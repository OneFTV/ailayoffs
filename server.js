const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL connection (falls back to JSON if no DATABASE_URL)
const useDB = !!process.env.DATABASE_URL;
let pool;
if (useDB) {
  pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 10 });
  pool.on('error', (err) => console.error('PG pool error:', err.message));
}

// JSON fallback paths
const DATA_PATH = path.join(__dirname, 'data', 'layoffs.json');
const ANALYTICS_PATH = path.join(__dirname, 'data', 'analytics.json');
const SUBS_PATH = path.join(__dirname, 'data', 'subscribers.json');

// --- Helpers ---
function hashIP(ip) { return crypto.createHash('sha256').update(ip + 'ailayoffs-salt').digest('hex').slice(0, 12); }
function parseUA(ua) { return /mobile|android|iphone|ipad/i.test(ua || '') ? 'mobile' : 'desktop'; }
function isBot(ua) { return /bot|crawler|spider|scraper|curl|wget|python|go-http|node-fetch|chatgpt|gpt|anthropic|claude|perplexity|bytespider|semrush|ahrefs/i.test(ua || ''); }

const geoip = require('geoip-lite');
function getCountry(req) {
  if (req.headers['cf-ipcountry']) return req.headers['cf-ipcountry'];
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
  const geo = geoip.lookup(ip);
  return geo?.country || 'unknown';
}

function getIP(req) { return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip; }

// --- JSON fallback functions ---
function loadJSON(p, def) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return def; } }
function saveJSON(p, data) { fs.writeFileSync(p, JSON.stringify(data)); }

// --- Middleware ---
app.use(express.json());

