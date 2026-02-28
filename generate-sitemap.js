const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const BASE = 'https://ailayoffs.live';
const today = new Date().toISOString().split('T')[0];

const staticPages = [
  { loc: '/', priority: '1.0' },
  { loc: '/risk-score', priority: '0.9' },
  { loc: '/about.html', priority: '0.5' },
  { loc: '/api.html', priority: '0.5' },
  { loc: '/blog.html', priority: '0.5' },
  { loc: '/methodology.html', priority: '0.5' },
  { loc: '/sources.html', priority: '0.5' },
  { loc: '/careers.html', priority: '0.5' },
  { loc: '/privacy.html', priority: '0.3' },
  { loc: '/terms.html', priority: '0.3' },
];

async function generate() {
  let slugs = [];
  try {
    const r = await pool.query('SELECT title_slug FROM occupations ORDER BY title_slug');
    slugs = r.rows.map(r => r.title_slug);
  } catch(e) { console.error('DB error, generating without occupations:', e.message); }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  for (const p of staticPages) {
    xml += `  <url><loc>${BASE}${p.loc}</loc><lastmod>${today}</lastmod><priority>${p.priority}</priority></url>\n`;
  }
  for (const slug of slugs) {
    xml += `  <url><loc>${BASE}/risk-score/${slug}</loc><lastmod>${today}</lastmod><priority>0.8</priority><changefreq>monthly</changefreq></url>\n`;
  }
  xml += `</urlset>\n`;

  fs.writeFileSync(path.join(__dirname, 'public', 'sitemap.xml'), xml);
  console.log(`Sitemap generated: ${staticPages.length + slugs.length} URLs`);
  await pool.end();
}

generate().catch(e => { console.error(e); process.exit(1); });
