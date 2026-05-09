import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Pool } from "pg";

const router = Router();

// JWT Secret - In production, use environment variable
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-this-in-production";

// Extend Express Request to include user
interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: "admin" | "user";
    permissions: {
      portals: string[];
      canManageUsers?: boolean;
    };
  };
}

// Middleware to verify JWT token
const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Access token required" });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      res.status(403).json({ error: "Invalid or expired token" });
      return;
    }
    req.user = decoded;
    next();
  });
};

// Middleware to check if user is admin
const isAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
};

// Get database pool from app locals
const getPool = (req: Request): Pool => {
  return req.app.locals.pool;
};

// Sign Up Route
router.post("/signup", async (req: Request, res: Response): Promise<void> => {
  const { username, password, firstName, lastName } = req.body;
  const pool = getPool(req);

  try {
    // Validate input
    if (!username || !password) {
      res.status(400).json({ error: "Username and password are required" });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }

    // Check if username already exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username],
    );

    if (existingUser.rows.length > 0) {
      res.status(409).json({ error: "Username already exists" });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with default permissions (empty - admin will assign)
    const result = await pool.query(
      `INSERT INTO users (username, password, first_name, last_name, role, permissions, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, username, first_name, last_name, role, permissions, is_active, created_at`,
      [
        username,
        hashedPassword,
        firstName || "",
        lastName || "",
        "user",
        JSON.stringify({ portals: [] }),
        false, // New users are inactive until admin approves
      ],
    );

    const user = result.rows[0];

    res.status(201).json({
      message: "User created successfully. Please wait for admin approval.",
      user: {
        id: user.id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        isActive: user.is_active,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Server error during signup" });
  }
});

// Sign In Route
router.post("/signin", async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;
  const pool = getPool(req);

  try {
    // Validate input
    if (!username || !password) {
      res.status(400).json({ error: "Username and password are required" });
      return;
    }

    // Find user
    const result = await pool.query(
      `SELECT id, username, password, first_name, last_name, role, permissions, is_active
       FROM users
       WHERE username = $1`,
      [username],
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: "Invalid username or password" });
      return;
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.is_active) {
      res.status(403).json({
        error: "Account is not active. Please contact administrator.",
      });
      return;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      res.status(401).json({ error: "Invalid username or password" });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        permissions: user.permissions,
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    // Update last login
    await pool.query(
      "UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [user.id],
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        permissions: user.permissions,
      },
    });
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({ error: "Server error during signin" });
  }
});

// Get current user info
router.get(
  "/me",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const pool = getPool(req);

    try {
      const result = await pool.query(
        `SELECT id, username, first_name, last_name, role, permissions, is_active, created_at
       FROM users
       WHERE id = $1`,
        [req.user?.id],
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const user = result.rows[0];

      res.json({
        user: {
          id: user.id,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          permissions: user.permissions,
          isActive: user.is_active,
          createdAt: user.created_at,
        },
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Server error" });
    }
  },
);

// Admin: Get all users
router.get(
  "/users",
  authenticateToken,
  isAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const pool = getPool(req);

    try {
      const result = await pool.query(
        `SELECT id, username, first_name, last_name, role, permissions, is_active, created_at, updated_at
       FROM users
       ORDER BY created_at DESC`,
      );

      const users = result.rows.map((user) => ({
        id: user.id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        permissions: user.permissions,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      }));

      res.json({ users });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "Server error" });
    }
  },
);

// Admin: Update user permissions
router.put(
  "/users/:userId/permissions",
  authenticateToken,
  isAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { userId } = req.params;
    const { permissions, isActive } = req.body;
    const pool = getPool(req);

    try {
      // Validate permissions structure
      if (!permissions || !Array.isArray(permissions.portals)) {
        res.status(400).json({ error: "Invalid permissions format" });
        return;
      }

      const result = await pool.query(
        `UPDATE users
       SET permissions = $1, is_active = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, username, first_name, last_name, role, permissions, is_active`,
        [JSON.stringify(permissions), isActive, userId],
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const user = result.rows[0];

      res.json({
        message: "User permissions updated successfully",
        user: {
          id: user.id,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          permissions: user.permissions,
          isActive: user.is_active,
        },
      });
    } catch (error) {
      console.error("Update permissions error:", error);
      res.status(500).json({ error: "Server error" });
    }
  },
);

// Admin: Delete user
router.delete(
  "/users/:userId",
  authenticateToken,
  isAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { userId } = req.params;
    const pool = getPool(req);

    try {
      // Prevent admin from deleting themselves
      if (parseInt(userId) === req.user?.id) {
        res.status(400).json({ error: "Cannot delete your own account" });
        return;
      }

      const result = await pool.query(
        "DELETE FROM users WHERE id = $1 RETURNING id, username",
        [userId],
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json({
        message: "User deleted successfully",
        deletedUser: result.rows[0],
      });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ error: "Server error" });
    }
  },
);

// Admin: Get permission templates
router.get(
  "/permission-templates",
  authenticateToken,
  isAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const pool = getPool(req);

    try {
      const result = await pool.query(
        "SELECT * FROM permission_templates ORDER BY name",
      );

      res.json({ templates: result.rows });
    } catch (error) {
      console.error("Get templates error:", error);
      res.status(500).json({ error: "Server error" });
    }
  },
);

// Logout (client-side token removal, but we can log it)
router.post(
  "/logout",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    res.json({ message: "Logged out successfully" });
  },
);

export default router;
export { authenticateToken, isAdmin };
