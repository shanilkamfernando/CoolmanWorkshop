import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

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
    console.error("❌ Error connecting to database:", err.message);
  } else {
    console.log("✅ Database connected successfully!");
    release();
  }
});

pool.on("error", (err) => {
  console.error("❌ Unexpected database error:", err);
});

export default pool;
