import { drizzle } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import * as schema from "@shared/schema";
import path from "path";
import { migrate } from "drizzle-orm/pglite/migrator";

// Use a local data directory for the embedded database
// Ensure absolute path is used to avoid ERR_INVALID_URL with PGlite
const dataDir = path.resolve(process.cwd(), ".data");

console.log(`Initializing PGlite with data directory: ${dataDir}`);
console.log(`Current working directory: ${process.cwd()}`);

// Initialize PGlite instance
// Note: PGlite handles creating the directory
export const client = new PGlite(dataDir);

// Initialize Drizzle ORM
export const db = drizzle(client, { schema });

// Function to initialize database (run migrations)
export async function initDb() {
  const migrationsFolder = path.join(process.cwd(), "migrations");
  console.log("Initializing database with migrations from:", migrationsFolder);
  try {
    await migrate(db, { migrationsFolder });
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
}
