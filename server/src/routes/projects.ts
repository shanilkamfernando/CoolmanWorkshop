// ============================================
// Projects Routes
// Save as: server/src/routes/projects.ts
// ============================================
//
// ⚠️ REQUIRED DATABASE MIGRATION — run once, alongside the one in
// worklist-tasks.ts (same columns, shared by both files):
//
//   ALTER TABLE worklist_tasks_v2
//     ADD COLUMN IF NOT EXISTS linked_member_id INTEGER;
//   ALTER TABLE project_assigned_members
//     ADD COLUMN IF NOT EXISTS linked_task_id INTEGER;
//
//   UPDATE worklist_tasks_v2 wt
//   SET linked_member_id = pam.id
//   FROM project_assigned_members pam
//   WHERE wt.job_type = 'project'
//     AND wt.job_reference_id = pam.project_id
//     AND wt.assigned_member = pam.assigned_member
//     AND wt.linked_member_id IS NULL;
//
//   UPDATE project_assigned_members pam
//   SET linked_task_id = wt.id
//   FROM worklist_tasks_v2 wt
//   WHERE wt.job_type = 'project'
//     AND wt.job_reference_id = pam.project_id
//     AND wt.assigned_member = pam.assigned_member
//     AND pam.linked_task_id IS NULL;
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
  limits: { fileSize: 50 * 1024 * 1024 },
});

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
    permissions: { portals: string[] };
  };
}

const getPool = (req: Request): Pool => req.app.locals.pool;

// ═══════════════════════════════════════════════════════════════
// PROJECTS
// ═══════════════════════════════════════════════════════════════

router.get(
  "/:customerId/projects",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { customerId } = req.params;
    const pool = getPool(req);
    try {
      const result = await pool.query(
        `SELECT id, customer_id, name, description, created_at, updated_at 
       FROM projects WHERE customer_id = $1 ORDER BY created_at DESC`,
        [customerId],
      );
      res.json({ success: true, projects: result.rows });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch projects" });
    }
  },
);

router.get(
  "/:customerId/projects/:projectId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { customerId, projectId } = req.params;
    const pool = getPool(req);
    try {
      const result = await pool.query(
        `SELECT id, customer_id, name, description, created_at, updated_at 
       FROM projects WHERE id = $1 AND customer_id = $2`,
        [projectId, customerId],
      );
      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: "Project not found" });
        return;
      }
      res.json({ success: true, project: result.rows[0] });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch project" });
    }
  },
);

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
      res
        .status(500)
        .json({ success: false, error: "Failed to create project" });
    }
  },
);

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
        `UPDATE projects SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP 
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
      res
        .status(500)
        .json({ success: false, error: "Failed to update project" });
    }
  },
);

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
      res
        .status(500)
        .json({ success: false, error: "Failed to delete project" });
    }
  },
);

// ═══════════════════════════════════════════════════════════════
// PROJECT MEETINGS
// ═══════════════════════════════════════════════════════════════

router.get(
  "/:customerId/projects/:projectId/meetings",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { projectId } = req.params;
    const pool = getPool(req);
    try {
      const result = await pool.query(
        `SELECT * FROM project_meetings WHERE project_id = $1 ORDER BY meeting_no ASC`,
        [projectId],
      );
      res.json({ success: true, meetings: result.rows });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch meetings" });
    }
  },
);

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
      const maxNoResult = await pool.query(
        `SELECT COALESCE(MAX(meeting_no), 0) as max_no FROM project_meetings WHERE project_id = $1`,
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
      res
        .status(500)
        .json({ success: false, error: "Failed to create meeting" });
    }
  },
);

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
       WHERE id=$7 RETURNING *`,
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
      res
        .status(500)
        .json({ success: false, error: "Failed to update meeting" });
    }
  },
);

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
      res
        .status(500)
        .json({ success: false, error: "Failed to delete meeting" });
    }
  },
);

// ═══════════════════════════════════════════════════════════════
// PROJECT ACTIVITIES
// ═══════════════════════════════════════════════════════════════

router.get(
  "/:customerId/projects/:projectId/activities",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { projectId } = req.params;
    const pool = getPool(req);
    try {
      const result = await pool.query(
        `SELECT id, project_id, activity_no,
     TO_CHAR(activity_date, 'YYYY-MM-DD') as activity_date,
     TO_CHAR(activity_time, 'HH24:MI') as activity_time,
     description, remarks, created_by, created_at
   FROM project_activities 
   WHERE project_id = $1 
   ORDER BY activity_no ASC`,
        [projectId],
      );
      res.json({ success: true, activities: result.rows });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch activities" });
    }
  },
);

