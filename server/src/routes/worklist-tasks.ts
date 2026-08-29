// ============================================
// Worklist Tasks Routes
// Save as: server/src/routes/worklist-tasks.ts
// ============================================
//
// ⚠️ REQUIRED DATABASE MIGRATION — run this once before deploying:
//
//   ALTER TABLE worklist_task_updates
//     ADD COLUMN IF NOT EXISTS status VARCHAR(50),
//     ADD COLUMN IF NOT EXISTS third_party VARCHAR(100);
//
// `status` stores what stage the task was at when that log line was added.
// `third_party` stores the username of a company member the log entry
// (and by extension the task) has been handed off to for review/action.
// ============================================

import { Router, Request, Response } from "express";
import { Pool } from "pg";
import { authenticateToken } from "./auth";

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

// Valid status values — keep in sync with frontend STATUS_OPTIONS
const VALID_STATUSES = ["todo", "in_progress", "on_hold", "permission", "done"];

// ─── DROPDOWN DATA ────────────────────────────────────────────────

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
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch customers" });
    }
  },
);

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
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch projects" });
    }
  },
);

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
      res.status(500).json({ success: false, error: "Failed to fetch users" });
    }
  },
);

// ─── TASKS CRUD ───────────────────────────────────────────────────

// GET tasks for specific year
// Also computes has_third_party (for the red-arrow indicator) and
// third_party_names (so search can match a third-party assignee's name)
// by aggregating across that task's update log rows.
router.get(
  "/jobAssigned/tasks/:year",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { year } = req.params;
    const pool = getPool(req);
    try {
      const result = await pool.query(
        `SELECT t.*,
          EXISTS (
            SELECT 1 FROM worklist_task_updates u
            WHERE u.task_id = t.id
              AND u.third_party IS NOT NULL
              AND u.third_party <> ''
          ) AS has_third_party,
          (
            SELECT STRING_AGG(DISTINCT u.third_party, ', ')
            FROM worklist_task_updates u
            WHERE u.task_id = t.id
              AND u.third_party IS NOT NULL
              AND u.third_party <> ''
          ) AS third_party_names
        FROM worklist_tasks_v2 t
        WHERE t.year = $1
        ORDER BY t.task_no ASC`,
        [year],
      );
      res.json({ success: true, tasks: result.rows });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch tasks" });
    }
  },
);

