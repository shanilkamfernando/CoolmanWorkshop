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

// GET all BOQ items
router.get(
  "/boq",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const pool = getPool(req);
    try {
      const result = await pool.query(
        `SELECT b.*,
        (b.available_quantity - COALESCE(SUM(cpe.required_quantity) FILTER (WHERE cpe.entry_type = 'boq'), 0)) AS remaining_quantity
       FROM boq_items b
       LEFT JOIN customer_purchasing_entries cpe ON cpe.boq_item_id = b.id
       GROUP BY b.id
       ORDER BY b.item_no ASC`,
      );
      res.json({ success: true, items: result.rows });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  },
);

// POST create BOQ item (data_entry, admin only)
router.post(
  "/boq",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const role = req.user?.role;
    if (!["admin", "data_entry"].includes(role || "")) {
      res.status(403).json({
        success: false,
        error: "Only data entry or admin can add BOQ items",
      });
      return;
    }
    const {
      item_no,
      item_name,
      part_number,
      boq_quantity,
      available_quantity,
    } = req.body;
    const pool = getPool(req);
    if (!item_name?.trim()) {
      res.status(400).json({ success: false, error: "Item name is required" });
      return;
    }
    try {
      const result = await pool.query(
        `INSERT INTO boq_items (item_no, item_name, part_number, boq_quantity, available_quantity, created_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [
          item_no || "",
          item_name.trim(),
          part_number || "",
          boq_quantity || 0,
          available_quantity || 0,
          req.user?.username,
        ],
      );
      res.status(201).json({ success: true, item: result.rows[0] });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  },
);

// PUT update BOQ item (data_entry, admin only)
router.put(
  "/boq/:itemId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const role = req.user?.role;
    if (!["admin", "data_entry"].includes(role || "")) {
      res.status(403).json({
        success: false,
        error: "Only data entry or admin can edit BOQ items",
      });
      return;
    }
    const { itemId } = req.params;
    const {
      item_no,
      item_name,
      part_number,
      boq_quantity,
      available_quantity,
    } = req.body;
    const pool = getPool(req);
    try {
      const result = await pool.query(
        `UPDATE boq_items SET item_no=$1, item_name=$2, part_number=$3, boq_quantity=$4, available_quantity=$5, updated_at=NOW()
       WHERE id=$6 RETURNING *`,
        [
          item_no || "",
          item_name,
          part_number || "",
          boq_quantity || 0,
          available_quantity || 0,
          itemId,
        ],
      );
      res.json({ success: true, item: result.rows[0] });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  },
);

// DELETE BOQ item (admin only)
router.delete(
  "/boq/:itemId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (req.user?.role !== "admin") {
      res.status(403).json({ success: false, error: "Admin only" });
      return;
    }
    const pool = getPool(req);
    try {
      await pool.query("DELETE FROM boq_items WHERE id=$1", [
        req.params.itemId,
      ]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  },
);

// GET all entries for a customer
router.get(
  "/boq/customer/:customerId/entries",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const pool = getPool(req);
    try {
      const result = await pool.query(
        `SELECT cpe.*, b.item_no, b.part_number, b.boq_quantity,
              b.available_quantity as boq_available
       FROM customer_purchasing_entries cpe
       LEFT JOIN boq_items b ON b.id = cpe.boq_item_id
       WHERE cpe.customer_id = $1
       ORDER BY cpe.created_at ASC`,
        [req.params.customerId],
      );
      res.json({ success: true, entries: result.rows });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  },
);

// POST create customer entry
router.post(
  "/boq/customer/:customerId/entries",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const pool = getPool(req);
    const { customerId } = req.params;
    const {
      entry_type,
      boq_item_id,
      product,
      required_quantity,
      required_date,
      description,
    } = req.body;

    if (!product?.trim()) {
      res.status(400).json({ success: false, error: "Product is required" });
      return;
    }

    try {
      let available_quantity = null;
      let shortage_quantity = 0;

      if (entry_type === "boq" && boq_item_id) {
        // Get current remaining quantity for this BOQ item
        const boqResult = await pool.query(
          `SELECT b.available_quantity,
                COALESCE(SUM(cpe.required_quantity), 0) as total_requested
         FROM boq_items b
         LEFT JOIN customer_purchasing_entries cpe ON cpe.boq_item_id = b.id AND cpe.entry_type = 'boq'
         WHERE b.id = $1
         GROUP BY b.id, b.available_quantity`,
          [boq_item_id],
        );

        if (boqResult.rows.length > 0) {
          const { available_quantity: boq_avail, total_requested } =
            boqResult.rows[0];
          const remaining =
            parseFloat(boq_avail) - parseFloat(total_requested || "0");
          available_quantity = remaining < 0 ? 0 : remaining;
          const req_qty = parseFloat(required_quantity) || 0;
          shortage_quantity = req_qty > remaining ? req_qty - remaining : 0;
        }
      }

      const result = await pool.query(
        `INSERT INTO customer_purchasing_entries
    (customer_id, entry_type, boq_item_id, product, available_quantity, required_quantity, shortage_quantity, required_date, description, requested_by)
   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [
          customerId,
          entry_type || "boq",
          boq_item_id || null,
          product.trim(),
          available_quantity,
          required_quantity || 0,
          shortage_quantity,
          required_date || null,
          description || "",
          req.user?.username,
        ],
      );

      // Auto-create BOQ item if this is a non-BOQ entry
      if (entry_type === "non_boq") {
        // Check if a BOQ item with this product name already exists
        const existing = await pool.query(
          `SELECT id FROM boq_items WHERE LOWER(item_name) = LOWER($1)`,
          [product.trim()],
        );

        if (existing.rows.length === 0) {
          // Create new BOQ item with blank item_no and part_number
          // data_entry/admin can fill those in later from the BOQ page
          await pool.query(
            `INSERT INTO boq_items (item_no, item_name, part_number, boq_quantity, available_quantity, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              "", // item_no — to be filled later
              product.trim(),
              "", // part_number — to be filled later
              0, // boq_quantity — to be filled later
              0, // available_quantity — to be filled later
              req.user?.username,
            ],
          );
        }
      }

      res.status(201).json({ success: true, entry: result.rows[0] });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  },
);

// DELETE customer entry (admin only)
router.delete(
  "/boq/customer/:customerId/entries/:entryId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (req.user?.role !== "admin") {
      res.status(403).json({ success: false, error: "Admin only" });
      return;
    }
    const pool = getPool(req);
    try {
      await pool.query("DELETE FROM customer_purchasing_entries WHERE id=$1", [
        req.params.entryId,
      ]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  },
);

export default router;
