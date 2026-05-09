// ============================================
// Job Cards Routes
// Save as: server/src/routes/job-cards.ts
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

// Generate job card number: CMR.WJC.XXXX@YYYY
const generateJobCardNumber = async (pool: Pool): Promise<string> => {
  const year = new Date().getFullYear();
  const result = await pool.query(
    `SELECT COUNT(*) as count FROM job_cards WHERE EXTRACT(YEAR FROM created_at) = $1`,
    [year],
  );
  const count = parseInt(result.rows[0].count) + 1;
  return `CMR.WJC.${String(count).padStart(4, "0")}@${year}`;
};

// ─── JOB CARDS LIST ───────────────────────────────────────────────

// GET all job cards for a customer
router.get(
  "/:customerId/jobcards",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { customerId } = req.params;
    const pool = getPool(req);
    try {
      const result = await pool.query(
        `SELECT id, job_card_number, date, time, item, item_number,
                vehicle_number, company_reference, status, created_by, created_at
         FROM job_cards
         WHERE customer_id = $1
         ORDER BY created_at DESC`,
        [customerId],
      );
      res.json({ success: true, jobcards: result.rows });
    } catch (error) {
      console.error("Get job cards error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch job cards" });
    }
  },
);

// GET single job card (full details)
router.get(
  "/:customerId/jobcards/:jobCardId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { jobCardId } = req.params;
    const pool = getPool(req);
    try {
      const [card, items, labor, grn, dispatch] = await Promise.all([
        pool.query("SELECT * FROM job_cards WHERE id = $1", [jobCardId]),
        pool.query(
          "SELECT * FROM job_card_items WHERE job_card_id = $1 ORDER BY row_no",
          [jobCardId],
        ),
        pool.query(
          "SELECT * FROM job_card_labor WHERE job_card_id = $1 ORDER BY row_no",
          [jobCardId],
        ),
        pool.query(
          "SELECT * FROM job_card_grn WHERE job_card_id = $1 LIMIT 1",
          [jobCardId],
        ),
        pool.query(
          "SELECT * FROM job_card_dispatch WHERE job_card_id = $1 LIMIT 1",
          [jobCardId],
        ),
      ]);

      if (card.rows.length === 0) {
        res.status(404).json({ success: false, error: "Job card not found" });
        return;
      }

      res.json({
        success: true,
        jobcard: card.rows[0],
        items: items.rows,
        labor: labor.rows,
        grn: grn.rows[0] || null,
        dispatch: dispatch.rows[0] || null,
      });
    } catch (error) {
      console.error("Get job card error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch job card" });
    }
  },
);

// POST create job card
router.post(
  "/:customerId/jobcards",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { customerId } = req.params;
    const pool = getPool(req);
    const {
      date,
      time,
      customer_name,
      contact_number,
      item,
      item_number,
      vehicle_number,
      company_reference,
      job_description,
      note,
      driver,
      driver_id_number,
      received_by,
      approved_by,
    } = req.body;

    if (!date || !item) {
      res
        .status(400)
        .json({ success: false, error: "Date and Item are required" });
      return;
    }

    try {
      const jobCardNumber = await generateJobCardNumber(pool);
      const result = await pool.query(
        `INSERT INTO job_cards
          (customer_id, job_card_number, date, time, customer_name, contact_number,
           item, item_number, vehicle_number, company_reference, job_description,
           note, driver, driver_id_number, received_by, approved_by, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
         RETURNING *`,
        [
          customerId,
          jobCardNumber,
          date,
          time || null,
          customer_name,
          contact_number,
          item,
          item_number,
          vehicle_number,
          company_reference,
          job_description,
          note,
          driver,
          driver_id_number,
          received_by,
          approved_by,
          req.user?.username || "Unknown",
        ],
      );
      res.status(201).json({ success: true, jobcard: result.rows[0] });
    } catch (error) {
      console.error("Create job card error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to create job card" });
    }
  },
);

