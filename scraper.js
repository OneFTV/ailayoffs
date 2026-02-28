const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const DATA_FILE = path.join(__dirname, 'data', 'layoffs.json');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const AI_KEYWORDS = /\b(ai|artificial intelligence|automation|machine learning|chatbot|gpt|llm|generative ai|copilot|deep learning|neural|openai|claude|gemini)\b/i;

// PostgreSQL connection
const useDB = !!process.env.DATABASE_URL;
let pool;
if (useDB) {
  pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 5 });
}

const http = axios.create({
  timeout: 15000,
  headers: { 'User-Agent': UA, 'Accept': 'text/html,application/json' },
});

let newEntries = [];

function isAIRelated(text) {
  return AI_KEYWORDS.test(text || '');
}

function dedupeKey(entry) {
  return `${(entry.company||'').toLowerCase().trim()}|${entry.date||''}`;
}

// ─── Source 1: layoffs.fyi ───
async function scrapeLayoffsFyi() {
  console.log('\n📊 Source 1: layoffs.fyi');
  try {
    const { data } = await http.get('https://layoffs.fyi/');
    const $ = cheerio.load(data);
    
    // Try to find embedded data or iframe URLs
    const iframes = [];
    $('iframe').each((_, el) => {
      const src = $(el).attr('src');
      if (src) iframes.push(src);
    });
    
    // Try the Google Sheets CSV export if available
    // layoffs.fyi typically embeds an Airtable - let's try to get data from the page
    let found = 0;
    
    // Look for any table data on the page
    $('table tr').each((i, row) => {
      if (i === 0) return; // skip header
      const cells = $(row).find('td');
      if (cells.length >= 3) {
        const company = $(cells[0]).text().trim();
        const jobsCut = parseInt($(cells[1]).text().replace(/[^0-9]/g, '')) || 0;
        const dateStr = $(cells[2]).text().trim();
        const text = $(row).text();
        if (company && isAIRelated(text)) {
          newEntries.push({
            company, sector: 'Unknown', jobsCut, reason: 'Layoff reported on layoffs.fyi',
            date: dateStr || new Date().toISOString().slice(0, 10),
            source: 'https://layoffs.fyi/', sourceName: 'layoffs.fyi', aiRelated: true,
          });
          found++;
        }
      }
    });
    
    // Also try their Google Sheets export
    try {
      const sheetUrl = 'https://docs.google.com/spreadsheets/d/1TeHbYOpnJPCq76By0la3TB3QFGJ2dJhJ8J7cxJCGsOY/export?format=csv';
      const { data: csv } = await http.get(sheetUrl);
      const lines = csv.split('\n').slice(1);
      for (const line of lines) {
        const cols = line.match(/(".*?"|[^,]+)/g) || [];
        const clean = c => (c || '').replace(/^"|"$/g, '').trim();
        const company = clean(cols[1]);
        const industry = clean(cols[2]);
        const numStr = clean(cols[3]);
        const dateStr = clean(cols[4]);
        const rowText = line;
        if (company && isAIRelated(rowText + ' ' + industry)) {
          newEntries.push({
            company, sector: industry || 'Unknown',
            jobsCut: parseInt(numStr) || 0,
            reason: `Layoff tracked by layoffs.fyi`,
            date: dateStr || new Date().toISOString().slice(0, 10),
            source: 'https://layoffs.fyi/', sourceName: 'layoffs.fyi', aiRelated: true,
          });
          found++;
        }
      }
    } catch (e) {
      console.log('  ⚠ Google Sheets export not accessible');
    }
    
    console.log(`  ✅ Found ${found} AI-related entries`);
    if (iframes.length) console.log(`  ℹ Iframes found: ${iframes.slice(0, 3).join(', ')}`);
  } catch (e) {
    console.log(`  ❌ Error: ${e.message}`);
  }
}

// ─── Source 2: thelayoff.com ───
async function scrapeTheLayoff() {
  console.log('\n📊 Source 2: thelayoff.com');
  try {
    const { data } = await http.get('https://www.thelayoff.com/');
    const $ = cheerio.load(data);
    let found = 0;
    
    $('a').each((_, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      if (text.length > 3 && isAIRelated(text)) {
        const company = text.replace(/layoff.*/i, '').replace(/\d+/g, '').trim() || text.slice(0, 40);
        newEntries.push({
          company: company.slice(0, 60), sector: 'Unknown', jobsCut: 0,
          reason: text.slice(0, 200),
          date: new Date().toISOString().slice(0, 10),
          source: href.startsWith('http') ? href : `https://www.thelayoff.com${href}`,
          sourceName: 'TheLayoff.com', aiRelated: true,
        });
        found++;
      }
    });
    
    console.log(`  ✅ Found ${found} AI-related entries`);
  } catch (e) {
    console.log(`  ❌ Error: ${e.message}`);
  }
}

