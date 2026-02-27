const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

const DATA_PATH = path.join(__dirname, 'data', 'layoffs.json');

function loadData() {
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
}

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

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`AILayoffs running on port ${PORT}`);
});
