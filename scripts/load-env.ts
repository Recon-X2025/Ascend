/**
 * Load environment variables for standalone scripts.
 * Run before any imports that depend on process.env (e.g. Typesense client).
 * Matches Next.js behavior: .env then .env.local (override).
 */
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
