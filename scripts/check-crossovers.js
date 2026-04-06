// ================================================================
//  CHECK-CROSSOVERS.JS — VERIFIED WORKING VERSION
//  Runs inside GitHub Actions
//  Node.js 20 compatible
// ================================================================

'use strict';

// Node.js built-in modules — no install needed
const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');

// ── Try to load axios, fall back to built-in https ──────────────
let axios;
try {
  axios = require('axios');
  console.log('✅ axios loaded successfully');
} catch(e) {
  console.log('⚠️  axios not found, using built-in https module');
  axios = null;
}

// ── ALL 50 NIFTY STOCKS ─────────────────────────────────────────
const NIFTY50 = [
  { symbol: 'RELIANCE.NS',   name: 'Reliance Industries', sector: 'Energy'       },
  { symbol: 'TCS.NS',        name: 'TCS',                 sector: 'IT'           },
  { symbol: 'HDFCBANK.NS',   name: 'HDFC Bank',           sector: 'Banking'      },
  { symbol: 'INFY.NS',       name: 'Infosys',             sector: 'IT'           },
  { symbol: 'ICICIBANK.NS',  name: 'ICICI Bank',          sector: 'Banking'      },
  { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever',  sector: 'FMCG'         },
  { symbol: 'ITC.NS',        name: 'ITC',                 sector: 'FMCG'         },
  { symbol: 'SBIN.NS',       name: 'State Bank of India', sector: 'Banking'      },
  { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel',       sector: 'Telecom'      },
  { symbol: 'KOTAKBANK.NS',  name: 'Kotak Mahindra Bank', sector: 'Banking'      },
  { symbol: 'LT.NS',         name: 'Larsen and Toubro',   sector: 'Infra'        },
  { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance',       sector: 'Finance'      },
  { symbol: 'HCLTECH.NS',    name: 'HCL Technologies',    sector: 'IT'           },
  { symbol: 'ASIANPAINT.NS', name: 'Asian Paints',        sector: 'Paints'       },
  { symbol: 'AXISBANK.NS',   name: 'Axis Bank',           sector: 'Banking'      },
  { symbol: 'MARUTI.NS',     name: 'Maruti Suzuki',       sector: 'Auto'         },
  { symbol: 'TITAN.NS',      name: 'Titan Company',       sector: 'Consumer'     },
  { symbol: 'WIPRO.NS',      name: 'Wipro',               sector: 'IT'           },
  { symbol: 'SUNPHARMA.NS',  name: 'Sun Pharma',          sector: 'Pharma'       },
  { symbol: 'ULTRACEMCO.NS', name: 'UltraTech Cement',    sector: 'Cement'       },
  { symbol: 'NESTLEIND.NS',  name: 'Nestle India',        sector: 'FMCG'         },
  { symbol: 'POWERGRID.NS',  name: 'Power Grid',          sector: 'Power'        },
  { symbol: 'NTPC.NS',       name: 'NTPC',                sector: 'Power'        },
  { symbol: 'TECHM.NS',      name: 'Tech Mahindra',       sector: 'IT'           },
  { symbol: 'ONGC.NS',       name: 'ONGC',                sector: 'Energy'       },
  { symbol: 'JSWSTEEL.NS',   name: 'JSW Steel',           sector: 'Metal'        },
  { symbol: 'TATAMOTORS.NS', name: 'Tata Motors',         sector: 'Auto'         },
  { symbol: 'ADANIPORTS.NS', name: 'Adani Ports',         sector: 'Logistics'    },
  { symbol: 'HINDALCO.NS',   name: 'Hindalco Industries', sector: 'Metal'        },
  { symbol: 'COALINDIA.NS',  name: 'Coal India',          sector: 'Mining'       },
  { symbol: 'BPCL.NS',       name: 'BPCL',                sector: 'Energy'       },
  { symbol: 'TATASTEEL.NS',  name: 'Tata Steel',          sector: 'Metal'        },
  { symbol: 'GRASIM.NS',     name: 'Grasim Industries',   sector: 'Cement'       },
  { symbol: 'CIPLA.NS',      name: 'Cipla',               sector: 'Pharma'       },
  { symbol: 'EICHERMOT.NS',  name: 'Eicher Motors',       sector: 'Auto'         },
  { symbol: 'DRREDDY.NS',    name: 'Dr Reddys Labs',      sector: 'Pharma'       },
  { symbol: 'BAJAJ-AUTO.NS', name: 'Bajaj Auto',          sector: 'Auto'         },
  { symbol: 'HEROMOTOCO.NS', name: 'Hero MotoCorp',       sector: 'Auto'         },
  { symbol: 'INDUSINDBK.NS', name: 'IndusInd Bank',       sector: 'Banking'      },
  { symbol: 'BRITANNIA.NS',  name: 'Britannia Industries',sector: 'FMCG'         },
  { symbol: 'APOLLOHOSP.NS', name: 'Apollo Hospitals',    sector: 'Healthcare'   },
  { symbol: 'DIVISLAB.NS',   name: 'Divis Laboratories',  sector: 'Pharma'       },
  { symbol: 'BAJAJFINSV.NS', name: 'Bajaj Finserv',       sector: 'Finance'      },
  { symbol: 'TATACONSUM.NS', name: 'Tata Consumer Prod',  sector: 'FMCG'         },
  { symbol: 'HDFCLIFE.NS',   name: 'HDFC Life Insurance', sector: 'Insurance'    },
  { symbol: 'SBILIFE.NS',    name: 'SBI Life Insurance',  sector: 'Insurance'    },
  { symbol: 'ADANIENT.NS',   name: 'Adani Enterprises',   sector: 'Conglomerate' },
  { symbol: 'M&M.NS',        name: 'Mahindra and Mahindra',sector: 'Auto'        },
  { symbol: 'SHREECEM.NS',   name: 'Shree Cement',        sector: 'Cement'       },
  { symbol: 'BEL.NS',        name: 'Bharat Electronics',  sector: 'Defence'      },
];

// ── CONFIG ──────────────────────────────────────────────────────
const CFG = {
  MA_SHORT:   50,
  MA_LONG:    200,
  LOG_FILE:   path.join(process.cwd(), 'crossover-log.json'),
  DATA_FILE:  path.join(process.cwd(), 'public', 'crossover-data.json'),
  NTFY_URL:   'https://ntfy.sh',
  YAHOO_HOST: 'query1.finance.yahoo.com',
  DELAY_MS:   600,
  TIMEOUT_MS: 15000,
};

// ── UTILITY FUNCTIONS ────────────────────────────────────────────

const sleep = ms => new Promise(r => setTimeout(r, ms));

function calcSMA(arr, period) {
  if (!arr || arr.length < period) return null;
  const slice = arr.slice(arr.length - period);
  const sum   = slice.reduce((a, b) => a + b, 0);
  return sum / period;
}

function fmtPrice(n) {
  if (n == null || isNaN(n)) return '--';
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(n);
}

function fmtDate(ts) {
  const d = new Date(ts * 1000);
  return d.toLocaleDateString('en-IN', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric'
  });
}

function getIST() {
  const now = new Date();
  const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  return {
    dateStr:     ist.toISOString().split('T')[0],
    displayStr:  ist.toUTCString().replace('GMT','IST'),
    hour:        ist.getUTCHours(),
    minute:      ist.getUTCMinutes(),
  };
}

// ── HTTPS FETCH (built-in fallback, no axios needed) ────────────
function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj  = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path:     urlObj.pathname + urlObj.search,
      method:   'GET',
      headers: {
        'User-Agent':      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        'Accept':          'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        ...headers,
      },
      timeout: CFG.TIMEOUT_MS,
    };

    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch(e) {
          reject(new Error(`JSON parse failed: ${e.message}`));
        }
      });
    });

    req.on('error',   err => reject(err));
    req.on('timeout', ()  => { req.destroy(); reject(new Error('Request timeout')); });
    req.end();
  });
}

