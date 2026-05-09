// ============================================
// Projects Routes
// Save as: server/src/routes/projects.ts
// ============================================

import { Router, Request, Response } from "express";
import { Pool } from "pg";
import { authenticateToken } from "./auth";
import multer from "multer";
import path from "path";
import fs from "fs";

const boqStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const projectId = req.params.projectId;
    const uploadDir = path.join(
      __dirname,
      "..",
      "..",
      "uploads",
      "boq",
      projectId,
    );
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `boq-${uniqueSuffix}${ext}`);
  },
});

const uploadBOQ = multer({
  storage: boqStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: "admin" | "user";
    permissions: { portals: string[] };
  };
}

const getPool = (req: Request): Pool => req.app.locals.pool;

// ═══════════════════════════════════════════════════════════════
// PROJECTS
// ═══════════════════════════════════════════════════════════════

// GET all projects for a customer
router.get(
  "/:customerId/projects",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { customerId } = req.params;
    const pool = getPool(req);

    try {
      const result = await pool.query(
        `SELECT id, customer_id, name, description, created_at, updated_at 
         FROM projects 
         WHERE customer_id = $1 
         ORDER BY created_at DESC`,
        [customerId],
      );

      res.json({ success: true, projects: result.rows });
    } catch (error) {
      console.error("Get projects error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch projects" });
    }
  },
);

// GET single project
router.get(
  "/:customerId/projects/:projectId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { customerId, projectId } = req.params;
    const pool = getPool(req);

    try {
      const result = await pool.query(
        `SELECT id, customer_id, name, description, created_at, updated_at 
         FROM projects 
         WHERE id = $1 AND customer_id = $2`,
        [projectId, customerId],
      );

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: "Project not found" });
        return;
      }

      res.json({ success: true, project: result.rows[0] });
    } catch (error) {
      console.error("Get project error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch project" });
    }
  },
);

// POST create new project (Admin only)
router.post(
  "/:customerId/projects",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { customerId } = req.params;
    const { name, description } = req.body;
    const pool = getPool(req);

    if (req.user?.role !== "admin") {
      res
        .status(403)
        .json({ success: false, error: "Only admins can create projects" });
      return;
    }

    if (!name || !name.trim()) {
      res
        .status(400)
        .json({ success: false, error: "Project name is required" });
      return;
    }

    try {
      const result = await pool.query(
        `INSERT INTO projects (customer_id, name, description, created_at, updated_at) 
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
         RETURNING id, customer_id, name, description, created_at, updated_at`,
        [customerId, name.trim(), description || ""],
      );

      res.status(201).json({
        success: true,
        message: "Project created successfully",
        project: result.rows[0],
      });
    } catch (error) {
      console.error("Create project error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to create project" });
    }
  },
);

// PUT update project (Admin only)
router.put(
  "/:customerId/projects/:projectId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { customerId, projectId } = req.params;
    const { name, description } = req.body;
    const pool = getPool(req);

    if (req.user?.role !== "admin") {
      res.status(403).json({
        success: false,
        error: "Only admins can update project details",
      });
      return;
    }

    if (!name || !name.trim()) {
      res
        .status(400)
        .json({ success: false, error: "Project name is required" });
      return;
    }

    try {
      const result = await pool.query(
        `UPDATE projects 
         SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $3 AND customer_id = $4 
         RETURNING id, customer_id, name, description, created_at, updated_at`,
        [name.trim(), description || "", projectId, customerId],
      );

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: "Project not found" });
        return;
      }

      res.json({
        success: true,
        message: "Project updated successfully",
        project: result.rows[0],
      });
    } catch (error) {
      console.error("Update project error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to update project" });
    }
  },
);

