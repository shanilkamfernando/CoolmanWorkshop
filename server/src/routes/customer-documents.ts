// ============================================
// Customer Documents Routes - File Upload/Download
// Save as: server/src/routes/customer-documents.ts
// ============================================

import { Router, Request, Response } from "express";
import { Pool } from "pg";
import { authenticateToken } from "./auth";
import multer from "multer";
import path from "path";
import fs from "fs";

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

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const customerId = req.params.customerId;
    const uploadPath = path.join(
      __dirname,
      "../../uploads/documents",
      customerId,
    );

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// GET all documents for a customer
router.get(
  "/:customerId/documents",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { customerId } = req.params;
    const pool = getPool(req);

    try {
      const result = await pool.query(
        `SELECT * FROM customer_documents 
         WHERE customer_id = $1 
         ORDER BY created_at DESC`,
        [customerId],
      );

      res.json({
        success: true,
        documents: result.rows,
      });
    } catch (error) {
      console.error("Get documents error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch documents",
      });
    }
  },
);

// POST upload new document
router.post(
  "/:customerId/documents/upload",
  authenticateToken,
  upload.single("file"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { customerId } = req.params;
    const { document_name, uploaded_by } = req.body;
    const pool = getPool(req);

    if (!req.file) {
      res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
      return;
    }

    if (!document_name || !document_name.trim()) {
      res.status(400).json({
        success: false,
        error: "Document name is required",
      });
      return;
    }

    try {
      const filePath = path.join("documents", customerId, req.file.filename);

      const result = await pool.query(
        `INSERT INTO customer_documents 
         (customer_id, document_name, file_path, file_size, file_type, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          customerId,
          document_name.trim(),
          filePath,
          req.file.size,
          req.file.mimetype,
          uploaded_by || "Unknown",
        ],
      );

      res.status(201).json({
        success: true,
        message: "Document uploaded successfully",
        document: result.rows[0],
      });
    } catch (error) {
      console.error("Upload document error:", error);

      // Delete uploaded file if database insert fails
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        success: false,
        error: "Failed to upload document",
      });
    }
  },
);

// GET download document
router.get(
  "/:customerId/documents/:documentId/download",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { documentId } = req.params;
    const pool = getPool(req);

    try {
      const result = await pool.query(
        "SELECT * FROM customer_documents WHERE id = $1",
        [documentId],
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: "Document not found",
        });
        return;
      }

      const document = result.rows[0];
      const filePath = path.join(
        __dirname,
        "../../uploads",
        document.file_path,
      );

      if (!fs.existsSync(filePath)) {
        res.status(404).json({
          success: false,
          error: "File not found on server",
        });
        return;
      }

      res.download(filePath, document.document_name);
    } catch (error) {
      console.error("Download document error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to download document",
      });
    }
  },
);

// DELETE document (Admin only)
router.delete(
  "/:customerId/documents/:documentId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { documentId } = req.params;
    const pool = getPool(req);

    if (req.user?.role !== "admin") {
      res.status(403).json({
        success: false,
        error: "Only admins can delete documents",
      });
      return;
    }

    try {
      // Get document info first
      const docResult = await pool.query(
        "SELECT * FROM customer_documents WHERE id = $1",
        [documentId],
      );

      if (docResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: "Document not found",
        });
        return;
      }

      const document = docResult.rows[0];

      // Delete from database
      await pool.query("DELETE FROM customer_documents WHERE id = $1", [
        documentId,
      ]);

      // Delete physical file
      const filePath = path.join(
        __dirname,
        "../../uploads",
        document.file_path,
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      res.json({
        success: true,
        message: "Document deleted successfully",
      });
    } catch (error) {
      console.error("Delete document error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete document",
      });
    }
  },
);

export default router;
