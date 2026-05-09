// ============================================
// Worklist Years Routes
// Save as: server/src/routes/worklist-years.ts
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

// GET all worklist years
router.get(
  "/jobAssigned/years",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const pool = getPool(req);

    try {
      const result = await pool.query(
        `SELECT * FROM worklist_years ORDER BY year DESC`,
      );

      res.json({
        success: true,
        years: result.rows,
      });
    } catch (error) {
      console.error("Get worklist years error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch worklist years",
      });
    }
  },
);

// POST create new worklist year
router.post(
  "/jobAssigned/years",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { year } = req.body;
    const pool = getPool(req);

    if (!year) {
      res.status(400).json({
        success: false,
        error: "Year is required",
      });
      return;
    }

    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
      res.status(400).json({
        success: false,
        error: "Invalid year",
      });
      return;
    }

    try {
      const result = await pool.query(
        `INSERT INTO worklist_years (year, created_by)
         VALUES ($1, $2)
         RETURNING *`,
        [yearNum, req.user?.username || "Unknown"],
      );

      res.status(201).json({
        success: true,
        message: "Worklist year created successfully",
        year: result.rows[0],
      });
    } catch (error: any) {
      if (error.code === "23505") {
        // Unique constraint violation
        res.status(400).json({
          success: false,
          error: "Year already exists",
        });
      } else {
        console.error("Create worklist year error:", error);
        res.status(500).json({
          success: false,
          error: "Failed to create worklist year",
        });
      }
    }
  },
);

// DELETE worklist year (Admin only)
router.delete(
  "/jobAssigned/years/:yearId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { yearId } = req.params;
    const pool = getPool(req);

    if (req.user?.role !== "admin") {
      res.status(403).json({
        success: false,
        error: "Only admins can delete years",
      });
      return;
    }

    try {
      const result = await pool.query(
        "DELETE FROM worklist_years WHERE id = $1 RETURNING id",
        [yearId],
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: "Year not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "Worklist year deleted successfully",
      });
    } catch (error) {
      console.error("Delete worklist year error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete worklist year",
      });
    }
  },
);

export default router;