// DELETE project (Admin only)
router.delete(
  "/:customerId/projects/:projectId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { customerId, projectId } = req.params;
    const pool = getPool(req);

    if (req.user?.role !== "admin") {
      res
        .status(403)
        .json({ success: false, error: "Only admins can delete projects" });
      return;
    }

    try {
      const result = await pool.query(
        `DELETE FROM projects WHERE id = $1 AND customer_id = $2 RETURNING id, name`,
        [projectId, customerId],
      );

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: "Project not found" });
        return;
      }

      res.json({
        success: true,
        message: "Project deleted successfully",
        deletedProject: result.rows[0],
      });
    } catch (error) {
      console.error("Delete project error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to delete project" });
    }
  },
);

// ═══════════════════════════════════════════════════════════════
// PROJECT MEETINGS  ← uses project_meetings table (NOT meetings)
// ═══════════════════════════════════════════════════════════════

// GET all meetings for a project
router.get(
  "/:customerId/projects/:projectId/meetings",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { projectId } = req.params;
    const pool = getPool(req);

    try {
      const result = await pool.query(
        `SELECT * FROM project_meetings 
         WHERE project_id = $1 
         ORDER BY meeting_no ASC`,
        [projectId],
      );

      res.json({ success: true, meetings: result.rows });
    } catch (error) {
      console.error("Get meetings error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch meetings" });
    }
  },
);

// POST create meeting (all users)
router.post(
  "/:customerId/projects/:projectId/meetings",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { projectId } = req.params;
    const { date, meeting_time, location, description } = req.body;
    const pool = getPool(req);

    if (!date || !description) {
      res
        .status(400)
        .json({ success: false, error: "Date and description are required" });
      return;
    }

    try {
      // Auto-increment meeting number per project
      const maxNoResult = await pool.query(
        `SELECT COALESCE(MAX(meeting_no), 0) as max_no 
         FROM project_meetings WHERE project_id = $1`,
        [projectId],
      );
      const nextNo = maxNoResult.rows[0].max_no + 1;

      const result = await pool.query(
        `INSERT INTO project_meetings 
          (project_id, meeting_no, date, meeting_time, location, description, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        [
          projectId,
          nextNo,
          date,
          meeting_time || null,
          location || null,
          description,
          req.user?.username || "Unknown",
        ],
      );

      res.status(201).json({
        success: true,
        message: "Meeting created successfully",
        meeting: result.rows[0],
      });
    } catch (error) {
      console.error("Create meeting error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to create meeting" });
    }
  },
);

// PUT update meeting (admin only for customer_side and cm_side, all users for other fields)
router.put(
  "/:customerId/projects/:projectId/meetings/:meetingId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { meetingId } = req.params;
    const {
      date,
      meeting_time,
      location,
      description,
      customer_side,
      cm_side,
    } = req.body;
    const pool = getPool(req);

    try {
      const result = await pool.query(
        `UPDATE project_meetings 
         SET date=$1, meeting_time=$2, location=$3, description=$4,
             customer_side=$5, cm_side=$6, updated_at=CURRENT_TIMESTAMP
         WHERE id=$7
         RETURNING *`,
        [
          date,
          meeting_time || null,
          location || null,
          description,
          customer_side || null,
          cm_side || null,
          meetingId,
        ],
      );

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: "Meeting not found" });
        return;
      }

      res.json({
        success: true,
        message: "Meeting updated successfully",
        meeting: result.rows[0],
      });
    } catch (error) {
      console.error("Update meeting error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to update meeting" });
    }
  },
);

// DELETE meeting (admin only)
router.delete(
  "/:customerId/projects/:projectId/meetings/:meetingId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { meetingId } = req.params;
    const pool = getPool(req);

    if (req.user?.role !== "admin") {
      res
        .status(403)
        .json({ success: false, error: "Only admins can delete meetings" });
      return;
    }

    try {
      const result = await pool.query(
        "DELETE FROM project_meetings WHERE id = $1 RETURNING id",
        [meetingId],
      );

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: "Meeting not found" });
        return;
      }

      res.json({ success: true, message: "Meeting deleted successfully" });
    } catch (error) {
      console.error("Delete meeting error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to delete meeting" });
    }
  },
);

// ═══════════════════════════════════════════════════════════════
// PROJECT ACTIVITIES
// ═══════════════════════════════════════════════════════════════

// GET all activities for a project
router.get(
  "/:customerId/projects/:projectId/activities",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { projectId } = req.params;
    const pool = getPool(req);

    try {
      const result = await pool.query(
        `SELECT * FROM project_activities 
         WHERE project_id = $1 
         ORDER BY activity_no ASC`,
        [projectId],
      );

      res.json({ success: true, activities: result.rows });
    } catch (error) {
      console.error("Get activities error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch activities" });
    }
  },
);

// POST create new activity (all users)
router.post(
  "/:customerId/projects/:projectId/activities",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { projectId } = req.params;
    const { activity_date, activity_time, description } = req.body;
    const pool = getPool(req);

    if (!activity_date || !description) {
      res
        .status(400)
        .json({ success: false, error: "Date and description are required" });
      return;
    }

    try {
      // Auto-increment activity number per project
      const maxNoResult = await pool.query(
        `SELECT COALESCE(MAX(activity_no), 0) as max_no 
         FROM project_activities WHERE project_id = $1`,
        [projectId],
      );
      const nextNo = maxNoResult.rows[0].max_no + 1;

      const result = await pool.query(
        `INSERT INTO project_activities 
          (project_id, activity_no, activity_date, activity_time, description, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          projectId,
          nextNo,
          activity_date,
          activity_time || null,
          description,
          req.user?.username || "Unknown",
        ],
      );

      res.status(201).json({
        success: true,
        message: "Activity created successfully",
        activity: result.rows[0],
      });
    } catch (error) {
      console.error("Create activity error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to create activity" });
    }
  },
);

