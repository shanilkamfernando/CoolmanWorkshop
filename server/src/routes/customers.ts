// ============================================
// Customers Routes
// Save as: server/src/routes/customers.ts
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

// GET all customers
router.get(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const pool = getPool(req);

    try {
      const result = await pool.query(
        `SELECT id, name, created_at, updated_at 
         FROM customers 
         ORDER BY created_at DESC`,
      );

      res.json({
        success: true,
        customers: result.rows,
      });
    } catch (error) {
      console.error("Get customers error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch customers",
      });
    }
  },
);

// GET single customer by ID
router.get(
  "/:id",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const pool = getPool(req);

    try {
      const result = await pool.query(
        `SELECT id, name, created_at, updated_at 
         FROM customers 
         WHERE id = $1`,
        [id],
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: "Customer not found",
        });
        return;
      }

      res.json({
        success: true,
        customer: result.rows[0],
      });
    } catch (error) {
      console.error("Get customer error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch customer",
      });
    }
  },
);

// POST create new customer (Admin only)
router.post(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { name } = req.body;
    const pool = getPool(req);

    // Check if user is admin
    if (req.user?.role !== "admin") {
      res.status(403).json({
        success: false,
        error: "Only admins can add customers",
      });
      return;
    }

    if (!name || !name.trim()) {
      res.status(400).json({
        success: false,
        error: "Customer name is required",
      });
      return;
    }

    try {
      const result = await pool.query(
        `INSERT INTO customers (name, created_at, updated_at) 
         VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
         RETURNING id, name, created_at, updated_at`,
        [name.trim()],
      );

      res.status(201).json({
        success: true,
        message: "Customer created successfully",
        customer: result.rows[0],
      });
    } catch (error) {
      console.error("Create customer error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create customer",
      });
    }
  },
);

// PUT update customer (Admin only)
router.put(
  "/:id",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { name } = req.body;
    const pool = getPool(req);

    if (req.user?.role !== "admin") {
      res.status(403).json({
        success: false,
        error: "Only admins can update customers",
      });
      return;
    }

    if (!name || !name.trim()) {
      res.status(400).json({
        success: false,
        error: "Customer name is required",
      });
      return;
    }

    try {
      const result = await pool.query(
        `UPDATE customers 
         SET name = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 
         RETURNING id, name, created_at, updated_at`,
        [name.trim(), id],
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: "Customer not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "Customer updated successfully",
        customer: result.rows[0],
      });
    } catch (error) {
      console.error("Update customer error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update customer",
      });
    }
  },
);

// DELETE customer (Admin only)
router.delete(
  "/:id",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const pool = getPool(req);

    if (req.user?.role !== "admin") {
      res.status(403).json({
        success: false,
        error: "Only admins can delete customers",
      });
      return;
    }

    try {
      const result = await pool.query(
        "DELETE FROM customers WHERE id = $1 RETURNING id, name",
        [id],
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: "Customer not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "Customer deleted successfully",
        deletedCustomer: result.rows[0],
      });
    } catch (error) {
      console.error("Delete customer error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete customer",
      });
    }
  },
);

export default router;