// POST create new task — syncs to project_assigned_members if job_type = "project"
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
      const nextTaskNo = maxNoResult.rows[0].max_no + 1;

      const result = await pool.query(
        `INSERT INTO worklist_tasks_v2
        (year, task_no, customer_id, customer_name, job_type, job_reference_id,
         job_reference_name, assigned_member, job_description, due_date, status, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
        [
          year,
          nextTaskNo,
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

      const newTask = result.rows[0];

      // ── Sync to project_assigned_members if job_type is "project" ──
      if (job_type === "project" && job_reference_id && customer_id) {
        try {
          const pmMaxResult = await pool.query(
            `SELECT COALESCE(MAX(assignment_no), 0) as max_no 
           FROM project_assigned_members WHERE project_id = $1`,
            [job_reference_id],
          );
          const pmNextNo = pmMaxResult.rows[0].max_no + 1;

          await pool.query(
            `INSERT INTO project_assigned_members
            (project_id, assignment_no, assigned_date, assigned_time,
             assigned_member, job_description, due_date, status, created_by)
           VALUES ($1, $2, CURRENT_DATE, CURRENT_TIME, $3, $4, $5, $6, $7)`,
            [
              job_reference_id,
              pmNextNo,
              assigned_member || null,
              job_description || null,
              due_date || null,
              status || "todo",
              req.user?.username,
            ],
          );
        } catch (syncErr) {
          console.error("Sync to project_assigned_members failed:", syncErr);
          // Non-blocking — don't fail the main request
        }
      }

      res.status(201).json({ success: true, task: newTask });
    } catch (error) {
      console.error("Create task error:", error);
      res.status(500).json({ success: false, error: "Failed to create task" });
    }
  },
);

// PUT update task — syncs status/note back to project_assigned_members
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

      // ── Once a task is done, it's locked — no further edits by anyone ──
      if (record.status === "done") {
        res.status(403).json({
          success: false,
          error: "This task is marked done and can no longer be edited",
        });
        return;
      }

      const updates: Record<string, any> = { ...req.body };

      // ── finish_date is never client-settable — only the server sets it,
      //    automatically, the moment status transitions to "done" ──
      delete updates.finish_date;

      // ── Block reverting back to "todo" once a task has moved past it ──
      if (updates.status === "todo" && record.status !== "todo") {
        res.status(400).json({
          success: false,
          error: "A task cannot be moved back to To Do once it has started",
        });
        return;
      }

      if (updates.status && !VALID_STATUSES.includes(updates.status)) {
        res.status(400).json({ success: false, error: "Invalid status value" });
        return;
      }

      const USER_ALLOWED = ["update_note", "status"];
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

      // ── Auto-stamp finish_date the moment status is set to done ──
      if (updates.status === "done") {
        updates.finish_date = new Date().toISOString().split("T")[0];
      }

      if (Object.keys(updates).length === 0) {
        res.status(400).json({ success: false, error: "No fields to update" });
        return;
      }

      const updatedFields = Object.keys(updates);
      const setClause = updatedFields
        .map((f, i) => `${f} = $${i + 2}`)
        .join(", ");

      const result = await pool.query(
        `UPDATE worklist_tasks_v2 SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
        [taskId, ...Object.values(updates)],
      );

      const updatedTask = result.rows[0];

      // ── Sync status/finish_date back to project_assigned_members (non-blocking) ──
      if (updatedTask.job_type === "project" && updatedTask.job_reference_id) {
        pool
          .query(
            `UPDATE project_assigned_members
         SET status = $1, finish_date = $2, updated_at = CURRENT_TIMESTAMP
         WHERE project_id = $3 AND assigned_member = $4`,
            [
              updatedTask.status,
              updatedTask.finish_date || null,
              updatedTask.job_reference_id,
              updatedTask.assigned_member,
            ],
          )
          .catch((err) =>
            console.error("Sync to project_assigned_members failed:", err),
          );
      }

      res.json({ success: true, task: updatedTask });
    } catch (error: any) {
      console.error("Update task error:", error?.message || error);
      res.status(500).json({
        success: false,
        error: error?.message || "Failed to update task",
      });
    }
  },
);

// GET update logs for a task
router.get(
  "/jobAssigned/tasks/:taskId/updates",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { taskId } = req.params;
    const pool = getPool(req);
    try {
      const result = await pool.query(
        `SELECT * FROM worklist_task_updates WHERE task_id = $1 ORDER BY created_at ASC`,
        [taskId],
      );
      res.json({ success: true, updates: result.rows });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  },
);

// POST add update log row
// Any authenticated user may add a note, as long as the task has moved
// past "todo" and isn't yet "done". The row's `status` column is
// auto-stamped with whatever stage the task is at right now.
router.post(
  "/jobAssigned/tasks/:taskId/updates",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { taskId } = req.params;
    const { update_note } = req.body;
    const pool = getPool(req);

    if (!update_note?.trim()) {
      res
        .status(400)
        .json({ success: false, error: "Update note is required" });
      return;
    }

    try {
      const taskResult = await pool.query(
        `SELECT * FROM worklist_tasks_v2 WHERE id = $1`,
        [taskId],
      );

      if (taskResult.rows.length === 0) {
        res.status(404).json({ success: false, error: "Task not found" });
        return;
      }

      const task = taskResult.rows[0];

      if (task.status === "done") {
        res.status(403).json({
          success: false,
          error: "This task is marked done and can no longer be edited",
        });
        return;
      }

      if (task.status === "todo") {
        res.status(403).json({
          success: false,
          error: "Move the task to In Progress before adding an update",
        });
        return;
      }

      const result = await pool.query(
        `INSERT INTO worklist_task_updates (task_id, update_note, status, created_by)
   VALUES ($1, $2, $3, $4) RETURNING *`,
        [taskId, update_note.trim(), task.status, req.user?.username],
      );

      // Sync to project_member_updates if task is linked to a project
      try {
        if (
          task?.job_type === "project" &&
          task?.job_reference_id &&
          task?.assigned_member
        ) {
          // Find the linked project_assigned_member
          const memberResult = await pool.query(
            `SELECT id FROM project_assigned_members
       WHERE project_id = $1 AND assigned_member = $2
       LIMIT 1`,
            [task.job_reference_id, task.assigned_member],
          );
          if (memberResult.rows.length > 0) {
            const memberId = memberResult.rows[0].id;
            await pool.query(
              `INSERT INTO project_member_updates (member_id, update_note, created_by)
         VALUES ($1, $2, $3)`,
              [memberId, update_note.trim(), req.user?.username],
            );
          }
        }
      } catch (syncErr) {
        console.error("Sync update to project_member_updates failed:", syncErr);
      }

      res.status(201).json({ success: true, update: result.rows[0] });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  },
);

