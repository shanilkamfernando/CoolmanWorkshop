// ============================================
// Attachments Routes
// Save as: server/src/routes/attachments.ts
// ============================================

import { Router, Request, Response } from "express";
import { Pool } from "pg";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcrypt";
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

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: PROJECT ATTACHMENTS (existing — filesystem based)
// ─────────────────────────────────────────────────────────────────────────────

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { customerId, projectId } = req.params;
    const uploadDir = path.join(
      __dirname,
      "../../uploads/projects",
      customerId,
      projectId,
    );
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now();
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, `${uniqueSuffix}_${nameWithoutExt}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, _file, cb) => cb(null, true),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

// GET all attachments for a project
router.get(
  "/:customerId/projects/:projectId/attachments",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { projectId } = req.params;
    const pool = getPool(req);
    try {
      const result = await pool.query(
        `SELECT id, project_id, filename, original_filename, file_path, file_type, file_size, uploaded_by, created_at
         FROM project_attachments
         WHERE project_id = $1
         ORDER BY created_at DESC`,
        [projectId],
      );
      res.json({ success: true, attachments: result.rows });
    } catch (error) {
      console.error("Get attachments error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch attachments" });
    }
  },
);

// POST upload attachment for a project
router.post(
  "/:customerId/projects/:projectId/attachments",
  authenticateToken,
  upload.single("file"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { projectId } = req.params;
    const pool = getPool(req);
    const file = req.file;

    if (!file) {
      res.status(400).json({ success: false, error: "No file uploaded" });
      return;
    }

    try {
      const result = await pool.query(
        `INSERT INTO project_attachments
         (project_id, filename, original_filename, file_path, file_type, file_size, uploaded_by, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
         RETURNING id, project_id, filename, original_filename, file_path, file_type, file_size, uploaded_by, created_at`,
        [
          projectId,
          file.filename,
          file.originalname,
          file.path,
          file.mimetype,
          file.size,
          req.user?.id,
        ],
      );
      res.status(201).json({
        success: true,
        message: "File uploaded successfully",
        attachment: result.rows[0],
      });
    } catch (error) {
      console.error("Upload attachment error:", error);
      if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      res.status(500).json({ success: false, error: "Failed to upload file" });
    }
  },
);

// GET download project attachment
router.get(
  "/:customerId/projects/:projectId/attachments/:attachmentId/download",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { attachmentId } = req.params;
    const pool = getPool(req);
    try {
      const result = await pool.query(
        `SELECT filename, original_filename, file_path, file_type
         FROM project_attachments WHERE id = $1`,
        [attachmentId],
      );
      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: "File not found" });
        return;
      }
      const attachment = result.rows[0];
      if (!fs.existsSync(attachment.file_path)) {
        res
          .status(404)
          .json({ success: false, error: "File not found on server" });
        return;
      }
      res.setHeader("Content-Type", attachment.file_type);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${attachment.original_filename}"`,
      );
      fs.createReadStream(attachment.file_path).pipe(res);
    } catch (error) {
      console.error("Download attachment error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to download file" });
    }
  },
);

// DELETE project attachment (admin only)
router.delete(
  "/:customerId/projects/:projectId/attachments/:attachmentId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { attachmentId } = req.params;
    const pool = getPool(req);

    if (req.user?.role !== "admin") {
      res
        .status(403)
        .json({ success: false, error: "Only admins can delete attachments" });
      return;
    }

    try {
      const result = await pool.query(
        "SELECT file_path FROM project_attachments WHERE id = $1",
        [attachmentId],
      );
      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: "Attachment not found" });
        return;
      }
      const filePath = result.rows[0].file_path;
      await pool.query("DELETE FROM project_attachments WHERE id = $1", [
        attachmentId,
      ]);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      res.json({ success: true, message: "Attachment deleted successfully" });
    } catch (error) {
      console.error("Delete attachment error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to delete attachment" });
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: SERVICE RECORD ATTACHMENTS (new — base64 in DB + master password)
// ─────────────────────────────────────────────────────────────────────────────

// GET master password status
router.get(
  "/attachments/master-password/status",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const pool = getPool(req);
    try {
      const result = await pool.query(
        `SELECT EXISTS (
           SELECT 1 FROM attachment_settings WHERE key = 'master_password'
         ) AS has_password`,
      );
      res.json({ success: true, hasPassword: result.rows[0].has_password });
    } catch (error: any) {
      console.error("Check master password error:", error?.message);
      res
        .status(500)
        .json({ success: false, error: "Failed to check password status" });
    }
  },
);

