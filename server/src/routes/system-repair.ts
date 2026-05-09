// ============================================
// System Repair Routes
// Save as: server/src/routes/system-repair.ts
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

// GET all system repair records for a customer
router.get(
  "/:customerId/system-repair/records",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { customerId } = req.params;
    const pool = getPool(req);

    try {
      const result = await pool.query(
        `SELECT * FROM system_repair_records 
         WHERE customer_id = $1 
         ORDER BY start_date DESC`,
        [customerId],
      );

      res.json({
        success: true,
        records: result.rows,
      });
    } catch (error) {
      console.error("Get system repair records error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch system repair records",
      });
    }
  },
);

// POST add new system repair record
router.post(
  "/:customerId/system-repair/records",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { customerId } = req.params;
    const {
      start_date,
      finished_date,
      repair_reason,
      repaired_areas,
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
        `INSERT INTO system_repair_records 
         (customer_id, start_date, finished_date, repair_reason, repaired_areas,
          repair_instructor, repair_team, vehicle, driver, note, report, invoice)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          customerId,
          start_date || null,
          finished_date || null,
          repair_reason,
          repaired_areas || null,
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
        message: "System repair record added successfully",
        record: result.rows[0],
      });
    } catch (error) {
      console.error("Add system repair record error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to add system repair record",
      });
    }
  },
);

// DELETE system repair record (Admin only)
router.delete(
  "/:customerId/system-repair/records/:recordId",
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
        "DELETE FROM system_repair_records WHERE id = $1 RETURNING id",
        [recordId],
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: "System repair record not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "System repair record deleted successfully",
      });
    } catch (error) {
      console.error("Delete system repair record error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete system repair record",
      });
    }
  },
);

// POST upload job card for a system repair record
router.post(
  "/:customerId/system-repair/records/:recordId/jobcard",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { recordId } = req.params;
    const { file_data, filename, mime_type } = req.body;
    const pool = getPool(req);
    try {
      await pool.query(
        `UPDATE system_repair_records 
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

// DELETE job card from system repair record (admin only)
router.delete(
  "/:customerId/system-repair/records/:recordId/jobcard",
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
        `UPDATE system_repair_records 
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

// POST upload report
router.post(
  "/:customerId/system-repair/records/:recordId/report",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { recordId } = req.params;
    const { file_data, filename, mime_type } = req.body;
    const pool = getPool(req);
    try {
      await pool.query(
        `UPDATE system_repair_records 
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

// DELETE report (admin only)
router.delete(
  "/:customerId/system-repair/records/:recordId/report",
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
        `UPDATE system_repair_records 
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

// POST upload invoice
router.post(
  "/:customerId/system-repair/records/:recordId/invoice",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { recordId } = req.params;
    const { file_data, filename, mime_type } = req.body;
    const pool = getPool(req);
    try {
      await pool.query(
        `UPDATE system_repair_records 
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

// DELETE invoice (admin only)
router.delete(
  "/:customerId/system-repair/records/:recordId/invoice",
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
        `UPDATE system_repair_records 
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
