
import { db, initDb } from "./server/db";
import { admins } from "./shared/schema";
import { initDefaultAdmin } from "./server/services/admin";
import { eq } from "drizzle-orm";

async function checkAdmin() {
  try {
    await initDb();
    await initDefaultAdmin();
    const [admin] = await db.select().from(admins).where(eq(admins.username, "admin")).limit(1);
    if (admin) {
      console.log("Admin exists:", admin.username);
    } else {
      console.log("Admin does NOT exist.");
    }
  } catch (error) {
    console.error("Database error:", error);
  }
  process.exit(0);
}

checkAdmin();
