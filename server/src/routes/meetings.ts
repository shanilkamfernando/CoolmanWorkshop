// ============================================
// Meetings Routes
// Save as: server/src/routes/meetings.ts
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

// Helper: convert empty string / undefined / null to null
const nullIfEmpty = (val: any): string | null =>
  val === "" || val === undefined || val === null ? null : String(val).trim();

// GET meetings - ALL users (including admin) see ONLY their own meetings
router.get(
  "/meetings",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const pool = getPool(req);
    const username = req.user?.username;

    try {
      const result = await pool.query(
        `SELECT id, title, type, TO_CHAR(date, 'YYYY-MM-DD') as date,
          start_time, end_time, location, notes, status,
          customer, remarks, created_by, created_at, updated_at
   FROM meetings 
   WHERE created_by = $1 
   ORDER BY date ASC, start_time ASC`,
        [username],
      );
      res.json({ success: true, meetings: result.rows });
    } catch (error: any) {
      console.error("Get meetings error:", error?.message || error);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch meetings" });
    }
  },
);

// POST create meeting (all authenticated users)
router.post(
  "/meetings",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const {
      title,
      type,
      date,
      start_time,
      end_time,
      location,
      notes,
      status,
      customer,
      remarks,
    } = req.body;
    const pool = getPool(req);

    if (!title?.trim() || !date) {
      res
        .status(400)
        .json({ success: false, error: "Title and date are required" });
      return;
    }

    try {
      const result = await pool.query(
        `INSERT INTO meetings
          (title, type, date, start_time, end_time, location, notes, status,  customer, remarks, created_by)
            VALUES ($1,$2,$3::date,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING id, title, type, TO_CHAR(date, 'YYYY-MM-DD') as date,
          start_time, end_time, location, notes, status,
          customer, remarks, created_by, created_at`,
        [
          title.trim(),
          nullIfEmpty(type) || "Customer Visit",
          date,
          nullIfEmpty(start_time),
          nullIfEmpty(end_time),
          nullIfEmpty(location),
          nullIfEmpty(notes),
          nullIfEmpty(status) || "Scheduled",
          nullIfEmpty(customer),
          nullIfEmpty(remarks),
          req.user?.username || "Unknown",
        ],
      );
      res.status(201).json({ success: true, meeting: result.rows[0] });
    } catch (error: any) {
      console.error("Create meeting error:", error?.message || error);
      res.status(500).json({
        success: false,
        error: "Failed to create meeting",
        detail: error?.message,
      });
    }
  },
);

// PUT update meeting - users can only update their own meetings
router.put(
  "/meetings/:id",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const pool = getPool(req);
    const username = req.user?.username;

    const {
      title,
      type,
      date,
      start_time,
      end_time,
      location,
      notes,
      status,
      customer,
      remarks,
    } = req.body;

    try {
      const result = await pool.query(
        `UPDATE meetings
         SET title=$1, type=$2, date=$3::date, start_time=$4, end_time=$5,
             location=$6, notes=$7, status=$8, customer=$9, remarks=$10,
             updated_at=CURRENT_TIMESTAMP
         WHERE id=$11 AND created_by=$12
        RETURNING id, title, type, TO_CHAR(date, 'YYYY-MM-DD') as date,
          start_time, end_time, location, notes, status,
          customer, remarks, created_by, created_at, updated_at`,
        [
          nullIfEmpty(title),
          nullIfEmpty(type) || "Customer Visit",
          date,
          nullIfEmpty(start_time),
          nullIfEmpty(end_time),
          nullIfEmpty(location),
          nullIfEmpty(notes),
          nullIfEmpty(status) || "Scheduled",
          nullIfEmpty(customer),
          nullIfEmpty(remarks),
          id,
          username,
        ],
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: "Meeting not found or not authorized",
        });
        return;
      }

      res.json({ success: true, meeting: result.rows[0] });
    } catch (error: any) {
      console.error("Update meeting error:", error?.message || error);
      res.status(500).json({
        success: false,
        error: "Failed to update meeting",
        detail: error?.message,
      });
    }
  },
);

// DELETE meeting - users can only delete their own meetings
router.delete(
  "/meetings/:id",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const pool = getPool(req);
    const username = req.user?.username;

    try {
      const result = await pool.query(
        "DELETE FROM meetings WHERE id=$1 AND created_by=$2 RETURNING id",
        [id, username],
      );
      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: "Meeting not found or not authorized",
        });
        return;
      }
      res.json({ success: true, message: "Meeting deleted" });
    } catch (error: any) {
      console.error("Delete meeting error:", error?.message || error);
      res
        .status(500)
        .json({ success: false, error: "Failed to delete meeting" });
    }
  },
);

export default router;