// ── POST to ntfy.sh (built-in https) ────────────────────────────
function httpsPost(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj  = new URL(url);
    const data    = Buffer.from(body, 'utf8');
    const options = {
      hostname: urlObj.hostname,
      path:     urlObj.pathname,
      method:   'POST',
      headers: {
        'Content-Type':   'text/plain',
        'Content-Length': data.length,
        ...headers,
      },
      timeout: 10000,
    };

    const req = https.request(options, res => {
      let resp = '';
      res.on('data', chunk => resp += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: resp }));
    });

    req.on('error',   err => reject(err));
    req.on('timeout', ()  => { req.destroy(); reject(new Error('ntfy timeout')); });
    req.write(data);
    req.end();
  });
}

// ── FETCH YAHOO FINANCE DATA ─────────────────────────────────────
async function fetchYahoo(symbol, attempt = 1) {
  // Try query1 first, then query2 as fallback
  const host  = attempt <= 2
    ? 'query1.finance.yahoo.com'
    : 'query2.finance.yahoo.com';
  const url   = `https://${host}/v8/finance/chart/${symbol}?interval=1d&range=2y`;

  try {
    let result;

    if (axios) {
      // Use axios if available
      const res = await axios.get(url, {
        timeout: CFG.TIMEOUT_MS,
        headers: {
          'User-Agent':  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
          'Accept':      'application/json',
          'Referer':     'https://finance.yahoo.com/',
        }
      });
      result = res.data;
    } else {
      // Fall back to built-in https
      const res = await httpsGet(url);
      result    = res.data;
    }

    const chart = result?.chart?.result?.[0];
    if (!chart) throw new Error('Empty chart result');
    return chart;

  } catch(err) {
    if (attempt < 3) {
      console.log(`    ↩️  Retry ${attempt + 1}/3 for ${symbol}...`);
      await sleep(2000 * attempt);
      return fetchYahoo(symbol, attempt + 1);
    }
    throw err;
  }
}