router.post(
  "/:customerId/projects/:projectId/activities",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { projectId } = req.params;
    const { activity_date, activity_time, description } = req.body;
    const pool = getPool(req);

    if (!description) {
      res
        .status(400)
        .json({ success: false, error: "Description is required" });
      return;
    }
    try {
      const maxNoResult = await pool.query(
        `SELECT COALESCE(MAX(activity_no), 0) as max_no FROM project_activities WHERE project_id = $1`,
        [projectId],
      );
      const nextNo = maxNoResult.rows[0].max_no + 1;

      const result = await pool.query(
        `INSERT INTO project_activities 
      (project_id, activity_no, activity_date, activity_time, description, created_by)
     VALUES ($1, $2, CURRENT_DATE, CURRENT_TIME, $3, $4) RETURNING *`,
        [projectId, nextNo, description, req.user?.username || "Unknown"],
      );

      res.status(201).json({
        success: true,
        message: "Activity created successfully",
        activity: result.rows[0],
      });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, error: "Failed to create activity" });
    }
  },
);

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
        `UPDATE project_activities SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
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
      res
        .status(500)
        .json({ success: false, error: "Failed to update activity" });
    }
  },
);

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
      res
        .status(500)
        .json({ success: false, error: "Failed to delete activity" });
    }
  },
);

// ═══════════════════════════════════════════════════════════════
// BOQ DOCUMENTS
// ═══════════════════════════════════════════════════════════════

router.get(
  "/:customerId/projects/:projectId/boq/:category",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { projectId, category } = req.params;
    const pool = getPool(req);
    try {
      const result = await pool.query(
        `SELECT * FROM boq_documents WHERE project_id = $1 AND category = $2 ORDER BY created_at DESC`,
        [projectId, category],
      );
      res.json({ success: true, documents: result.rows });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch BOQ documents" });
    }
  },
);

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
      !["electrical", "mechanical", "quotation", "invoice"].includes(category)
    ) {
      res.status(400).json({ success: false, error: "Invalid category" });
      return;
    }

    try {
      const result = await pool.query(
        `INSERT INTO boq_documents 
        (project_id, category, filename, original_filename, file_path, file_type, file_size, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
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
      if (req.file?.path) fs.unlinkSync(req.file.path);
      res
        .status(500)
        .json({ success: false, error: "Failed to upload BOQ document" });
    }
  },
);

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
      res
        .status(500)
        .json({ success: false, error: "Failed to download document" });
    }
  },
);

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
      res
        .status(500)
        .json({ success: false, error: "Failed to delete document" });
    }
  },
);

// ═══════════════════════════════════════════════════════════════
// SYSTEM USERS (for dropdowns)
// ═══════════════════════════════════════════════════════════════

router.get(
  "/:customerId/projects/:projectId/users",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const pool = getPool(req);
    try {
      const result = await pool.query(
        `SELECT username, first_name, last_name, role FROM users WHERE is_active = true ORDER BY username ASC`,
      );
      res.json({ success: true, users: result.rows });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch users" });
    }
  },
);

// ═══════════════════════════════════════════════════════════════
// PROJECT ASSIGNED MEMBERS — syncs to worklist_tasks_v2
// ═══════════════════════════════════════════════════════════════

router.get(
  "/:customerId/projects/:projectId/members",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { projectId } = req.params;
    const pool = getPool(req);
    try {
      const result = await pool.query(
        `SELECT * FROM project_assigned_members WHERE project_id = $1 ORDER BY assignment_no ASC`,
        [projectId],
      );
      res.json({ success: true, members: result.rows });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch assigned members" });
    }
  },
);

