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
// router.get(
//   "/boq",
//   authenticateToken,
//   async (req: AuthRequest, res: Response): Promise<void> => {
//     const pool = getPool(req);
//     const { customer_id } = req.query;
//     try {
//       const result = await pool.query(
//         `SELECT b.*,
//         (b.available_quantity - COALESCE(SUM(cpe.required_quantity) FILTER (WHERE cpe.entry_type = 'boq'), 0)) AS remaining_quantity
//        FROM boq_items b
//        LEFT JOIN customer_purchasing_entries cpe ON cpe.boq_item_id = b.id
//        GROUP BY b.id
//        ORDER BY b.item_no ASC`,
//       );
//       res.json({ success: true, items: result.rows });
//     } catch (error: any) {
//       res.status(500).json({ success: false, error: error?.message });
//     }
//   },
// );

router.get(
  "/boq",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const pool = getPool(req);
    const { customer_id } = req.query;
    try {
      let result;
      if (customer_id) {
        result = await pool.query(
          `SELECT b.*,
            (b.available_quantity - COALESCE(SUM(cpe.required_quantity)
              FILTER (WHERE cpe.entry_type = 'boq'), 0)) AS remaining_quantity
           FROM boq_items b
           LEFT JOIN customer_purchasing_entries cpe ON cpe.boq_item_id = b.id
           WHERE b.customer_id = $1
           GROUP BY b.id
           ORDER BY b.item_name ASC, b.specification ASC`,
          [customer_id],
        );
      } else {
        result = await pool.query(
          `SELECT b.*,
            (b.available_quantity - COALESCE(SUM(cpe.required_quantity)
              FILTER (WHERE cpe.entry_type = 'boq'), 0)) AS remaining_quantity
           FROM boq_items b
           LEFT JOIN customer_purchasing_entries cpe ON cpe.boq_item_id = b.id
           GROUP BY b.id
           ORDER BY b.item_name ASC, b.specification ASC`,
        );
      }
      res.json({ success: true, items: result.rows });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch BOQ items" });
    }
  },
);

// POST create BOQ item (data_entry, admin only)
// router.post(
//   "/boq",
//   authenticateToken,
//   async (req: AuthRequest, res: Response): Promise<void> => {
//     const role = req.user?.role;
//     if (!["admin", "data_entry"].includes(role || "")) {
//       res.status(403).json({
//         success: false,
//         error: "Only data entry or admin can add BOQ items",
//       });
//       return;
//     }
//     const {
//       item_no,
//       item_name,
//       part_number,
//       boq_quantity,
//       available_quantity,
//     } = req.body;
//     const pool = getPool(req);
//     if (!item_name?.trim()) {
//       res.status(400).json({ success: false, error: "Item name is required" });
//       return;
//     }
//     try {
//       const result = await pool.query(
//         `INSERT INTO boq_items (item_no, item_name, part_number, boq_quantity, available_quantity, created_by)
//        VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
//         [
//           item_no || "",
//           item_name.trim(),
//           part_number || "",
//           boq_quantity || 0,
//           available_quantity || 0,
//           req.user?.username,
//         ],
//       );
//       res.status(201).json({ success: true, item: result.rows[0] });
//     } catch (error: any) {
//       res.status(500).json({ success: false, error: error?.message });
//     }
//   },
// );

