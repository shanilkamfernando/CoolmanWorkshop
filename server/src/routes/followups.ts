// ============================================
// Follow Up Routes
// Save as: server/src/routes/followups.ts
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

const nullIfEmpty = (val: any): string | null =>
  val === "" || val === undefined || val === null ? null : String(val).trim();

// Generate follow-up number: FU-001, FU-002 ...
const generateFollowUpNo = async (pool: Pool): Promise<string> => {
  const result = await pool.query(
    `SELECT follow_up_no FROM follow_ups ORDER BY id DESC LIMIT 1`,
  );
  if (result.rows.length === 0) return "FU-001";
  const last = result.rows[0].follow_up_no;
  const match = last.match(/FU-(\d+)/);
  if (match) {
    const next = (parseInt(match[1]) + 1).toString().padStart(3, "0");
    return `FU-${next}`;
  }
  return "FU-001";
};

// ── GET all follow-ups (everyone sees all) ────────────────────────────────
router.get(
  "/followups",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const pool = getPool(req);
    try {
      const followUps = await pool.query(
        `SELECT * FROM follow_ups ORDER BY id ASC`,
      );

      // For each follow-up, get its contacts ordered by contact_index
      const withContacts = await Promise.all(
        followUps.rows.map(async (fu) => {
          const contacts = await pool.query(
            `SELECT date, update_note as "update", logged_by
             FROM follow_up_contacts
             WHERE follow_up_id = $1
             ORDER BY contact_index ASC`,
            [fu.id],
          );
          return { ...fu, contacts: contacts.rows };
        }),
      );

      res.json({ success: true, followUps: withContacts });
    } catch (error: any) {
      console.error("Get follow-ups error:", error?.message || error);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch follow-ups" });
    }
  },
);

// ── POST create follow-up (admin only) ───────────────────────────────────
router.post(
  "/followups",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (req.user?.role !== "admin") {
      res
        .status(403)
        .json({ success: false, error: "Only admins can create follow-ups" });
      return;
    }

    const {
      company,
      project,
      person,
      description,
      contact1_date,
      contact1_update,
    } = req.body;
    const pool = getPool(req);

    if (!company?.trim() || !person?.trim()) {
      res
        .status(400)
        .json({ success: false, error: "Company and Person are required" });
      return;
    }

    try {
      const followUpNo = await generateFollowUpNo(pool);

      const result = await pool.query(
        `INSERT INTO follow_ups (follow_up_no, company, project, person, description, created_by)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [
          followUpNo,
          company.trim(),
          nullIfEmpty(project),
          person.trim(),
          nullIfEmpty(description),
          req.user?.username || "Unknown",
        ],
      );

      const followUpId = result.rows[0].id;

      // If first contact was provided, save it
      if (contact1_date || contact1_update) {
        await pool.query(
          `INSERT INTO follow_up_contacts (follow_up_id, contact_index, date, update_note, logged_by)
           VALUES ($1, 0, $2, $3, $4)`,
          [
            followUpId,
            nullIfEmpty(contact1_date),
            nullIfEmpty(contact1_update),
            req.user?.username || "Unknown",
          ],
        );
      }

      res.status(201).json({ success: true, followUp: result.rows[0] });
    } catch (error: any) {
      console.error("Create follow-up error:", error?.message || error);
      res.status(500).json({
        success: false,
        error: "Failed to create follow-up",
        detail: error?.message,
      });
    }
  },
);

// ── PATCH update a single main field (admin only) ─────────────────────────
router.patch(
  "/followups/:id/field",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (req.user?.role !== "admin") {
      res
        .status(403)
        .json({ success: false, error: "Only admins can edit follow-ups" });
      return;
    }

    const { id } = req.params;
    const { field, value } = req.body;
    const pool = getPool(req);

    const allowed = ["company", "project", "person", "description"];
    if (!allowed.includes(field)) {
      res.status(400).json({ success: false, error: "Invalid field" });
      return;
    }

    try {
      await pool.query(
        `UPDATE follow_ups SET ${field} = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [nullIfEmpty(value), id],
      );
      res.json({ success: true });
    } catch (error: any) {
      console.error("Update field error:", error?.message || error);
      res.status(500).json({ success: false, error: "Failed to update field" });
    }
  },
);

// ── PATCH update a contact entry (admin only) ─────────────────────────────
router.patch(
  "/followups/:id/contact",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (req.user?.role !== "admin") {
      res
        .status(403)
        .json({ success: false, error: "Only admins can edit contacts" });
      return;
    }

    const { id } = req.params;
    const { contact_index, field, value } = req.body;
    const pool = getPool(req);

    const allowed = ["date", "update"];
    if (!allowed.includes(field)) {
      res.status(400).json({ success: false, error: "Invalid field" });
      return;
    }

    const dbField = field === "update" ? "update_note" : "date";

    try {
      await pool.query(
        `UPDATE follow_up_contacts SET ${dbField} = $1
         WHERE follow_up_id = $2 AND contact_index = $3`,
        [nullIfEmpty(value), id, contact_index],
      );
      res.json({ success: true });
    } catch (error: any) {
      console.error("Update contact error:", error?.message || error);
      res
        .status(500)
        .json({ success: false, error: "Failed to update contact" });
    }
  },
);

// ── POST log a new contact attempt (any user, max 5, cannot edit after) ───
router.post(
  "/followups/:id/contact",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { date, update } = req.body;
    const pool = getPool(req);

    if (!date || !update?.trim()) {
      res
        .status(400)
        .json({ success: false, error: "Date and update are required" });
      return;
    }

    try {
      // Check current contact count
      const countResult = await pool.query(
        `SELECT COUNT(*) as cnt FROM follow_up_contacts WHERE follow_up_id = $1`,
        [id],
      );
      const count = parseInt(countResult.rows[0].cnt);

      if (count >= 5) {
        res
          .status(400)
          .json({ success: false, error: "Maximum 5 contacts already logged" });
        return;
      }

      await pool.query(
        `INSERT INTO follow_up_contacts (follow_up_id, contact_index, date, update_note, logged_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          id,
          count,
          nullIfEmpty(date),
          update.trim(),
          req.user?.username || "Unknown",
        ],
      );

      res.status(201).json({ success: true });
    } catch (error: any) {
      console.error("Log contact error:", error?.message || error);
      res.status(500).json({
        success: false,
        error: "Failed to log contact",
        detail: error?.message,
      });
    }
  },
);

// ── DELETE follow-up (admin only) ─────────────────────────────────────────
router.delete(
  "/followups/:id",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (req.user?.role !== "admin") {
      res
        .status(403)
        .json({ success: false, error: "Only admins can delete follow-ups" });
      return;
    }

    const { id } = req.params;
    const pool = getPool(req);

    try {
      // Contacts are deleted via CASCADE (see migration)
      const result = await pool.query(
        "DELETE FROM follow_ups WHERE id = $1 RETURNING id",
        [id],
      );
      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: "Follow-up not found" });
        return;
      }
      res.json({ success: true, message: "Follow-up deleted" });
    } catch (error: any) {
      console.error("Delete follow-up error:", error?.message || error);
      res
        .status(500)
        .json({ success: false, error: "Failed to delete follow-up" });
    }
  },
);

export default router;
