// ============================================
// Purchasing Routes
// Save as: server/src/routes/purchasing.ts
// ============================================

import { Router, Request, Response } from "express";
import { Pool } from "pg";
import { authenticateToken } from "./auth";

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
    permissions: { portals: string[] };
  };
}

const getPool = (req: Request): Pool => req.app.locals.pool;

// ─── PURCHASING CUSTOMERS ─────────────────────────────────────────

// GET all purchasing customers
router.get(
  "/purchasing/customers",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const pool = getPool(req);
    try {
      const result = await pool.query(
        `SELECT * FROM purchasing_customers ORDER BY name ASC`,
      );
      res.json({ success: true, customers: result.rows });
    } catch (error) {
      console.error("Get purchasing customers error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch customers" });
    }
  },
);

// GET single purchasing customer
router.get(
  "/purchasing/customers/:customerId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { customerId } = req.params;
    const pool = getPool(req);
    try {
      const result = await pool.query(
        `SELECT * FROM purchasing_customers WHERE id = $1`,
        [customerId],
      );
      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: "Customer not found" });
        return;
      }
      res.json({ success: true, customer: result.rows[0] });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch customer" });
    }
  },
);

// POST create purchasing customer
router.post(
  "/purchasing/customers",
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
        `INSERT INTO purchasing_customers (name, contact_number, email, address, created_by)
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
      res
        .status(500)
        .json({ success: false, error: "Failed to create customer" });
    }
  },
);

// DELETE purchasing customer (admin only)
router.delete(
  "/purchasing/customers/:customerId",
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
        "DELETE FROM purchasing_customers WHERE id = $1 RETURNING id, name",
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
      res
        .status(500)
        .json({ success: false, error: "Failed to delete customer" });
    }
  },
);

// ─── PURCHASING ENTRIES ───────────────────────────────────────────

// GET all entries for a customer
router.get(
  "/purchasing/customers/:customerId/entries",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { customerId } = req.params;
    const { workshop_customer_id } = req.query;
    const pool = getPool(req);
    try {
      let result;
      if (workshop_customer_id) {
        // Coming from workshop side — fetch by workshop_customer_id
        result = await pool.query(
          `SELECT * FROM purchasing_entries 
           WHERE workshop_customer_id = $1 
           ORDER BY created_at ASC`,
          [workshop_customer_id],
        );
      } else {
        // Fetch by customer_id OR any entries whose workshop customer
        // maps to this purchasing customer
        result = await pool.query(
          `SELECT * FROM purchasing_entries 
           WHERE customer_id = $1
           ORDER BY created_at ASC`,
          [customerId],
        );
      }
      res.json({ success: true, entries: result.rows });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch entries" });
    }
  },
);
// POST create entry — auto creates a workshop job card
router.post(
  "/purchasing/customers/:customerId/entries",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { customerId } = req.params;
    const {
      product,
      quantity,
      description,
      due_date,
      workshop_customer_id,
      job_card_id,
      job_card_number,
    } = req.body;
    const pool = getPool(req);

    if (!product?.trim()) {
      res.status(400).json({ success: false, error: "Product is required" });
      return;
    }

    try {
      const result = await pool.query(
        `INSERT INTO purchasing_entries
          (customer_id, user_name, product, quantity, description, due_date,
           workshop_customer_id, job_card_id, job_card_number, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          customerId,
          req.user?.username,
          product.trim(),
          quantity || null,
          description || null,
          due_date || null,
          workshop_customer_id || null,
          job_card_id || null,
          job_card_number || null,
          req.user?.username,
        ],
      );

      res.status(201).json({ success: true, entry: result.rows[0] });
    } catch (error: any) {
      console.error("Create entry error:", error?.message || error);
      res.status(500).json({
        success: false,
        error: error?.message || "Failed to create entry",
      });
    }
  },
);

