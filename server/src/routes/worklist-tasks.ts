// ============================================
// Worklist Tasks Routes - Redesigned
// Save as: server/src/routes/worklist-tasks.ts
// ============================================

import { Router, Request, Response } from "express";
import { Pool } from "pg";
import { authenticateToken } from "./auth";

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

// ─── GET dropdown data for the form ──────────────────────────────

// GET all customers (for dropdown)
router.get(
  "/worklist/dropdown/customers",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const pool = getPool(req);
    try {
      const result = await pool.query(
        "SELECT id, name FROM customers ORDER BY name ASC",
      );
      res.json({ success: true, customers: result.rows });
    } catch (error) {
      console.error("Get customers error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch customers" });
    }
  },
);

// GET projects for a customer
router.get(
  "/worklist/dropdown/customers/:customerId/projects",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { customerId } = req.params;
    const pool = getPool(req);
    try {
      const result = await pool.query(
        "SELECT id, name FROM projects WHERE customer_id = $1 ORDER BY name ASC",
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

// GET compressor service companies for a customer
router.get(
  "/worklist/dropdown/customers/:customerId/compressor-service",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { customerId } = req.params;
    const pool = getPool(req);
    try {
      const result = await pool.query(
        "SELECT id, name FROM compressor_service_companies WHERE customer_id = $1 ORDER BY name ASC",
        [customerId],
      );
      res.json({ success: true, items: result.rows });
    } catch (error) {
      res.json({ success: true, items: [] });
    }
  },
);

// GET compressor repair companies for a customer
router.get(
  "/worklist/dropdown/customers/:customerId/compressor-repair",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { customerId } = req.params;
    const pool = getPool(req);
    try {
      const result = await pool.query(
        "SELECT id, name FROM compressor_repair_companies WHERE customer_id = $1 ORDER BY name ASC",
        [customerId],
      );
      res.json({ success: true, items: result.rows });
    } catch (error) {
      res.json({ success: true, items: [] });
    }
  },
);

// GET system repair records for a customer
router.get(
  "/worklist/dropdown/customers/:customerId/system-repair",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { customerId } = req.params;
    const pool = getPool(req);
    try {
      const result = await pool.query(
        "SELECT id, CONCAT('System Repair #', id) as name FROM system_repair_records WHERE customer_id = $1 ORDER BY id DESC",
        [customerId],
      );
      res.json({ success: true, items: result.rows });
    } catch (error) {
      res.json({ success: true, items: [] });
    }
  },
);

// GET system inspection records for a customer
router.get(
  "/worklist/dropdown/customers/:customerId/system-inspection",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { customerId } = req.params;
    const pool = getPool(req);
    try {
      const result = await pool.query(
        "SELECT id, CONCAT('System Inspection #', id) as name FROM system_inspection_records WHERE customer_id = $1 ORDER BY id DESC",
        [customerId],
      );
      res.json({ success: true, items: result.rows });
    } catch (error) {
      res.json({ success: true, items: [] });
    }
  },
);

// GET all active system users (for assigned member dropdown)
router.get(
  "/worklist/dropdown/users",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const pool = getPool(req);
    try {
      const result = await pool.query(
        "SELECT username, first_name, last_name FROM users WHERE is_active = true ORDER BY username ASC",
      );
      res.json({ success: true, users: result.rows });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch users" });
    }
  },
);

// ─── TASKS CRUD ───────────────────────────────────────────────────

// GET tasks for specific year
router.get(
  "/jobAssigned/tasks/:year",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { year } = req.params;
    const pool = getPool(req);
    try {
      const result = await pool.query(
        `SELECT * FROM worklist_tasks_v2 
         WHERE year = $1 
         ORDER BY task_no ASC`,
        [year],
      );
      res.json({ success: true, tasks: result.rows });
    } catch (error) {
      console.error("Get worklist tasks error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch tasks" });
    }
  },
);