// PUT assign (or clear) a third-party member on a single update-log row
// Any authenticated user may do this, as long as the task isn't done.
router.put(
  "/jobAssigned/tasks/:taskId/updates/:updateId/third-party",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { taskId, updateId } = req.params;
    const { third_party } = req.body; // username string, or null to clear
    const pool = getPool(req);

    try {
      const taskResult = await pool.query(
        "SELECT status FROM worklist_tasks_v2 WHERE id = $1",
        [taskId],
      );
      if (taskResult.rows.length === 0) {
        res.status(404).json({ success: false, error: "Task not found" });
        return;
      }
      if (taskResult.rows[0].status === "done") {
        res.status(403).json({
          success: false,
          error: "This task is marked done and can no longer be edited",
        });
        return;
      }

      const result = await pool.query(
        `UPDATE worklist_task_updates SET third_party = $1 WHERE id = $2 AND task_id = $3 RETURNING *`,
        [third_party || null, updateId, taskId],
      );

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: "Update row not found" });
        return;
      }

      res.json({ success: true, update: result.rows[0] });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  },
);

// DELETE update log row (admin only)
router.delete(
  "/jobAssigned/tasks/:taskId/updates/:updateId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { taskId, updateId } = req.params;
    const pool = getPool(req);

    if (req.user?.role !== "admin") {
      res.status(403).json({ success: false, error: "Admin only" });
      return;
    }

    try {
      // Get the update note before deleting so we can match it in project_member_updates
      const updateResult = await pool.query(
        "SELECT * FROM worklist_task_updates WHERE id = $1",
        [updateId],
      );

      if (updateResult.rows.length === 0) {
        res.status(404).json({ success: false, error: "Update not found" });
        return;
      }

      const updateRow = updateResult.rows[0];

      // Delete from worklist_task_updates
      await pool.query("DELETE FROM worklist_task_updates WHERE id = $1", [
        updateId,
      ]);

      // Sync delete to project_member_updates (non-blocking)
      pool
        .query(`SELECT * FROM worklist_tasks_v2 WHERE id = $1`, [taskId])
        .then(async (taskResult) => {
          const task = taskResult.rows[0];
          if (
            task?.job_type === "project" &&
            task?.job_reference_id &&
            task?.assigned_member
          ) {
            const memberResult = await pool.query(
              `SELECT id FROM project_assigned_members
             WHERE project_id = $1 AND assigned_member = $2
             LIMIT 1`,
              [task.job_reference_id, task.assigned_member],
            );
            if (memberResult.rows.length > 0) {
              const memberId = memberResult.rows[0].id;
              // Delete matching entry by member_id + note + created_by
              await pool.query(
                `DELETE FROM project_member_updates
                  WHERE id = (
                    SELECT id FROM project_member_updates
                    WHERE member_id = $1
                      AND update_note = $2
                      AND created_by = $3
                    ORDER BY created_at ASC
                    LIMIT 1
                  )`,
                [memberId, updateRow.update_note, updateRow.created_by],
              );
            }
          }
        })
        .catch((err) =>
          console.error("Sync delete to project_member_updates failed:", err),
        );

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
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
