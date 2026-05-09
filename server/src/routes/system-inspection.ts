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

//get all system inspection records for a customer
router.get(
  "/:customerId/system-inspection/records",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { customerId } = req.params;
    const pool = getPool(req);

    try {
      const result = await pool.query(
        `SELECT * FROM system_inspection_records
                WHERE customer_id = $1
                ORDER BY inspected_Date DESC`,
        [customerId],
      );

      res.json({
        success: true,
        records: result.rows,
      });
    } catch (error) {
      console.error("et system inspection records error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch system inspection records",
      });
    }
  },
);

// POST add new system inspection record
router.post(
  "/:customerId/system-inspection/records",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { customerId } = req.params;
    const {
      inspected_date,
      inspected_reason,
      inspected_areas,
      inspection_engineer,
      inspection_team,
      vehicle,
      driver,
      inspection_summary,
      report,
      invoice,
    } = req.body;

    const pool = getPool(req);

    if (!inspected_date || !inspected_reason) {
      res.status(400).json({
        success: false,
        error: "Inspected date and reason are required",
      });
      return;
    }

    try {
      const result = await pool.query(
        `INSERT INTO system_inspection_records 
         (customer_id, inspected_date, inspected_reason, inspected_areas,
          inspection_engineer, inspection_team, vehicle, driver, inspection_summary, report, invoice)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          customerId,
          inspected_date || null,
          inspected_reason,
          inspected_areas || null,
          inspection_engineer || "Auto User",
          inspection_team || null,
          vehicle || null,
          driver || null,
          inspection_summary || null,
          report || null,
          invoice || null,
        ],
      );

      res.status(201).json({
        success: true,
        message: "System inspection record added successfully",
        record: result.rows[0],
      });
    } catch (error) {
      console.error("Add system inspection record error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to add system inspection record",
      });
    }
  },
);

// DELETE system inspection record (Admin only)
router.delete(
  "/:customerId/system-inspection/records/:recordId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { recordId } = req.params;
    const pool = getPool(req);

    if (req.user?.role !== "admin") {
      res.status(403).json({
        success: false,
        error: "Only admins can delete inspection records",
      });
      return;
    }

    try {
      const result = await pool.query(
        "DELETE FROM system_inspection_records WHERE id = $1 RETURNING id",
        [recordId],
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: "System inspection record not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "System inspection record deleted successfully",
      });
    } catch (error) {
      console.error("Delete system inspection record error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete system inspection record",
      });
    }
  },
);

// POST upload job card
router.post(
  "/:customerId/system-inspection/records/:recordId/jobcard",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { recordId } = req.params;
    const { file_data, filename, mime_type } = req.body;
    const pool = getPool(req);
    try {
      await pool.query(
        `UPDATE system_inspection_records 
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

// DELETE job card (admin only)
router.delete(
  "/:customerId/system-inspection/records/:recordId/jobcard",
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
        `UPDATE system_inspection_records 
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
  "/:customerId/system-inspection/records/:recordId/report",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { recordId } = req.params;
    const { file_data, filename, mime_type } = req.body;
    const pool = getPool(req);
    try {
      await pool.query(
        `UPDATE system_inspection_records 
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
  "/:customerId/system-inspection/records/:recordId/report",
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
        `UPDATE system_inspection_records 
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
  "/:customerId/system-inspection/records/:recordId/invoice",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { recordId } = req.params;
    const { file_data, filename, mime_type } = req.body;
    const pool = getPool(req);
    try {
      await pool.query(
        `UPDATE system_inspection_records 
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
  "/:customerId/system-inspection/records/:recordId/invoice",
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
        `UPDATE system_inspection_records 
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