// POST create new task (all users)
router.post(
  "/jobAssigned/tasks",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const {
      year,
      customer_id,
      customer_name,
      job_type,
      job_reference_id,
      job_reference_name,
      assigned_member,
      job_description,
      due_date,
      status,
    } = req.body;
    const pool = getPool(req);

    if (!year) {
      res.status(400).json({ success: false, error: "Year is required" });
      return;
    }

    try {
      // Auto-increment task_no per year
      const maxNoResult = await pool.query(
        "SELECT COALESCE(MAX(task_no), 0) as max_no FROM worklist_tasks_v2 WHERE year = $1",
        [year],
      );
      const nextNo = maxNoResult.rows[0].max_no + 1;

      const result = await pool.query(
        `INSERT INTO worklist_tasks_v2
          (year, task_no, customer_id, customer_name, job_type, job_reference_id,
           job_reference_name, assigned_member, job_description, due_date, status, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         RETURNING *`,
        [
          year,
          nextNo,
          customer_id || null,
          customer_name || null,
          job_type || null,
          job_reference_id || null,
          job_reference_name || null,
          assigned_member || null,
          job_description || null,
          due_date || null,
          status || "todo",
          req.user?.username || "Unknown",
        ],
      );

      res.status(201).json({ success: true, task: result.rows[0] });
    } catch (error) {
      console.error("Create task error:", error);
      res.status(500).json({ success: false, error: "Failed to create task" });
    }
  },
);

// PUT update task
// Admin: all fields | Assigned user: update_note, status, finish_date only
router.put(
  "/jobAssigned/tasks/:taskId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { taskId } = req.params;
    const pool = getPool(req);
    const isAdmin = req.user?.role === "admin";
    const currentUser = req.user?.username;

    try {
      const existing = await pool.query(
        "SELECT * FROM worklist_tasks_v2 WHERE id = $1",
        [taskId],
      );

      if (existing.rows.length === 0) {
        res.status(404).json({ success: false, error: "Task not found" });
        return;
      }

      const record = existing.rows[0];
      const isAssignedUser = record.assigned_member === currentUser;

      if (!isAdmin && !isAssignedUser) {
        res.status(403).json({
          success: false,
          error: "You can only update your own assigned tasks",
        });
        return;
      }

      const USER_ALLOWED = ["update_note", "status", "finish_date"];
      const updates = req.body;
      const fields = Object.keys(updates);

      if (!isAdmin) {
        const disallowed = fields.filter((f) => !USER_ALLOWED.includes(f));
        if (disallowed.length > 0) {
          res.status(403).json({
            success: false,
            error: `Not allowed to update: ${disallowed.join(", ")}`,
          });
          return;
        }
      }

      if (fields.length === 0) {
        res.status(400).json({ success: false, error: "No fields to update" });
        return;
      }

      const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(", ");
      const result = await pool.query(
        `UPDATE worklist_tasks_v2 SET ${setClause}, updated_at=CURRENT_TIMESTAMP WHERE id=$1 RETURNING *`,
        [taskId, ...Object.values(updates)],
      );

      res.json({ success: true, task: result.rows[0] });
    } catch (error) {
      console.error("Update task error:", error);
      res.status(500).json({ success: false, error: "Failed to update task" });
    }
  },
);

// DELETE task (admin only)
router.delete(
  "/jobAssigned/tasks/:taskId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { taskId } = req.params;
    const pool = getPool(req);

    if (req.user?.role !== "admin") {
      res
        .status(403)
        .json({ success: false, error: "Only admins can delete tasks" });
      return;
    }

    try {
      const result = await pool.query(
        "DELETE FROM worklist_tasks_v2 WHERE id = $1 RETURNING id",
        [taskId],
      );

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: "Task not found" });
        return;
      }

      res.json({ success: true, message: "Task deleted" });
    } catch (error) {
      console.error("Delete task error:", error);
      res.status(500).json({ success: false, error: "Failed to delete task" });
    }
  },
);

export default router;
