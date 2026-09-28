// ============================================
// Workshop Routes - Customers & Job Cards
// Save as: server/src/routes/workshop.ts
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

// ─── Generate workshop job card number ───────────────────────────
const generateJobCardNumber = async (pool: Pool): Promise<string> => {
  const year = new Date().getFullYear();
  // Extract the numeric part from existing numbers and take the max,
  // so deletions never cause a collision.
  const result = await pool.query(
    `SELECT COALESCE(
        MAX(
          CAST(
            SUBSTRING(job_card_number FROM 'CMR\\.WJC\\.WS\\.([0-9]+)@')
            AS INTEGER
          )
        ), 0
      ) AS max_num
     FROM workshop_job_cards
     WHERE job_card_number LIKE $1`,
    [`CMR.WJC.WS.%@${year}`],
  );
  const next = parseInt(result.rows[0].max_num) + 1;
  return `CMR.WJC.WS.${String(next).padStart(4, "0")}@${year}`;
};

// Find or create a purchasing customer matching the workshop customer name
const findOrCreatePurchasingCustomer = async (
  pool: Pool,
  workshopCustomerId: number,
  username: string,
): Promise<number | null> => {
  try {
    const wc = await pool.query(
      `SELECT name FROM workshop_customers WHERE id = $1`,
      [workshopCustomerId],
    );
    if (wc.rows.length === 0) return null;
    const name = wc.rows[0].name;

    const existing = await pool.query(
      `SELECT id FROM purchasing_customers WHERE LOWER(name) = LOWER($1) LIMIT 1`,
      [name],
    );
    if (existing.rows.length > 0) return existing.rows[0].id;

    const created = await pool.query(
      `INSERT INTO purchasing_customers (name, created_by,  workshop_customer_id) VALUES ($1, $2, $3) RETURNING id`,
      [name, username, workshopCustomerId],
    );
    return created.rows[0].id;
  } catch (err) {
    console.error("findOrCreatePurchasingCustomer failed:", err);
    return null;
  }
};

// ═══════════════════════════════════════════════════════════════
// WORKSHOP CUSTOMERS
// ═══════════════════════════════════════════════════════════════

// GET all workshop customers
router.get(
  "/workshop/customers",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const pool = getPool(req);
    try {
      const result = await pool.query(
        `SELECT wc.*, COUNT(wjc.id) as job_card_count
         FROM workshop_customers wc
         LEFT JOIN workshop_job_cards wjc ON wjc.workshop_customer_id = wc.id
         GROUP BY wc.id
         ORDER BY wc.name ASC`,
      );
      res.json({ success: true, customers: result.rows });
    } catch (error) {
      console.error("Get workshop customers error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch customers" });
    }
  },
);