// ── PROCESS ONE STOCK ────────────────────────────────────────────
async function processStock(stock) {
  try {
    const chart      = await fetchYahoo(stock.symbol);
    const meta       = chart.meta;
    const timestamps = chart.timestamp ?? [];
    const rawCloses  = chart.indicators?.quote?.[0]?.close ?? [];

    // Clean: remove null/undefined values
    const clean = rawCloses
      .map((c, i) => ({ c, t: timestamps[i] }))
      .filter(d => d.c != null && !isNaN(d.c) && d.t != null);

    if (clean.length < CFG.MA_LONG + 5) {
      console.log(`  ⚠️  ${stock.symbol}: Only ${clean.length} data points (need ${CFG.MA_LONG + 5})`);
      return null;
    }

    const closes = clean.map(d => d.c);
    const times  = clean.map(d => d.t);
    const len    = closes.length;

    // ── Calculate MAs ──────────────────────────────────────────
    const ma50now  = calcSMA(closes,                 CFG.MA_SHORT);
    const ma200now = calcSMA(closes,                 CFG.MA_LONG);
    const ma50pre  = calcSMA(closes.slice(0, len-1), CFG.MA_SHORT);
    const ma200pre = calcSMA(closes.slice(0, len-1), CFG.MA_LONG);

    if (!ma50now || !ma200now || !ma50pre || !ma200pre) return null;

    // ── Current price ──────────────────────────────────────────
    const price     = meta.regularMarketPrice || closes[len - 1];
    const prevClose = closes[len - 2] || price;
    const changePct = ((price - prevClose) / prevClose * 100);

    // ── Crossover detection ────────────────────────────────────
    // Golden: yesterday 50MA was below 200MA, today 50MA is above 200MA
    const isGoldenToday = (ma50pre  <  ma200pre) && (ma50now  >  ma200now);
    // Death:  yesterday 50MA was above 200MA, today 50MA is below 200MA
    const isDeathToday  = (ma50pre  >  ma200pre) && (ma50now  <  ma200now);
    // Current position
    const isBullish     = ma50now   >  ma200now;
    const maGapPct      = ((ma50now - ma200now) / ma200now * 100);

    // ── Scan last 45 days for most recent crossover ────────────
    let xDate    = null;
    let xType    = null;
    let xDaysAgo = null;

    for (let i = len - 1; i >= Math.max(1, len - 45); i--) {
      const c50  = calcSMA(closes.slice(0, i + 1), CFG.MA_SHORT);
      const c200 = calcSMA(closes.slice(0, i + 1), CFG.MA_LONG);
      const p50  = calcSMA(closes.slice(0, i),     CFG.MA_SHORT);
      const p200 = calcSMA(closes.slice(0, i),     CFG.MA_LONG);

      if (!c50 || !c200 || !p50 || !p200) continue;

      if (p50 <= p200 && c50 > c200) {
        xType    = 'golden';
        xDate    = fmtDate(times[i]);
        xDaysAgo = Math.round((Date.now() - times[i] * 1000) / 86400000);
        break;
      }
      if (p50 >= p200 && c50 < c200) {
        xType    = 'death';
        xDate    = fmtDate(times[i]);
        xDaysAgo = Math.round((Date.now() - times[i] * 1000) / 86400000);
        break;
      }
    }

    // ── Trend label ────────────────────────────────────────────
    let trend;
    if      (isGoldenToday)                             trend = '🥇 GOLDEN CROSS — TODAY!';
    else if (xType === 'golden' && xDaysAgo <= 3)       trend = `🥇 Golden Cross (${xDaysAgo}d ago)`;
    else if (xType === 'golden' && xDaysAgo <= 10)      trend = `🥇 Golden Cross (${xDaysAgo}d ago)`;
    else if (xType === 'golden' && xDaysAgo <= 30)      trend = `📈 Post Golden (${xDaysAgo}d ago)`;
    else if (isBullish && maGapPct > 3)                 trend = '🚀 Strong Bullish';
    else if (isBullish && maGapPct > 0)                 trend = '📈 Bullish';
    else if (isDeathToday)                              trend = '💀 DEATH CROSS — TODAY!';
    else if (xType === 'death' && xDaysAgo <= 30)       trend = `💀 Death Cross (${xDaysAgo}d ago)`;
    else if (!isBullish && Math.abs(maGapPct) < 0.5)   trend = '👀 Watch Zone';
    else if (!isBullish)                                trend = '🔻 Bearish';
    else                                                trend = '➡️  Neutral';

    console.log(`  ✅ ${stock.symbol.padEnd(18)} ₹${fmtPrice(price).padStart(10)} | 50MA: ${fmtPrice(ma50now).padStart(10)} | 200MA: ${fmtPrice(ma200now).padStart(10)} | ${trend}`);

    return {
      symbol:        stock.symbol,
      name:          stock.name,
      sector:        stock.sector,
      price:         parseFloat(price.toFixed(2)),
      priceChangePct:parseFloat(changePct.toFixed(2)),
      ma50:          parseFloat(ma50now.toFixed(2)),
      ma200:         parseFloat(ma200now.toFixed(2)),
      maGapPct:      parseFloat(maGapPct.toFixed(3)),
      crossDate:     xDate    || 'No recent crossover',
      crossType:     xType    || 'none',
      crossDaysAgo:  xDaysAgo || null,
      trend,
      isGoldenToday,
      isDeathToday,
      isBullish,
    };

  } catch(err) {
    console.log(`  ❌ ${stock.symbol}: ${err.message}`);
    return null;
  }
}

