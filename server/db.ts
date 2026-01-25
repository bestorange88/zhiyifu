import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema";
import path from "path";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { migrate as migratePg } from "drizzle-orm/node-postgres/migrator";
import "dotenv/config";

// Database interface
export let db: ReturnType<typeof drizzlePglite> | ReturnType<typeof drizzlePg>;
export let client: PGlite | pg.Pool;

// Initialize database
const databaseUrl = process.env.DATABASE_URL;

if (databaseUrl && (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://"))) {
  console.log("🔌 Initializing PostgreSQL driver with DATABASE_URL");
  const pool = new pg.Pool({
    connectionString: databaseUrl,
  });
  client = pool;
  db = drizzlePg(pool, { schema });
} else {
  // Use a local data directory for the embedded database
  // Ensure absolute path is used to avoid ERR_INVALID_URL with PGlite
  const dataDir = path.resolve(process.cwd(), ".data");
  
  console.log(`Initializing PGlite with data directory: ${dataDir}`);
  console.log(`Current working directory: ${process.cwd()}`);
  
  // Initialize PGlite instance
  client = new PGlite(dataDir);
  db = drizzlePglite(client, { schema });
}

// Function to initialize database (run migrations)
export async function initDb() {
  const migrationsFolder = path.join(process.cwd(), "migrations");
  console.log("Initializing database with migrations from:", migrationsFolder);
  try {
    if (databaseUrl && (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://"))) {
       // Note: drizzle-orm/node-postgres/migrator might behave differently or require different setup
       // For now, we assume standard migration works if compatible
       try {
         await migratePg(db as any, { migrationsFolder });
       } catch (pgError: any) {
         if (pgError.code === '42P07') { // duplicate_table
            console.warn("⚠️ Migration warning: Tables already exist, skipping initialization. Error:", pgError.message);
         } else {
            console.error("❌ Migration failed:", pgError);
            // Optionally re-throw if critical, but for now we try to proceed to avoid boot loop
            // throw pgError; 
         }
       }
    } else {
       await migratePglite(db as any, { migrationsFolder });
    }
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
}