// POST create workshop customer (all users)
router.post(
  "/workshop/customers",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { name, contact_number, email, address } = req.body;
    const pool = getPool(req);

    if (!name || !name.trim()) {
      res
        .status(400)
        .json({ success: false, error: "Customer name is required" });
      return;
    }

    try {
      const result = await pool.query(
        `INSERT INTO workshop_customers (name, contact_number, email, address, created_by)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [
          name.trim(),
          contact_number || null,
          email || null,
          address || null,
          req.user?.username || "Unknown",
        ],
      );
      res.status(201).json({ success: true, customer: result.rows[0] });
    } catch (error) {
      console.error("Create workshop customer error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to create customer" });
    }
  },
);

// DELETE workshop customer (admin only)
router.delete(
  "/workshop/customers/:customerId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { customerId } = req.params;
    const pool = getPool(req);

    if (req.user?.role !== "admin") {
      res
        .status(403)
        .json({ success: false, error: "Only admins can delete customers" });
      return;
    }

    try {
      const result = await pool.query(
        "DELETE FROM workshop_customers WHERE id = $1 RETURNING id, name",
        [customerId],
      );
      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: "Customer not found" });
        return;
      }
      res.json({
        success: true,
        message: `Customer "${result.rows[0].name}" deleted`,
      });
    } catch (error) {
      console.error("Delete workshop customer error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to delete customer" });
    }
  },
);

// ═══════════════════════════════════════════════════════════════
// WORKSHOP JOB CARDS
// ═══════════════════════════════════════════════════════════════

// GET all job cards for a workshop customer
router.get(
  "/workshop/customers/:customerId/jobcards",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { customerId } = req.params;
    const pool = getPool(req);
    try {
      const result = await pool.query(
        `SELECT id, job_card_number,  job_card_name, date, time, item, item_number,
                vehicle_number, company_reference, status, created_by, created_at,
                has_item_list, has_labor_sheet, has_grn, has_dispatch_note
         FROM workshop_job_cards
         WHERE workshop_customer_id = $1
         ORDER BY created_at DESC`,
        [customerId],
      );
      res.json({ success: true, jobcards: result.rows });
    } catch (error) {
      console.error("Get workshop job cards error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch job cards" });
    }
  },
);

// GET single workshop job card (full details)
router.get(
  "/workshop/customers/:customerId/jobcards/:jobCardId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { jobCardId } = req.params;
    const pool = getPool(req);
    try {
      const [card, items, labor, grn, dispatch] = await Promise.all([
        pool.query("SELECT * FROM workshop_job_cards WHERE id = $1", [
          jobCardId,
        ]),
        pool.query(
          "SELECT * FROM workshop_job_card_items WHERE job_card_id = $1 ORDER BY row_no",
          [jobCardId],
        ),
        pool.query(
          "SELECT * FROM workshop_job_card_labor WHERE job_card_id = $1 ORDER BY row_no",
          [jobCardId],
        ),
        pool.query(
          "SELECT * FROM workshop_job_card_grn WHERE job_card_id = $1 LIMIT 1",
          [jobCardId],
        ),
        pool.query(
          "SELECT * FROM workshop_job_card_dispatch WHERE job_card_id = $1 LIMIT 1",
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
      console.error("Get workshop job card error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch job card" });
    }
  },
);

// POST create workshop job card
router.post(
  "/workshop/customers/:customerId/jobcards",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { customerId } = req.params;
    const pool = getPool(req);
    const {
      date,
      time,
      job_card_name,
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
        `INSERT INTO workshop_job_cards
          (workshop_customer_id, job_card_number, job_card_name, date, time, customer_name, contact_number,
           item, item_number, vehicle_number, company_reference, job_description,
           note, driver, driver_id_number, received_by, approved_by, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
         RETURNING *`,
        [
          customerId,
          jobCardNumber,
          job_card_name || null,
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
      const newJobCard = result.rows[0];
      console.log(
        "✅ Job card created:",
        newJobCard.id,
        "— starting purchasing entry auto-create...",
      );

      // POST create workshop job card — replace the auto-create block:
      try {
        // Find or create a matching purchasing_customer by name
        const wcResult = await pool.query(
          `SELECT name FROM workshop_customers WHERE id = $1`,
          [customerId],
        );

        if (wcResult.rows.length > 0) {
          const customerNameVal = wcResult.rows[0].name;

          // Find existing purchasing_customer with same name, or create one
          let purchasingCustId: number;
          const existing = await pool.query(
            `SELECT id FROM purchasing_customers WHERE LOWER(name) = LOWER($1) LIMIT 1`,
            [customerNameVal],
          );

          if (existing.rows.length > 0) {
            purchasingCustId = existing.rows[0].id;
          } else {
            const created = await pool.query(
              `INSERT INTO purchasing_customers (name, created_by) VALUES ($1, $2) RETURNING id`,
              [customerNameVal, req.user?.username || "Unknown"],
            );
            purchasingCustId = created.rows[0].id;
          }

          const entryResult = await pool.query(
            `INSERT INTO purchasing_entries
        (customer_id, user_name, product, description,
         workshop_customer_id, job_card_id, job_card_number, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
            [
              purchasingCustId, // ← purchasing_customers.id ✓
              req.user?.username,
              item,
              job_description || "",
              Number(customerId), // ← workshop_customers.id ✓
              newJobCard.id,
              newJobCard.job_card_number,
              req.user?.username,
            ],
          );

          const purchasingEntryId = entryResult.rows[0]?.id;
          if (purchasingEntryId) {
            await pool.query(
              `UPDATE workshop_job_cards 
         SET purchasing_entry_id = $1, purchasing_customer_id = $2
         WHERE id = $3`,
              [purchasingEntryId, purchasingCustId, newJobCard.id],
            );
            newJobCard.purchasing_entry_id = purchasingEntryId;
            newJobCard.purchasing_customer_id = purchasingCustId;
          }
        }
      } catch (syncErr) {
        console.error("Auto-create purchasing entry failed:", syncErr);
      }

      res.status(201).json({ success: true, jobcard: newJobCard });
    } catch (error) {
      console.error("Create workshop job card error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to create job card" });
    }
  },
);