// ── SEND NTFY NOTIFICATION ───────────────────────────────────────
async function notify(stock, type) {
  const topic = process.env.NTFY_TOPIC;
  if (!topic || topic.trim() === '') {
    console.log('  ⚠️  NTFY_TOPIC secret not set — skipping notification');
    return;
  }

  const ist     = getIST();
  const isGold  = type === 'golden';
  const title   = isGold
    ? `🥇 Golden Crossover: ${stock.name}`
    : `💀 Death Cross Alert: ${stock.name}`;

  const body = [
    `📊 Stock: ${stock.name}`,
    `🔖 Symbol: ${stock.symbol.replace('.NS','')} (NSE)`,
    `💰 Price: ₹${fmtPrice(stock.price)} (${stock.priceChangePct >= 0 ? '+' : ''}${stock.priceChangePct}%)`,
    `📅 Crossover Date: ${stock.crossDate}`,
    ``,
    `📈 50-Day MA  : ₹${fmtPrice(stock.ma50)}`,
    `📉 200-Day MA : ₹${fmtPrice(stock.ma200)}`,
    `📊 MA Gap     : ${stock.maGapPct > 0 ? '+' : ''}${stock.maGapPct}%`,
    ``,
    `🏭 Sector: ${stock.sector}`,
    `📌 Status: ${stock.trend}`,
    `⏰ Time: ${ist.displayStr}`,
  ].join('\n');

  try {
    const res = await httpsPost(
      `${CFG.NTFY_URL}/${topic.trim()}`,
      body,
      {
        'Title':    title,
        'Priority': isGold ? 'urgent' : 'high',
        'Tags':     isGold ? 'chart_increasing,trophy,moneybag' : 'chart_decreasing,skull',
      }
    );
    console.log(`  📱 Notification sent — HTTP ${res.status}`);
  } catch(err) {
    console.error(`  ❌ Notification failed: ${err.message}`);
  }
}