// PUT update activity (admin only)
router.put(
  "/:customerId/projects/:projectId/activities/:activityId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { activityId } = req.params;
    const pool = getPool(req);

    if (req.user?.role !== "admin") {
      res
        .status(403)
        .json({ success: false, error: "Only admins can update activities" });
      return;
    }

    try {
      const updates = req.body;
      const fields = Object.keys(updates);
      const values = Object.values(updates);

      if (fields.length === 0) {
        res.status(400).json({ success: false, error: "No fields to update" });
        return;
      }

      const setClause = fields
        .map((field, index) => `${field} = $${index + 2}`)
        .join(", ");

      const result = await pool.query(
        `UPDATE project_activities 
         SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1 
         RETURNING *`,
        [activityId, ...values],
      );

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: "Activity not found" });
        return;
      }

      res.json({
        success: true,
        message: "Activity updated successfully",
        activity: result.rows[0],
      });
    } catch (error) {
      console.error("Update activity error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to update activity" });
    }
  },
);

// DELETE activity (admin only)
router.delete(
  "/:customerId/projects/:projectId/activities/:activityId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { activityId } = req.params;
    const pool = getPool(req);

    if (req.user?.role !== "admin") {
      res
        .status(403)
        .json({ success: false, error: "Only admins can delete activities" });
      return;
    }

    try {
      const result = await pool.query(
        "DELETE FROM project_activities WHERE id = $1 RETURNING id",
        [activityId],
      );

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: "Activity not found" });
        return;
      }

      res.json({ success: true, message: "Activity deleted successfully" });
    } catch (error) {
      console.error("Delete activity error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to delete activity" });
    }
  },
);

// ═══════════════════════════════════════════════════════════════
// BOQ DOCUMENTS
// ═══════════════════════════════════════════════════════════════

// GET BOQ documents for a specific category
router.get(
  "/:customerId/projects/:projectId/boq/:category",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { projectId, category } = req.params;
    const pool = getPool(req);

    try {
      const result = await pool.query(
        `SELECT * FROM boq_documents 
         WHERE project_id = $1 AND category = $2 
         ORDER BY created_at DESC`,
        [projectId, category],
      );

      res.json({ success: true, documents: result.rows });
    } catch (error) {
      console.error("Get BOQ documents error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch BOQ documents" });
    }
  },
);

