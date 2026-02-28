const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

const crypto = require('crypto');
const DATA_PATH = path.join(__dirname, 'data', 'layoffs.json');
const ANALYTICS_PATH = path.join(__dirname, 'data', 'analytics.json');

// --- Analytics Engine ---
function loadAnalytics() {
  try {
    const raw = JSON.parse(fs.readFileSync(ANALYTICS_PATH, 'utf8'));
    return { pageviews: raw.pageviews || [], visitors: raw.visitors || {} };
  } catch(e) { return { pageviews: [], visitors: {} }; }
}
function saveAnalytics(data) {
  fs.writeFileSync(ANALYTICS_PATH, JSON.stringify(data));
}
function hashIP(ip) {
  return crypto.createHash('sha256').update(ip + 'ailayoffs-salt').digest('hex').slice(0, 12);
}
function parseUA(ua) {
  if (!ua) return 'unknown';
  if (/mobile|android|iphone|ipad/i.test(ua)) return 'mobile';
  return 'desktop';
}
const geoip = require('geoip-lite');
function getCountry(req) {
  if (req.headers['cf-ipcountry']) return req.headers['cf-ipcountry'];
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
  const geo = geoip.lookup(ip);
  return geo?.country || 'unknown';
}

function loadData() {
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
}

// Analytics middleware — track page views (skip API/static)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.match(/\.(js|css|png|jpg|svg|ico|woff)$/)) return next();
  try {
    const analytics = loadAnalytics();
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
    const vid = hashIP(ip);
    const today = new Date().toISOString().slice(0, 10);
    analytics.pageviews.push({
      path: req.path,
      vid,
      country: getCountry(req),
      device: parseUA(req.headers['user-agent']),
      referrer: req.headers['referer'] || 'direct',
      ts: Date.now(),
      date: today
    });
    // Track unique visitors per day
    if (!analytics.visitors[today]) analytics.visitors[today] = [];
    if (!analytics.visitors[today].includes(vid)) analytics.visitors[today].push(vid);
    // Keep only last 30 days of pageviews
    const cutoff = Date.now() - 30 * 86400000;
    analytics.pageviews = analytics.pageviews.filter(p => p.ts > cutoff);
    saveAnalytics(analytics);
  } catch(e) { /* don't break the site */ }
  next();
});

app.use(express.static('public'));

// GET /api/layoffs
app.get('/api/layoffs', (req, res) => {
  let data = loadData();
  const { sector, company, from, to } = req.query;
  if (sector) data = data.filter(d => d.sector.toLowerCase() === sector.toLowerCase());
  if (company) data = data.filter(d => d.company.toLowerCase().includes(company.toLowerCase()));
  if (from) data = data.filter(d => d.date >= from);
  if (to) data = data.filter(d => d.date <= to);
  data.sort((a, b) => b.jobsCut - a.jobsCut);
  res.json(data);
});

// GET /api/stats
app.get('/api/stats', (req, res) => {
  const data = loadData();
  const totalJobsCut = data.reduce((s, d) => s + d.jobsCut, 0);
  const companies = [...new Set(data.map(d => d.company))];
  const totalCompanies = companies.length;
  const avgPerCompany = Math.round(totalJobsCut / totalCompanies);

  const bySector = {};
  data.forEach(d => { bySector[d.sector] = (bySector[d.sector] || 0) + d.jobsCut; });

  const byMonthMap = {};
  data.forEach(d => {
    const m = d.date.slice(0, 7);
    byMonthMap[m] = (byMonthMap[m] || 0) + d.jobsCut;
  });
  const byMonth = Object.entries(byMonthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, jobsCut]) => ({ month, jobsCut }));

  res.json({ totalJobsCut, totalCompanies, bySector, byMonth, avgPerCompany });
});

// GET /api/companies
app.get('/api/companies', (req, res) => {
  const data = loadData();
  const map = {};
  data.forEach(d => {
    if (!map[d.company]) map[d.company] = { company: d.company, totalJobsCut: 0, sector: d.sector, events: 0 };
    map[d.company].totalJobsCut += d.jobsCut;
    map[d.company].events++;
  });
  res.json(Object.values(map).sort((a, b) => b.totalJobsCut - a.totalJobsCut));
});

// GET /api/analytics — our own analytics dashboard
app.get('/api/analytics', (req, res) => {
  const a = loadAnalytics();
  const now = Date.now();
  const day = 86400000;
  const pv24h = a.pageviews.filter(p => p.ts > now - day);
  const pv7d = a.pageviews.filter(p => p.ts > now - 7*day);
  const pv30d = a.pageviews;

  const countBy = (arr, key) => {
    const m = {};
    arr.forEach(p => { m[p[key]] = (m[p[key]] || 0) + 1; });
    return Object.entries(m).sort((a,b) => b[1]-a[1]).map(([k,v]) => ({name:k,count:v}));
  };

  const dailyPV = {};
  pv30d.forEach(p => { dailyPV[p.date] = (dailyPV[p.date] || 0) + 1; });

  const dailyUV = {};
  Object.entries(a.visitors).forEach(([date, vids]) => { dailyUV[date] = vids.length; });

  res.json({
    summary: {
      pageviews_24h: pv24h.length,
      pageviews_7d: pv7d.length,
      pageviews_30d: pv30d.length,
      unique_today: (a.visitors[new Date().toISOString().slice(0,10)] || []).length,
      unique_7d: Object.entries(a.visitors).filter(([d]) => new Date(d) > new Date(now-7*day)).reduce((s,[,v])=>s+v.length,0),
    },
    daily: { pageviews: dailyPV, visitors: dailyUV },
    top_countries: countBy(pv7d, 'country').slice(0,20),
    top_referrers: countBy(pv7d, 'referrer').slice(0,20),
    devices: countBy(pv7d, 'device'),
    top_pages: countBy(pv7d, 'path').slice(0,10),
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`AILayoffs running on port ${PORT}`);
});
