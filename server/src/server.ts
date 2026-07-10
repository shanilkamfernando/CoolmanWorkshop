import express, { Application, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import pool from "./db";
import authRoutes from "../src/routes/auth";
import customers from "./routes/customers";
import projects from "./routes/projects";
import attachments from "./routes/attachments";

import compressorService from "./routes/compressor-service";
import compressorDashboard from "./routes/compressor-dashboard";
import compressorRepair from "./routes/compressor-repair";
import compressorRepairDashboard from "./routes/compressor-repair-dashboard";
import systemRepair from "./routes/system-repair";
import systemInspection from "./routes/system-inspection";
import customerDocuments from "./routes/customer-documents";
import jobCards from "./routes/job-cards";

import purchasing from "./routes/purchasing";
import boqRouter from "./routes/boq";
import workshopProjects from "./routes/workshop-projects";
import workshopRepairs from "./routes/workshop-repairs";

import storeBrands from "./routes/store-brands";
import stores from "./routes/stores";

import documents from "./routes/documents";

import worklistYears from "./routes/worklist-years";
import worklistTasks from "./routes/worklist-tasks";

import meetingsRouter from "./routes/meetings";

import followUps from "./routes/followups";

import workshop from "./routes/workshop";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Middleware — CORS accepts a comma-separated list of allowed origins in CLIENT_URL
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow tools with no origin (curl, Postman, mobile apps)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.warn(`❌ CORS blocked origin: ${origin}`);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

//server static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Make pool available to routes via app.locals
app.locals.pool = pool;

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/customers", customers);
app.use("/api/customers", projects);
app.use("/api/customers", attachments);

app.use("/api/customers", compressorService);
app.use("/api/customers", compressorDashboard);
app.use("/api/customers", compressorRepair);
app.use("/api/customers", compressorRepairDashboard);
app.use("/api/customers", systemRepair);
app.use("/api/customers", systemInspection);
app.use("/api/customers", customerDocuments);
app.use("/api/customers", jobCards);

app.use("/api/purchasing", workshopProjects);
app.use("/api/purchasing", workshopRepairs);

app.use("/api", purchasing);
app.use("/api", boqRouter);

app.use("/api", stores);
app.use("/api", storeBrands);

app.use("/api", workshop);

app.use("/api", documents);
app.use("/api", worklistYears);
app.use("/api", worklistTasks);
app.use("/api", meetingsRouter);
app.use("/api", followUps);

// Root route
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "🚀 Coolman Workshop Server is Running!",
    status: "success",
    endpoints: {
      health: "/",
      testDb: "/test-db",
      auth: "/api/auth",
      customers: "/api/customers",
      projects: "/api/customers/:customerId/projects",
      compressorService: "/api/customers/:customerId/compressor-service",
      compressorRepair: "/api/customers/:customerId/compressor-repair",
      compressorRepairDashboard:
        "/api/customers/:customerId/compressor-repair/:companyId",
      attachments: "/api/customers/:customerId/projects/:projectId/attachments",
    },
  });
});

// Test database connection route
app.get("/test-db", async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      success: true,
      message: "✅ Database connected!",
      time: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "❌ Database connection failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path,
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: Function) => {
  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// Start server
app.listen(PORT, () => {
  console.log("");
  console.log("========================================");
  console.log("🚀 COOLMan Workshop Server");
  console.log("========================================");
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `🔗 Client: ${process.env.CLIENT_URL || "http://localhost:5173"}`,
  );
  console.log("========================================");
  console.log("📍 Available Routes:");
  console.log("   - POST   /api/auth/signin");
  console.log("   - POST   /api/auth/signup");
  console.log("   - GET    /api/customers");
  console.log("   - POST   /api/customers");
  console.log("   - GET    /api/customers/:id/projects");
  console.log("   - POST   /api/customers/:id/projects");
  console.log("   - GET    /api/customers/:id/compressor-service");
  console.log("   - POST   /api/customers/:id/compressor-service");
  console.log(
    "   - POST   /api/customers/:id/projects/:pid/attachments (upload)",
  );
  console.log(
    "   - GET    /api/customers/:id/projects/:pid/attachments (list)",
  );
  console.log(
    "   - GET    /api/customers/:id/projects/:pid/attachments/:aid/download",
  );
  console.log("   - GET    /api/customers/:id/compressor-repair");
  console.log("   - POST   /api/customers/:id/compressor-repair");
  console.log(
    "   - GET    /api/customers/:id/compressor-repair/:cid/compressors",
  );
  console.log(
    "   - POST   /api/customers/:id/compressor-repair/:cid/compressors",
  );
  console.log("   - GET    /api/customers/:id/compressor-repair/:cid/records");
  console.log("   - POST   /api/customers/:id/compressor-repair/:cid/records");
  console.log("   - DELETE /api/customers/:id/projects/:pid/attachments/:aid");
  console.log("");
  console.log("========================================");
  console.log("");
});

export default app;
