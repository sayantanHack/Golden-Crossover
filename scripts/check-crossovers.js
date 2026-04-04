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
    const
