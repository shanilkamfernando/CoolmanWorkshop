// ============================================
// Compressor Repair Dashboard Routes
// Save as: server/src/routes/compressor-repair-dashboard.ts
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
// COMPRESSOR DETAILS ROUTES (FOR REPAIR)
// ===========================================

// GET all compressors for a repair company
router.get(
  "/:customerId/compressor-repair/:companyId/compressors",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { companyId } = req.params;
    const pool = getPool(req);

    try {
      const result = await pool.query(
        `SELECT * FROM compressor_repair_details 
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

// POST add new compressor
router.post(
  "/:customerId/compressor-repair/:companyId/compressors",
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
        `INSERT INTO compressor_repair_details 
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

// DELETE compressor (Admin only)
router.delete(
  "/:customerId/compressor-repair/:companyId/compressors/:compressorId",
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
        "DELETE FROM compressor_repair_details WHERE id = $1 RETURNING id",
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
// REPAIR RECORDS ROUTES
// ===========================================

// GET all repair records for a company
router.get(
  "/:customerId/compressor-repair/:companyId/records",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { companyId } = req.params;
    const pool = getPool(req);

    try {
      const result = await pool.query(
        `SELECT * FROM repair_records 
         WHERE company_id = $1 
         ORDER BY start_date DESC`,
        [companyId],
      );

      res.json({
        success: true,
        records: result.rows,
      });
    } catch (error) {
      console.error("Get repair records error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch repair records",
      });
    }
  },
);

// POST add new repair record
router.post(
  "/:customerId/compressor-repair/:companyId/records",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { companyId } = req.params;
    const {
      start_date,
      finished_date,
      repair_reason,
      running_hours,
      repair_instructor,
      repair_team,
      vehicle,
      driver,
      note,
      report,
      invoice,
    } = req.body;
    const pool = getPool(req);

    if (!start_date || !repair_reason) {
      res.status(400).json({
        success: false,
        error: "Start date and repair reason are required",
      });
      return;
    }

    try {
      const result = await pool.query(
        `INSERT INTO repair_records 
         (company_id, start_date, finished_date, repair_reason, running_hours, 
          repair_instructor, repair_team, vehicle, driver, note, report, invoice)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          companyId,
          start_date || null,
          finished_date || null,
          repair_reason,
          running_hours || null,
          repair_instructor || "Auto User",
          repair_team || null,
          vehicle || null,
          driver || null,
          note || null,
          report || null,
          invoice || null,
        ],
      );

      res.status(201).json({
        success: true,
        message: "Repair record added successfully",
        record: result.rows[0],
      });
    } catch (error) {
      console.error("Add repair record error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to add repair record",
      });
    }
  },
);

// DELETE repair record (Admin only)
router.delete(
  "/:customerId/compressor-repair/:companyId/records/:recordId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { recordId } = req.params;
    const pool = getPool(req);

    if (req.user?.role !== "admin") {
      res.status(403).json({
        success: false,
        error: "Only admins can delete repair records",
      });
      return;
    }

    try {
      const result = await pool.query(
        "DELETE FROM repair_records WHERE id = $1 RETURNING id",
        [recordId],
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: "Repair record not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "Repair record deleted successfully",
      });
    } catch (error) {
      console.error("Delete repair record error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete repair record",
      });
    }
  },
);

// POST upload name tag for a compressor (repair)
router.post(
  "/:customerId/compressor-repair/:companyId/compressors/:compressorId/nametag",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { compressorId } = req.params;
    const { file_data, filename, mime_type } = req.body;
    const pool = getPool(req);
    try {
      await pool.query(
        `UPDATE compressor_repair_details 
         SET name_tag_filename=$1, name_tag_data=$2, name_tag_mime=$3
         WHERE id=$4`,
        [filename, file_data, mime_type, compressorId],
      );
      res.json({ success: true });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, error: "Failed to upload name tag" });
    }
  },
);

// DELETE name tag (repair compressor)
router.delete(
  "/:customerId/compressor-repair/:companyId/compressors/:compressorId/nametag",
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
        `UPDATE compressor_repair_details 
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

// POST upload job card for a repair record
router.post(
  "/:customerId/compressor-repair/:companyId/records/:recordId/jobcard",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { recordId } = req.params;
    const { file_data, filename, mime_type } = req.body;
    const pool = getPool(req);
    try {
      await pool.query(
        `UPDATE repair_records 
         SET job_card_filename=$1, job_card_data=$2, job_card_mime=$3
         WHERE id=$4`,
        [filename, file_data, mime_type, recordId],
      );
      res.json({ success: true });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, error: "Failed to upload job card" });
    }
  },
);

// DELETE job card from repair record (admin only)
router.delete(
  "/:customerId/compressor-repair/:companyId/records/:recordId/jobcard",
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
        `UPDATE repair_records 
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

// POST upload report for a repair record
router.post(
  "/:customerId/compressor-repair/:companyId/records/:recordId/report",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { recordId } = req.params;
    const { file_data, filename, mime_type } = req.body;
    const pool = getPool(req);
    try {
      await pool.query(
        `UPDATE repair_records 
         SET report_filename=$1, report_data=$2, report_mime=$3
         WHERE id=$4`,
        [filename, file_data, mime_type, recordId],
      );
      res.json({ success: true });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, error: "Failed to upload report" });
    }
  },
);

// DELETE report from repair record (admin only)
router.delete(
  "/:customerId/compressor-repair/:companyId/records/:recordId/report",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { recordId } = req.params;
    const pool = getPool(req);
    if (req.user?.role !== "admin") {
      res
        .status(403)
        .json({ success: false, error: "Only admins can delete reports" });
      return;
    }
    try {
      await pool.query(
        `UPDATE repair_records 
         SET report_filename=NULL, report_data=NULL, report_mime=NULL
         WHERE id=$1`,
        [recordId],
      );
      res.json({ success: true });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, error: "Failed to delete report" });
    }
  },
);

// POST upload invoice for a repair record
router.post(
  "/:customerId/compressor-repair/:companyId/records/:recordId/invoice",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { recordId } = req.params;
    const { file_data, filename, mime_type } = req.body;
    const pool = getPool(req);
    try {
      await pool.query(
        `UPDATE repair_records 
         SET invoice_filename=$1, invoice_data=$2, invoice_mime=$3
         WHERE id=$4`,
        [filename, file_data, mime_type, recordId],
      );
      res.json({ success: true });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, error: "Failed to upload invoice" });
    }
  },
);

// DELETE invoice from repair record (admin only)
router.delete(
  "/:customerId/compressor-repair/:companyId/records/:recordId/invoice",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { recordId } = req.params;
    const pool = getPool(req);
    if (req.user?.role !== "admin") {
      res
        .status(403)
        .json({ success: false, error: "Only admins can delete invoices" });
      return;
    }
    try {
      await pool.query(
        `UPDATE repair_records 
         SET invoice_filename=NULL, invoice_data=NULL, invoice_mime=NULL
         WHERE id=$1`,
        [recordId],
      );
      res.json({ success: true });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, error: "Failed to delete invoice" });
    }
  },
);

export default router;