// PUT update main job card
router.put(
  "/:customerId/jobcards/:jobCardId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { jobCardId } = req.params;
    const pool = getPool(req);
    const {
      date,
      time,
      customer_name,
      contact_number,
      item,
      item_number,
      vehicle_number,
      company_reference,
      job_description,
      note,
      driver,
      driver_id_number,
      received_by,
      approved_by,
      workshop_received_date,
      workshop_received_time,
      workshop_received_note,
      workshop_received_by,
      finished_date,
      finished_time,
      finished_note,
      checked_by,
      stores_received_date,
      stores_received_time,
      stores_person,
      office_received_date,
      office_received_time,
      office_person,
      finalizing_note,
      status,
    } = req.body;

    try {
      const result = await pool.query(
        `UPDATE job_cards SET
          date=$1, time=$2, customer_name=$3, contact_number=$4, item=$5, item_number=$6,
          vehicle_number=$7, company_reference=$8, job_description=$9, note=$10,
          driver=$11, driver_id_number=$12, received_by=$13, approved_by=$14,
          workshop_received_date=$15, workshop_received_time=$16, workshop_received_note=$17, workshop_received_by=$18,
          finished_date=$19, finished_time=$20, finished_note=$21, checked_by=$22,
          stores_received_date=$23, stores_received_time=$24, stores_person=$25,
          office_received_date=$26, office_received_time=$27, office_person=$28,
          finalizing_note=$29, status=$30, updated_at=CURRENT_TIMESTAMP
         WHERE id=$31 RETURNING *`,
        [
          date,
          time || null,
          customer_name,
          contact_number,
          item,
          item_number,
          vehicle_number,
          company_reference,
          job_description,
          note,
          driver,
          driver_id_number,
          received_by,
          approved_by,
          workshop_received_date || null,
          workshop_received_time || null,
          workshop_received_note,
          workshop_received_by,
          finished_date || null,
          finished_time || null,
          finished_note,
          checked_by,
          stores_received_date || null,
          stores_received_time || null,
          stores_person,
          office_received_date || null,
          office_received_time || null,
          office_person,
          finalizing_note,
          status || "open",
          jobCardId,
        ],
      );
      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: "Job card not found" });
        return;
      }
      res.json({ success: true, jobcard: result.rows[0] });
    } catch (error) {
      console.error("Update job card error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to update job card" });
    }
  },
);

// DELETE job card (admin only)
router.delete(
  "/:customerId/jobcards/:jobCardId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { jobCardId } = req.params;
    const pool = getPool(req);
    if (req.user?.role !== "admin") {
      res
        .status(403)
        .json({ success: false, error: "Only admins can delete job cards" });
      return;
    }
    try {
      await pool.query("DELETE FROM job_cards WHERE id = $1", [jobCardId]);
      res.json({ success: true, message: "Job card deleted" });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, error: "Failed to delete job card" });
    }
  },
);

// ─── ITEM LIST ────────────────────────────────────────────────────