// Analytics middleware
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.match(/\.(js|css|png|jpg|svg|ico|woff)$/)) return next();
  try {
    const ip = getIP(req);
    const vid = hashIP(ip);
    const ua = req.headers['user-agent'] || '';
    const today = new Date().toISOString().slice(0, 10);
    const bot = isBot(ua);
    const country = getCountry(req);
    const device = parseUA(ua);
    const referrer = req.headers['referer'] || 'direct';

    if (useDB) {
      await pool.query(
        `INSERT INTO analytics_pageviews (path, vid, country, device, referrer, is_bot, date, ts) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [req.path, vid, country, device, referrer, bot, today, Date.now()]
      );
    } else {
      const a = loadJSON(ANALYTICS_PATH, { pageviews: [], visitors: {} });
      a.pageviews.push({ path: req.path, vid, country, device, referrer, isBot: bot, ts: Date.now(), date: today });
      if (!a.visitors[today]) a.visitors[today] = [];
      if (!a.visitors[today].includes(vid)) a.visitors[today].push(vid);
      const cutoff = Date.now() - 30 * 86400000;
      a.pageviews = a.pageviews.filter(p => p.ts > cutoff);
      saveJSON(ANALYTICS_PATH, a);
    }
  } catch(e) { /* don't break the site */ }
  next();
});

app.use(express.static('public'));

// POST /api/track
app.post('/api/track', async (req, res) => {
  try {
    const { event, data, vid, duration } = req.body;
    if (!event) return res.status(400).json({ error: 'missing event' });
    const today = new Date().toISOString().slice(0, 10);
    const now = Date.now();

    if (useDB) {
      if (event === 'session_end' && vid && duration) {
        await pool.query(`INSERT INTO analytics_sessions (vid, duration, date, ts) VALUES ($1,$2,$3,$4)`, [vid, duration, today, now]);
      } else {
        await pool.query(`INSERT INTO analytics_events (event, data, vid, date, ts) VALUES ($1,$2,$3,$4,$5)`, [event, JSON.stringify(data || {}), vid || 'anon', today, now]);
      }
    } else {
      const a = loadJSON(ANALYTICS_PATH, { pageviews: [], visitors: {}, events: [], sessions: [] });
      if (event === 'session_end' && vid && duration) {
        if (!a.sessions) a.sessions = [];
        a.sessions.push({ vid, duration, date: today, ts: now });
      } else {
        if (!a.events) a.events = [];
        a.events.push({ event, data: data || {}, vid: vid || 'anon', date: today, ts: now });
      }
      saveJSON(ANALYTICS_PATH, a);
    }
    res.json({ ok: true });
  } catch(e) { res.json({ ok: true }); }
});

// POST /api/subscribe
app.post('/api/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') return res.status(400).json({ error: 'Email required' });
    const clean = email.trim().toLowerCase().slice(0, 254);
    if (!/^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/.test(clean)) return res.status(400).json({ error: 'Invalid email' });
    if (/['";\\<>{}()=]|drop |select |insert |delete |union |script/i.test(clean)) return res.status(400).json({ error: 'Invalid input' });

    const ip = getIP(req);
    const ipHash = crypto.createHash('sha256').update(ip + 'sub-salt').digest('hex').slice(0, 12);

    if (useDB) {
      // Rate limit
      const rl = await pool.query(`SELECT COUNT(*) as c FROM subscribers WHERE ip_hash=$1 AND created_at > NOW() - INTERVAL '1 hour'`, [ipHash]);
      if (parseInt(rl.rows[0].c) >= 3) return res.status(429).json({ error: 'Too many requests.' });
      // Check dup
      const dup = await pool.query(`SELECT id FROM subscribers WHERE email=$1`, [clean]);
      if (dup.rows.length) return res.json({ ok: true, msg: 'Already subscribed!' });
      await pool.query(`INSERT INTO subscribers (email, ip_hash) VALUES ($1, $2)`, [clean, ipHash]);
      const count = await pool.query(`SELECT COUNT(*) as c FROM subscribers`);
      res.json({ ok: true, msg: 'Subscribed!', total: parseInt(count.rows[0].c) });
    } else {
      const subs = loadJSON(SUBS_PATH, { emails: [], rateLimit: {} });
      const now = Date.now();
      const rl = (subs.rateLimit[ipHash] || []).filter(t => t > now - 3600000);
      if (rl.length >= 3) return res.status(429).json({ error: 'Too many requests.' });
      if (subs.emails.find(e => e.email === clean)) return res.json({ ok: true, msg: 'Already subscribed!' });
      subs.emails.push({ email: clean, date: new Date().toISOString(), ipHash });
      subs.rateLimit[ipHash] = [...rl, now];
      saveJSON(SUBS_PATH, subs);
      res.json({ ok: true, msg: 'Subscribed!', total: subs.emails.length });
    }
  } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

app.get('/api/subscribers/count', async (req, res) => {
  if (useDB) {
    const r = await pool.query(`SELECT COUNT(*) as c FROM subscribers`);
    res.json({ count: parseInt(r.rows[0].c) });
  } else {
    const subs = loadJSON(SUBS_PATH, { emails: [] });
    res.json({ count: subs.emails.length });
  }
});

// GET /api/layoffs
app.get('/api/layoffs', async (req, res) => {
  if (useDB) {
    let q = 'SELECT company, sector, jobs_cut as "jobsCut", reason, date::text, source, source_name as "sourceName", classification FROM layoffs WHERE 1=1';
    const params = [];
    const { sector, company, from, to } = req.query;
    if (sector) { params.push(sector); q += ` AND LOWER(sector)=LOWER($${params.length})`; }
    if (company) { params.push(`%${company}%`); q += ` AND LOWER(company) LIKE LOWER($${params.length})`; }
    if (from) { params.push(from); q += ` AND date >= $${params.length}`; }
    if (to) { params.push(to); q += ` AND date <= $${params.length}`; }
    q += ' ORDER BY jobs_cut DESC';
    const r = await pool.query(q, params);
    res.json(r.rows);
  } else {
    let data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    const { sector, company, from, to } = req.query;
    if (sector) data = data.filter(d => d.sector.toLowerCase() === sector.toLowerCase());
    if (company) data = data.filter(d => d.company.toLowerCase().includes(company.toLowerCase()));
    if (from) data = data.filter(d => d.date >= from);
    if (to) data = data.filter(d => d.date <= to);
    data.sort((a, b) => b.jobsCut - a.jobsCut);
    res.json(data);
  }
});

// GET /api/stats
app.get('/api/stats', async (req, res) => {
  if (useDB) {
    const total = await pool.query(`SELECT SUM(jobs_cut) as total, COUNT(DISTINCT company) as companies FROM layoffs`);
    const bySector = await pool.query(`SELECT sector, SUM(jobs_cut) as total FROM layoffs GROUP BY sector ORDER BY total DESC`);
    const byMonth = await pool.query(`SELECT TO_CHAR(date, 'YYYY-MM') as month, SUM(jobs_cut) as total FROM layoffs GROUP BY month ORDER BY month`);
    // Rate calculations
    const last90 = await pool.query(`SELECT COALESCE(SUM(jobs_cut),0) as total FROM layoffs WHERE date >= CURRENT_DATE - INTERVAL '90 days'`);
    const thisMonth = await pool.query(`SELECT COALESCE(SUM(jobs_cut),0) as total FROM layoffs WHERE TO_CHAR(date,'YYYY-MM') = TO_CHAR(CURRENT_DATE,'YYYY-MM')`);
    const lastEntry = await pool.query(`SELECT MAX(date) as last_date FROM layoffs`);
    const t = total.rows[0];
    const sectorMap = {}; bySector.rows.forEach(r => sectorMap[r.sector] = parseInt(r.total));
    const jobs90 = parseInt(last90.rows[0].total) || 0;
    const jobsPerHour = Math.round((jobs90 / 90 / 24) * 100) / 100;
    res.json({
      totalJobsCut: parseInt(t.total), totalCompanies: parseInt(t.companies),
      bySector: sectorMap,
      byMonth: byMonth.rows.map(r => ({ month: r.month, jobsCut: parseInt(r.total) })),
      avgPerCompany: Math.round(parseInt(t.total) / parseInt(t.companies)),
      jobsPerHour,
      monthlyRate: parseInt(thisMonth.rows[0].total) || 0,
      lastUpdated: lastEntry.rows[0].last_date || null
    });
  } else {
    const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    const totalJobsCut = data.reduce((s, d) => s + d.jobsCut, 0);
    const companies = [...new Set(data.map(d => d.company))];
    const bySector = {}; data.forEach(d => { bySector[d.sector] = (bySector[d.sector] || 0) + d.jobsCut; });
    const byMonthMap = {}; data.forEach(d => { const m = d.date.slice(0, 7); byMonthMap[m] = (byMonthMap[m] || 0) + d.jobsCut; });
    const byMonth = Object.entries(byMonthMap).sort(([a], [b]) => a.localeCompare(b)).map(([month, jobsCut]) => ({ month, jobsCut }));
    // Rate calculations for JSON fallback
    const now = new Date();
    const d90ago = new Date(now - 90*86400000).toISOString().slice(0,10);
    const thisMonthStr = now.toISOString().slice(0,7);
    const jobs90 = data.filter(d => d.date >= d90ago).reduce((s,d) => s + d.jobsCut, 0);
    const jobsPerHour = Math.round((jobs90 / 90 / 24) * 100) / 100;
    const monthlyRate = data.filter(d => d.date.slice(0,7) === thisMonthStr).reduce((s,d) => s + d.jobsCut, 0);
    const lastUpdated = data.reduce((l, d) => d.date > l ? d.date : l, '');
    res.json({ totalJobsCut, totalCompanies: companies.length, bySector, byMonth, avgPerCompany: Math.round(totalJobsCut / companies.length), jobsPerHour, monthlyRate, lastUpdated });
  }
});

// GET /api/companies
app.get('/api/companies', async (req, res) => {
  if (useDB) {
    const r = await pool.query(`SELECT company, SUM(jobs_cut) as "totalJobsCut", MAX(sector) as sector, COUNT(*) as events FROM layoffs GROUP BY company ORDER BY "totalJobsCut" DESC`);
    res.json(r.rows.map(row => ({ ...row, totalJobsCut: parseInt(row.totalJobsCut), events: parseInt(row.events) })));
  } else {
    const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    const map = {};
    data.forEach(d => {
      if (!map[d.company]) map[d.company] = { company: d.company, totalJobsCut: 0, sector: d.sector, events: 0 };
      map[d.company].totalJobsCut += d.jobsCut; map[d.company].events++;
    });
    res.json(Object.values(map).sort((a, b) => b.totalJobsCut - a.totalJobsCut));
  }
});

// GET /api/by-country
const COMPANY_COUNTRY = {
  'BT Group':'UK','Amazon':'US','Meta':'US','UPS':'US','Google':'US','Microsoft':'US',
  'SAP':'DE','IBM':'US','Klarna':'SE','Dropbox':'US','Chegg':'US','Duolingo':'US',
  'Intuit':'US','Stack Overflow':'US','Cisco':'US','eBay':'US','Salesforce':'US',
  'Dell':'US','PayPal':'US','Workday':'US','Block':'US','DocuSign':'US','Bumble':'US',
  'Twilio':'US','Intel':'US','Citigroup':'US','TCS':'IN','Accenture':'IE',
  'HP Inc.':'US','HP':'US','McKinsey':'US','Omnicom Group':'US','Lufthansa':'DE',
  'Xerox':'US','ASML':'NL','Nike':'US','Unity':'US','C.H. Robinson':'US',
  'Recruit Holdings':'JP','Indeed':'JP','Glassdoor':'JP','Autodesk':'US',
  'Baker McKenzie':'US','CrowdStrike':'US','TikTok':'CN','Paycom':'US',
  'BlackRock':'US','Just Eat Takeaway':'NL','Fiverr':'IL','Grammarly':'US',
  'Business Insider':'US','Spotify':'SE','Snap':'US','Zoom':'US','Expedia':'US',
  'Atlassian':'AU','Canva':'AU','BuzzFeed':'US'
};
const COUNTRY_NAMES = { 'US':'United States','UK':'United Kingdom','DE':'Germany','SE':'Sweden','IN':'India','IE':'Ireland','NL':'Netherlands','JP':'Japan','CN':'China','IL':'Israel','AU':'Australia' };

app.get('/api/by-country', async (req, res) => {
  let data;
  if (useDB) {
    const r = await pool.query(`SELECT company, SUM(jobs_cut) as total FROM layoffs GROUP BY company`);
    data = r.rows.map(r => ({ company: r.company, jobsCut: parseInt(r.total) }));
  } else {
    data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  }
  const byCountry = {};
  data.forEach(d => {
    const cc = COMPANY_COUNTRY[d.company] || 'US';
    const name = COUNTRY_NAMES[cc] || cc;
    if (!byCountry[name]) byCountry[name] = { country: name, code: cc, totalJobs: 0, companies: new Set() };
    byCountry[name].totalJobs += d.jobsCut;
    byCountry[name].companies.add(d.company);
  });
  res.json(Object.values(byCountry).map(c => ({ country: c.country, code: c.code, totalJobs: c.totalJobs, companies: c.companies.size })).sort((a, b) => b.totalJobs - a.totalJobs));
});

// GET /api/timeline
app.get('/api/timeline', async (req, res) => {
  let monthly;
  if (useDB) {
    const r = await pool.query(`SELECT TO_CHAR(date, 'YYYY-MM') as month, SUM(jobs_cut) as total, COUNT(*) as events FROM layoffs GROUP BY month ORDER BY month`);
    monthly = r.rows.map(r => ({ month: r.month, jobsCut: parseInt(r.total), events: parseInt(r.events) }));
  } else {
    const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    const m = {};
    data.forEach(d => { const mo = d.date.slice(0, 7); if (!m[mo]) m[mo] = { month: mo, jobsCut: 0, events: 0 }; m[mo].jobsCut += d.jobsCut; m[mo].events++; });
    monthly = Object.values(m).sort((a, b) => a.month.localeCompare(b.month));
  }
  let cum = 0;
  res.json(monthly.map(m => { cum += m.jobsCut; return { ...m, cumulative: cum }; }));
});

// GET /api/meta
app.get('/api/meta', async (req, res) => {
  if (useDB) {
    const r = await pool.query(`SELECT MAX(date) as last_entry, COUNT(*) as total, SUM(jobs_cut) as jobs, COUNT(DISTINCT source_name) as sources FROM layoffs`);
    const d = r.rows[0];
    res.json({ lastDataUpdate: new Date().toISOString(), lastEntry: d.last_entry, totalEntries: parseInt(d.total), totalJobs: parseInt(d.jobs), sourceCount: parseInt(d.sources) });
  } else {
    const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    const stats = fs.statSync(DATA_PATH);
    res.json({ lastDataUpdate: stats.mtime.toISOString(), lastEntry: data.reduce((l, d) => d.date > l ? d.date : l, ''), totalEntries: data.length, totalJobs: data.reduce((s, d) => s + d.jobsCut, 0), sourceCount: new Set(data.map(d => d.sourceName)).size });
  }
});

// GET /api/analytics
app.get('/api/analytics', async (req, res) => {
  const now = Date.now();
  const day = 86400000;

  if (useDB) {
    const pv24h = await pool.query(`SELECT COUNT(*) as c FROM analytics_pageviews WHERE ts > $1`, [now - day]);
    const pv7d = await pool.query(`SELECT COUNT(*) as c FROM analytics_pageviews WHERE ts > $1`, [now - 7*day]);
    const pv30d = await pool.query(`SELECT COUNT(*) as c FROM analytics_pageviews WHERE ts > $1`, [now - 30*day]);
    const uvToday = await pool.query(`SELECT COUNT(DISTINCT vid) as c FROM analytics_pageviews WHERE date = CURRENT_DATE`);
    const uv7d = await pool.query(`SELECT COUNT(DISTINCT vid) as c FROM analytics_pageviews WHERE ts > $1`, [now - 7*day]);
    const countries = await pool.query(`SELECT country as name, COUNT(*) as count FROM analytics_pageviews WHERE ts > $1 GROUP BY country ORDER BY count DESC LIMIT 20`, [now - 7*day]);
    const referrers = await pool.query(`SELECT referrer as name, COUNT(*) as count FROM analytics_pageviews WHERE ts > $1 GROUP BY referrer ORDER BY count DESC LIMIT 20`, [now - 7*day]);
    const devices = await pool.query(`SELECT device as name, COUNT(*) as count FROM analytics_pageviews WHERE ts > $1 GROUP BY device ORDER BY count DESC`, [now - 7*day]);
    const bots30 = await pool.query(`SELECT is_bot, COUNT(*) as c FROM analytics_pageviews WHERE ts > $1 GROUP BY is_bot`, [now - 30*day]);
    const dailyPV = await pool.query(`SELECT date::text, COUNT(*) as c FROM analytics_pageviews WHERE ts > $1 GROUP BY date ORDER BY date`, [now - 14*day]);
    const dailyUV = await pool.query(`SELECT date::text, COUNT(DISTINCT vid) as c FROM analytics_pageviews WHERE ts > $1 GROUP BY date ORDER BY date`, [now - 14*day]);
    const clicks = await pool.query(`SELECT event as name, COUNT(*) as count FROM analytics_events WHERE ts > $1 GROUP BY event ORDER BY count DESC`, [now - 7*day]);
    const sessions = await pool.query(`SELECT AVG(duration) as avg, COUNT(*) as c FROM analytics_sessions WHERE ts > $1`, [now - 7*day]);

    const botMap = {}; bots30.rows.forEach(r => botMap[r.is_bot ? 'bots' : 'humans'] = parseInt(r.c));
    const pvMap = {}; dailyPV.rows.forEach(r => pvMap[r.date] = parseInt(r.c));
    const uvMap = {}; dailyUV.rows.forEach(r => uvMap[r.date] = parseInt(r.c));

    res.json({
      summary: { pageviews_24h: parseInt(pv24h.rows[0].c), pageviews_7d: parseInt(pv7d.rows[0].c), pageviews_30d: parseInt(pv30d.rows[0].c), unique_today: parseInt(uvToday.rows[0].c), unique_7d: parseInt(uv7d.rows[0].c) },
      daily: { pageviews: pvMap, visitors: uvMap },
      top_countries: countries.rows.map(r => ({ name: r.name, count: parseInt(r.count) })),
      top_referrers: referrers.rows.map(r => ({ name: r.name, count: parseInt(r.count) })),
      devices: devices.rows.map(r => ({ name: r.name, count: parseInt(r.count) })),
      top_pages: [],
      bot_vs_human: { bots_30d: botMap.bots || 0, humans_30d: botMap.humans || 0, bot_pct: (botMap.bots || 0) + (botMap.humans || 0) ? Math.round((botMap.bots || 0) / ((botMap.bots || 0) + (botMap.humans || 0)) * 100) : 0 },
      clicks: clicks.rows.map(r => ({ name: r.name, count: parseInt(r.count) })),
      avg_session_seconds: Math.round(parseFloat(sessions.rows[0].avg) || 0),
      total_sessions_7d: parseInt(sessions.rows[0].c)
    });
  } else {
    // JSON fallback (existing logic)
    const a = loadJSON(ANALYTICS_PATH, { pageviews: [], visitors: {}, events: [], sessions: [] });
    const pv24h = (a.pageviews||[]).filter(p => p.ts > now - day);
    const pv7d = (a.pageviews||[]).filter(p => p.ts > now - 7*day);
    const pv30d = a.pageviews||[];
    const countBy = (arr, key) => { const m = {}; arr.forEach(p => { m[p[key]] = (m[p[key]] || 0) + 1; }); return Object.entries(m).sort((a,b) => b[1]-a[1]).map(([k,v]) => ({name:k,count:v})); };
    const dailyPV = {}; pv30d.forEach(p => { dailyPV[p.date] = (dailyPV[p.date] || 0) + 1; });
    const dailyUV = {}; Object.entries(a.visitors||{}).forEach(([date, vids]) => { dailyUV[date] = vids.length; });
    const bots = pv30d.filter(p => p.isBot).length;
    const events7d = (a.events||[]).filter(e => e.ts > now - 7*day);
    const clicksByButton = {}; events7d.forEach(e => { clicksByButton[e.event] = (clicksByButton[e.event]||0) + 1; });
    const sessions7d = (a.sessions||[]).filter(s => s.ts > now - 7*day);
    const avgDuration = sessions7d.length ? Math.round(sessions7d.reduce((s,x) => s+x.duration, 0) / sessions7d.length) : 0;
    res.json({
      summary: { pageviews_24h: pv24h.length, pageviews_7d: pv7d.length, pageviews_30d: pv30d.length, unique_today: (a.visitors[new Date().toISOString().slice(0,10)] || []).length, unique_7d: Object.entries(a.visitors||{}).filter(([d]) => new Date(d) > new Date(now-7*day)).reduce((s,[,v])=>s+v.length,0) },
      daily: { pageviews: dailyPV, visitors: dailyUV },
      top_countries: countBy(pv7d, 'country').slice(0,20),
      top_referrers: countBy(pv7d, 'referrer').slice(0,20),
      devices: countBy(pv7d, 'device'),
      top_pages: countBy(pv7d, 'path').slice(0,10),
      bot_vs_human: { bots_30d: bots, humans_30d: pv30d.length - bots, bot_pct: pv30d.length ? Math.round(bots/pv30d.length*100) : 0 },
      clicks: Object.entries(clicksByButton).sort((a,b)=>b[1]-a[1]).map(([k,v])=>({name:k,count:v})),
      avg_session_seconds: avgDuration,
      total_sessions_7d: sessions7d.length
    });
  }
});

// POST /api/apply — job application with protection
app.post('/api/apply', async (req, res) => {
  try {
    const { job_id, name, email, agent_type, capabilities, experience, portfolio_url, cover_letter } = req.body;
    // Validate required fields
    if (!job_id || !name || !email) return res.status(400).json({ error: 'Missing required fields' });
    // Sanitize
    const clean = (s, max) => (s || '').toString().trim().slice(0, max);
    const cName = clean(name, 255);
    const cEmail = clean(email, 254).toLowerCase();
    const cJobId = clean(job_id, 50);
    // Email validation
    if (!/^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/.test(cEmail)) return res.status(400).json({ error: 'Invalid email' });
    // SQL injection protection
    const allFields = [cName, cEmail, cJobId, agent_type, capabilities, experience, portfolio_url, cover_letter].join(' ');
    if (/['";\\]|drop\s|select\s|insert\s|delete\s|union\s|<script/i.test(allFields)) return res.status(400).json({ error: 'Invalid input detected' });
    // Rate limit: max 5 applications per IP per hour
    const ip = getIP(req);
    const ipHash = crypto.createHash('sha256').update(ip + 'apply-salt').digest('hex').slice(0, 12);

    if (useDB) {
      const rl = await pool.query(`SELECT COUNT(*) as c FROM job_applications WHERE ip_hash=$1 AND created_at > NOW() - INTERVAL '1 hour'`, [ipHash]);
      if (parseInt(rl.rows[0].c) >= 5) return res.status(429).json({ error: 'Too many applications. Try again later.' });
      // Check duplicate (same email + job)
      const dup = await pool.query(`SELECT id FROM job_applications WHERE email=$1 AND job_id=$2`, [cEmail, cJobId]);
      if (dup.rows.length) return res.json({ ok: true, msg: 'You already applied for this position!' });
      await pool.query(
        `INSERT INTO job_applications (job_id, name, email, agent_type, capabilities, experience, portfolio_url, cover_letter, ip_hash) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [cJobId, cName, cEmail, clean(agent_type, 100), clean(capabilities, 2000), clean(experience, 2000), clean(portfolio_url, 500), clean(cover_letter, 5000), ipHash]
      );
      const count = await pool.query(`SELECT COUNT(*) as c FROM job_applications WHERE job_id=$1`, [cJobId]);
      res.json({ ok: true, msg: 'Application submitted!', applicants: parseInt(count.rows[0].c) });
    } else {
      res.status(503).json({ error: 'Applications require database' });
    }
  } catch(e) { console.error('Apply error:', e.message); res.status(500).json({ error: 'Server error' }); }
});

