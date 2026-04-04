// ================================================================
//  CHECK-CROSSOVERS.JS
//  Runs inside GitHub Actions
//  Fetches Yahoo Finance data → Checks 50MA/200MA crossover
//  Sends push notification via ntfy.sh (FREE)
// ================================================================

'use strict';

const axios = require('axios');
const fs    = require('fs');
const path  = require('path');

// ── ALL NIFTY 50 STOCKS ─────────────────────────────────────────
const NIFTY50 = [
  { symbol: 'RELIANCE.NS',   name: 'Reliance Industries', sector: 'Energy'      },
  { symbol: 'TCS.NS',        name: 'TCS',                 sector: 'IT'          },
  { symbol: 'HDFCBANK.NS',   name: 'HDFC Bank',           sector: 'Banking'     },
  { symbol: 'INFY.NS',       name: 'Infosys',             sector: 'IT'          },
  { symbol: 'ICICIBANK.NS',  name: 'ICICI Bank',          sector: 'Banking'     },
  { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever',  sector: 'FMCG'        },
  { symbol: 'ITC.NS',        name: 'ITC',                 sector: 'FMCG'        },
  { symbol: 'SBIN.NS',       name: 'State Bank of India', sector: 'Banking'     },
  { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel',       sector: 'Telecom'     },
  { symbol: 'KOTAKBANK.NS',  name: 'Kotak Mahindra Bank', sector: 'Banking'     },
  { symbol: 'LT.NS',         name: 'L&T',                 sector: 'Infra'       },
  { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance',       sector: 'Finance'     },
  { symbol: 'HCLTECH.NS',    name: 'HCL Technologies',    sector: 'IT'          },
  { symbol: 'ASIANPAINT.NS', name: 'Asian Paints',        sector: 'Paints'      },
  { symbol: 'AXISBANK.NS',   name: 'Axis Bank',           sector: 'Banking'     },
  { symbol: 'MARUTI.NS',     name: 'Maruti Suzuki',       sector: 'Auto'        },
  { symbol: 'TITAN.NS',      name: 'Titan Company',       sector: 'Consumer'    },
  { symbol: 'WIPRO.NS',      name: 'Wipro',               sector: 'IT'          },
  { symbol: 'SUNPHARMA.NS',  name: 'Sun Pharma',          sector: 'Pharma'      },
  { symbol: 'ULTRACEMCO.NS', name: 'UltraTech Cement',    sector: 'Cement'      },
  { symbol: 'NESTLEIND.NS',  name: 'Nestle India',        sector: 'FMCG'        },
  { symbol: 'POWERGRID.NS',  name: 'Power Grid',          sector: 'Power'       },
  { symbol: 'NTPC.NS',       name: 'NTPC',                sector: 'Power'       },
  { symbol: 'TECHM.NS',      name: 'Tech Mahindra',       sector: 'IT'          },
  { symbol: 'ONGC.NS',       name: 'ONGC',                sector: 'Energy'      },
  { symbol: 'JSWSTEEL.NS',   name: 'JSW Steel',           sector: 'Metal'       },
  { symbol: 'TATAMOTORS.NS', name: 'Tata Motors',         sector: 'Auto'        },
  { symbol: 'ADANIPORTS.NS', name: 'Adani Ports',         sector: 'Logistics'   },
  { symbol: 'HINDALCO.NS',   name: 'Hindalco',            sector: 'Metal'       },
  { symbol: 'COALINDIA.NS',  name: 'Coal India',          sector: 'Mining'      },
  { symbol: 'BPCL.NS',       name: 'BPCL',                sector: 'Energy'      },
  { symbol: 'TATASTEEL.NS',  name: 'Tata Steel',          sector: 'Metal'       },
  { symbol: 'GRASIM.NS',     name: 'Grasim Industries',   sector: 'Cement'      },
  { symbol: 'CIPLA.NS',      name: 'Cipla',               sector: 'Pharma'      },
  { symbol: 'EICHERMOT.NS',  name: 'Eicher Motors',       sector: 'Auto'        },
  { symbol: 'DRREDDY.NS',    name: "Dr. Reddy's Labs",    sector: 'Pharma'      },
  { symbol: 'BAJAJ-AUTO.NS', name: 'Bajaj Auto',          sector: 'Auto'        },
  { symbol: 'HEROMOTOCO.NS', name: 'Hero MotoCorp',       sector: 'Auto'        },
  { symbol: 'INDUSINDBK.NS', name: 'IndusInd Bank',       sector: 'Banking'     },
  { symbol: 'BRITANNIA.NS',  name: 'Britannia',           sector: 'FMCG'        },
  { symbol: 'APOLLOHOSP.NS', name: 'Apollo Hospitals',    sector: 'Healthcare'  },
  { symbol: 'DIVISLAB.NS',   name: "Divi's Laboratories", sector: 'Pharma'      },
  { symbol: 'BAJAJFINSV.NS', name: 'Bajaj Finserv',       sector: 'Finance'     },
  { symbol: 'TATACONSUM.NS', name: 'Tata Consumer',       sector: 'FMCG'        },
  { symbol: 'HDFCLIFE.NS',   name: 'HDFC Life Insurance', sector: 'Insurance'   },
  { symbol: 'SBILIFE.NS',    name: 'SBI Life Insurance',  sector: 'Insurance'   },
  { symbol: 'ADANIENT.NS',   name: 'Adani Enterprises',   sector: 'Conglomerate'},
  { symbol: 'M&M.NS',        name: 'Mahindra & Mahindra', sector: 'Auto'        },
  { symbol: 'SHREECEM.NS',   name: 'Shree Cement',        sector: 'Cement'      },
  { symbol: 'BEL.NS',        name: 'Bharat Electronics',  sector: 'Defence'     },
];

// ── CONFIG ──────────────────────────────────────────────────────
const CONFIG = {
  MA_SHORT:     50,
  MA_LONG:      200,
  LOG_FILE:     'crossover-log.json',
  DATA_FILE:    'public/crossover-data.json',
  NTFY_SERVER:  'https://ntfy.sh',
  YAHOO_URL:    'https://query1.finance.yahoo.com/v8/finance/chart',
  DELAY_MS:     400,   // delay between each stock fetch (avoid rate limiting)
  RETRY_COUNT:  2,     // how many times to retry failed requests
};

// ── HELPERS ─────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

function calcMA(arr, period) {
  if (arr.length < period) return null;
  const slice = arr.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function formatINR(num) {
  if (!num) return '--';
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

function getISTDateString() {
  const now = new Date();
  const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  return ist.toISOString().split('T')[0]; // YYYY-MM-DD
}

function getISTDateTime() {
  const now = new Date();
  const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  return ist.toUTCString().replace('GMT', 'IST');
}

// ── FETCH SINGLE STOCK ───────────────────────────────────────────
async function fetchStockData(stock, retryCount = 0) {
  const url = `${CONFIG.YAHOO_URL}/${stock.symbol}?interval=1d&range=2y`;
  
  try {
    console.log(`  📥 Fetching: ${stock.symbol}`);
    
    const response = await axios.get(url, {
      timeout: 12000,
      headers: {
        // These headers make Yahoo think it is a real browser
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Origin': 'https://finance.yahoo.com',
        'Referer': 'https://finance.yahoo.com/',
      }
    });

    const result = response.data?.chart?.result?.[0];
    if (!result) throw new Error('No chart result in response');

    const meta      = result.meta;
    const closes    = result.indicators?.quote?.[0]?.close ?? [];
    const timestamps = result.timestamp ?? [];

    // Remove null values
    const cleanData = closes
      .map((c, i) => ({ close: c, ts: timestamps[i] }))
      .filter(d => d.close !== null && d.close !== undefined);

    if (cleanData.length < CONFIG.MA_LONG + 10) {
      console.log(`  ⚠️  ${stock.symbol}: Not enough data (${cleanData.length} days)`);
      return null;
    }

    const allCloses = cleanData.map(d => d.close);
    const len       = allCloses.length;

    // Current values
    const ma50Current  = calcMA(allCloses, CONFIG.MA_SHORT);
    const ma200Current = calcMA(allCloses, CONFIG.MA_LONG);

    // Previous day values (remove last element)
    const prevCloses   = allCloses.slice(0, -1);
    const ma50Prev     = calcMA(prevCloses, CONFIG.MA_SHORT);
    const ma200Prev    = calcMA(prevCloses, CONFIG.MA_LONG);

    if (!ma50Current || !ma200Current || !ma50Prev || !ma200Prev) {
      return null;
    }

    // Current market price
    const currentPrice = meta.regularMarketPrice || allCloses[len - 1];
    const prevPrice    = allCloses[len - 2] || currentPrice;
    const priceChange  = ((currentPrice - prevPrice) / prevPrice * 100);

    // Golden Cross detection
    // 50MA was BELOW 200MA yesterday → 50MA is ABOVE 200MA today = GOLDEN CROSS
    const isGoldenCrossToday = (ma50Prev  <= ma200Prev)  && (ma50Current > ma200Current);

    // Death Cross detection  
    // 50MA was ABOVE 200MA yesterday → 50MA is BELOW 200MA today = DEATH CROSS
    const isDeathCrossToday  = (ma50Prev  >= ma200Prev)  && (ma50Current < ma200Current);

    // Current position
    const isBullish = ma50Current > ma200Current;
    const isBearish = ma50Current < ma200Current;
    const maGap     = ((ma50Current - ma200Current) / ma200Current * 100);

    // Find crossover date (scan last 30 days)
    let crossoverDate    = null;
    let crossoverType    = null;
    let crossoverDaysAgo = null;

    for (let i = len - 1; i >= Math.max(1, len - 30); i--) {
      const c50 = calcMA(allCloses.slice(0, i + 1), CONFIG.MA_SHORT);
      const c200 = calcMA(allCloses.slice(0, i + 1), CONFIG.MA_LONG);
      const p50 = calcMA(allCloses.slice(0, i), CONFIG.MA_SHORT);
      const p200 = calcMA(allCloses.slice(0, i), CONFIG.MA_LONG);

      if (!c50 || !c200 || !p50 || !p200) continue;

      if (p50 <= p200 && c50 > c200) {
        crossoverType = 'golden';
        const d = new Date(cleanData[i].ts * 1000);
        crossoverDate = d.toLocaleDateString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric'
        });
        crossoverDaysAgo = Math.round((Date.now() - d.getTime()) / 86400000);
        break;
      }
      if (p50 >= p200 && c50 < c200) {
        crossoverType = 'death';
        const d = new Date(cleanData[i].ts * 1000);
        crossoverDate = d.toLocaleDateString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric'
        });
        crossoverDaysAgo = Math.round((Date.now() - d.getTime()) / 86400000);
        break;
      }
    }

    // Trend label
    let trendStatus = '';
    if (isGoldenCrossToday) {
      trendStatus = '🥇 GOLDEN CROSSOVER (TODAY!)';
    } else if (crossoverType === 'golden' && crossoverDaysAgo <= 7) {
      trendStatus = `🥇 Golden Cross (${crossoverDaysAgo}d ago)`;
    } else if (crossoverType === 'golden' && crossoverDaysAgo <= 30) {
      trendStatus = `📈 Post Golden Cross (${crossoverDaysAgo}d ago)`;
    } else if (isBullish && maGap > 2) {
      trendStatus = '🚀 Strong Bullish';
    } else if (isBullish) {
      trendStatus = '📈 Bullish';
    } else if (isDeathCrossToday) {
      trendStatus = '💀 DEATH CROSS (TODAY!)';
    } else if (crossoverType === 'death') {
      trendStatus = `💀 Death Cross (${crossoverDaysAgo}d ago)`;
    } else if (isBearish && Math.abs(maGap) < 0.5) {
      trendStatus = '👀 Watch Zone (Near Crossover)';
    } else if (isBearish) {
      trendStatus = '🔻 Bearish';
    } else {
      trendStatus = '➡️ Neutral';
    }

    console.log(`  ✅ ${stock.symbol}: ₹${formatINR(currentPrice)} | 50MA: ${formatINR(ma50Current)} | 200MA: ${formatINR(ma200Current)} | ${trendStatus}`);

    return {
      symbol:           stock.symbol,
      name:             stock.name,
      sector:           stock.sector,
      price:            parseFloat(currentPrice.toFixed(2)),
      priceChange:      parseFloat(priceChange.toFixed(2)),
      ma50:             parseFloat(ma50Current.toFixed(2)),
      ma200:            parseFloat(ma200Current.toFixed(2)),
      maGap:            parseFloat(maGap.toFixed(2)),
      crossoverDate:    crossoverDate || 'No recent crossover',
      crossoverType:    crossoverType || 'none',
      crossoverDaysAgo: crossoverDaysAgo,
      trendStatus:      trendStatus,
      isGoldenToday:    isGoldenCrossToday,
      isDeathToday:     isDeathCrossToday,
      isBullish:        isBullish,
      isBearish:        isBearish,
    };

  } catch (err) {
    // Retry logic
    if (retryCount < CONFIG.RETRY_COUNT) {
      console.log(`  🔄 Retrying ${stock.symbol} (attempt ${retryCount + 2})...`);
      await sleep(2000);
      return fetchStockData(stock, retryCount + 1);
    }
    console.log(`  ❌ Failed: ${stock.symbol} — ${err.message}`);
    return null;
  }
}

// ── SEND NOTIFICATION via ntfy.sh ───────────────────────────────
async function sendNtfyNotification(stock, isGolden = true) {
  const topic = process.env.NTFY_TOPIC;

  if (!topic) {
    console.log('⚠️  NTFY_TOPIC not set in environment — skipping notification');
    return false;
  }

  // Build the message body
  const emoji   = isGolden ? '🥇' : '💀';
  const title   = isGolden 
    ? `${emoji} Golden Crossover: ${stock.name}` 
    : `${emoji} Death Cross Alert: ${stock.name}`;

  const body = [
    `📊 Stock: ${stock.name} (${stock.symbol.replace('.NS','')})`,
    `💰 Price: ₹${formatINR(stock.price)} (${stock.priceChange >= 0 ? '+' : ''}${stock.priceChange}%)`,
    `📅 Crossover: ${stock.crossoverDate}`,
    `📈 50-Day MA:  ₹${formatINR(stock.ma50)}`,
    `📉 200-Day MA: ₹${formatINR(stock.ma200)}`,
    `📊 MA Gap: ${stock.maGap > 0 ? '+' : ''}${stock.maGap}%`,
    `🏭 Sector: ${stock.sector}`,
    `📌 Trend: ${stock.trendStatus}`,
    `⏰ ${getISTDateTime()}`,
  ].join('\n');

  try {
    const response = await axios.post(
      `${CONFIG.NTFY_SERVER}/${topic}`,
      body,
      {
        headers: {
          'Title':    title,
          // Priority: urgent for golden, high for death
          'Priority': isGolden ? 'urgent' : 'high',
          // Tags show as emoji on phone
          'Tags':     isGolden 
            ? 'chart_increasing,moneybag,trophy' 
            : 'chart_decreasing,skull',
          // Click notification to open the app/website
          'Click':    'https://sayantanHack.github.io/Golden-Crossover',
          // Notification actions (buttons on Android)
          'Actions':  'view, Open App, https://sayantanHack.github.io/Golden-Crossover',
        },
        timeout: 8000,
      }
    );
    console.log(`  📱 Notification sent for ${stock.symbol} — Status: ${response.status}`);
    return true;
  } catch (err) {
    console.error(`  ❌ Failed to send notification for ${stock.symbol}: ${err.message}`);
    return false;
  }
}

// ── SEND DAILY SUMMARY NOTIFICATION ─────────────────────────────
async function sendSummaryNotification(results, newGolden, newDeath) {
  const topic = process.env.NTFY_TOPIC;
  if (!topic) return;

  const goldenStocks  = results.filter(r => r.isBullish && r.crossoverType === 'golden');
  const watchStocks   = results.filter(r => r.isBearish && Math.abs(r.maGap) < 1);

  const body = [
    `📊 NIFTY 50 CROSSOVER SUMMARY`,
    `⏰ ${getISTDateTime()}`,
    ``,
    `🥇 Golden Crossovers Today: ${newGolden.length}`,
    `💀 Death Crossovers Today:  ${newDeath.length}`,
    `🚀 Bullish Trend Stocks:    ${goldenStocks.length}`,
    `👀 Watch Zone Stocks:       ${watchStocks.length}`,
    ``,
    newGolden.length > 0 
      ? `🥇 New Golden: ${newGolden.map(s => s.symbol.replace('.NS','')).join(', ')}` 
      : `✅ No new Golden Crossovers today`,
    watchStocks.length > 0
      ? `👀 Near Cross: ${watchStocks.slice(0,5).map(s => s.symbol.replace('.NS','')).join(', ')}`
      : '',
  ].filter(Boolean).join('\n');

  try {
    await axios.post(`${CONFIG.NTFY_SERVER}/${topic}`, body, {
      headers: {
        'Title':    '📊 Nifty 50 Daily Summary',
        'Priority': 'default',
        'Tags':     'bar_chart',
      },
      timeout: 8000,
    });
    console.log('📊 Daily summary notification sent');
  } catch (err) {
    console.error('Failed to send summary:', err.message);
  }
}

// ── LOAD CROSSOVER LOG ───────────────────────────────────────────
function loadLog() {
  try {
    if (fs.existsSync(CONFIG.LOG_FILE)) {
      const raw = fs.readFileSync(CONFIG.LOG_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Could not read log file:', e.message);
  }
  return {};
}

// ── SAVE CROSSOVER LOG ───────────────────────────────────────────
function saveLog(log) {
  try {
    fs.writeFileSync(CONFIG.LOG_FILE, JSON.stringify(log, null, 2));
    console.log('💾 Crossover log saved');
  } catch (e) {
    console.error('Failed to save log:', e.message);
  }
}

// ── SAVE PUBLIC DATA (for the website to read) ───────────────────
function savePublicData(results) {
  try {
    const dir = path.dirname(CONFIG.DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const data = {
      updated:     new Date().toISOString(),
      updatedIST:  getISTDateTime(),
      totalStocks: results.length,
      stocks:      results,
      summary: {
        golden:  results.filter(r => r.crossoverType === 'golden').length,
        death:   results.filter(r => r.crossoverType === 'death').length,
        bullish: results.filter(r => r.isBullish).length,
        bearish: results.filter(r => r.isBearish).length,
        watch:   results.filter(r => Math.abs(r.maGap) < 1).length,
      }
    };

    fs.writeFileSync(CONFIG.DATA_FILE, JSON.stringify(data, null, 2));
    console.log('💾 Public data file saved');
  } catch (e) {
    console.error('Failed to save public data:', e.message);
  }
}

// ── MAIN FUNCTION ────────────────────────────────────────────────
async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  🥇 NIFTY 50 GOLDEN CROSSOVER CHECKER STARTED');
  console.log(`  ⏰ ${getISTDateTime()}`);
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  // Load previous log to avoid duplicate notifications
  const log = loadLog();
  const todayIST = getISTDateString();

  console.log(`📋 Previous log entries: ${Object.keys(log).length}`);
  console.log(`📅 Today (IST): ${todayIST}`);
  console.log('');

  // Fetch all stocks
  console.log('📥 FETCHING STOCK DATA FROM YAHOO FINANCE...');
  console.log('─────────────────────────────────────────────');
  
  const results = [];

  for (let i = 0; i < NIFTY50.length; i++) {
    const stock = NIFTY50[i];
    console.log(`[${i + 1}/${NIFTY50.length}] Processing ${stock.symbol}...`);
    
    const data = await fetchStockData(stock);
    if (data) results.push(data);

    // Wait between requests to avoid Yahoo rate limiting
    if (i < NIFTY50.length - 1) {
      await sleep(CONFIG.DELAY_MS);
    }
  }

  console.log('');
  console.log(`✅ Successfully fetched: ${results.length}/${NIFTY50.length} stocks`);
  console.log('');

  // Find new crossovers
  const newGoldenCrossovers = [];
  const newDeathCrossovers  = [];

  const forceNotify = process.env.FORCE_NOTIFY === 'true';

  for (const stock of results) {
    // Check if golden crossover happened and we haven't notified today
    if (stock.isGoldenToday || forceNotify) {
      const logKey = `golden_${stock.symbol}`;
      if (log[logKey] !== todayIST || forceNotify) {
        newGoldenCrossovers.push(stock);
        log[logKey] = todayIST;
      } else {
        console.log(`  ℹ️  Already notified for ${stock.symbol} golden cross today`);
      }
    }

    // Check for death crossovers too
    if (stock.isDeathToday && log[`death_${stock.symbol}`] !== todayIST) {
      newDeathCrossovers.push(stock);
      log[`death_${stock.symbol}`] = todayIST;
    }
  }

  console.log('─────────────────────────────────────────────');
  console.log(`🥇 New Golden Crossovers: ${newGoldenCrossovers.length}`);
  console.log(`💀 New Death Crossovers:  ${newDeathCrossovers.length}`);
  console.log('─────────────────────────────────────────────');

  // Send notifications
  if (newGoldenCrossovers.length > 0) {
    console.log('');
    console.log('📱 SENDING GOLDEN CROSSOVER NOTIFICATIONS...');
    for (const stock of newGoldenCrossovers) {
      console.log(`  → Notifying: ${stock.name}`);
      await sendNtfyNotification(stock, true);
      await sleep(500); // Small gap between notifications
    }
  }

  if (newDeathCrossovers.length > 0) {
    console.log('');
    console.log('📱 SENDING DEATH CROSS NOTIFICATIONS...');
    for (const stock of newDeathCrossovers) {
      console.log(`  → Notifying: ${stock.name}`);
      await sendNtfyNotification(stock, false);
      await sleep(500);
    }
  }

  // Send daily summary at market close (around 15:30 IST = 10:00 UTC)
  const utcHour = new Date().getUTCHours();
  const utcMin  = new Date().getUTCMinutes();
  if (utcHour === 10 && utcMin <= 10) {
    console.log('');
    console.log('📊 Sending daily summary...');
    await sendSummaryNotification(results, newGoldenCrossovers, newDeathCrossovers);
  }

  // Save everything
  saveLog(log);
  savePublicData(results);

  // Print final report
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  📊 FINAL REPORT');
  console.log('═══════════════════════════════════════════════════');
  
  const goldenStocks = results.filter(r => r.crossoverType === 'golden');
  if (goldenStocks.length > 0) {
    console.log('🥇 Stocks with Golden Cross (last 30 days):');
    goldenStocks.forEach(s => {
      console.log(`   ${s.name.padEnd(30)} ₹${s.price} | ${s.trendStatus}`);
    });
  }

  const watchStocks = results.filter(r => Math.abs(r.maGap) < 1 && r.isBearish);
  if (watchStocks.length > 0) {
    console.log('');
    console.log('👀 Stocks near crossover (Watch Zone):');
    watchStocks.forEach(s => {
      console.log(`   ${s.name.padEnd(30)} Gap: ${s.maGap}% | ₹${s.price}`);
    });
  }

  console.log('');
  console.log('✅ ALL DONE!');
  console.log('═══════════════════════════════════════════════════');
}

// Run
main().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