router.post(
  "/:customerId/jobcards/:jobCardId/items",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { jobCardId } = req.params;
    const pool = getPool(req);
    const items: any[] = req.body.items || [];

    try {
      await pool.query("DELETE FROM job_card_items WHERE job_card_id = $1", [
        jobCardId,
      ]);
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        await pool.query(
          `INSERT INTO job_card_items
            (job_card_id, row_no, date, of_number, of_date, in_number, item, item_number, quantity)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [
            jobCardId,
            i + 1,
            it.date || null,
            it.of_number,
            it.of_date || null,
            it.in_number,
            it.item,
            it.item_number,
            it.quantity || null,
          ],
        );
      }
      await pool.query(
        "UPDATE job_cards SET has_item_list=TRUE, updated_at=CURRENT_TIMESTAMP WHERE id=$1",
        [jobCardId],
      );
      const result = await pool.query(
        "SELECT * FROM job_card_items WHERE job_card_id=$1 ORDER BY row_no",
        [jobCardId],
      );
      res.json({ success: true, items: result.rows });
    } catch (error) {
      console.error("Save items error:", error);
      res.status(500).json({ success: false, error: "Failed to save items" });
    }
  },
);

// ─── LABOR SHEET ──────────────────────────────────────────────────

router.post(
  "/:customerId/jobcards/:jobCardId/labor",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { jobCardId } = req.params;
    const pool = getPool(req);
    const rows: any[] = req.body.labor || [];

    try {
      await pool.query("DELETE FROM job_card_labor WHERE job_card_id = $1", [
        jobCardId,
      ]);
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        await pool.query(
          `INSERT INTO job_card_labor (job_card_id, row_no, date, person, job_done, in_time, out_time)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [
            jobCardId,
            i + 1,
            r.date || null,
            r.person,
            r.job_done,
            r.in_time || null,
            r.out_time || null,
          ],
        );
      }
      await pool.query(
        "UPDATE job_cards SET has_labor_sheet=TRUE, updated_at=CURRENT_TIMESTAMP WHERE id=$1",
        [jobCardId],
      );
      const result = await pool.query(
        "SELECT * FROM job_card_labor WHERE job_card_id=$1 ORDER BY row_no",
        [jobCardId],
      );
      res.json({ success: true, labor: result.rows });
    } catch (error) {
      console.error("Save labor error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to save labor sheet" });
    }
  },
);

// ─── GRN ─────────────────────────────────────────────────────────

router.post(
  "/:customerId/jobcards/:jobCardId/grn",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { jobCardId } = req.params;
    const pool = getPool(req);
    const {
      date,
      time,
      contact_detail,
      vehicle_number,
      job_description,
      note,
      driver,
      driver_id_number,
      office_person,
    } = req.body;

    try {
      await pool.query("DELETE FROM job_card_grn WHERE job_card_id=$1", [
        jobCardId,
      ]);
      const result = await pool.query(
        `INSERT INTO job_card_grn
          (job_card_id, date, time, contact_detail, vehicle_number, job_description, note, driver, driver_id_number, office_person)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [
          jobCardId,
          date || null,
          time || null,
          contact_detail,
          vehicle_number,
          job_description,
          note,
          driver,
          driver_id_number,
          office_person,
        ],
      );
      await pool.query(
        "UPDATE job_cards SET has_grn=TRUE, updated_at=CURRENT_TIMESTAMP WHERE id=$1",
        [jobCardId],
      );
      res.json({ success: true, grn: result.rows[0] });
    } catch (error) {
      console.error("Save GRN error:", error);
      res.status(500).json({ success: false, error: "Failed to save GRN" });
    }
  },
);

// ─── DISPATCH NOTE ────────────────────────────────────────────────

router.post(
  "/:customerId/jobcards/:jobCardId/dispatch",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { jobCardId } = req.params;
    const pool = getPool(req);
    const {
      date,
      time,
      contact_detail,
      invoice_number,
      vehicle_number,
      driver,
      driver_id_number,
      office_person,
      stores_person,
    } = req.body;

    try {
      await pool.query("DELETE FROM job_card_dispatch WHERE job_card_id=$1", [
        jobCardId,
      ]);
      const result = await pool.query(
        `INSERT INTO job_card_dispatch
          (job_card_id, date, time, contact_detail, invoice_number, vehicle_number, driver, driver_id_number, office_person, stores_person)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [
          jobCardId,
          date || null,
          time || null,
          contact_detail,
          invoice_number,
          vehicle_number,
          driver,
          driver_id_number,
          office_person,
          stores_person,
        ],
      );
      await pool.query(
        "UPDATE job_cards SET has_dispatch_note=TRUE, status='dispatched', updated_at=CURRENT_TIMESTAMP WHERE id=$1",
        [jobCardId],
      );
      res.json({ success: true, dispatch: result.rows[0] });
    } catch (error) {
      console.error("Save dispatch error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to save dispatch note" });
    }
  },
);

export default router;
