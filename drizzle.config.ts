import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  // throw new Error("DATABASE_URL, ensure the database is provisioned");
  console.warn("DATABASE_URL is not set, using dummy URL for generation");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgres://dummy:dummy@localhost:5432/dummy",
  },
});