// PUT update workshop job card
router.put(
  "/workshop/customers/:customerId/jobcards/:jobCardId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { jobCardId } = req.params;
    const pool = getPool(req);
    const {
      date,
      time,
      job_card_name,
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
        `UPDATE workshop_job_cards SET
          job_card_name=$1, date=$2, time=$3, customer_name=$4, contact_number=$5, item=$6, item_number=$7,
          vehicle_number=$8, company_reference=$9, job_description=$10, note=$11,
          driver=$12, driver_id_number=$13, received_by=$14, approved_by=$15,
          workshop_received_date=$16, workshop_received_time=$17, workshop_received_note=$18, workshop_received_by=$19,
          finished_date=$20, finished_time=$21, finished_note=$22, checked_by=$23,
          stores_received_date=$24, stores_received_time=$25, stores_person=$26,
          office_received_date=$27, office_received_time=$28, office_person=$29,
          finalizing_note=$30, status=$31, updated_at=CURRENT_TIMESTAMP
         WHERE id=$32 RETURNING *`,
        [
          job_card_name || null,
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
      console.error("Update workshop job card error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to update job card" });
    }
  },
);

// DELETE workshop job card (admin only)
router.delete(
  "/workshop/customers/:customerId/jobcards/:jobCardId",
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
      await pool.query("DELETE FROM workshop_job_cards WHERE id = $1", [
        jobCardId,
      ]);
      res.json({ success: true, message: "Job card deleted" });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Delete purchasing details before deleting the job card.",
      });
    }
  },
);

// ─── ITEM LIST ────────────────────────────────────────────────────
router.post(
  "/workshop/customers/:customerId/jobcards/:jobCardId/items",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { jobCardId } = req.params;
    const pool = getPool(req);
    const items: any[] = req.body.items || [];
    try {
      await pool.query(
        "DELETE FROM workshop_job_card_items WHERE job_card_id = $1",
        [jobCardId],
      );

      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        await pool.query(
          `INSERT INTO workshop_job_card_items
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
        "UPDATE workshop_job_cards SET has_item_list=TRUE, updated_at=CURRENT_TIMESTAMP WHERE id=$1",
        [jobCardId],
      );

      // ── Sync purchasing_flow_products from the saved item list ──
      console.log(`[SYNC] === Starting for jobCardId=${jobCardId} ===`);
      try {
        const jc = await pool.query(
          `SELECT purchasing_entry_id FROM workshop_job_cards WHERE id = $1`,
          [jobCardId],
        );
        const entryId = jc.rows[0]?.purchasing_entry_id || null;
        console.log(`[SYNC] entryId resolved to:`, entryId);

        const savedItems = await pool.query(
          `SELECT row_no, item, item_number, quantity
           FROM workshop_job_card_items WHERE job_card_id = $1 ORDER BY row_no`,
          [jobCardId],
        );
        console.log(
          `[SYNC] found ${savedItems.rows.length} saved items:`,
          savedItems.rows,
        );

        for (const it of savedItems.rows) {
          console.log(`[SYNC] processing row_no=${it.row_no} item=${it.item}`);
          const existing = await pool.query(
            `SELECT id FROM purchasing_flow_products
             WHERE job_card_id = $1 AND job_card_item_id = $2`,
            [jobCardId, it.row_no],
          );
          if (existing.rows.length > 0) {
            console.log(
              `[SYNC] updating existing row id=${existing.rows[0].id}`,
            );
            await pool.query(
              `UPDATE purchasing_flow_products
               SET product = $1, item_number = $2, quantity = $3,
                   purchasing_entry_id = $4, updated_at = NOW()
               WHERE id = $5`,
              [
                it.item,
                it.item_number,
                it.quantity,
                entryId,
                existing.rows[0].id,
              ],
            );
          } else {
            console.log(
              `[SYNC] inserting NEW row: entryId=${entryId}, jobCardId=${jobCardId}, row_no=${it.row_no}, item=${it.item}, qty=${it.quantity}`,
            );
            const ins = await pool.query(
              `INSERT INTO purchasing_flow_products
                (purchasing_entry_id, job_card_id, job_card_item_id, product, item_number, quantity)
               VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
              [
                entryId,
                jobCardId,
                it.row_no,
                it.item,
                it.item_number,
                it.quantity,
              ],
            );
            console.log(`[SYNC] inserted with id=${ins.rows[0].id}`);
          }
        }

        const cleanupResult = await pool.query(
          `DELETE FROM purchasing_flow_products
           WHERE job_card_id = $1
             AND job_card_item_id NOT IN (
               SELECT row_no FROM workshop_job_card_items WHERE job_card_id = $1
             )`,
          [jobCardId],
        );
        console.log(
          `[SYNC] cleanup deleted ${cleanupResult.rowCount} orphan rows`,
        );
        console.log(`[SYNC] === DONE for jobCardId=${jobCardId} ===`);
      } catch (syncErr: any) {
        console.error(
          `[SYNC] FAILED for jobCardId=${jobCardId}:`,
          syncErr?.message || syncErr,
        );
        console.error(`[SYNC] full error:`, syncErr);
      }

      const result = await pool.query(
        "SELECT * FROM workshop_job_card_items WHERE job_card_id=$1 ORDER BY row_no",
        [jobCardId],
      );
      res.json({ success: true, items: result.rows });
    } catch (error) {
      console.error("Save workshop items error:", error);
      res.status(500).json({ success: false, error: "Failed to save items" });
    }
  },
);

