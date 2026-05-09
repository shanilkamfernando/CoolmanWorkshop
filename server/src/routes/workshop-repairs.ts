// ============================================
// Workshop Repairs Routes
// Save as: server/src/routes/workshop-repairs.ts
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

// GET all workshop repairs
router.get(
  "/workshop/repairs",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const pool = getPool(req);

    try {
      const result = await pool.query(
        `SELECT 
          wr.id,
          wr.repair_name,
          wr.customer_id,
          c.name as customer_name,
          wr.created_by,
          wr.created_at,
          wr.updated_at
         FROM workshop_repairs wr
         LEFT JOIN customers c ON wr.customer_id = c.id
         ORDER BY wr.created_at DESC`,
      );

      res.json({
        success: true,
        repairs: result.rows,
      });
    } catch (error) {
      console.error("Get workshop repairs error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch workshop repairs",
      });
    }
  },
);

// GET single workshop repair by ID
router.get(
  "/workshop/repairs/:repairId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { repairId } = req.params;
    const pool = getPool(req);

    try {
      const result = await pool.query(
        `SELECT 
          wr.id,
          wr.repair_name,
          wr.customer_id,
          c.name as customer_name,
          wr.created_by,
          wr.created_at,
          wr.updated_at
         FROM workshop_repairs wr
         LEFT JOIN customers c ON wr.customer_id = c.id
         WHERE wr.id = $1`,
        [repairId],
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: "Repair not found",
        });
        return;
      }

      res.json({
        success: true,
        repair: result.rows[0],
      });
    } catch (error) {
      console.error("Get workshop repair error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch workshop repair",
      });
    }
  },
);

// POST create new workshop repair
router.post(
  "/workshop/repairs",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { repair_name, customer_id } = req.body;
    const pool = getPool(req);

    if (!repair_name || !repair_name.trim()) {
      res.status(400).json({
        success: false,
        error: "Repair name is required",
      });
      return;
    }

    try {
      const result = await pool.query(
        `INSERT INTO workshop_repairs 
         (repair_name, customer_id, created_by)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [
          repair_name.trim(),
          customer_id || null,
          req.user?.username || "Unknown",
        ],
      );

      res.status(201).json({
        success: true,
        message: "Workshop repair created successfully",
        repair: result.rows[0],
      });
    } catch (error) {
      console.error("Create workshop repair error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create workshop repair",
      });
    }
  },
);

// DELETE workshop repair (Admin only)
router.delete(
  "/workshop/repairs/:repairId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { repairId } = req.params;
    const pool = getPool(req);

    if (req.user?.role !== "admin") {
      res.status(403).json({
        success: false,
        error: "Only admins can delete repairs",
      });
      return;
    }

    try {
      const result = await pool.query(
        "DELETE FROM workshop_repairs WHERE id = $1 RETURNING id",
        [repairId],
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: "Repair not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "Workshop repair deleted successfully",
      });
    } catch (error) {
      console.error("Delete workshop repair error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete workshop repair",
      });
    }
  },
);

export default router;
