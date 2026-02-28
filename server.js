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
    const ua = req.headers['user-agent'] || '';
    const isBot = /bot|crawler|spider|scraper|curl|wget|python|go-http|node-fetch|chatgpt|gpt|anthropic|claude|perplexity|bytespider|semrush|ahrefs/i.test(ua);
    analytics.pageviews.push({
      path: req.path,
      vid,
      country: getCountry(req),
      device: parseUA(ua),
      referrer: req.headers['referer'] || 'direct',
      isBot,
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

app.use(express.json());
app.use(express.static('public'));

// POST /api/track — client-side event tracking
app.post('/api/track', (req, res) => {
  try {
    const { event, data, vid, duration } = req.body;
    if (!event) return res.status(400).json({error:'missing event'});
    const analytics = loadAnalytics();
    if (!analytics.events) analytics.events = [];
    if (!analytics.sessions) analytics.sessions = [];
    
    if (event === 'session_end' && vid && duration) {
      analytics.sessions.push({ vid, duration, date: new Date().toISOString().slice(0,10), ts: Date.now() });
      // Keep last 30 days
      const cutoff = Date.now() - 30*86400000;
      analytics.sessions = analytics.sessions.filter(s => s.ts > cutoff);
    } else {
      analytics.events.push({ event, data: data||{}, vid: vid||'anon', date: new Date().toISOString().slice(0,10), ts: Date.now() });
      const cutoff = Date.now() - 30*86400000;
      analytics.events = analytics.events.filter(e => e.ts > cutoff);
    }
    saveAnalytics(analytics);
    res.json({ok:true});
  } catch(e) { res.json({ok:true}); }
});

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

  // Bot detection
  const bots = pv30d.filter(p => p.isBot).length;
  const humans = pv30d.length - bots;

  // Events (clicks)
  const events = a.events || [];
  const events7d = events.filter(e => e.ts > now - 7*day);
  const clicksByButton = {};
  events7d.forEach(e => { clicksByButton[e.event] = (clicksByButton[e.event]||0) + 1; });

  // Session duration
  const sessions = a.sessions || [];
  const sessions7d = sessions.filter(s => s.ts > now - 7*day);
  const avgDuration = sessions7d.length ? Math.round(sessions7d.reduce((s,x) => s+x.duration, 0) / sessions7d.length) : 0;

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
    bot_vs_human: { bots_30d: bots, humans_30d: humans, bot_pct: pv30d.length ? Math.round(bots/pv30d.length*100) : 0 },
    clicks: Object.entries(clicksByButton).sort((a,b)=>b[1]-a[1]).map(([k,v])=>({name:k,count:v})),
    avg_session_seconds: avgDuration,
    total_sessions_7d: sessions7d.length,
  });
});

// GET /api/by-country — jobs by country
app.get('/api/by-country', (req, res) => {
  const data = loadData();
  const companyCountry = {
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
  const countryNames = {
    'US':'United States','UK':'United Kingdom','DE':'Germany','SE':'Sweden','IN':'India',
    'IE':'Ireland','NL':'Netherlands','JP':'Japan','CN':'China','IL':'Israel','AU':'Australia'
  };
  const byCountry = {};
  data.forEach(d => {
    const cc = companyCountry[d.company] || 'US';
    const name = countryNames[cc] || cc;
    if (!byCountry[name]) byCountry[name] = { country: name, code: cc, totalJobs: 0, companies: 0, companySet: new Set() };
    byCountry[name].totalJobs += d.jobsCut;
    byCountry[name].companySet.add(d.company);
  });
  const result = Object.values(byCountry).map(c => ({ country: c.country, code: c.code, totalJobs: c.totalJobs, companies: c.companySet.size }));
  result.sort((a, b) => b.totalJobs - a.totalJobs);
  res.json(result);
});

// GET /api/timeline — monthly timeline
app.get('/api/timeline', (req, res) => {
  const data = loadData();
  const monthly = {};
  data.forEach(d => {
    const m = d.date.slice(0, 7);
    if (!monthly[m]) monthly[m] = { month: m, jobsCut: 0, events: 0 };
    monthly[m].jobsCut += d.jobsCut;
    monthly[m].events++;
  });
  let cumulative = 0;
  const result = Object.values(monthly).sort((a, b) => a.month.localeCompare(b.month)).map(m => {
    cumulative += m.jobsCut;
    return { ...m, cumulative };
  });
  res.json(result);
});

// GET /api/meta — site metadata
app.get('/api/meta', (req, res) => {
  const data = loadData();
  const lastEntry = data.reduce((latest, d) => d.date > latest ? d.date : latest, '2000-01-01');
  const stats = fs.statSync(DATA_PATH);
  res.json({
    lastDataUpdate: stats.mtime.toISOString(),
    lastEntry,
    totalEntries: data.length,
    totalJobs: data.reduce((s, d) => s + d.jobsCut, 0),
    sourceCount: new Set(data.map(d => d.sourceName)).size
  });
});

// POST /api/subscribe — newsletter signup with protection
const SUBS_PATH = path.join(__dirname, 'data', 'subscribers.json');
function loadSubs() {
  try { return JSON.parse(fs.readFileSync(SUBS_PATH, 'utf8')); }
  catch { return { emails: [], rateLimit: {} }; }
}
function saveSubs(data) { fs.writeFileSync(SUBS_PATH, JSON.stringify(data, null, 2)); }

app.post('/api/subscribe', (req, res) => {
  try {
    const { email } = req.body;
    // Validate email format strictly
    if (!email || typeof email !== 'string') return res.status(400).json({error:'Email required'});
    const clean = email.trim().toLowerCase().slice(0, 254);
    if (!/^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/.test(clean)) return res.status(400).json({error:'Invalid email'});
    // Block SQL injection patterns
    if (/['";\\<>{}()=]|drop |select |insert |delete |union |script/i.test(clean)) return res.status(400).json({error:'Invalid input'});
    
    // Rate limit: max 3 per IP per hour
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
    const ipHash = crypto.createHash('sha256').update(ip + 'sub-salt').digest('hex').slice(0, 12);
    const subs = loadSubs();
    const now = Date.now();
    if (!subs.rateLimit) subs.rateLimit = {};
    const rl = subs.rateLimit[ipHash] || [];
    const recent = rl.filter(t => t > now - 3600000);
    if (recent.length >= 3) return res.status(429).json({error:'Too many requests. Try again later.'});
    
    // Check duplicate
    if (subs.emails.find(e => e.email === clean)) return res.json({ok:true, msg:'Already subscribed!'});
    
    // Save
    subs.emails.push({ email: clean, date: new Date().toISOString(), ipHash });
    subs.rateLimit[ipHash] = [...recent, now];
    // Clean old rate limit entries
    Object.keys(subs.rateLimit).forEach(k => {
      subs.rateLimit[k] = subs.rateLimit[k].filter(t => t > now - 3600000);
      if (!subs.rateLimit[k].length) delete subs.rateLimit[k];
    });
    saveSubs(subs);
    res.json({ok:true, msg:'Subscribed!', total: subs.emails.length});
  } catch(e) { res.status(500).json({error:'Server error'}); }
});

// GET /api/subscribers/count
app.get('/api/subscribers/count', (req, res) => {
  const subs = loadSubs();
  res.json({ count: subs.emails.length });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`AILayoffs running on port ${PORT}`);
});
