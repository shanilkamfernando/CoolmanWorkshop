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
    role: "admin" | "user";
    permissions: { portals: string[] };
  };
}

const getPool = (req: Request): Pool => req.app.locals.pool;

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

// POST create purchasing customer (all users)
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

// ─── PURCHASING ENTRIES ────────────────────────────────────────

// GET all entries for a customer
router.get(
  "/purchasing/customers/:customerId/entries",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { customerId } = req.params;
    const pool = getPool(req);
    try {
      const result = await pool.query(
        `SELECT * FROM purchasing_entries WHERE customer_id = $1 ORDER BY created_at ASC`,
        [customerId],
      );
      res.json({ success: true, entries: result.rows });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch entries" });
    }
  },
);

// POST create entry (all users)
router.post(
  "/purchasing/customers/:customerId/entries",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { customerId } = req.params;
    const { product, quantity, description, due_date } = req.body;
    const pool = getPool(req);
    if (!product?.trim()) {
      res.status(400).json({ success: false, error: "Product is required" });
      return;
    }
    try {
      const result = await pool.query(
        `INSERT INTO purchasing_entries (customer_id, user_name, product, quantity, description, due_date, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [
          customerId,
          req.user?.username,
          product.trim(),
          quantity || null,
          description || null,
          due_date || null,
          req.user?.username,
        ],
      );
      res.status(201).json({ success: true, entry: result.rows[0] });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to create entry" });
    }
  },
);

// PUT update entry — role-based
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
        if (role !== "admin") {
          res
            .status(403)
            .json({ success: false, error: "Only admins can approve" });
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
        query = `UPDATE purchasing_entries SET user_name=$1, product=$2, quantity=$3, description=$4, due_date=$5,
          order_form_no=$6, notes=$7, po_no=$8, invoice_no=$9, approved=$10, approved_by=$11,
          purchase_date=$12, drivers_name=$13, vehicle_no=$14, received=$15, driver_description=$16,
          remarks=$17, updated_at=NOW() WHERE id=$18 RETURNING *`;
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
      res.json({ success: true, entry: result.rows[0] });
    } catch (error) {
      console.error("Update entry error:", error);
      res.status(500).json({ success: false, error: "Failed to update entry" });
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