// ─── LABOR SHEET ──────────────────────────────────────────────────
router.post(
  "/workshop/customers/:customerId/jobcards/:jobCardId/labor",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { jobCardId } = req.params;
    const pool = getPool(req);
    const rows: any[] = req.body.labor || [];
    try {
      await pool.query(
        "DELETE FROM workshop_job_card_labor WHERE job_card_id = $1",
        [jobCardId],
      );
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        await pool.query(
          `INSERT INTO workshop_job_card_labor (job_card_id, row_no, date, person, job_done, in_time, out_time)
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
        "UPDATE workshop_job_cards SET has_labor_sheet=TRUE, updated_at=CURRENT_TIMESTAMP WHERE id=$1",
        [jobCardId],
      );

      const result = await pool.query(
        "SELECT * FROM workshop_job_card_labor WHERE job_card_id=$1 ORDER BY row_no",
        [jobCardId],
      );

      res.json({ success: true, labor: result.rows });
    } catch (error) {
      console.error("Save workshop labor error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to save labor sheet" });
    }
  },
);

// ─── GRN ─────────────────────────────────────────────────────────
router.post(
  "/workshop/customers/:customerId/jobcards/:jobCardId/grn",
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
      await pool.query(
        "DELETE FROM workshop_job_card_grn WHERE job_card_id=$1",
        [jobCardId],
      );
      const result = await pool.query(
        `INSERT INTO workshop_job_card_grn
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
        "UPDATE workshop_job_cards SET has_grn=TRUE, updated_at=CURRENT_TIMESTAMP WHERE id=$1",
        [jobCardId],
      );
      res.json({ success: true, grn: result.rows[0] });
    } catch (error) {
      console.error("Save workshop GRN error:", error);
      res.status(500).json({ success: false, error: "Failed to save GRN" });
    }
  },
);

// ─── DISPATCH NOTE ────────────────────────────────────────────────
router.post(
  "/workshop/customers/:customerId/jobcards/:jobCardId/dispatch",
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
      await pool.query(
        "DELETE FROM workshop_job_card_dispatch WHERE job_card_id=$1",
        [jobCardId],
      );
      const result = await pool.query(
        `INSERT INTO workshop_job_card_dispatch
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
        "UPDATE workshop_job_cards SET has_dispatch_note=TRUE, status='dispatched', updated_at=CURRENT_TIMESTAMP WHERE id=$1",
        [jobCardId],
      );
      res.json({ success: true, dispatch: result.rows[0] });
    } catch (error) {
      console.error("Save workshop dispatch error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to save dispatch note" });
    }
  },
);

export default router;
