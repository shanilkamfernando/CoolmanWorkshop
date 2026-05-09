// ============================================
// Documents Management Routes
// Save as: server/src/routes/documents.ts
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
    const category = req.body.category || "word";
    const uploadDir = path.join(
      __dirname,
      "..",
      "..",
      "uploads",
      "documents",
      category,
    );

    // Create directory if it doesn't exist
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document formats
    const allowedTypes = [
      ".pdf",
      ".doc",
      ".docx",
      ".xls",
      ".xlsx",
      ".ppt",
      ".pptx",
      ".txt",
      ".jpg",
      ".jpeg",
      ".png",
    ];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Allowed types: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, JPG, PNG",
        ),
      );
    }
  },
});

// GET all document files
router.get(
  "/documents/files",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const pool = getPool(req);

    try {
      const result = await pool.query(
        `SELECT * FROM document_files 
         ORDER BY category, folder_name, created_at DESC`,
      );

      res.json({
        success: true,
        files: result.rows,
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

// POST upload file
router.post(
  "/documents/upload",
  authenticateToken,
  upload.single("file"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { category, custom_filename } = req.body;
    const pool = getPool(req);

    if (!req.file) {
      res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
      return;
    }

    if (!category) {
      res.status(400).json({
        success: false,
        error: "Category is required",
      });
      return;
    }

    const fileName =
      custom_filename && custom_filename.trim()
        ? custom_filename
        : req.file.originalname;

    try {
      const result = await pool.query(
        `INSERT INTO document_files 
         (category, folder_name, file_name, file_path, file_size, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          category,
          "", // No folders - always empty
          fileName,
          req.file.path,
          req.file.size,
          req.user?.username || "Unknown",
        ],
      );

      res.status(201).json({
        success: true,
        message: "File uploaded successfully",
        file: result.rows[0],
      });
    } catch (error) {
      console.error("Upload file error:", error);
      // Delete uploaded file if database insert fails
      if (req.file?.path) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({
        success: false,
        error: "Failed to upload file",
      });
    }
  },
);

// GET download file
router.get(
  "/documents/download/:fileId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { fileId } = req.params;
    const pool = getPool(req);

    try {
      const result = await pool.query(
        "SELECT * FROM document_files WHERE id = $1",
        [fileId],
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: "File not found",
        });
        return;
      }

      const file = result.rows[0];

      if (!fs.existsSync(file.file_path)) {
        res.status(404).json({
          success: false,
          error: "File not found on server",
        });
        return;
      }

      res.download(file.file_path, file.file_name);
    } catch (error) {
      console.error("Download file error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to download file",
      });
    }
  },
);

// DELETE file (Admin only)
router.delete(
  "/documents/files/:fileId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { fileId } = req.params;
    const pool = getPool(req);

    if (req.user?.role !== "admin") {
      res.status(403).json({
        success: false,
        error: "Only admins can delete files",
      });
      return;
    }

    try {
      const result = await pool.query(
        "SELECT * FROM document_files WHERE id = $1",
        [fileId],
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: "File not found",
        });
        return;
      }

      const file = result.rows[0];

      // Delete file from filesystem
      if (fs.existsSync(file.file_path)) {
        fs.unlinkSync(file.file_path);
      }

      // Delete from database
      await pool.query("DELETE FROM document_files WHERE id = $1", [fileId]);

      res.json({
        success: true,
        message: "File deleted successfully",
      });
    } catch (error) {
      console.error("Delete file error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete file",
      });
    }
  },
);

export default router;
