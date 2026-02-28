const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:ZbwrIpoGafpCTVuEjqsBGhkdLnLfeQaM@shinkansen.proxy.rlwy.net:16008/railway', ssl: { rejectUnauthorized: false }, max: 5 });

// Inline a subset — we'll build SQL values
const fs = require('fs');
// Extract data object from the update script
const script = fs.readFileSync(__dirname + '/update-augmentation.js', 'utf8');
const match = script.match(/const data = ({[\s\S]*?});/);
if (!match) { console.error('Cannot parse data'); process.exit(1); }
const data = eval('(' + match[1] + ')');

async function run() {
  const entries = Object.entries(data);
  console.log('Total entries:', entries.length);
  
  // Process in batches of 20
  const batch = 20;
  let updated = 0;
  for (let i = 0; i < entries.length; i += batch) {
    const chunk = entries.slice(i, i + batch);
    await Promise.all(chunk.map(([slug, [score, skills]]) => 
      pool.query('UPDATE occupations SET augmentation_score=$1, skills_to_learn=$2 WHERE title_slug=$3', [score, JSON.stringify(skills), slug])
        .then(r => { if (r.rowCount > 0) updated++; else console.log('MISS:', slug); })
    ));
    process.stdout.write('.');
  }
  console.log(`\nUpdated ${updated} occupations`);
  await pool.end();
}

run().catch(e => { console.error(e); process.exit(1); });
