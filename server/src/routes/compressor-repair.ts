// ============================================
// Compressor Repair Routes
// Save as: server/src/routes/compressor-repair.ts
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

// GET all compressor repair companies for a customer
router.get(
  "/:customerId/compressor-repair",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { customerId } = req.params;
    const pool = getPool(req);

    try {
      const result = await pool.query(
        `SELECT * FROM compressor_repair_companies 
         WHERE customer_id = $1 
         ORDER BY created_at DESC`,
        [customerId],
      );

      res.json({
        success: true,
        companies: result.rows,
      });
    } catch (error) {
      console.error("Get compressor repair companies error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch compressor repair companies",
      });
    }
  },
);

// POST create new compressor repair company (Admin only)
router.post(
  "/:customerId/compressor-repair",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { customerId } = req.params;
    const { name } = req.body;
    const pool = getPool(req);

    if (req.user?.role !== "admin") {
      res.status(403).json({
        success: false,
        error: "Only admins can create compressor repair companies",
      });
      return;
    }

    if (!name || !name.trim()) {
      res.status(400).json({
        success: false,
        error: "Company name is required",
      });
      return;
    }

    try {
      const result = await pool.query(
        `INSERT INTO compressor_repair_companies (customer_id, name) 
         VALUES ($1, $2) 
         RETURNING *`,
        [customerId, name.trim()],
      );

      res.status(201).json({
        success: true,
        message: "Compressor repair company created successfully",
        company: result.rows[0],
      });
    } catch (error) {
      console.error("Create compressor repair company error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create compressor repair company",
      });
    }
  },
);

// DELETE compressor repair company (Admin only)
router.delete(
  "/:customerId/compressor-repair/:companyId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { companyId } = req.params;
    const pool = getPool(req);

    if (req.user?.role !== "admin") {
      res.status(403).json({
        success: false,
        error: "Only admins can delete compressor repair companies",
      });
      return;
    }

    try {
      const result = await pool.query(
        "DELETE FROM compressor_repair_companies WHERE id = $1 RETURNING id",
        [companyId],
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: "Compressor repair company not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "Compressor repair company deleted successfully",
      });
    } catch (error) {
      console.error("Delete compressor repair company error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete compressor repair company",
      });
    }
  },
);

export default router;
