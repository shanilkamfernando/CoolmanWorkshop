// ============================================
// Workshop Projects Routes
// Save as: server/src/routes/workshop-projects.ts
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

// GET all workshop projects
router.get(
  "/workshop/projects",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const pool = getPool(req);

    try {
      const result = await pool.query(
        `SELECT 
          wp.id,
          wp.project_name,
          wp.customer_id,
          c.name as customer_name,
          wp.created_by,
          wp.created_at,
          wp.updated_at
         FROM workshop_projects wp
         LEFT JOIN customers c ON wp.customer_id = c.id
         ORDER BY wp.created_at DESC`,
      );

      res.json({
        success: true,
        projects: result.rows,
      });
    } catch (error) {
      console.error("Get workshop projects error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch workshop projects",
      });
    }
  },
);

// GET single workshop project by ID
router.get(
  "/workshop/projects/:projectId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { projectId } = req.params;
    const pool = getPool(req);

    try {
      const result = await pool.query(
        `SELECT 
          wp.id,
          wp.project_name,
          wp.customer_id,
          c.name as customer_name,
          wp.created_by,
          wp.created_at,
          wp.updated_at
         FROM workshop_projects wp
         LEFT JOIN customers c ON wp.customer_id = c.id
         WHERE wp.id = $1`,
        [projectId],
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: "Project not found",
        });
        return;
      }

      res.json({
        success: true,
        project: result.rows[0],
      });
    } catch (error) {
      console.error("Get workshop project error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch workshop project",
      });
    }
  },
);

// POST create new workshop project
router.post(
  "/workshop/projects",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { project_name, customer_id } = req.body;
    const pool = getPool(req);

    if (!project_name || !project_name.trim()) {
      res.status(400).json({
        success: false,
        error: "Project name is required",
      });
      return;
    }

    try {
      const result = await pool.query(
        `INSERT INTO workshop_projects 
         (project_name, customer_id, created_by)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [
          project_name.trim(),
          customer_id || null,
          req.user?.username || "Unknown",
        ],
      );

      res.status(201).json({
        success: true,
        message: "Workshop project created successfully",
        project: result.rows[0],
      });
    } catch (error) {
      console.error("Create workshop project error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create workshop project",
      });
    }
  },
);

// DELETE workshop project (Admin only)
router.delete(
  "/workshop/projects/:projectId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { projectId } = req.params;
    const pool = getPool(req);

    if (req.user?.role !== "admin") {
      res.status(403).json({
        success: false,
        error: "Only admins can delete projects",
      });
      return;
    }

    try {
      const result = await pool.query(
        "DELETE FROM workshop_projects WHERE id = $1 RETURNING id",
        [projectId],
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: "Project not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "Workshop project deleted successfully",
      });
    } catch (error) {
      console.error("Delete workshop project error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete workshop project",
      });
    }
  },
);

export default router;
