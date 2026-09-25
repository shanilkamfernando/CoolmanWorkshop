import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();
type ConnectionError = Error & {
  code?: string;
  address?: string;
  port?: number;
  errors?: ConnectionError[];
};

// Use single DATABASE_URL in production (Neon/Render).
// Fall back to individual vars for local development.
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : new Pool({
      user: process.env.DB_USER || "postgres",
      host: process.env.DB_HOST || "localhost",
      database: process.env.DB_NAME || "coolman_workshop",
      password: process.env.DB_PASSWORD || "admin123",
      port: parseInt(process.env.DB_PORT || "5432"),
    });

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    const dbError = err as ConnectionError;

    console.error("❌ Database connection failed:", {
      name: dbError.name,
      code: dbError.code,
      message: dbError.message,
      causes: dbError.errors?.map((cause) => ({
        code: cause.code,
        address: cause.address,
        port: cause.port,
      })),
    });
    return;
  }

  console.log("✅ Database connected successfully!");
  release();
});

pool.on("error", (err) => {
  console.error("❌ Unexpected database error:", err);
});

export default pool;