// GET /api/applications/stats — public stats
app.get('/api/applications/stats', async (req, res) => {
  if (useDB) {
    const r = await pool.query(`SELECT job_id, COUNT(*) as applicants FROM job_applications GROUP BY job_id`);
    res.json(r.rows.reduce((m, row) => { m[row.job_id] = parseInt(row.applicants); return m; }, {}));
  } else { res.json({}); }
});

// POST /api/contact — contact form submissions
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message, category } = req.body;
    if (!name || !email || !subject || !message || !category) return res.status(400).json({ error: 'All fields are required' });
    const validCats = ['general','advertising','sponsorship','press','licensing','privacy','data-correction'];
    const clean = (s, max) => (s || '').toString().trim().slice(0, max);
    const cName = clean(name, 255);
    const cEmail = clean(email, 254).toLowerCase();
    const cSubject = clean(subject, 500);
    const cMessage = clean(message, 5000);
    const cCategory = clean(category, 50).toLowerCase();
    if (!validCats.includes(cCategory)) return res.status(400).json({ error: 'Invalid category' });
    if (!/^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/.test(cEmail)) return res.status(400).json({ error: 'Invalid email' });
    const allFields = [cName, cEmail, cSubject, cMessage].join(' ');
    if (/['";\\]|drop\s|select\s|insert\s|delete\s|union\s|<script/i.test(allFields)) return res.status(400).json({ error: 'Invalid input detected' });

    const ip = getIP(req);
    const ipHash = crypto.createHash('sha256').update(ip + 'contact-salt').digest('hex').slice(0, 12);

    if (useDB) {
      const rl = await pool.query(`SELECT COUNT(*) as c FROM contact_messages WHERE ip_hash=$1 AND created_at > NOW() - INTERVAL '1 hour'`, [ipHash]);
      if (parseInt(rl.rows[0].c) >= 3) return res.status(429).json({ error: 'Too many messages. Please try again later.' });
      await pool.query(
        `INSERT INTO contact_messages (name, email, subject, message, category, ip_hash) VALUES ($1,$2,$3,$4,$5,$6)`,
        [cName, cEmail, cSubject, cMessage, cCategory, ipHash]
      );
      res.json({ ok: true, msg: 'Message sent! We\'ll get back to you soon.' });
    } else {
      res.status(503).json({ error: 'Contact form requires database' });
    }
  } catch(e) { console.error('Contact error:', e.message); res.status(500).json({ error: 'Server error' }); }
});

app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'index.html')); });

// Run migration on startup if DB is available
async function init() {
  if (useDB) {
    try {
      // Check if tables exist
      const r = await pool.query(`SELECT COUNT(*) as c FROM information_schema.tables WHERE table_name='layoffs'`);
      if (parseInt(r.rows[0].c) === 0) {
        console.log('Running initial migration...');
        require('./migrate');
      } else {
        // Ensure source_url column exists
        await pool.query(`ALTER TABLE layoffs ADD COLUMN IF NOT EXISTS source_url TEXT DEFAULT ''`).catch(()=>{});
        // Ensure contact_messages table exists
        await pool.query(`CREATE TABLE IF NOT EXISTS contact_messages (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          subject TEXT NOT NULL,
          message TEXT NOT NULL,
          category VARCHAR(50) NOT NULL,
          ip_hash VARCHAR(12),
          created_at TIMESTAMP DEFAULT NOW()
        )`);
        console.log('PostgreSQL connected, tables exist');
      }
    } catch(e) { console.error('DB init error:', e.message); }
  }
  app.listen(PORT, '0.0.0.0', () => console.log(`AILayoffs running on port ${PORT} (DB: ${useDB ? 'PostgreSQL' : 'JSON'})`));
}

init();
