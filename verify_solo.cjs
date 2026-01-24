const { Client } = require('pg');
const path = require('path');
const fs = require('fs');

async function main() {
  console.log("-----------------------------------------");
  console.log("   Data Verification (SOLO Branch)      ");
  console.log("-----------------------------------------");

  // Read .env.prod to get connection string
  let dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
      try {
        const envContent = fs.readFileSync('.env.prod', 'utf8');
        const match = envContent.match(/DATABASE_URL=(.*)/);
        if (match) dbUrl = match[1].trim();
      } catch (e) {
          console.log("Could not read local .env.prod");
      }
  }

  if (!dbUrl) {
      console.error("❌ No DATABASE_URL found.");
      return;
  }
  
  console.log("Connecting to:", dbUrl.replace(/:[^:@]+@/, ':****@')); // Hide password

  const client = new Client({
    connectionString: dbUrl,
  });

  try {
    await client.connect();
    const res = await client.query('SELECT count(*) FROM users');
    console.log(`✅ Current User Count: ${res.rows[0].count}`);
    
    // Also check chat messages to be sure
    const chatRes = await client.query('SELECT count(*) FROM messages');
    console.log(`✅ Chat Messages Count: ${chatRes.rows[0].count}`);

  } catch (err) {
    console.error('❌ Connection error:', err.message);
  } finally {
    await client.end();
  }
}

main();