// PUT update entry — role-based actions
router.put(
  "/purchasing/customers/:customerId/entries/:entryId/:action",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { entryId, action } = req.params;
    const pool = getPool(req);
    const username = req.user?.username;
    const role = req.user?.role;

    try {
      let query = "";
      let values: any[] = [];

      if (action === "orderform") {
        query = `UPDATE purchasing_entries SET order_form_no=$1, notes=$2, office_user_1=$3, office_datetime_1=NOW(), updated_at=NOW() WHERE id=$4 RETURNING *`;
        values = [req.body.order_form_no, req.body.notes, username, entryId];
      } else if (action === "approve") {
        if (!["admin", "office_admin"].includes(role || "")) {
          res.status(403).json({
            success: false,
            error: "Only admin or office_admin can approve",
          });
          return;
        }
        query = `UPDATE purchasing_entries SET approved=TRUE, approved_by=$1, approved_at=NOW(), updated_at=NOW() WHERE id=$2 RETURNING *`;
        values = [username, entryId];
      } else if (action === "remarks") {
        query = `UPDATE purchasing_entries SET remarks=$1, updated_at=NOW() WHERE id=$2 RETURNING *`;
        values = [req.body.remarks, entryId];
      } else if (action === "po") {
        query = `UPDATE purchasing_entries SET po_no=$1, office_user_2=$2, office_datetime_2=NOW(), updated_at=NOW() WHERE id=$3 RETURNING *`;
        values = [req.body.po_no, username, entryId];
      } else if (action === "invoice") {
        query = `UPDATE purchasing_entries SET invoice_no=$1, office_user_3=$2, office_datetime_3=NOW(), updated_at=NOW() WHERE id=$3 RETURNING *`;
        values = [req.body.invoice_no, username, entryId];
      } else if (action === "driver") {
        query = `UPDATE purchasing_entries SET purchase_date=$1, drivers_name=$2, vehicle_no=$3, received=$4, driver_description=$5, updated_at=NOW() WHERE id=$6 RETURNING *`;
        values = [
          req.body.purchase_date || null,
          req.body.drivers_name,
          req.body.vehicle_no,
          req.body.received,
          req.body.driver_description,
          entryId,
        ];
      } else if (action === "admin") {
        if (role !== "admin") {
          res
            .status(403)
            .json({ success: false, error: "Only admins can do full edit" });
          return;
        }
        const b = req.body;
        query = `UPDATE purchasing_entries SET
          user_name=$1, product=$2, quantity=$3, description=$4, due_date=$5,
          order_form_no=$6, notes=$7, po_no=$8, invoice_no=$9, approved=$10,
          approved_by=$11, purchase_date=$12, drivers_name=$13, vehicle_no=$14,
          received=$15, driver_description=$16, remarks=$17, updated_at=NOW()
          WHERE id=$18 RETURNING *`;
        values = [
          b.user_name,
          b.product,
          b.quantity,
          b.description,
          b.due_date || null,
          b.order_form_no,
          b.notes,
          b.po_no,
          b.invoice_no,
          b.approved || false,
          b.approved_by,
          b.purchase_date || null,
          b.drivers_name,
          b.vehicle_no,
          b.received,
          b.driver_description,
          b.remarks,
          entryId,
        ];
      } else {
        res.status(400).json({ success: false, error: "Invalid action" });
        return;
      }

      const result = await pool.query(query, values);
      const entry = result.rows[0];

      // Sync product/description back to linked workshop job card
      if (action === "admin" && entry.job_card_id) {
        const b = req.body;
        await pool.query(
          `UPDATE workshop_job_cards
           SET item = $1, job_description = $2
           WHERE id = $3`,
          [b.product || entry.product, b.description || "", entry.job_card_id],
        );
      }

      res.json({ success: true, entry });
    } catch (error: any) {
      console.error("Update entry error:", error?.message || error);
      res.status(500).json({
        success: false,
        error: error?.message || "Failed to update entry",
      });
    }
  },
);

// ─── WORKSHOP CUSTOMER & JOB CARD DROPDOWNS ──────────────────────

// GET workshop customers for dropdown
router.get(
  "/purchasing/workshop-customers",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const pool = getPool(req);
    try {
      const result = await pool.query(
        `SELECT id, name FROM workshop_customers ORDER BY name ASC`,
      );
      res.json({ success: true, customers: result.rows });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch customers" });
    }
  },
);

// GET job cards for a workshop customer
router.get(
  "/purchasing/workshop-customers/:customerId/jobcards",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { customerId } = req.params;
    const pool = getPool(req);
    try {
      const result = await pool.query(
        `SELECT id, job_card_number, item, item_number, status
         FROM workshop_job_cards
         WHERE workshop_customer_id = $1
         ORDER BY created_at DESC`,
        [customerId],
      );
      res.json({ success: true, jobcards: result.rows });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch job cards" });
    }
  },
);

