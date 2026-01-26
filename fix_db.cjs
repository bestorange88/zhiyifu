const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  await client.connect();
  console.log('Connected to DB');

  try {
    // 1. vip_levels.benefits
    await client.query('ALTER TABLE vip_levels ADD COLUMN IF NOT EXISTS benefits TEXT;');
    console.log('Added vip_levels.benefits');
    
    // 2. vip_requirements.downline_level_requirements
    await client.query('ALTER TABLE vip_requirements ADD COLUMN IF NOT EXISTS downline_level_requirements TEXT;');
    console.log('Added vip_requirements.downline_level_requirements');

    // 2.1 vip_levels.bonus_rules
    await client.query('ALTER TABLE vip_levels ADD COLUMN IF NOT EXISTS bonus_rules TEXT;');
    console.log('Added vip_levels.bonus_rules');

    // 2.2 wallets.total_unfrozen
    await client.query('ALTER TABLE wallets ADD COLUMN IF NOT EXISTS total_unfrozen NUMERIC(10,2) DEFAULT 0 NOT NULL;');
    console.log('Added wallets.total_unfrozen');
    
    // 3. vip_commission_rates columns
    await client.query('ALTER TABLE vip_commission_rates ADD COLUMN IF NOT EXISTS direct_rate NUMERIC(6,4) DEFAULT 0.10;');
    await client.query('ALTER TABLE vip_commission_rates ADD COLUMN IF NOT EXISTS indirect_rate NUMERIC(6,4) DEFAULT 0.05;');
    console.log('Added vip_commission_rates columns');
    
     // 4. lottery_commission_rates columns
    await client.query('ALTER TABLE lottery_commission_rates ADD COLUMN IF NOT EXISTS direct_rate NUMERIC(6,4) DEFAULT 0.10;');
    await client.query('ALTER TABLE lottery_commission_rates ADD COLUMN IF NOT EXISTS indirect_rate NUMERIC(6,4) DEFAULT 0.05;');
    console.log('Added lottery_commission_rates columns');

    // 5. commission_logs constraints/columns (just in case)
    // commission_logs was newly added, if the table doesn't exist, we might need to create it.
    // But usually drizzle creates tables if they don't exist? No, only if migration runs.
    // The error was "column does not exist", implying table exists.
    // If `commission_logs` table is missing, the code will fail later.
    // Let's check if commission_logs exists.
    const res = await client.query("SELECT to_regclass('public.commission_logs');");
    if (!res.rows[0].to_regclass) {
        console.log('Creating commission_logs table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS commission_logs (
                id SERIAL PRIMARY KEY,
                to_user_id INTEGER NOT NULL,
                from_user_id INTEGER NOT NULL,
                biz_type VARCHAR(30) NOT NULL,
                relation_level INTEGER NOT NULL,
                base_cents INTEGER NOT NULL,
                rate NUMERIC(6,4) NOT NULL,
                amount_cents INTEGER NOT NULL,
                ref_id VARCHAR(50) NOT NULL,
                status VARCHAR(20) DEFAULT 'pending' NOT NULL,
                created_at TIMESTAMP DEFAULT NOW() NOT NULL,
                CONSTRAINT commission_unique UNIQUE (biz_type, to_user_id, ref_id, relation_level)
            );
        `);
        console.log('Created commission_logs table');
    }

    // 6. vip_unlock_state table
    const resUnlock = await client.query("SELECT to_regclass('public.vip_unlock_state');");
    if (!resUnlock.rows[0].to_regclass) {
        console.log('Creating vip_unlock_state table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS vip_unlock_state (
                user_id INTEGER PRIMARY KEY,
                vip_level INTEGER NOT NULL,
                unlocked_base_amount NUMERIC(10,2) DEFAULT 0 NOT NULL,
                last_unlock_at TIMESTAMP
            );
        `);
        console.log('Created vip_unlock_state table');
    }

    // 7. chat_groups.announcement & open_hours
    await client.query('ALTER TABLE chat_groups ADD COLUMN IF NOT EXISTS announcement TEXT;');
    await client.query('ALTER TABLE chat_groups ADD COLUMN IF NOT EXISTS open_hours VARCHAR(50);');
    console.log('Added chat_groups columns');

    // 8. ai_chat_logs table
    const resAi = await client.query("SELECT to_regclass('public.ai_chat_logs');");
    if (!resAi.rows[0].to_regclass) {
        console.log('Creating ai_chat_logs table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS ai_chat_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                question TEXT NOT NULL,
                answer TEXT NOT NULL,
                source VARCHAR(20) DEFAULT 'private',
                created_at TIMESTAMP DEFAULT NOW() NOT NULL
            );
        `);
        console.log('Created ai_chat_logs table');
    }

  } catch (e) {
    console.error('Error:', e);
  } finally {
    await client.end();
  }
}

run();
