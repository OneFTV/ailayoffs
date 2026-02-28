// One-time migration: JSON → PostgreSQL
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : false });

async function migrate() {
  const client = await pool.connect();
  try {
    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS layoffs (
        id SERIAL PRIMARY KEY,
        company VARCHAR(255) NOT NULL,
        sector VARCHAR(100),
        jobs_cut INTEGER NOT NULL,
        reason TEXT,
        date DATE,
        source TEXT,
        source_name VARCHAR(255),
        ai_related BOOLEAN DEFAULT true,
        classification VARCHAR(50),
        source_count INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS subscribers (
        id SERIAL PRIMARY KEY,
        email VARCHAR(254) UNIQUE NOT NULL,
        ip_hash VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS analytics_pageviews (
        id SERIAL PRIMARY KEY,
        path VARCHAR(500),
        vid VARCHAR(50),
        country VARCHAR(10),
        device VARCHAR(20),
        referrer TEXT,
        is_bot BOOLEAN DEFAULT false,
        date DATE,
        ts BIGINT
      );
      CREATE TABLE IF NOT EXISTS analytics_events (
        id SERIAL PRIMARY KEY,
        event VARCHAR(100),
        data JSONB DEFAULT '{}',
        vid VARCHAR(50),
        date DATE,
        ts BIGINT
      );
      CREATE TABLE IF NOT EXISTS analytics_sessions (
        id SERIAL PRIMARY KEY,
        vid VARCHAR(50),
        duration INTEGER,
        date DATE,
        ts BIGINT
      );
      CREATE INDEX IF NOT EXISTS idx_layoffs_company ON layoffs(company);
      CREATE INDEX IF NOT EXISTS idx_layoffs_date ON layoffs(date);
      CREATE INDEX IF NOT EXISTS idx_pv_date ON analytics_pageviews(date);
      CREATE INDEX IF NOT EXISTS idx_pv_ts ON analytics_pageviews(ts);
    `);
    console.log('Tables created');

    // Migrate layoffs data
    const layoffs = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'layoffs.json'), 'utf8'));
    for (const l of layoffs) {
      await client.query(
        `INSERT INTO layoffs (company, sector, jobs_cut, reason, date, source, source_name, ai_related, classification, source_count)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT DO NOTHING`,
        [l.company, l.sector, l.jobsCut, l.reason, l.date, l.source, l.sourceName, l.aiRelated !== false, l.classification || 'confirmed', l.sourceCount || 1]
      );
    }
    console.log(`Migrated ${layoffs.length} layoff entries`);

    // Migrate subscribers
    try {
      const subs = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'subscribers.json'), 'utf8'));
      for (const s of (subs.emails || [])) {
        await client.query(
          `INSERT INTO subscribers (email, ip_hash, created_at) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
          [s.email, s.ipHash, s.date]
        );
      }
      console.log(`Migrated ${(subs.emails||[]).length} subscribers`);
    } catch(e) { console.log('No subscribers to migrate'); }

    console.log('Migration complete!');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(e => { console.error(e); process.exit(1); });