// POST create assigned member — also syncs to worklist_tasks_v2
router.post(
  "/:customerId/projects/:projectId/members",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { customerId, projectId } = req.params;
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
      // Auto-increment assignment number
      const maxNoResult = await pool.query(
        `SELECT COALESCE(MAX(assignment_no), 0) as max_no FROM project_assigned_members WHERE project_id = $1`,
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

      const newMember = result.rows[0];

      // ── Sync to worklist_tasks_v2 ──
      try {
        const year = new Date().getFullYear();

        const taskMaxResult = await pool.query(
          `SELECT COALESCE(MAX(task_no), 0) as max_no FROM worklist_tasks_v2 WHERE year = $1`,
          [year],
        );
        const nextTaskNo = taskMaxResult.rows[0].max_no + 1;

        // Get customer name
        const custResult = await pool.query(
          `SELECT name FROM customers WHERE id = $1`,
          [customerId],
        );
        const customerName = custResult.rows[0]?.name || "";

        // Get project name
        const projResult = await pool.query(
          `SELECT name FROM projects WHERE id = $1`,
          [projectId],
        );
        const projectName = projResult.rows[0]?.name || "";

        await pool
          .query(
            `INSERT INTO worklist_tasks_v2
          (task_no, year, customer_id, customer_name, job_type,
           job_reference_id, job_reference_name, assigned_member,
           job_description, due_date, status, created_by, linked_member_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         RETURNING id`,
            [
              nextTaskNo,
              year,
              customerId,
              customerName,
              "project",
              projectId,
              projectName,
              assigned_member || null,
              job_description || null,
              due_date || null,
              "todo",
              req.user?.username,
              newMember.id,
            ],
          )
          .then(async (taskInsertResult) => {
            // Link the member row back to the task just created — this
            // direct link is what every future sync follows.
            await pool.query(
              `UPDATE project_assigned_members SET linked_task_id = $1 WHERE id = $2`,
              [taskInsertResult.rows[0].id, newMember.id],
            );
          });
      } catch (syncErr) {
        console.error("Sync to worklist_tasks_v2 failed:", syncErr);
        // Non-blocking
      }

      res.status(201).json({ success: true, member: newMember });
    } catch (error) {
      console.error("Create assigned member error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to assign member" });
    }
  },
);

// PUT update assigned member — also syncs status back to worklist_tasks_v2
router.put(
  "/:customerId/projects/:projectId/members/:memberId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { projectId, memberId } = req.params;
    const pool = getPool(req);
    const currentUser = req.user?.username;
    const isAdmin = req.user?.role === "admin";

    try {
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

      // ── Once done, locked for everyone — read only ──
      if (record.status === "done") {
        res.status(403).json({
          success: false,
          error: "This assignment is marked done and can no longer be edited",
        });
        return;
      }

      // finish_date is never client-settable — auto-stamped only when
      // status transitions to "done"
      const incomingStatus: string | undefined = req.body.status;
      const autoFinishDate =
        incomingStatus === "done"
          ? new Date().toISOString().split("T")[0]
          : record.finish_date;

      let result;

      if (isAdmin) {
        const { assigned_member, job_description, due_date, status } = req.body;
        result = await pool.query(
          `UPDATE project_assigned_members
         SET assigned_member=$1, job_description=$2, due_date=$3,
             status=$4, finish_date=$5, updated_at=CURRENT_TIMESTAMP
         WHERE id=$6 RETURNING *`,
          [
            assigned_member || record.assigned_member,
            job_description ?? record.job_description,
            due_date || record.due_date,
            status || record.status,
            autoFinishDate,
            memberId,
          ],
        );
      } else {
        const { status } = req.body;
        result = await pool.query(
          `UPDATE project_assigned_members
     SET status=$1, finish_date=$2, updated_at=CURRENT_TIMESTAMP
     WHERE id=$3 RETURNING *`,
          [status || record.status, autoFinishDate, memberId],
        );
      }

      const updatedMember = result.rows[0];

      // ── Sync status/finish_date back to worklist_tasks_v2 ──
      try {
        if (record.linked_task_id) {
          await pool.query(
            `UPDATE worklist_tasks_v2 SET status = $1, finish_date = $2 WHERE id = $3`,
            [
              updatedMember.status,
              updatedMember.finish_date || null,
              record.linked_task_id,
            ],
          );
        } else {
          const matched = await pool.query(
            `UPDATE worklist_tasks_v2
             SET status = $1, finish_date = $2
             WHERE job_type = 'project' AND job_reference_id = $3 AND assigned_member = $4
             RETURNING id`,
            [
              updatedMember.status,
              updatedMember.finish_date || null,
              projectId,
              record.assigned_member,
            ],
          );
          if (matched.rows.length > 0) {
            await pool.query(
              `UPDATE project_assigned_members SET linked_task_id = $1 WHERE id = $2`,
              [matched.rows[0].id, memberId],
            );
          }
        }
      } catch (syncErr) {
        console.error("Sync to worklist_tasks_v2 failed:", syncErr);
      }

      res.json({ success: true, member: updatedMember });
    } catch (error) {
      console.error("Update assigned member error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to update assignment" });
    }
  },
);

// GET update logs for a member
router.get(
  "/:customerId/projects/:projectId/members/:memberId/updates",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { memberId } = req.params;
    const pool = getPool(req);
    try {
      const result = await pool.query(
        `SELECT * FROM project_member_updates 
         WHERE member_id = $1 ORDER BY created_at ASC`,
        [memberId],
      );
      res.json({ success: true, updates: result.rows });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  },
);

