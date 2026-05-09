// ============================================
// Compressor Service Dashboard Routes - UPDATED: Multiple Compressors
// Save as: server/src/routes/compressor-dashboard.ts
// REPLACE the old file with this one
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

// ===========================================
// COMPRESSOR ROUTES (MULTIPLE COMPRESSORS)
// ===========================================

// GET all compressors for a service company
router.get(
  "/:customerId/compressor-service/:companyId/compressors",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { companyId } = req.params;
    const pool = getPool(req);

    try {
      const result = await pool.query(
        `SELECT * FROM compressor_details 
         WHERE company_id = $1 
         ORDER BY created_at DESC`,
        [companyId],
      );

      res.json({
        success: true,
        compressors: result.rows,
      });
    } catch (error) {
      console.error("Get compressors error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch compressors",
      });
    }
  },
);

// POST add new compressor (Anyone can add)
router.post(
  "/:customerId/compressor-service/:companyId/compressors",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { companyId } = req.params;
    const {
      compressor_type,
      serial_number,
      compressor_name,
      coupling_type,
      used_for,
      installed_year,
    } = req.body;
    const pool = getPool(req);

    if (!compressor_type || !serial_number) {
      res.status(400).json({
        success: false,
        error: "Compressor type and serial number are required",
      });
      return;
    }

    try {
      const result = await pool.query(
        `INSERT INTO compressor_details 
         (company_id, compressor_type, serial_number, compressor_name, coupling_type, used_for, installed_year)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          companyId,
          compressor_type,
          serial_number,
          compressor_name || null,
          coupling_type || null,
          used_for || null,
          installed_year || null,
        ],
      );

      res.status(201).json({
        success: true,
        message: "Compressor added successfully",
        compressor: result.rows[0],
      });
    } catch (error) {
      console.error("Add compressor error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to add compressor",
      });
    }
  },
);

// PUT update compressor (Admin only)
router.put(
  "/:customerId/compressor-service/:companyId/compressors/:compressorId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { compressorId } = req.params;
    const pool = getPool(req);

    if (req.user?.role !== "admin") {
      res.status(403).json({
        success: false,
        error: "Only admins can update compressors",
      });
      return;
    }

    try {
      const fields = req.body;
      const updates = Object.keys(fields)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(", ");

      const values = Object.values(fields);

      const result = await pool.query(
        `UPDATE compressor_details 
         SET ${updates}, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1 
         RETURNING *`,
        [compressorId, ...values],
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: "Compressor not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "Compressor updated successfully",
        compressor: result.rows[0],
      });
    } catch (error) {
      console.error("Update compressor error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update compressor",
      });
    }
  },
);

// DELETE compressor (Admin only)
router.delete(
  "/:customerId/compressor-service/:companyId/compressors/:compressorId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { compressorId } = req.params;
    const pool = getPool(req);

    if (req.user?.role !== "admin") {
      res.status(403).json({
        success: false,
        error: "Only admins can delete compressors",
      });
      return;
    }

    try {
      const result = await pool.query(
        "DELETE FROM compressor_details WHERE id = $1 RETURNING id",
        [compressorId],
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: "Compressor not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "Compressor deleted successfully",
      });
    } catch (error) {
      console.error("Delete compressor error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete compressor",
      });
    }
  },
);

// ===========================================
// SERVICE RECORDS ROUTES
// ===========================================

// GET all service records for a company
router.get(
  "/:customerId/compressor-service/:companyId/records",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { companyId } = req.params;
    const pool = getPool(req);

    try {
      const result = await pool.query(
        `SELECT * FROM service_records 
         WHERE company_id = $1 
         ORDER BY start_date DESC`,
        [companyId],
      );

      res.json({
        success: true,
        records: result.rows,
      });
    } catch (error) {
      console.error("Get service records error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch service records",
      });
    }
  },
);

// POST add new service record
router.post(
  "/:customerId/compressor-service/:companyId/records",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { companyId } = req.params;
    const {
      start_date,
      finished_date,
      service_type,
      due_running_hours,
      serviced_running_hours,
      service_instructor,
      service_team,
      vehicle,
      driver,
      next_service_type,
      next_service_running_hours,
      report,
      invoice,
    } = req.body;
    const pool = getPool(req);

    if (!start_date || !service_type) {
      res.status(400).json({
        success: false,
        error: "Start date and service type are required",
      });
      return;
    }

    try {
      const result = await pool.query(
        `INSERT INTO service_records 
         (company_id, start_date, finished_date, service_type, due_running_hours, 
          serviced_running_hours, service_instructor, service_team, vehicle, driver, 
          next_service_type, next_service_running_hours, report, invoice)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         RETURNING *`,
        [
          companyId,
          start_date || null,
          finished_date || null,
          service_type,
          due_running_hours || null,
          serviced_running_hours || null,
          service_instructor || "Auto User",
          service_team || null,
          vehicle || null,
          driver || null,
          next_service_type || null,
          next_service_running_hours || null,
          report || null,
          invoice || null,
        ],
      );

      res.status(201).json({
        success: true,
        message: "Service record added successfully",
        record: result.rows[0],
      });
    } catch (error) {
      console.error("Add service record error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to add service record",
      });
    }
  },
);

// PUT update service record (Admin only)
router.put(
  "/:customerId/compressor-service/:companyId/records/:recordId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { recordId } = req.params;
    const pool = getPool(req);

    if (req.user?.role !== "admin") {
      res.status(403).json({
        success: false,
        error: "Only admins can update service records",
      });
      return;
    }

    try {
      const fields = req.body;
      const updates = Object.keys(fields)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(", ");

      const values = Object.values(fields);

      const result = await pool.query(
        `UPDATE service_records 
         SET ${updates}, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1 
         RETURNING *`,
        [recordId, ...values],
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: "Service record not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "Service record updated successfully",
        record: result.rows[0],
      });
    } catch (error) {
      console.error("Update service record error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update service record",
      });
    }
  },
);

// DELETE service record (Admin only)
router.delete(
  "/:customerId/compressor-service/:companyId/records/:recordId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { recordId } = req.params;
    const pool = getPool(req);

    if (req.user?.role !== "admin") {
      res.status(403).json({
        success: false,
        error: "Only admins can delete service records",
      });
      return;
    }

    try {
      const result = await pool.query(
        "DELETE FROM service_records WHERE id = $1 RETURNING id",
        [recordId],
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: "Service record not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "Service record deleted successfully",
      });
    } catch (error) {
      console.error("Delete service record error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete service record",
      });
    }
  },
);

export default router;
