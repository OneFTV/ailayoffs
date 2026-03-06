const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: 'postgresql://postgres:HDICFl0wfAI76jYEYyzk6EgLw42wKk@shinkansen.proxy.rlwy.net:16008/railway',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  // Parse CSV
  const csv = fs.readFileSync('/tmp/job_exposure.csv', 'utf8');
  const lines = csv.trim().split('\n').slice(1);
  const exposures = lines.map(line => {
    const match = line.match(/^([^,]+),(".*?"|[^,]+),(.+)$/);
    if (!match) return null;
    const title = match[2].replace(/^"|"$/g, '');
    const score = parseFloat(match[3]);
    return { title, score: Math.round(score * 100) };
  }).filter(Boolean);

  console.log(`Parsed ${exposures.length} occupations from Anthropic data`);

  // Get existing occupations
  const { rows: existing } = await pool.query('SELECT id, title, risk_score FROM occupations');
  const existingMap = {};
  existing.forEach(r => { existingMap[r.title.toLowerCase()] = r; });

  // Update existing occupations where we have a match
  let updated = 0;
  let notFound = [];
  for (const exp of exposures) {
    const key = exp.title.toLowerCase();
    if (existingMap[key]) {
      await pool.query('UPDATE occupations SET risk_score = $1 WHERE id = $2', [exp.score, existingMap[key].id]);
      updated++;
    } else {
      notFound.push({ title: exp.title, score: exp.score });
    }
  }
  console.log(`Updated ${updated} occupations`);

  // Task 2: Add specific occupations mentioned in the paper
  const newOccupations = [
    { title: 'Computer Programmers', risk_score: 75, augmentation_score: 60, related_sector: 'Technology', category: 'Computer & Mathematical', skills_to_learn: 'AI prompt engineering, system architecture, code review' },
    { title: 'Customer Service Representatives', risk_score: 70, augmentation_score: 45, related_sector: 'Customer Service', category: 'Office & Administrative Support', skills_to_learn: 'Complex problem solving, emotional intelligence, escalation management' },
    { title: 'Data Entry Keyers', risk_score: 67, augmentation_score: 20, related_sector: 'Administrative', category: 'Office & Administrative Support', skills_to_learn: 'Data analysis, database management, process automation' },
    { title: 'Financial Analysts', risk_score: 55, augmentation_score: 65, related_sector: 'Finance', category: 'Business & Financial Operations', skills_to_learn: 'AI-assisted modeling, alternative data analysis, strategic advisory' },
    { title: 'Cooks', risk_score: 0, augmentation_score: 5, related_sector: 'Food Service', category: 'Food Preparation & Serving', skills_to_learn: 'Menu innovation, food safety management, kitchen management' },
    { title: 'Motorcycle Mechanics', risk_score: 0, augmentation_score: 10, related_sector: 'Automotive', category: 'Installation, Maintenance & Repair', skills_to_learn: 'Electric vehicle systems, diagnostic technology, customer service' },
    { title: 'Lifeguards', risk_score: 0, augmentation_score: 5, related_sector: 'Recreation', category: 'Protective Service', skills_to_learn: 'Advanced lifesaving, facility management, fitness instruction' },
    { title: 'Bartenders', risk_score: 0, augmentation_score: 5, related_sector: 'Food Service', category: 'Food Preparation & Serving', skills_to_learn: 'Mixology innovation, event management, customer experience' },
    { title: 'Dishwashers', risk_score: 0, augmentation_score: 3, related_sector: 'Food Service', category: 'Food Preparation & Serving', skills_to_learn: 'Kitchen operations, food prep, equipment maintenance' },
    { title: 'Dressing Room Attendants', risk_score: 0, augmentation_score: 5, related_sector: 'Retail', category: 'Personal Care & Service', skills_to_learn: 'Personal styling, customer experience, visual merchandising' },
  ];

  let added = 0;
  for (const occ of newOccupations) {
    const exists = existingMap[occ.title.toLowerCase()];
    if (!exists) {
      const slug = occ.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      try {
        await pool.query(
          'INSERT INTO occupations (title, title_slug, risk_score, augmentation_score, related_sector, category, skills_to_learn) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [occ.title, slug, occ.risk_score, occ.augmentation_score, occ.related_sector, occ.category, occ.skills_to_learn]
        );
        added++;
        console.log(`Added: ${occ.title}`);
      } catch (e) {
        console.log(`Skip ${occ.title}: ${e.message}`);
      }
    } else {
      // Update risk score from paper data
      await pool.query('UPDATE occupations SET risk_score = $1 WHERE id = $2', [occ.risk_score, exists.id]);
      console.log(`Updated existing: ${occ.title} -> risk_score ${occ.risk_score}`);
    }
  }
  console.log(`Added ${added} new occupations`);

  // Task 3: Add layoff entry for Anthropic research
  try {
    await pool.query(
      `INSERT INTO layoffs (company, sector, jobs_cut, reason, date, source, source_name, ai_related, classification, source_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        'Anthropic Research',
        'Research',
        0,
        'Research finding: 75% of Computer Programmer tasks now covered by AI. No systematic unemployment increase yet, but hiring of workers aged 22-25 slowing in exposed occupations. BLS projects 0.6% growth drop per 10% AI coverage increase.',
        '2026-03-05',
        'https://www.anthropic.com/research/labor-market-impacts',
        'Anthropic',
        true,
        'research',
        'https://www.anthropic.com/research/labor-market-impacts'
      ]
    );
    console.log('Added layoff entry for Anthropic research');
  } catch (e) {
    console.log(`Layoff entry error: ${e.message}`);
  }

  // Also update occupations from the CSV that have fuzzy matches
  // Map Anthropic titles to our DB titles
  const fuzzyMap = {
    'chief executives': 'Chief executives',
    'general and operations managers': 'General Manager',
    'marketing managers': 'Marketing Manager',
    'sales managers': 'Sales Manager',
    'public relations managers': 'Public Relations Manager',
    'financial managers': 'Financial Controller',
    'computer and information systems managers': 'IT Manager',
    'human resources managers': 'HR Manager',
    'training and development managers': 'Training Manager',
    'construction managers': 'Construction Manager',
    'software developers': 'Software Developer',
    'software quality assurance analysts and testers': 'QA Engineer',
    'web developers': 'Web Developer',
    'database administrators': 'Database Administrator',
    'network and computer systems administrators': 'Network Administrator',
    'computer user support specialists': 'IT Support Specialist',
    'accountants and auditors': 'Accountant',
    'financial and investment analysts': 'Financial Analyst',
    'management analysts': 'Management Consultant',
    'market research analysts and marketing specialists': 'Marketing Analyst',
    'graphic designers': 'Graphic Designer',
    'writers and authors': 'Writer',
    'editors': 'Editor',
    'interpreters and translators': 'Translator',
    'lawyers': 'Lawyer',
    'paralegals and legal assistants': 'Paralegal',
    'registered nurses': 'Registered Nurse',
    'physicians, all other': 'Physician',
    'pharmacists': 'Pharmacist',
    'physical therapists': 'Physical Therapist',
  };

  for (const exp of exposures) {
    const mapped = fuzzyMap[exp.title.toLowerCase()];
    if (mapped && existingMap[mapped.toLowerCase()]) {
      const row = existingMap[mapped.toLowerCase()];
      await pool.query('UPDATE occupations SET risk_score = $1 WHERE id = $2', [exp.score, row.id]);
      console.log(`Fuzzy updated: ${mapped} -> ${exp.score}`);
    }
  }

  await pool.end();
  console.log('Done!');
}

main().catch(e => { console.error(e); pool.end(); });