// POST add update log for a member
router.post(
  "/:customerId/projects/:projectId/members/:memberId/updates",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { projectId, memberId } = req.params;
    const { update_note } = req.body;
    const pool = getPool(req);

    if (!update_note?.trim()) {
      res
        .status(400)
        .json({ success: false, error: "Update note is required" });
      return;
    }

    try {
      const memberResult = await pool.query(
        `SELECT * FROM project_assigned_members WHERE id = $1`,
        [memberId],
      );
      if (memberResult.rows.length === 0) {
        res.status(404).json({ success: false, error: "Assignment not found" });
        return;
      }
      const member = memberResult.rows[0];

      if (member.status === "done") {
        res.status(403).json({
          success: false,
          error: "This assignment is marked done and can no longer be edited",
        });
        return;
      }

      const result = await pool.query(
        `INSERT INTO project_member_updates (member_id, update_note, created_by)
   VALUES ($1, $2, $3) RETURNING *`,
        [memberId, update_note.trim(), req.user?.username],
      );

      // ── Sync this note into worklist_task_updates as a real log row —
      //    now follows the direct link set at creation time, falling back
      //    to the old text-match only for legacy rows, and self-healing
      //    the link so that fallback only runs once. ──
      try {
        let taskId: number | null = member.linked_task_id || null;
        let taskStatus: string | null = null;

        if (taskId) {
          const t = await pool.query(
            `SELECT status FROM worklist_tasks_v2 WHERE id = $1`,
            [taskId],
          );
          taskStatus = t.rows[0]?.status || null;
        } else {
          const taskResult = await pool.query(
            `SELECT id, status FROM worklist_tasks_v2
             WHERE job_type = 'project'
               AND job_reference_id = $1
               AND assigned_member = $2
             LIMIT 1`,
            [projectId, member.assigned_member],
          );
          if (taskResult.rows.length > 0) {
            taskId = taskResult.rows[0].id;
            taskStatus = taskResult.rows[0].status;
            await pool.query(
              `UPDATE project_assigned_members SET linked_task_id = $1 WHERE id = $2`,
              [taskId, memberId],
            );
          }
        }

        if (taskId) {
          await pool.query(
            `INSERT INTO worklist_task_updates (task_id, update_note, status, created_by)
             VALUES ($1, $2, $3, $4)`,
            [taskId, update_note.trim(), taskStatus, req.user?.username],
          );
        }
      } catch (syncErr) {
        console.error("Sync update to worklist_task_updates failed:", syncErr);
      }

      res.status(201).json({ success: true, update: result.rows[0] });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  },
);

// GET meeting updates
router.get(
  "/:customerId/projects/:projectId/meetings/:meetingId/updates",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { meetingId } = req.params;
    const pool = getPool(req);
    try {
      const result = await pool.query(
        `SELECT * FROM project_meeting_updates 
         WHERE meeting_id = $1 ORDER BY created_at ASC`,
        [meetingId],
      );
      res.json({ success: true, updates: result.rows });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  },
);

// POST add meeting update
router.post(
  "/:customerId/projects/:projectId/meetings/:meetingId/updates",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { meetingId } = req.params;
    const { update_note } = req.body;
    const pool = getPool(req);

    if (!update_note?.trim()) {
      res
        .status(400)
        .json({ success: false, error: "Update note is required" });
      return;
    }

    try {
      const result = await pool.query(
        `INSERT INTO project_meeting_updates (meeting_id, update_note, created_by)
         VALUES ($1, $2, $3) RETURNING *`,
        [meetingId, update_note.trim(), req.user?.username],
      );
      res.status(201).json({ success: true, update: result.rows[0] });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  },
);

// DELETE meeting update (admin only)
router.delete(
  "/:customerId/projects/:projectId/meetings/:meetingId/updates/:updateId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { updateId } = req.params;
    const pool = getPool(req);

    if (req.user?.role !== "admin") {
      res.status(403).json({ success: false, error: "Admin only" });
      return;
    }
    try {
      await pool.query("DELETE FROM project_meeting_updates WHERE id = $1", [
        updateId,
      ]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  },
);

// DELETE update log (admin only)
router.delete(
  "/:customerId/projects/:projectId/members/:memberId/updates/:updateId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { updateId } = req.params;
    const pool = getPool(req);

    if (req.user?.role !== "admin") {
      res.status(403).json({ success: false, error: "Admin only" });
      return;
    }
    try {
      await pool.query("DELETE FROM project_member_updates WHERE id = $1", [
        updateId,
      ]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  },
);

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
      res
        .status(500)
        .json({ success: false, error: "Failed to remove assignment" });
    }
  },
);

export default router;