// POST set/update master password (admin only)
router.post(
  "/attachments/master-password",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (req.user?.role !== "admin") {
      res.status(403).json({
        success: false,
        error: "Only admins can set the master password",
      });
      return;
    }

    const { password } = req.body;
    const pool = getPool(req);

    if (!password || password.length < 4) {
      res.status(400).json({
        success: false,
        error: "Password must be at least 4 characters",
      });
      return;
    }

    try {
      const hash = await bcrypt.hash(password, 12);
      await pool.query(
        `INSERT INTO attachment_settings (key, value)
         VALUES ('master_password', $1)
         ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP`,
        [hash],
      );
      res.json({
        success: true,
        message: "Master password updated successfully",
      });
    } catch (error: any) {
      console.error("Set master password error:", error?.message);
      res
        .status(500)
        .json({ success: false, error: "Failed to set master password" });
    }
  },
);

// POST upload service record attachment (base64 stored in DB)
router.post(
  "/service-records/:recordId/attachments",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { recordId } = req.params;
    const { attachment_type, original_name, file_data, file_size, mime_type } =
      req.body;
    const pool = getPool(req);

    if (!file_data || !original_name) {
      res
        .status(400)
        .json({ success: false, error: "File data and name are required" });
      return;
    }

    if (!["report", "invoice"].includes(attachment_type)) {
      res
        .status(400)
        .json({ success: false, error: "Invalid attachment type" });
      return;
    }

    // Ensure master password is set before allowing uploads
    try {
      const pwdCheck = await pool.query(
        `SELECT value FROM attachment_settings WHERE key = 'master_password'`,
      );
      if (pwdCheck.rows.length === 0) {
        res.status(400).json({
          success: false,
          error:
            "No master password set. Ask your admin to set a master password before uploading files.",
        });
        return;
      }

      await pool.query(
        `INSERT INTO service_attachments
          (record_id, attachment_type, original_name, file_data, file_size, mime_type, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          recordId,
          attachment_type,
          original_name,
          file_data,
          file_size || 0,
          mime_type || "application/octet-stream",
          req.user?.username || "Unknown",
        ],
      );
      res
        .status(201)
        .json({ success: true, message: "File uploaded successfully" });
    } catch (error: any) {
      console.error("Service upload error:", error?.message);
      res.status(500).json({
        success: false,
        error: "Upload failed",
        detail: error?.message,
      });
    }
  },
);

// GET list service record attachments (metadata only — no file data)
router.get(
  "/service-records/:recordId/attachments",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { recordId } = req.params;
    const pool = getPool(req);
    try {
      const result = await pool.query(
        `SELECT id, record_id, attachment_type, original_name, file_size, mime_type, uploaded_by, created_at
         FROM service_attachments
         WHERE record_id = $1
         ORDER BY created_at ASC`,
        [recordId],
      );
      res.json({ success: true, attachments: result.rows });
    } catch (error: any) {
      console.error("List service attachments error:", error?.message);
      res
        .status(500)
        .json({ success: false, error: "Failed to list attachments" });
    }
  },
);

// POST download service attachment — verify master password then return base64
router.post(
  "/attachments/:id/download",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { password } = req.body;
    const pool = getPool(req);

    if (!password) {
      res.status(400).json({ success: false, error: "Password required" });
      return;
    }

    try {
      const pwdResult = await pool.query(
        `SELECT value FROM attachment_settings WHERE key = 'master_password'`,
      );
      if (pwdResult.rows.length === 0) {
        res
          .status(400)
          .json({ success: false, error: "No master password configured" });
        return;
      }

      const match = await bcrypt.compare(password, pwdResult.rows[0].value);
      if (!match) {
        res.status(403).json({ success: false, error: "Incorrect password" });
        return;
      }

      const fileResult = await pool.query(
        `SELECT original_name, file_data, mime_type FROM service_attachments WHERE id = $1`,
        [id],
      );
      if (fileResult.rows.length === 0) {
        res.status(404).json({ success: false, error: "Attachment not found" });
        return;
      }

      res.json({
        success: true,
        original_name: fileResult.rows[0].original_name,
        file_data: fileResult.rows[0].file_data,
        mime_type: fileResult.rows[0].mime_type,
      });
    } catch (error: any) {
      console.error("Service download error:", error?.message);
      res.status(500).json({ success: false, error: "Download failed" });
    }
  },
);

// DELETE service attachment (admin only)
router.delete(
  "/attachments/:id",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (req.user?.role !== "admin") {
      res
        .status(403)
        .json({ success: false, error: "Only admins can delete attachments" });
      return;
    }

    const { id } = req.params;
    const pool = getPool(req);

    try {
      const result = await pool.query(
        "DELETE FROM service_attachments WHERE id = $1 RETURNING id",
        [id],
      );
      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: "Attachment not found" });
        return;
      }
      res.json({ success: true, message: "Attachment deleted" });
    } catch (error: any) {
      console.error("Delete service attachment error:", error?.message);
      res
        .status(500)
        .json({ success: false, error: "Failed to delete attachment" });
    }
  },
);

export default router;
