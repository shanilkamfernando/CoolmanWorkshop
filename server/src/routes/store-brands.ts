import { Router, Request, Response } from "express";
import { Pool } from "pg";
import { authenticateToken } from "./auth";

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: "admin" | "user";
    permission: { portals: string[] };
  };
}

const getPool = (req: Request): Pool => req.app.locals.pool;

// GET all fixed categories
router.get(
  "/stores/categories",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const pool = getPool(req);
    try {
      const result = await pool.query(
        "SELECT * FROM store_categories ORDER BY sort_order",
      );
      res.json({ success: true, categories: result.rows });
    } catch (error) {
      console.error("Get categories error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch categories" });
    }
  },
);

// GET all brands for a category
router.get(
  "/stores/categories/:categoryKey/brands",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { categoryKey } = req.params;
    const pool = getPool(req);
    try {
      const result = await pool.query(
        `SELECT b.*, 
                COUNT(si.id) as item_count
         FROM store_brands b
         LEFT JOIN store_items si ON si.brand_id = b.id
         WHERE b.category_key = $1
         GROUP BY b.id
         ORDER BY b.name ASC`,
        [categoryKey],
      );
      res.json({ success: true, brands: result.rows });
    } catch (error) {
      console.error("Get brands error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch brands" });
    }
  },
);

// POST add a new brand (all authenticated users)
router.post(
  "/stores/categories/:categoryKey/brands",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { categoryKey } = req.params;
    const { name, description } = req.body;
    const pool = getPool(req);

    if (!name || !name.trim()) {
      res.status(400).json({ success: false, error: "Brand name is required" });
      return;
    }

    try {
      // Verify category exists
      const catCheck = await pool.query(
        "SELECT key FROM store_categories WHERE key = $1",
        [categoryKey],
      );
      if (catCheck.rows.length === 0) {
        res.status(404).json({ success: false, error: "Category not found" });
        return;
      }

      const result = await pool.query(
        `INSERT INTO store_brands (category_key, name, description, created_by)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [
          categoryKey,
          name.trim(),
          description?.trim() || null,
          req.user?.username || "Unknown",
        ],
      );
      res.status(201).json({ success: true, brand: result.rows[0] });
    } catch (error: any) {
      if (error.code === "23505") {
        res
          .status(409)
          .json({
            success: false,
            error: "Brand already exists in this category",
          });
      } else {
        console.error("Create brand error:", error);
        res
          .status(500)
          .json({ success: false, error: "Failed to create brand" });
      }
    }
  },
);

// DELETE a brand (admin only)
router.delete(
  "/stores/categories/:categoryKey/brands/:brandId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { brandId } = req.params;
    const pool = getPool(req);

    if (req.user?.role !== "admin") {
      res
        .status(403)
        .json({ success: false, error: "Only admins can delete brands" });
      return;
    }

    try {
      const result = await pool.query(
        "DELETE FROM store_brands WHERE id = $1 RETURNING id, name",
        [brandId],
      );
      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: "Brand not found" });
        return;
      }
      res.json({
        success: true,
        message: `Brand "${result.rows[0].name}" deleted`,
      });
    } catch (error) {
      console.error("Delete brand error:", error);
      res.status(500).json({ success: false, error: "Failed to delete brand" });
    }
  },
);

export default router;
