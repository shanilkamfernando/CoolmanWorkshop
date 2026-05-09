// ============================================
// Stores Inventory Routes
// Save as: server/src/routes/stores.ts
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

// GET all store items
router.get(
  "/stores/items",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const pool = getPool(req);
    const { brandId } = req.query;

    try {
      let result;
      if (brandId) {
        result = await pool.query(
          `SELECT * FROM store_items WHERE brand_id = $1 ORDER BY created_at DESC`,
          [brandId],
        );
      } else {
        result = await pool.query(
          `SELECT * FROM store_items ORDER BY created_at DESC`,
        );
      }
      res.json({ success: true, items: result.rows });
    } catch (error) {
      console.error("Get store items error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch store items" });
    }
  },
);

// GET single store item by ID
router.get(
  "/stores/items/:itemId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { itemId } = req.params;
    const pool = getPool(req);

    try {
      const result = await pool.query(
        "SELECT * FROM store_items WHERE id = $1",
        [itemId],
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: "Store item not found",
        });
        return;
      }

      res.json({
        success: true,
        item: result.rows[0],
      });
    } catch (error) {
      console.error("Get store item error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch store item",
      });
    }
  },
);

// POST route:
router.post(
  "/stores/items",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const {
      po,
      ordered_date,
      received_date,
      part_name,
      part_number,
      quantity,
      location,
      rack_no,
      used_date,
      borrowed_quantity,
      issue_note,
      used_by,
      used_purpose,
      note,
      returned,
      brand_id,
      category_key, // NEW
    } = req.body;
    const pool = getPool(req);

    if (!part_name || !part_number) {
      res.status(400).json({
        success: false,
        error: "Part name and part number are required",
      });
      return;
    }

    try {
      const thisLeftQuantity = (quantity || 0) - (borrowed_quantity || 0);

      const result = await pool.query(
        `INSERT INTO store_items 
         (po, ordered_date, received_date, part_name, part_number, quantity,
          left_quantity, location, rack_no, used_date, borrowed_quantity,
          issue_note, used_by, used_purpose, note, returned, created_by,
          brand_id, category_key)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
         RETURNING *`,
        [
          po || null,
          ordered_date || null,
          received_date || null,
          part_name,
          part_number,
          quantity || 0,
          thisLeftQuantity,
          location || null,
          rack_no || null,
          used_date || null,
          borrowed_quantity || 0,
          issue_note || null,
          used_by || null,
          used_purpose || null,
          note || null,
          returned || false,
          req.user?.username || "Unknown",
          brand_id || null,
          category_key || null,
        ],
      );

      const totals = await pool.query(
        `SELECT SUM(quantity) as total_quantity, SUM(borrowed_quantity) as total_borrowed, SUM(left_quantity) as total_left
         FROM store_items WHERE part_number = $1`,
        [part_number],
      );

      res.status(201).json({
        success: true,
        message: "Store item created successfully",
        item: result.rows[0],
        totals: totals.rows[0],
      });
    } catch (error) {
      console.error("Create store item error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to create store item" });
    }
  },
);
// PUT update store item
router.put(
  "/stores/items/:itemId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { itemId } = req.params;
    const pool = getPool(req);

    // if (req.user?.role !== "admin") {
    //   res.status(403).json({
    //     success: false,
    //     error: "Only admins can update store items",
    //   });
    //   return;
    // }

    try {
      const fields = req.body;
      const setClause = Object.keys(fields)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(", ");
      const values = [itemId, ...Object.values(fields)];

      const result = await pool.query(
        `UPDATE store_items SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1 RETURNING *`,
        values,
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: "Store item not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "Store item updated successfully",
        item: result.rows[0],
      });
    } catch (error) {
      console.error("Update store item error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update store item",
      });
    }
  },
);

// DELETE store item (Admin only)
router.delete(
  "/stores/items/:itemId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { itemId } = req.params;
    const pool = getPool(req);

    if (req.user?.role !== "admin") {
      res.status(403).json({
        success: false,
        error: "Only admins can delete store items",
      });
      return;
    }

    try {
      const result = await pool.query(
        "DELETE FROM store_items WHERE id = $1 RETURNING id",
        [itemId],
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: "Store item not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "Store item deleted successfully",
      });
    } catch (error) {
      console.error("Delete store item error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete store item",
      });
    }
  },
);

export default router;