// POST upload BOQ document
router.post(
  "/:customerId/projects/:projectId/boq",
  authenticateToken,
  uploadBOQ.single("file"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { projectId } = req.params;
    const { category } = req.body;
    const pool = getPool(req);

    if (!req.file) {
      res.status(400).json({ success: false, error: "No file uploaded" });
      return;
    }

    if (
      !category ||
      !["electrical", "mechanical", "quotation"].includes(category)
    ) {
      res.status(400).json({ success: false, error: "Invalid category" });
      return;
    }

    try {
      const result = await pool.query(
        `INSERT INTO boq_documents 
          (project_id, category, filename, original_filename, file_path, file_type, file_size, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          projectId,
          category,
          req.file.filename,
          req.file.originalname,
          req.file.path,
          req.file.mimetype,
          req.file.size,
          req.user?.username || "Unknown",
        ],
      );

      res.status(201).json({
        success: true,
        message: "BOQ document uploaded successfully",
        document: result.rows[0],
      });
    } catch (error) {
      console.error("Upload BOQ error:", error);
      if (req.file?.path) fs.unlinkSync(req.file.path);
      res
        .status(500)
        .json({ success: false, error: "Failed to upload BOQ document" });
    }
  },
);

// GET download BOQ document
router.get(
  "/:customerId/projects/:projectId/boq/:docId/download",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { docId } = req.params;
    const pool = getPool(req);

    try {
      const result = await pool.query(
        "SELECT * FROM boq_documents WHERE id = $1",
        [docId],
      );

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: "Document not found" });
        return;
      }

      const doc = result.rows[0];

      if (!fs.existsSync(doc.file_path)) {
        res
          .status(404)
          .json({ success: false, error: "File not found on server" });
        return;
      }

      res.download(doc.file_path, doc.original_filename);
    } catch (error) {
      console.error("Download BOQ error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to download document" });
    }
  },
);

// DELETE BOQ document (admin only)
router.delete(
  "/:customerId/projects/:projectId/boq/:docId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { docId } = req.params;
    const pool = getPool(req);

    if (req.user?.role !== "admin") {
      res.status(403).json({
        success: false,
        error: "Only admins can delete BOQ documents",
      });
      return;
    }

    try {
      const result = await pool.query(
        "SELECT * FROM boq_documents WHERE id = $1",
        [docId],
      );

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: "Document not found" });
        return;
      }

      const doc = result.rows[0];

      if (fs.existsSync(doc.file_path)) fs.unlinkSync(doc.file_path);

      await pool.query("DELETE FROM boq_documents WHERE id = $1", [docId]);

      res.json({ success: true, message: "Document deleted successfully" });
    } catch (error) {
      console.error("Delete BOQ error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to delete document" });
    }
  },
);

// GET all system users (for the dropdown)
router.get(
  "/:customerId/projects/:projectId/users",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const pool = getPool(req);
    try {
      const result = await pool.query(
        `SELECT username, first_name, last_name, role 
   FROM users 
   WHERE is_active = true
   ORDER BY username ASC`,
      );
      res.json({ success: true, users: result.rows });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch users" });
    }
  },
);

// GET all assigned members for a project
router.get(
  "/:customerId/projects/:projectId/members",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { projectId } = req.params;
    const pool = getPool(req);
    try {
      const result = await pool.query(
        `SELECT * FROM project_assigned_members 
         WHERE project_id = $1 
         ORDER BY assignment_no ASC`,
        [projectId],
      );
      res.json({ success: true, members: result.rows });
    } catch (error) {
      console.error("Get assigned members error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch assigned members" });
    }
  },
);

// POST create assigned member (admin only)
router.post(
  "/:customerId/projects/:projectId/members",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { projectId } = req.params;
    const { assigned_member, job_description, due_date } = req.body;
    const pool = getPool(req);

    if (req.user?.role !== "admin") {
      res
        .status(403)
        .json({ success: false, error: "Only admins can assign members" });
      return;
    }

    if (!assigned_member) {
      res
        .status(400)
        .json({ success: false, error: "Assigned member is required" });
      return;
    }

    try {
      // Auto-increment assignment number per project
      const maxNoResult = await pool.query(
        `SELECT COALESCE(MAX(assignment_no), 0) as max_no 
         FROM project_assigned_members WHERE project_id = $1`,
        [projectId],
      );
      const nextNo = maxNoResult.rows[0].max_no + 1;

      const result = await pool.query(
        `INSERT INTO project_assigned_members
          (project_id, assignment_no, assigned_date, assigned_time, assigned_member,
           job_description, due_date, status, created_by)
         VALUES ($1, $2, CURRENT_DATE, CURRENT_TIME, $3, $4, $5, 'todo', $6)
         RETURNING *`,
        [
          projectId,
          nextNo,
          assigned_member,
          job_description || null,
          due_date || null,
          req.user?.username || "Unknown",
        ],
      );

      res.status(201).json({ success: true, member: result.rows[0] });
    } catch (error) {
      console.error("Create assigned member error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to assign member" });
    }
  },
);

// PUT update assigned member
// - Admin can update all fields
// - Assigned user can only update update_note, status, finish_date
router.put(
  "/:customerId/projects/:projectId/members/:memberId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { memberId } = req.params;
    const pool = getPool(req);
    const currentUser = req.user?.username;
    const isAdmin = req.user?.role === "admin";

    try {
      // First get the existing record to check who is assigned
      const existing = await pool.query(
        "SELECT * FROM project_assigned_members WHERE id = $1",
        [memberId],
      );

      if (existing.rows.length === 0) {
        res.status(404).json({ success: false, error: "Assignment not found" });
        return;
      }

      const record = existing.rows[0];
      const isAssignedUser = record.assigned_member === currentUser;

      if (!isAdmin && !isAssignedUser) {
        res.status(403).json({
          success: false,
          error: "You can only update your own assignments",
        });
        return;
      }

      let result;

      if (isAdmin) {
        // Admin can update everything
        const {
          assigned_member,
          job_description,
          due_date,
          update_note,
          status,
          finish_date,
        } = req.body;

        result = await pool.query(
          `UPDATE project_assigned_members
           SET assigned_member=$1, job_description=$2, due_date=$3,
               update_note=$4, status=$5, finish_date=$6,
               updated_at=CURRENT_TIMESTAMP
           WHERE id=$7
           RETURNING *`,
          [
            assigned_member || record.assigned_member,
            job_description ?? record.job_description,
            due_date || record.due_date,
            update_note ?? record.update_note,
            status || record.status,
            finish_date || record.finish_date,
            memberId,
          ],
        );
      } else {
        // Assigned user can only update note, status, finish_date
        const { update_note, status, finish_date } = req.body;

        result = await pool.query(
          `UPDATE project_assigned_members
           SET update_note=$1, status=$2, finish_date=$3,
               updated_at=CURRENT_TIMESTAMP
           WHERE id=$4
           RETURNING *`,
          [
            update_note ?? record.update_note,
            status || record.status,
            finish_date || record.finish_date,
            memberId,
          ],
        );
      }

      res.json({ success: true, member: result.rows[0] });
    } catch (error) {
      console.error("Update assigned member error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to update assignment" });
    }
  },
);

// DELETE assigned member (admin only)
router.delete(
  "/:customerId/projects/:projectId/members/:memberId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { memberId } = req.params;
    const pool = getPool(req);

    if (req.user?.role !== "admin") {
      res
        .status(403)
        .json({ success: false, error: "Only admins can remove assignments" });
      return;
    }

    try {
      const result = await pool.query(
        "DELETE FROM project_assigned_members WHERE id = $1 RETURNING id",
        [memberId],
      );

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: "Assignment not found" });
        return;
      }

      res.json({ success: true, message: "Assignment removed" });
    } catch (error) {
      console.error("Delete assigned member error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to remove assignment" });
    }
  },
);

export default router;
