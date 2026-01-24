
import { PGlite } from "@electric-sql/pglite";
import path from "path";

async function checkData() {
  const dataDir = path.resolve(process.cwd(), ".data");
  console.log(`Checking PGlite data in: ${dataDir}`);

  try {
    const db = new PGlite(dataDir);
    console.log("Connected to PGlite successfully.");

    // Check databases
    console.log("\n--- Databases ---");
    const dbs = await db.query("SELECT datname FROM pg_database");
    console.log(dbs.rows);

    // Check all tables in all schemas
    console.log("\n--- All Tables ---");
    const allTables = await db.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
    `);
    
    for (const table of allTables.rows) {
      const count = await db.query(`SELECT count(*) FROM "${table.table_schema}"."${table.table_name}"`);
      console.log(`${table.table_schema}.${table.table_name}: ${count.rows[0].count} rows`);
    }

    // Explicitly check for users table if it exists
            console.log("\n--- Specific Checks ---");
            try {
              const users = await db.query("SELECT count(*) FROM users");
              console.log(`public.users count: ${users.rows[0].count}`);
              
              // Check columns of users table
              const columns = await db.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'users'
              `);
              console.log("Users table columns:", columns.rows);

              // Check for specific user 18515151970
              // Only run this if mobile_phone column exists, otherwise try phone
              const hasMobilePhone = columns.rows.some((c: any) => c.column_name === 'mobile_phone');
              const hasPhone = columns.rows.some((c: any) => c.column_name === 'phone');
              
              console.log(`Has mobile_phone: ${hasMobilePhone}, Has phone: ${hasPhone}`);

              let query = "";
              if (hasMobilePhone) {
                 query = "SELECT * FROM users WHERE mobile_phone = '18515151970' OR id = '18515151970'";
              } else if (hasPhone) {
                 query = "SELECT * FROM users WHERE phone = '18515151970' OR id = '18515151970'";
              }
              
              if (query) {
                  const specificUser = await db.query(query);
                  console.log(`User 18515151970 found: ${specificUser.rows.length > 0}`);
                  if (specificUser.rows.length > 0) {
                     console.log(specificUser.rows[0]);
                  }
              }

            } catch (e) {
              console.log("public.users table not found or error querying it: " + e.message);
            }

    try {
      const authUsers = await db.query("SELECT count(*) FROM auth.users");
      console.log(`auth.users count: ${authUsers.rows[0].count}`);
    } catch (e) {
      console.log("auth.users table not found");
    }

  } catch (error) {
    console.error("Error checking PGlite data:", error);
  }
}

checkData();