router.post(
  "/boq",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const pool = getPool(req);
    if (!["admin", "data_entry"].includes(req.user?.role || "")) {
      res.status(403).json({
        success: false,
        error: "Only admin or data entry can add BOQ items",
      });
      return;
    }
    const {
      customer_id,
      item_name,
      specification,
      part_number,
      boq_quantity,
      available_quantity,
    } = req.body;

    if (!item_name?.trim()) {
      res.status(400).json({ success: false, error: "Item name is required" });
      return;
    }
    if (!customer_id) {
      res.status(400).json({ success: false, error: "Customer is required" });
      return;
    }

    try {
      const result = await pool.query(
        `INSERT INTO boq_items
          (customer_id, item_name, specification, part_number, boq_quantity, available_quantity, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          customer_id,
          item_name.trim(),
          specification || null,
          part_number || null,
          boq_quantity || 0,
          available_quantity || 0,
          req.user?.username || "Unknown",
        ],
      );
      res.status(201).json({ success: true, item: result.rows[0] });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, error: "Failed to create BOQ item" });
    }
  },
);

// PUT update BOQ item (data_entry, admin only)
// router.put(
//   "/boq/:itemId",
//   authenticateToken,
//   async (req: AuthRequest, res: Response): Promise<void> => {
//     const role = req.user?.role;
//     if (!["admin", "data_entry"].includes(role || "")) {
//       res.status(403).json({
//         success: false,
//         error: "Only data entry or admin can edit BOQ items",
//       });
//       return;
//     }
//     const { itemId } = req.params;
//     const {
//       item_no,
//       item_name,
//       part_number,
//       boq_quantity,
//       available_quantity,
//     } = req.body;
//     const pool = getPool(req);
//     try {
//       const result = await pool.query(
//         `UPDATE boq_items SET item_no=$1, item_name=$2, part_number=$3, boq_quantity=$4, available_quantity=$5, updated_at=NOW()
//        WHERE id=$6 RETURNING *`,
//         [
//           item_no || "",
//           item_name,
//           part_number || "",
//           boq_quantity || 0,
//           available_quantity || 0,
//           itemId,
//         ],
//       );
//       res.json({ success: true, item: result.rows[0] });
//     } catch (error: any) {
//       res.status(500).json({ success: false, error: error?.message });
//     }
//   },
// );
router.put(
  "/boq/:id",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const pool = getPool(req);

    if (req.user?.role !== "admin") {
      res
        .status(403)
        .json({ success: false, error: "Only admins can edit BOQ items" });
      return;
    }
    const { id } = req.params;
    const {
      item_name,
      specification,
      part_number,
      boq_quantity,
      available_quantity,
    } = req.body;
    try {
      const result = await pool.query(
        `UPDATE boq_items SET
          item_name = $1, specification = $2, part_number = $3,
          boq_quantity = $4, available_quantity = $5, updated_at = NOW()
         WHERE id = $6 RETURNING *`,
        [
          item_name,
          specification || null,
          part_number || null,
          boq_quantity || 0,
          available_quantity || 0,
          id,
        ],
      );
      res.json({ success: true, item: result.rows[0] });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, error: "Failed to update BOQ item" });
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
        `SELECT cpe.*,
       COALESCE(cpe.specification, b.specification) AS specification,
       COALESCE(cpe.part_number, b.part_number) AS part_number,
       b.boq_quantity,
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
      specification,
      part_number,
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
    (customer_id, entry_type, boq_item_id, product, specification, part_number, available_quantity, required_quantity, shortage_quantity, required_date, description, requested_by)
   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
        [
          customerId,
          entry_type || "boq",
          boq_item_id || null,
          product.trim(),
          specification || null,
          part_number || null,
          available_quantity,
          required_quantity || 0,
          shortage_quantity,
          required_date || null,
          description || "",
          req.user?.username,
        ],
      );
      res.status(201).json({ success: true, entry: result.rows[0] });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  },
);

// PUT update entry stage (order / approve / po / invoice / driver)
router.put(
  "/boq/customer/:customerId/entries/:entryId/:action",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { entryId, action } = req.params;
    const pool = getPool(req);
    const username = req.user?.username || "Unknown";
    const role = req.user?.role || "";

    try {
      let result;
      if (action === "order") {
        result = await pool.query(
          `UPDATE customer_purchasing_entries
           SET order_form_no = $1, order_notes = $2,
               order_saved_at = NOW(), order_saved_by = $3
           WHERE id = $4 RETURNING *`,
          [
            req.body.order_form_no || null,
            req.body.order_notes || null,
            username,
            entryId,
          ],
        );
      } else if (action === "approve") {
        if (!["admin", "office_admin"].includes(role)) {
          res
            .status(403)
            .json({
              success: false,
              error: "Only admin/office_admin can approve",
            });
          return;
        }
        result = await pool.query(
          `UPDATE customer_purchasing_entries
           SET approved = TRUE, approved_by = $1, approved_at = NOW(),
               approved_quantity = $2
           WHERE id = $3 RETURNING *`,
          [username, req.body.approved_quantity ?? null, entryId],
        );
      } else if (action === "po") {
        result = await pool.query(
          `UPDATE customer_purchasing_entries
           SET po_no = $1, po_saved_at = NOW(), po_saved_by = $2
           WHERE id = $3 RETURNING *`,
          [req.body.po_no || null, username, entryId],
        );
      } else if (action === "invoice") {
        result = await pool.query(
          `UPDATE customer_purchasing_entries
           SET invoice_no = $1, invoice_saved_at = NOW(), invoice_saved_by = $2
           WHERE id = $3 RETURNING *`,
          [req.body.invoice_no || null, username, entryId],
        );
      } else if (action === "driver") {
        result = await pool.query(
          `UPDATE customer_purchasing_entries
           SET purchase_date = $1, drivers_name = $2, vehicle_no = $3,
               received = $4, delivery_notes = $5,
               driver_saved_at = NOW(), driver_saved_by = $6
           WHERE id = $7 RETURNING *`,
          [
            req.body.purchase_date || null,
            req.body.drivers_name || null,
            req.body.vehicle_no || null,
            req.body.received || null,
            req.body.delivery_notes || null,
            username,
            entryId,
          ],
        );
      } else {
        res.status(400).json({ success: false, error: "Invalid action" });
        return;
      }

      res.json({ success: true, entry: result.rows[0] });
    } catch (error: any) {
      console.error(
        "Update customer entry stage error:",
        error?.message || error,
      );
      res
        .status(500)
        .json({ success: false, error: error?.message || "Failed to update" });
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