// ── LOAD JSON LOG ────────────────────────────────────────────────
function loadLog() {
  try {
    if (fs.existsSync(CFG.LOG_FILE)) {
      return JSON.parse(fs.readFileSync(CFG.LOG_FILE, 'utf8'));
    }
  } catch(e) { /* empty */ }
  return {};
}

// ── SAVE JSON LOG ────────────────────────────────────────────────
function saveLog(log) {
  try {
    fs.writeFileSync(CFG.LOG_FILE, JSON.stringify(log, null, 2), 'utf8');
  } catch(e) {
    console.error('Log save error:', e.message);
  }
}

// ── SAVE PUBLIC DATA FILE (website reads this) ───────────────────
function savePublic(results) {
  try {
    const dir = path.dirname(CFG.DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const ist = getIST();
    const out = {
      updatedUTC: new Date().toISOString(),
      updatedIST: ist.displayStr,
      count:      results.length,
      summary: {
        golden:  results.filter(r => r.crossType === 'golden').length,
        death:   results.filter(r => r.crossType === 'death').length,
        bullish: results.filter(r => r.isBullish).length,
        watch:   results.filter(r => Math.abs(r.maGapPct) < 0.5).length,
        newToday:results.filter(r => r.isGoldenToday).length,
      },
      stocks: results,
    };
    fs.writeFileSync(CFG.DATA_FILE, JSON.stringify(out, null, 2), 'utf8');
    console.log(`💾 Public data saved → ${CFG.DATA_FILE}`);
  } catch(e) {
    console.error('Public data save error:', e.message);
  }
}

// ── MAIN ─────────────────────────────────────────────────────────
async function main() {
  const ist = getIST();

  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  🥇  NIFTY 50 GOLDEN CROSSOVER CHECKER');
  console.log(`  📅  Date : ${ist.dateStr}`);
  console.log(`  ⏰  Time : ${ist.displayStr}`);
  console.log(`  🔧  Node : ${process.version}`);
  console.log(`  📦  axios: ${axios ? 'available' : 'using built-in https'}`);
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  // Load stored log (prevents duplicate notifications)
  const log = loadLog();
  console.log(`📋 Log entries loaded: ${Object.keys(log).length}`);

  const forceNotify = process.env.FORCE_NOTIFY === 'true';
  if (forceNotify) console.log('⚡ FORCE_NOTIFY is ON — will send test notifications');

  console.log('');
  console.log('─── FETCHING DATA ──────────────────────────────────────');

  // Process all stocks with delay between each
  const results = [];
  for (let i = 0; i < NIFTY50.length; i++) {
    const stock = NIFTY50[i];
    process.stdout.write(`[${String(i+1).padStart(2)}/${NIFTY50.length}] `);
    const data = await processStock(stock);
    if (data) results.push(data);
    if (i < NIFTY50.length - 1) await sleep(CFG.DELAY_MS);
  }

  console.log('');
  console.log(`─── RESULTS ────────────────────────────────────────────`);
  console.log(`✅ Fetched: ${results.length}/${NIFTY50.length} stocks`);

  // ── Detect new crossovers ──────────────────────────────────
  const newGolden = [];
  const newDeath  = [];

  for (const s of results) {
    const gKey = `golden_${s.symbol}_${ist.dateStr}`;
    const dKey = `death_${s.symbol}_${ist.dateStr}`;

    if ((s.isGoldenToday && !log[gKey]) || (forceNotify && s.isBullish)) {
      newGolden.push(s);
      log[gKey] = ist.displayStr;
    }
    if (s.isDeathToday && !log[dKey]) {
      newDeath.push(s);
      log[dKey] = ist.displayStr;
    }
  }

  console.log(`🥇 New Golden Crossovers  : ${newGolden.length}`);
  console.log(`💀 New Death Crossovers   : ${newDeath.length}`);

  // ── Send notifications ─────────────────────────────────────
  if (newGolden.length > 0 || newDeath.length > 0) {
    console.log('');
    console.log('─── SENDING NOTIFICATIONS ──────────────────────────────');
    
    for (const s of newGolden) {
      console.log(`  📱 Golden alert → ${s.name}`);
      await notify(s, 'golden');
      await sleep(300);
    }
    for (const s of newDeath) {
      console.log(`  📱 Death alert  → ${s.name}`);
      await notify(s, 'death');
      await sleep(300);
    }
  } else {
    console.log('ℹ️  No new crossovers — no notifications sent');
  }

  // ── Save everything ────────────────────────────────────────
  console.log('');
  console.log('─── SAVING DATA ────────────────────────────────────────');
  saveLog(log);
  savePublic(results);

  // ── Final summary ──────────────────────────────────────────
  console.log('');
  console.log('─── CROSSOVER SUMMARY ──────────────────────────────────');
  
  const goldenStocks = results
    .filter(r => r.crossType === 'golden')
    .sort((a,b) => (a.crossDaysAgo||999) - (b.crossDaysAgo||999));

  if (goldenStocks.length > 0) {
    console.log('🥇 Stocks with recent Golden Cross:');
    goldenStocks.forEach(s => {
      const ago = s.crossDaysAgo != null ? `${s.crossDaysAgo}d ago` : '';
      console.log(`   ${s.name.padEnd(30)} ₹${fmtPrice(s.price).padStart(10)} | ${ago.padEnd(8)} | ${s.trend}`);
    });
  } else {
    console.log('   No Golden Crossovers in last 45 days');
  }

  const watchList = results.filter(r => !r.isBullish && Math.abs(r.maGapPct) < 0.8);
  if (watchList.length > 0) {
    console.log('');
    console.log('👀 Watch Zone (close to crossover):');
    watchList.forEach(s => {
      console.log(`   ${s.name.padEnd(30)} Gap: ${s.maGapPct}%`);
    });
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  ✅  JOB COMPLETE');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
}

main().catch(err => {
  console.error('');
  console.error('💥 FATAL ERROR:', err.message);
  console.error(err.stack);
  process.exit(1);
});
