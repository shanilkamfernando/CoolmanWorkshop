// ============================================
// Compressor Service Routes
// Save as: server/src/routes/compressor-service.ts
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

// GET all compressor service companies for a customer
router.get(
  "/:customerId/compressor-service",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { customerId } = req.params;
    const pool = getPool(req);

    try {
      const result = await pool.query(
        `SELECT id, customer_id, name, model, serial_number, unit, created_at, updated_at 
         FROM compressor_service_companies 
         WHERE customer_id = $1 
         ORDER BY created_at DESC`,
        [customerId],
      );

      res.json({
        success: true,
        companies: result.rows,
      });
    } catch (error) {
      console.error("Get compressor service companies error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch companies",
      });
    }
  },
);

// GET single compressor service company
router.get(
  "/:customerId/compressor-service/:companyId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { customerId, companyId } = req.params;
    const pool = getPool(req);

    try {
      const result = await pool.query(
        `SELECT id, customer_id, name, model, serial_number, unit, created_at, updated_at 
         FROM compressor_service_companies 
         WHERE id = $1 AND customer_id = $2`,
        [companyId, customerId],
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: "Company not found",
        });
        return;
      }

      res.json({
        success: true,
        company: result.rows[0],
      });
    } catch (error) {
      console.error("Get company error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch company",
      });
    }
  },
);

// POST create new compressor service company (Admin only)
router.post(
  "/:customerId/compressor-service",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { customerId } = req.params;
    const { name, model, serial_number, unit } = req.body;
    const pool = getPool(req);

    if (req.user?.role !== "admin") {
      res.status(403).json({
        success: false,
        error: "Only admins can create service companies",
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
        `INSERT INTO compressor_service_companies 
           (customer_id, name, model, serial_number, unit, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
         RETURNING id, customer_id, name, model, serial_number, unit, created_at, updated_at`,
        [
          customerId,
          name.trim(),
          model?.trim() || null,
          serial_number?.trim() || null,
          unit?.trim() || null,
        ],
      );

      res.status(201).json({
        success: true,
        message: "Service company created successfully",
        company: result.rows[0],
      });
    } catch (error) {
      console.error("Create service company error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create service company",
      });
    }
  },
);

// PUT update compressor service company (Admin only)
router.put(
  "/:customerId/compressor-service/:companyId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { customerId, companyId } = req.params;
    const { name, model, serial_number, unit } = req.body;
    const pool = getPool(req);

    if (req.user?.role !== "admin") {
      res.status(403).json({
        success: false,
        error: "Only admins can update service companies",
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
        `UPDATE compressor_service_companies 
         SET name = $1, model = $2, serial_number = $3, unit = $4, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $5 AND customer_id = $6 
         RETURNING id, customer_id, name, model, serial_number, unit, created_at, updated_at`,
        [
          name.trim(),
          model?.trim() || null,
          serial_number?.trim() || null,
          unit?.trim() || null,
          companyId,
          customerId,
        ],
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: "Company not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "Service company updated successfully",
        company: result.rows[0],
      });
    } catch (error) {
      console.error("Update service company error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update service company",
      });
    }
  },
);

// DELETE compressor service company (Admin only)
router.delete(
  "/:customerId/compressor-service/:companyId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { customerId, companyId } = req.params;
    const pool = getPool(req);

    if (req.user?.role !== "admin") {
      res.status(403).json({
        success: false,
        error: "Only admins can delete service companies",
      });
      return;
    }

    try {
      const result = await pool.query(
        `DELETE FROM compressor_service_companies 
         WHERE id = $1 AND customer_id = $2 
         RETURNING id, name`,
        [companyId, customerId],
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: "Company not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "Service company deleted successfully",
        deletedCompany: result.rows[0],
      });
    } catch (error) {
      console.error("Delete service company error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete service company",
      });
    }
  },
);

// POST upload name tag for a compressor
router.post(
  "/:customerId/compressor-service/:companyId/compressors/:compressorId/nametag",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { compressorId } = req.params;
    const { file_data, filename, mime_type } = req.body;
    const pool = getPool(req);

    try {
      await pool.query(
        `UPDATE compressor_details 
         SET name_tag_filename=$1, name_tag_data=$2, name_tag_mime=$3
         WHERE id=$4`,
        [filename, file_data, mime_type, compressorId],
      );
      res.json({ success: true });
    } catch (error) {
      console.error("Upload name tag error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to upload name tag" });
    }
  },
);

// DELETE name tag
router.delete(
  "/:customerId/compressor-service/:companyId/compressors/:compressorId/nametag",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { compressorId } = req.params;
    const pool = getPool(req);

    if (req.user?.role !== "admin") {
      res
        .status(403)
        .json({ success: false, error: "Only admins can delete name tags" });
      return;
    }

    try {
      await pool.query(
        `UPDATE compressor_details 
         SET name_tag_filename=NULL, name_tag_data=NULL, name_tag_mime=NULL
         WHERE id=$1`,
        [compressorId],
      );
      res.json({ success: true });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, error: "Failed to delete name tag" });
    }
  },
);

// POST upload job card for a service record
router.post(
  "/:customerId/compressor-service/:companyId/records/:recordId/jobcard",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { recordId } = req.params;
    const { file_data, filename, mime_type } = req.body;
    const pool = getPool(req);
    try {
      await pool.query(
        `UPDATE service_records 
         SET job_card_filename=$1, job_card_data=$2, job_card_mime=$3
         WHERE id=$4`,
        [filename, file_data, mime_type, recordId],
      );
      res.json({ success: true });
    } catch (error) {
      console.error("Upload job card error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to upload job card" });
    }
  },
);

// DELETE job card from service record (admin only)
router.delete(
  "/:customerId/compressor-service/:companyId/records/:recordId/jobcard",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { recordId } = req.params;
    const pool = getPool(req);
    if (req.user?.role !== "admin") {
      res
        .status(403)
        .json({ success: false, error: "Only admins can delete job cards" });
      return;
    }
    try {
      await pool.query(
        `UPDATE service_records 
         SET job_card_filename=NULL, job_card_data=NULL, job_card_mime=NULL
         WHERE id=$1`,
        [recordId],
      );
      res.json({ success: true });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, error: "Failed to delete job card" });
    }
  },
);

export default router;