// ─── Source 3: Google News ───
async function scrapeGoogleNews() {
  console.log('\n📊 Source 3: Google News');
  const queries = ['AI+layoffs+2024', 'AI+replacing+jobs+layoffs', 'artificial+intelligence+job+cuts'];
  let found = 0;
  
  for (const q of queries) {
    try {
      const url = `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`;
      const { data } = await http.get(url);
      const $ = cheerio.load(data, { xmlMode: true });
      
      $('item').each((_, item) => {
        const title = $(item).find('title').text().trim();
        const link = $(item).find('link').text().trim();
        const pubDate = $(item).find('pubDate').text().trim();
        const source = $(item).find('source').text().trim();
        
        if (isAIRelated(title)) {
          // Try to extract company name from title
          const companyMatch = title.match(/^([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)?)/);
          const company = companyMatch ? companyMatch[1] : 'Various';
          const date = pubDate ? new Date(pubDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
          
          newEntries.push({
            company, sector: 'Unknown', jobsCut: 0,
            reason: title.slice(0, 200),
            date, source: link, sourceName: source || 'Google News', aiRelated: true,
          });
          found++;
        }
      });
    } catch (e) {
      console.log(`  ⚠ Query "${q}": ${e.message}`);
    }
  }
  
  console.log(`  ✅ Found ${found} AI-related entries`);
}

// ─── Source 4: Reddit ───
async function scrapeReddit() {
  console.log('\n📊 Source 4: Reddit');
  const subs = ['layoffs', 'cscareerquestions'];
  let found = 0;
  
  for (const sub of subs) {
    try {
      const { data } = await http.get(`https://www.reddit.com/r/${sub}/hot.json?limit=50`, {
        headers: { 'User-Agent': 'AILayoffsBot/1.0' }
      });
      
      for (const post of (data?.data?.children || [])) {
        const d = post.data;
        const text = `${d.title} ${d.selftext || ''}`;
        if (isAIRelated(text) && /layoff|laid off|fired|cut|downsiz/i.test(text)) {
          const companyMatch = text.match(/\b(Google|Meta|Amazon|Microsoft|Apple|IBM|SAP|Salesforce|Tesla|Intel|Cisco|Dell|HP|Oracle|Adobe|Netflix|Uber|Lyft|Snap|Twitter|X|ByteDance|TikTok|Spotify|PayPal|Block|Stripe|Shopify|Zoom|Slack|Twilio|Palantir|Databricks|Snowflake|CrowdStrike|Cloudflare|Unity)\b/i);
          const company = companyMatch ? companyMatch[1] : 'Various';
          const date = d.created_utc ? new Date(d.created_utc * 1000).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
          
          newEntries.push({
            company, sector: 'Tech', jobsCut: 0,
            reason: d.title.slice(0, 200),
            date, source: `https://reddit.com${d.permalink}`,
            sourceName: `Reddit r/${sub}`, aiRelated: true,
          });
          found++;
        }
      }
    } catch (e) {
      console.log(`  ⚠ r/${sub}: ${e.message}`);
    }
  }
  
  console.log(`  ✅ Found ${found} AI-related entries`);
}

// ─── Source 5: WARN Act ───
async function scrapeWARN() {
  console.log('\n📊 Source 5: WARN Act Notices');
  let found = 0;
  
  // California WARN
  try {
    const { data } = await http.get('https://edd.ca.gov/en/Jobs_and_Training/Layoff_Services_WARN');
    const $ = cheerio.load(data);
    $('table tr').each((i, row) => {
      if (i === 0) return;
      const cells = $(row).find('td');
      const text = $(row).text();
      if (cells.length >= 3 && isAIRelated(text)) {
        const company = $(cells[0]).text().trim() || $(cells[1]).text().trim();
        const dateStr = $(cells[cells.length - 1]).text().trim();
        const numMatch = text.match(/(\d{2,})\s*(employee|worker|job)/i);
        newEntries.push({
          company: company.slice(0, 60), sector: 'Unknown',
          jobsCut: numMatch ? parseInt(numMatch[1]) : 0,
          reason: `WARN Act notice (California) - ${text.slice(0, 100)}`,
          date: dateStr || new Date().toISOString().slice(0, 10),
          source: 'https://edd.ca.gov/en/Jobs_and_Training/Layoff_Services_WARN',
          sourceName: 'CA EDD WARN', aiRelated: true,
        });
        found++;
      }
    });
  } catch (e) {
    console.log(`  ⚠ CA WARN: ${e.message}`);
  }
  
  // New York WARN
  try {
    const { data } = await http.get('https://dol.ny.gov/warn-notices');
    const $ = cheerio.load(data);
    $('table tr').each((i, row) => {
      if (i === 0) return;
      const cells = $(row).find('td');
      const text = $(row).text();
      if (cells.length >= 3 && isAIRelated(text)) {
        const company = $(cells[0]).text().trim();
        const numMatch = text.match(/(\d{2,})/);
        newEntries.push({
          company: company.slice(0, 60), sector: 'Unknown',
          jobsCut: numMatch ? parseInt(numMatch[1]) : 0,
          reason: `WARN Act notice (New York) - ${text.slice(0, 100)}`,
          date: new Date().toISOString().slice(0, 10),
          source: 'https://dol.ny.gov/warn-notices',
          sourceName: 'NY DOL WARN', aiRelated: true,
        });
        found++;
      }
    });
  } catch (e) {
    console.log(`  ⚠ NY WARN: ${e.message}`);
  }
  
  console.log(`  ✅ Found ${found} AI-related entries`);
}

// ─── Main ───
async function main() {
  const ts = new Date().toISOString();
  console.log(`\n[${ts}] 🤖 AILayoffs.live Scraper`);
  console.log('========================\n');
  
  // Load existing data (JSON)
  let existing = [];
  try {
    existing = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    console.log(`📁 Loaded ${existing.length} existing JSON entries`);
  } catch (e) {
    console.log('📁 No existing data file, starting fresh');
  }
  
  // Run all scrapers
  await scrapeLayoffsFyi();
  await scrapeTheLayoff();
  await scrapeGoogleNews();
  await scrapeReddit();
  await scrapeWARN();
  
  // Deduplicate against JSON
  const seen = new Set(existing.map(dedupeKey));
  let added = 0;
  const uniqueNew = [];
  for (const entry of newEntries) {
    const key = dedupeKey(entry);
    if (!seen.has(key)) {
      seen.add(key);
      existing.push(entry);
      uniqueNew.push(entry);
      added++;
    }
  }
  
  // Sort by date descending
  existing.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  
  // Save to JSON
  fs.writeFileSync(DATA_FILE, JSON.stringify(existing, null, 2));
  
  // Write to PostgreSQL if available
  let dbInserted = 0;
  if (useDB && uniqueNew.length > 0) {
    console.log(`\n💾 Writing ${uniqueNew.length} new entries to PostgreSQL...`);
    for (const entry of uniqueNew) {
      try {
        // Check for duplicate in DB by company + date
        const dup = await pool.query(
          `SELECT id FROM layoffs WHERE LOWER(company) = LOWER($1) AND date = $2`,
          [entry.company, entry.date]
        );
        if (dup.rows.length > 0) {
          console.log(`  ⏭ Skip (exists in DB): ${entry.company} ${entry.date}`);
          continue;
        }
        await pool.query(
          `INSERT INTO layoffs (company, sector, jobs_cut, reason, date, source, source_name, source_url, classification)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            entry.company, entry.sector || 'Unknown', entry.jobsCut || 0,
            entry.reason || '', entry.date, entry.source || '',
            entry.sourceName || '', entry.source || '', entry.aiRelated ? 'ai-related' : 'general'
          ]
        );
        dbInserted++;
        console.log(`  ✅ Inserted: ${entry.company} (${entry.jobsCut} jobs, ${entry.date})`);
      } catch (e) {
        console.log(`  ❌ DB insert error for ${entry.company}: ${e.message}`);
      }
    }
    console.log(`\n📊 DB: ${dbInserted} new rows inserted`);
  } else if (useDB) {
    console.log('\n💾 No new entries to write to PostgreSQL');
  } else {
    console.log('\n⚠ No DATABASE_URL — skipping PostgreSQL');
  }
  
  console.log('\n========================');
  console.log(`📊 Results: ${newEntries.length} scraped, ${added} new unique, ${existing.length} total JSON`);
  console.log(`💾 JSON saved to ${DATA_FILE}`);
  if (useDB) console.log(`💾 PostgreSQL: ${dbInserted} inserted`);
  
  // Close pool
  if (pool) await pool.end();
}

main().catch(e => {
  console.error('Fatal error:', e.message);
  if (pool) pool.end();
  process.exit(1);
});