// Add this new route in purchasing.ts — GET entries by workshop_customer_id
router.get(
  "/purchasing/workshop-customers/:workshopCustomerId/entries",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { workshopCustomerId } = req.params;
    const pool = getPool(req);
    try {
      const result = await pool.query(
        `SELECT * FROM purchasing_entries 
         WHERE workshop_customer_id = $1 
         ORDER BY created_at ASC`,
        [workshopCustomerId],
      );
      res.json({ success: true, entries: result.rows });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch entries" });
    }
  },
);

// GET all product rows for a purchasing entry
router.get(
  "/purchasing/entries/:entryId/products",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { entryId } = req.params;
    const pool = getPool(req);
    try {
      const result = await pool.query(
        `SELECT * FROM purchasing_flow_products
         WHERE purchasing_entry_id = $1
         ORDER BY job_card_item_id ASC, id ASC`,
        [entryId],
      );
      res.json({ success: true, products: result.rows });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error?.message || "Failed to fetch products",
      });
    }
  },
);

// PUT batch-update per-product stage fields for an entry
// body: { stage: "order"|"po"|"invoice"|"driver", products: [{ id, ...fields }] }
router.put(
  "/purchasing/entries/:entryId/products",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { entryId } = req.params;
    const { stage, products } = req.body;
    const pool = getPool(req);
    const username = req.user?.username || "Unknown";
    const role = req.user?.role || "";

    if (!Array.isArray(products)) {
      res
        .status(400)
        .json({ success: false, error: "products array required" });
      return;
    }

    try {
      for (const p of products) {
        if (stage === "order") {
          await pool.query(
            `UPDATE purchasing_flow_products
             SET order_form_no = $1, order_notes = $2,
                 order_saved_at = NOW(), order_saved_by = $3, updated_at = NOW()
             WHERE id = $4 AND purchasing_entry_id = $5`,
            [
              p.order_form_no || null,
              p.order_notes || null,
              username,
              p.id,
              entryId,
            ],
          );
        } else if (stage === "po") {
          await pool.query(
            `UPDATE purchasing_flow_products
             SET po_no = $1,
                 po_saved_at = NOW(), po_saved_by = $2, updated_at = NOW()
             WHERE id = $3 AND purchasing_entry_id = $4`,
            [p.po_no || null, username, p.id, entryId],
          );
        } else if (stage === "invoice") {
          await pool.query(
            `UPDATE purchasing_flow_products
             SET invoice_no = $1,
                 invoice_saved_at = NOW(), invoice_saved_by = $2, updated_at = NOW()
             WHERE id = $3 AND purchasing_entry_id = $4`,
            [p.invoice_no || null, username, p.id, entryId],
          );
        } else if (stage === "driver") {
          await pool.query(
            `UPDATE purchasing_flow_products
             SET purchase_date = $1, drivers_name = $2, vehicle_no = $3,
                 received = $4, delivery_notes = $5,
                 driver_saved_at = NOW(), driver_saved_by = $6, updated_at = NOW()
             WHERE id = $7 AND purchasing_entry_id = $8`,
            [
              p.purchase_date || null,
              p.drivers_name || null,
              p.vehicle_no || null,
              p.received || null,
              p.delivery_notes || null,
              username,
              p.id,
              entryId,
            ],
          );
        } else if (stage === "approve") {
          if (!["admin", "office_admin"].includes(role)) {
            res
              .status(403)
              .json({
                success: false,
                error: "Only admin/office_admin can approve",
              });
            return;
          }
          await pool.query(
            `UPDATE purchasing_flow_products
             SET approved = TRUE,
                 approved_by = $1,
                 approved_at = NOW(),
                 approved_quantity = $2,
                 updated_at = NOW()
             WHERE id = $3 AND purchasing_entry_id = $4`,
            [username, p.approved_quantity ?? null, p.id, entryId],
          );
        }
      }

      const result = await pool.query(
        `SELECT * FROM purchasing_flow_products
         WHERE purchasing_entry_id = $1 ORDER BY job_card_item_id ASC, id ASC`,
        [entryId],
      );
      res.json({ success: true, products: result.rows });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error?.message || "Failed to update products",
      });
    }
  },
);

// DELETE entry (admin only)
router.delete(
  "/purchasing/customers/:customerId/entries/:entryId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { entryId } = req.params;
    const pool = getPool(req);

    if (req.user?.role !== "admin") {
      res
        .status(403)
        .json({ success: false, error: "Only admins can delete entries" });
      return;
    }

    try {
      await pool.query("DELETE FROM purchasing_entries WHERE id=$1", [entryId]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to delete entry" });
    }
  },
);

export default router;
