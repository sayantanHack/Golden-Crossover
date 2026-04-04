// GitHub Action script — runs on server, sends notifications via ntfy.sh
const axios = require('axios');
const fs    = require('fs');

const STOCKS = [
  'RELIANCE.NS','TCS.NS','HDFCBANK.NS','INFY.NS','ICICIBANK.NS',
  'HINDUNILVR.NS','ITC.NS','SBIN.NS','BHARTIARTL.NS','KOTAKBANK.NS',
  'LT.NS','BAJFINANCE.NS','HCLTECH.NS','ASIANPAINT.NS','AXISBANK.NS',
  'MARUTI.NS','TITAN.NS','WIPRO.NS','SUNPHARMA.NS','ULTRACEMCO.NS',
  // ... add all 50
];

const LOG_FILE = 'crossover-log.json';

async function fetchMA(symbol) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1y`;
    const res = await axios.get(url, { 
      timeout: 8000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const chart = res.data?.chart?.result?.[0];
    if (!chart) return null;

    const closes = chart.indicators?.quote?.[0]?.close?.filter(c => c != null) ?? [];
    const meta   = chart.meta;

    if (closes.length < 205) return null;

    const calcMA = (arr, n) => arr.slice(-n).reduce((a,b)=>a+b,0)/n;
    const ma50   = calcMA(closes, 50);
    const ma200  = calcMA(closes, 200);
    const ma50p  = calcMA(closes.slice(0,-1), 50);
    const ma200p = calcMA(closes.slice(0,-1), 200);
    const price  = meta.regularMarketPrice || closes[closes.length-1];

    const isGoldenNow  = ma50  > ma200;
    const wasGoldenPrev = ma50p > ma200p;
    const isNewGolden  = !wasGoldenPrev && isGoldenNow;

    return { symbol, price, ma50, ma200, isNewGolden, isGolden: isGoldenNow };
  } catch(e) {
    return null;
  }
}

async function run() {
  console.log('🔍 Checking crossovers...');
  
  // Load previous log
  let prevLog = {};
  if (fs.existsSync(LOG_FILE)) {
    try { prevLog = JSON.parse(fs.readFileSync(LOG_FILE,'utf8')); } catch(e){}
  }

  const results = [];
  for (const sym of STOCKS) {
    const data = await fetchMA(sym);
    if (data) results.push(data);
    await new Promise(r => setTimeout(r, 300)); // Rate limit
  }

  const newCrossovers = results.filter(r => {
    if (!r.isNewGolden) return false;
    const today = new Date().toDateString();
    return prevLog[r.symbol] !== today;
  });

  // Save log
  const newLog = { ...prevLog };
  newCrossovers.forEach(r => {
    newLog[r.symbol] = new Date().toDateString();
  });
  fs.writeFileSync(LOG_FILE, JSON.stringify(newLog, null, 2));
  fs.writeFileSync('public/crossover-data.json', JSON.stringify({
    updated: new Date().toISOString(),
    stocks: results,
    newCrossovers
  }, null, 2));

  // ── SEND FREE PUSH NOTIFICATIONS via ntfy.sh ──
  const topic = process.env.NTFY_TOPIC || 'nifty50-golden-cross-yourname';
  
  for (const r of newCrossovers) {
    const name = r.symbol.replace('.NS','');
    const msg = `🥇 GOLDEN CROSSOVER: ${name}\n💰 Price: ₹${r.price?.toFixed(2)}\n📊 50MA: ₹${r.ma50?.toFixed(2)} > 200MA: ₹${r.ma200?.toFixed(2)}\n📅 ${new Date().toLocaleDateString('en-IN')}`;
    
    try {
      await axios.post(`https://ntfy.sh/${topic}`, msg, {
        headers: {
          'Title': `🥇 ${name} Golden Crossover!`,
          'Priority': 'high',
          'Tags': 'chart_increasing,moneybag',
        }
      });
      console.log(`✅ Notified: ${name}`);
    } catch(e) {
      console.warn(`Failed to notify ${name}:`, e.message);
    }
  }

  console.log(`✅ Done. ${results.length} stocks checked. ${newCrossovers.length} new crossovers.`);
  if (newCrossovers.length > 0) {
    console.log('🥇 New Crossovers:', newCrossovers.map(r=>r.symbol));
  }
}

run();