// ============================================================
//  NIFTY 50 GOLDEN CROSSOVER TRACKER
//  Uses Yahoo Finance CORS proxy for live data
// ============================================================

'use strict';

// ── NIFTY 50 STOCK LIST ─────────────────────────────────────
const NIFTY50_STOCKS = [
  { symbol: 'RELIANCE.NS',    name: 'Reliance Industries', sector: 'Energy' },
  { symbol: 'TCS.NS',         name: 'TCS',                 sector: 'IT' },
  { symbol: 'HDFCBANK.NS',    name: 'HDFC Bank',           sector: 'Banking' },
  { symbol: 'INFY.NS',        name: 'Infosys',             sector: 'IT' },
  { symbol: 'ICICIBANK.NS',   name: 'ICICI Bank',          sector: 'Banking' },
  { symbol: 'HINDUNILVR.NS',  name: 'Hindustan Unilever',  sector: 'FMCG' },
  { symbol: 'ITC.NS',         name: 'ITC',                 sector: 'FMCG' },
  { symbol: 'SBIN.NS',        name: 'State Bank of India', sector: 'Banking' },
  { symbol: 'BHARTIARTL.NS',  name: 'Bharti Airtel',       sector: 'Telecom' },
  { symbol: 'KOTAKBANK.NS',   name: 'Kotak Mahindra Bank', sector: 'Banking' },
  { symbol: 'LT.NS',          name: 'L&T',                 sector: 'Infra' },
  { symbol: 'BAJFINANCE.NS',  name: 'Bajaj Finance',       sector: 'Finance' },
  { symbol: 'HCLTECH.NS',     name: 'HCL Technologies',    sector: 'IT' },
  { symbol: 'ASIANPAINT.NS',  name: 'Asian Paints',        sector: 'Paints' },
  { symbol: 'AXISBANK.NS',    name: 'Axis Bank',           sector: 'Banking' },
  { symbol: 'MARUTI.NS',      name: 'Maruti Suzuki',       sector: 'Auto' },
  { symbol: 'TITAN.NS',       name: 'Titan Company',       sector: 'Consumer' },
  { symbol: 'WIPRO.NS',       name: 'Wipro',               sector: 'IT' },
  { symbol: 'SUNPHARMA.NS',   name: 'Sun Pharma',          sector: 'Pharma' },
  { symbol: 'ULTRACEMCO.NS',  name: 'UltraTech Cement',    sector: 'Cement' },
  { symbol: 'NESTLEIND.NS',   name: 'Nestle India',        sector: 'FMCG' },
  { symbol: 'POWERGRID.NS',   name: 'Power Grid',          sector: 'Power' },
  { symbol: 'NTPC.NS',        name: 'NTPC',                sector: 'Power' },
  { symbol: 'TECHM.NS',       name: 'Tech Mahindra',       sector: 'IT' },
  { symbol: 'ONGC.NS',        name: 'ONGC',                sector: 'Energy' },
  { symbol: 'JSWSTEEL.NS',    name: 'JSW Steel',           sector: 'Metal' },
  { symbol: 'TATAMOTORS.NS',  name: 'Tata Motors',         sector: 'Auto' },
  { symbol: 'ADANIPORTS.NS',  name: 'Adani Ports',         sector: 'Logistics' },
  { symbol: 'HINDALCO.NS',    name: 'Hindalco',            sector: 'Metal' },
  { symbol: 'COALINDIA.NS',   name: 'Coal India',          sector: 'Mining' },
  { symbol: 'BPCL.NS',        name: 'BPCL',                sector: 'Energy' },
  { symbol: 'TATASTEEL.NS',   name: 'Tata Steel',          sector: 'Metal' },
  { symbol: 'GRASIM.NS',      name: 'Grasim Industries',   sector: 'Cement' },
  { symbol: 'CIPLA.NS',       name: 'Cipla',               sector: 'Pharma' },
  { symbol: 'EICHERMOT.NS',   name: 'Eicher Motors',       sector: 'Auto' },
  { symbol: 'DRREDDY.NS',     name: 'Dr. Reddy\'s',        sector: 'Pharma' },
  { symbol: 'BAJAJ-AUTO.NS',  name: 'Bajaj Auto',          sector: 'Auto' },
  { symbol: 'HEROMOTOCO.NS',  name: 'Hero MotoCorp',       sector: 'Auto' },
  { symbol: 'INDUSINDBK.NS',  name: 'IndusInd Bank',       sector: 'Banking' },
  { symbol: 'BRITANNIA.NS',   name: 'Britannia',           sector: 'FMCG' },
  { symbol: 'APOLLOHOSP.NS',  name: 'Apollo Hospitals',    sector: 'Healthcare' },
  { symbol: 'DIVISLAB.NS',    name: 'Divi\'s Labs',        sector: 'Pharma' },
  { symbol: 'BAJAJFINSV.NS',  name: 'Bajaj Finserv',       sector: 'Finance' },
  { symbol: 'TATACONSUM.NS',  name: 'Tata Consumer',       sector: 'FMCG' },
  { symbol: 'HDFCLIFE.NS',    name: 'HDFC Life',           sector: 'Insurance' },
  { symbol: 'SBILIFE.NS',     name: 'SBI Life',            sector: 'Insurance' },
  { symbol: 'ADANIENT.NS',    name: 'Adani Enterprises',   sector: 'Conglomerate' },
  { symbol: 'MM.NS',          name: 'Mahindra & Mahindra', sector: 'Auto' },
  { symbol: 'SHREECEM.NS',    name: 'Shree Cement',        sector: 'Cement' },
  { symbol: 'BEL.NS',         name: 'Bharat Electronics',  sector: 'Defence' },
];

// ── CONFIG ───────────────────────────────────────────────────
const CONFIG = {
  MA_SHORT:         50,
  MA_LONG:          200,
  REFRESH_INTERVAL: 15 * 60 * 1000, // 15 minutes
  MARKET_OPEN:      { hour: 9,  minute: 15 },
  MARKET_CLOSE:     { hour: 15, minute: 30 },
  CORS_PROXY:       'https://api.allorigins.win/get?url=',
  YAHOO_BASE:       'https://query1.finance.yahoo.com/v8/finance/chart/',
};

// ── STATE ────────────────────────────────────────────────────
let state = {
  stocks:        [],
  filteredStocks:[],
  sortField:     'trend',
  sortDir:       'asc',
  activeFilter:  'all',
  viewMode:      'card', // 'card' | 'table'
  refreshTimer:  null,
  notifyEnabled: false,
  lastCrossoverMap: {}, // symbol -> last known crossover date
};

// ── INIT ─────────────────────────────────────────────────────
window.addEventListener('load', async () => {
  registerServiceWorker();
  loadStoredCrossovers();
  updateMarketStatus();
  await refreshData();
  startAutoRefresh();
  setInterval(updateMarketStatus, 60000);
});

// ============================================================
//  DATA FETCHING
// ============================================================

async function refreshData() {
  showToast('🔄 Fetching latest data...');
  updateLastUpdated('Fetching...');

  const results = [];
  const batchSize = 5; // Fetch in batches to avoid rate limiting

  for (let i = 0; i < NIFTY50_STOCKS.length; i += batchSize) {
    const batch = NIFTY50_STOCKS.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map(stock => fetchStockData(stock))
    );
    batchResults.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        results.push(result.value);
      }
    });
    // Small delay between batches
    if (i + batchSize < NIFTY50_STOCKS.length) {
      await sleep(500);
    }
  }

  state.stocks = results.sort((a, b) => {
    // Sort: Golden first, then Bullish, Watch, Death
    const order = { 'golden': 0, 'bullish': 1, 'watch': 2, 'neutral': 3, 'death': 4 };
    return (order[a.trendKey] ?? 3) - (order[b.trendKey] ?? 3);
  });

  updateSummaryCards();
  applyFilter(state.activeFilter);
  checkForNewCrossovers();
  updateLastUpdated(new Date().toLocaleTimeString('en-IN'));
  showToast('✅ Data updated successfully!');
}

async function fetchStockData(stockInfo) {
  try {
    // Yahoo Finance returns 1y daily data
    const url = `${CONFIG.YAHOO_BASE}${stockInfo.symbol}?interval=1d&range=1y`;
    const proxyUrl = `${CONFIG.CORS_PROXY}${encodeURIComponent(url)}`;

    const response = await fetch(proxyUrl, { 
      signal: AbortSignal.timeout(10000) 
    });
    
    if (!response.ok) throw new Error('Network error');
    
    const wrapper = await response.json();
    const data = JSON.parse(wrapper.contents);
    const chart = data?.chart?.result?.[0];
    if (!chart) throw new Error('No chart data');

    const timestamps = chart.timestamp;
    const closes = chart.indicators?.quote?.[0]?.close;
    const meta = chart.meta;

    if (!closes || closes.length < CONFIG.MA_LONG + 5) {
      return buildFallbackData(stockInfo);
    }

    // Clean closes (remove nulls)
    const cleanCloses = closes.map((c, i) => ({
      date: new Date(timestamps[i] * 1000),
      close: c
    })).filter(d => d.close != null);

    const prices = cleanCloses.map(d => d.close);
    const dates  = cleanCloses.map(d => d.date);

    // Calculate MAs
    const ma50s  = calculateMA(prices, CONFIG.MA_SHORT);
    const ma200s = calculateMA(prices, CONFIG.MA_LONG);

    const lastIdx  = prices.length - 1;
    const prevIdx  = lastIdx - 1;

    const currentMA50  = ma50s[lastIdx];
    const currentMA200 = ma200s[lastIdx];
    const prevMA50     = ma50s[prevIdx];
    const prevMA200    = ma200s[prevIdx];

    const currentPrice = meta.regularMarketPrice || prices[lastIdx];
    const prevPrice    = prices[prevIdx] || currentPrice;
    const priceChange  = ((currentPrice - prevPrice) / prevPrice * 100).toFixed(2);

    // Detect crossover
    const crossoverInfo = detectCrossover(
      ma50s, ma200s, dates, prevIdx, lastIdx
    );

    // Determine trend
    const trendInfo = getTrend(
      currentMA50, currentMA200, crossoverInfo, 
      currentPrice, prevMA50, prevMA200
    );

    // Signal strength (0-5)
    const signalStrength = calcSignalStrength(
      currentMA50, currentMA200, currentPrice, crossoverInfo
    );

    return {
      symbol:          stockInfo.symbol,
      name:            stockInfo.name,
      sector:          stockInfo.sector,
      price:           currentPrice.toFixed(2),
      priceChange:     parseFloat(priceChange),
      ma50:            currentMA50?.toFixed(2) ?? '--',
      ma200:           currentMA200?.toFixed(2) ?? '--',
      ma50Raw:         currentMA50,
      ma200Raw:        currentMA200,
      crossoverDate:   crossoverInfo.date,
      crossoverType:   crossoverInfo.type,
      crossoverDaysAgo:crossoverInfo.daysAgo,
      trend:           trendInfo.label,
      trendKey:        trendInfo.key,
      trendIcon:       trendInfo.icon,
      trendClass:      trendInfo.cssClass,
      signalStrength,
      maGap:           currentMA50 && currentMA200 
                         ? ((currentMA50 - currentMA200) / currentMA200 * 100).toFixed(2) 
                         : '0',
      prices:          prices.slice(-60),  // Last 60 days for chart
      ma50History:     ma50s.slice(-60),
      ma200History:    ma200s.slice(-60),
      dates:           dates.slice(-60),
    };

  } catch (err) {
    console.warn(`[${stockInfo.symbol}] fetch failed:`, err.message);
    return buildFallbackData(stockInfo);
  }
}

// ── FALLBACK (when API fails) ────────────────────────────────
function buildFallbackData(stockInfo) {
  return {
    symbol:         stockInfo.symbol,
    name:           stockInfo.name,
    sector:         stockInfo.sector,
    price:          '--',
    priceChange:    0,
    ma50:           '--',
    ma200:          '--',
    ma50Raw:        null,
    ma200Raw:       null,
    crossoverDate:  '--',
    crossoverType:  'none',
    crossoverDaysAgo: null,
    trend:          'Data Unavailable',
    trendKey:       'neutral',
    trendIcon:      '❓',
    trendClass:     'trend-neutral',
    signalStrength: 0,
    maGap:          '0',
    prices:         [],
    ma50History:    [],
    ma200History:   [],
    dates:          [],
  };
}

// ============================================================
//  MOVING AVERAGE CALCULATIONS
// ============================================================

function calculateMA(prices, period) {
  const result = new Array(prices.length).fill(null);
  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    result[i] = slice.reduce((a, b) => a + b, 0) / period;
  }
  return result;
}

function detectCrossover(ma50s, ma200s, dates, prevIdx, lastIdx) {
  // Scan last 30 days for most recent crossover
  const scanWindow = Math.min(30, prevIdx);
  
  for (let i = lastIdx; i >= lastIdx - scanWindow; i--) {
    if (i < 1) break;
    const curr50 = ma50s[i], curr200 = ma200s[i];
    const prev50 = ma50s[i-1], prev200 = ma200s[i-1];
    if (!curr50 || !curr200 || !prev50 || !prev200) continue;

    const wasBellow = prev50 <= prev200;
    const isAbove   = curr50 >  curr200;
    const wasAbove  = prev50 >= prev200;
    const isBelow   = curr50 <  curr200;

    if (wasBellow && isAbove) {
      return {
        type:    'golden',
        date:    dates[i] ? formatDate(dates[i]) : '--',
        dateRaw: dates[i],
        daysAgo: Math.round((Date.now() - dates[i]) / 86400000),
      };
    }
    if (wasAbove && isBelow) {
      return {
        type:    'death',
        date:    dates[i] ? formatDate(dates[i]) : '--',
        dateRaw: dates[i],
        daysAgo: Math.round((Date.now() - dates[i]) / 86400000),
      };
    }
  }

  return { type: 'none', date: '--', dateRaw: null, daysAgo: null };
}

function getTrend(ma50, ma200, crossoverInfo, price, prevMA50, prevMA200) {
  if (!ma50 || !ma200) {
    return { key: 'neutral', label: 'No Data', icon: '❓', cssClass: 'trend-neutral' };
  }

  const gap = ((ma50 - ma200) / ma200) * 100;
  const ma50Rising  = prevMA50  ? ma50  > prevMA50  : true;
  const ma200Rising = prevMA200 ? ma200 > prevMA200 : true;

  if (crossoverInfo.type === 'golden' && crossoverInfo.daysAgo <= 7) {
    return { key: 'golden', label: '🥇 Golden Cross (NEW!)', icon: '🥇', cssClass: 'trend-golden' };
  }
  if (crossoverInfo.type === 'golden' && crossoverInfo.daysAgo <= 30) {
    return { key: 'golden', label: '🥇 Golden Cross', icon: '🥇', cssClass: 'trend-golden' };
  }
  if (ma50 > ma200 && ma50Rising && gap > 2) {
    return { key: 'bullish', label: '🚀 Strong Bullish', icon: '🚀', cssClass: 'trend-bullish' };
  }
  if (ma50 > ma200 && gap > 0) {
    return { key: 'bullish', label: '📈 Bullish', icon: '📈', cssClass: 'trend-bullish' };
  }
  if (crossoverInfo.type === 'death') {
    return { key: 'death', label: '💀 Death Cross', icon: '💀', cssClass: 'trend-death' };
  }
  if (ma50 < ma200 && Math.abs(gap) < 1) {
    return { key: 'watch', label: '👀 Watch Zone', icon: '👀', cssClass: 'trend-watch' };
  }
  if (ma50 < ma200) {
    return { key: 'death', label: '🔻 Bearish', icon: '🔻', cssClass: 'trend-death' };
  }

  return { key: 'neutral', label: '➡️ Neutral', icon: '➡️', cssClass: 'trend-neutral' };
}

function calcSignalStrength(ma50, ma200, price, crossoverInfo) {
  if (!ma50 || !ma200) return 0;
  const gap = Math.abs((ma50 - ma200) / ma200 * 100);
  let strength = 0;
  if (ma50 > ma200)                strength++;
  if (gap > 1)                     strength++;
  if (gap > 3)                     strength++;
  if (crossoverInfo.type === 'golden' && crossoverInfo.daysAgo <= 30) strength++;
  if (price > ma50)                strength++;
  return Math.min(strength, 5);
}

// ============================================================
//  CROSSOVER NOTIFICATION LOGIC
// ============================================================

function checkForNewCrossovers() {
  const newCrossovers = [];

  state.stocks.forEach(stock => {
    if (stock.crossoverType === 'golden') {
      const stored = state.lastCrossoverMap[stock.symbol];
      if (stored !== stock.crossoverDate) {
        state.lastCrossoverMap[stock.symbol] = stock.crossoverDate;
        if (stored !== undefined) {
          // It's actually new since last check
          newCrossovers.push(stock);
        }
      }
    }
  });

  saveCrossovers();

  if (newCrossovers.length > 0 && state.notifyEnabled) {
    newCrossovers.forEach(stock => sendCrossoverNotification(stock));
  }
}

function sendCrossoverNotification(stock) {
  if (!('serviceWorker' in navigator) || Notification.permission !== 'granted') return;

  navigator.serviceWorker.ready.then(reg => {
    reg.showNotification(`🥇 Golden Crossover: ${stock.name}`, {
      body: `📅 Date: ${stock.crossoverDate}\n💰 Price: ₹${stock.price}\n📊 50MA crossed above 200MA`,
      icon: 'icon-192.png',
      badge: 'icon-96.png',
      tag: stock.symbol,
      data: { url: window.location.href, symbol: stock.symbol },
      actions: [
        { action: 'view', title: '📊 View Chart' },
        { action: 'dismiss', title: '✕ Dismiss' }
      ],
      vibrate: [100, 50, 100, 50, 100],
      requireInteraction: true,
    });
  });
}

// ============================================================
//  RENDER FUNCTIONS
// ============================================================

function renderCards(stocks) {
  const container = document.getElementById('cardsView');
  const tbody     = document.getElementById('stockTableBody');

  if (!stocks || stocks.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:40px">No stocks match the filter.</p>';
    tbody.innerHTML = '<tr><td colspan="7" class="loading-cell">No stocks match the filter.</td></tr>';
    return;
  }

  // ── Card View ──
  container.innerHTML = stocks.map((s, i) => `
    <div class="stock-card ${s.trendKey} ${s.trendKey === 'golden' ? 'golden-glow' : ''}"
         onclick="openModal('${s.symbol}')"
         style="animation-delay:${i * 0.04}s">
      
      <div class="card-top">
        <div>
          <div class="stock-name">${s.name}</div>
          <div class="stock-sector">${s.sector} · ${s.symbol.replace('.NS','')}</div>
        </div>
        <div class="stock-price-block">
          <div class="stock-price">₹${s.price}</div>
          <div class="price-change ${s.priceChange >= 0 ? 'up' : 'down'}">
            ${s.priceChange >= 0 ? '▲' : '▼'} ${Math.abs(s.priceChange)}%
          </div>
        </div>
      </div>

      <div class="card-middle">
        <div class="card-stat">
          <span class="card-stat-label">50 MA</span>
          <span class="card-stat-value ma50-val">₹${s.ma50}</span>
        </div>
        <div class="card-stat">
          <span class="card-stat-label">200 MA</span>
          <span class="card-stat-value ma200-val">₹${s.ma200}</span>
        </div>
        <div class="card-stat">
          <span class="card-stat-label">MA Gap</span>
          <span class="card-stat-value gap-val">${s.maGap}%</span>
        </div>
      </div>

      <div class="card-bottom">
        <div class="crossover-date">
          <span>${s.crossoverDate !== '--' ? '📅 ' + s.crossoverDate : '📅 No recent crossover'}</span>
          <span>${s.crossoverDaysAgo != null ? s.crossoverDaysAgo + ' days ago' : ''}</span>
        </div>
        <span class="trend-badge ${s.trendClass}">${s.trend}</span>
      </div>

    </div>
  `).join('');

  // ── Table View ──
  tbody.innerHTML = stocks.map(s => `
    <tr onclick="openModal('${s.symbol}')">
      <td>
        <div style="font-weight:700">${s.name}</div>
        <div style="font-size:0.75rem;color:var(--text-muted)">${s.symbol.replace('.NS','')}</div>
      </td>
      <td>
        <div>₹${s.price}</div>
        <div class="price-change ${s.priceChange >= 0 ? 'up' : 'down'}" style="display:inline-block;margin-top:2px">
          ${s.priceChange >= 0 ? '▲' : '▼'} ${Math.abs(s.priceChange)}%
        </div>
      </td>
      <td style="color:var(--blue)">₹${s.ma50}</td>
      <td style="color:var(--purple)">₹${s.ma200}</td>
      <td>
        <div>${s.crossoverDate}</div>
        ${s.crossoverDaysAgo != null ? `<div style="font-size:0.75rem;color:var(--text-muted)">${s.crossoverDaysAgo}d ago</div>` : ''}
      </td>
      <td><span class="trend-badge ${s.trendClass}">${s.trend}</span></td>
      <td>${renderSignalBar(s.signalStrength)}</td>
    </tr>
  `).join('');
}

function renderSignalBar(strength) {
  let bars = '';
  for (let i = 1; i <= 5; i++) {
    bars += `<span class="${i <= strength ? 'active' : ''}"></span>`;
  }
  return `<div class="signal-bar">${bars}</div>`;
}

// ============================================================
//  FILTERING, SORTING, SEARCHING
// ============================================================

function filterStocks(type, btn) {
  // Update active button
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.activeFilter = type;
  applyFilter(type);
}

function applyFilter(type) {
  let filtered = [...state.stocks];
  if (type !== 'all') {
    filtered = filtered.filter(s => s.trendKey === type);
  }
  state.filteredStocks = filtered;
  renderCards(filtered);
}

function searchStocks(query) {
  const q = query.toLowerCase();
  const base = state.activeFilter === 'all' 
    ? state.stocks 
    : state.stocks.filter(s => s.trendKey === state.activeFilter);
  
  const filtered = base.filter(s => 
    s.name.toLowerCase().includes(q) ||
    s.symbol.toLowerCase().includes(q) ||
    s.sector.toLowerCase().includes(q)
  );
  renderCards(filtered);
}

function sortTable(field) {
  if (state.sortField === field) {
    state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
  } else {
    state.sortField = field;
    state.sortDir = 'asc';
  }

  const dir = state.sortDir === 'asc' ? 1 : -1;
  state.filteredStocks.sort((a, b) => {
    let va = a[field] ?? '';
    let vb = b[field] ?? '';
    if (!isNaN(parseFloat(va))) {
      return (parseFloat(va) - parseFloat(vb)) * dir;
    }
    return va.toString().localeCompare(vb.toString()) * dir;
  });
  renderCards(state.filteredStocks);
}

// ============================================================
//  CHART MODAL
// ============================================================

let chartInstance = null;

function openModal(symbol) {
  const stock = state.stocks.find(s => s.symbol === symbol);
  if (!stock || !stock.prices.length) {
    showToast('⚠️ Chart data not available');
    return;
  }

  document.getElementById('modalTitle').textContent = `${stock.name} — MA Chart`;
  document.getElementById('modalOverlay').classList.add('open');

  // Build chart
  const ctx = document.getElementById('maChart').getContext('2d');
  if (chartInstance) chartInstance.destroy();

  const labels = stock.dates.map(d => formatDateShort(d));

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Price',
          data: stock.prices,
          borderColor: '#e8e8f0',
          backgroundColor: 'rgba(232,232,240,0.05)',
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.2,
          fill: true,
        },
        {
          label: '50 MA',
          data: stock.ma50History,
          borderColor: '#00b4d8',
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.3,
        },
        {
          label: '200 MA',
          data: stock.ma200History,
          borderColor: '#7c3aed',
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.3,
        },
      ]
    },
    options: {
      responsive: true,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: {
          labels: { color: '#e8e8f0', font: { size: 11 } }
        },
        tooltip: {
          backgroundColor: '#1a1a2e',
          borderColor: '#2a2a4a',
          borderWidth: 1,
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ₹${ctx.parsed.y?.toFixed(2) ?? '--'}`
          }
        }
      },
      scales: {
        x: {
          ticks: { color: '#666688', maxTicksLimit: 8, font: { size: 10 } },
          grid:  { color: 'rgba(255,255,255,0.04)' },
        },
        y: {
          ticks: { color: '#666688', font: { size: 10 },
                   callback: v => '₹' + v.toFixed(0) },
          grid:  { color: 'rgba(255,255,255,0.04)' },
        }
      }
    }
  });

  // Stats
  document.getElementById('modalStats').innerHTML = `
    <div class="modal-stat">
      <span class="modal-stat-label">Current Price</span>
      <span class="modal-stat-value" style="color:var(--gold)">₹${stock.price}</span>
    </div>
    <div class="modal-stat">
      <span class="modal-stat-label">50 Day MA</span>
      <span class="modal-stat-value" style="color:var(--blue)">₹${stock.ma50}</span>
    </div>
    <div class="modal-stat">
      <span class="modal-stat-label">200 Day MA</span>
      <span class="modal-stat-value" style="color:var(--purple)">₹${stock.ma200}</span>
    </div>
    <div class="modal-stat">
      <span class="modal-stat-label">Trend</span>
      <span class="modal-stat-value">
        <span class="trend-badge ${stock.trendClass}">${stock.trend}</span>
      </span>
    </div>
  `;
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

// ============================================================
//  SUMMARY CARDS
// ============================================================

function updateSummaryCards() {
  const counts = { golden: 0, death: 0, bullish: 0, watch: 0 };
  state.stocks.forEach(s => {
    if (s.trendKey === 'golden') counts.golden++;
    else if (s.trendKey === 'death') counts.death++;
    else if (s.trendKey === 'bullish') counts.bullish++;
    else if (s.trendKey === 'watch') counts.watch++;
  });
  document.getElementById('goldenCount').textContent  = counts.golden;
  document.getElementById('deathCount').textContent   = counts.death;
  document.getElementById('bullishCount').textContent = counts.bullish;
  document.getElementById('watchCount').textContent   = counts.watch;
}

// ============================================================
//  NOTIFICATIONS
// ============================================================

async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    showToast('⚠️ Notifications not supported on this browser');
    return;
  }

  const permission = await Notification.requestPermission();

  if (permission === 'granted') {
    state.notifyEnabled = true;
    document.getElementById('notifyStatus').textContent = '✅ Alerts enabled! You\'ll be notified on Golden Crossovers.';
    document.getElementById('notifyBtn').textContent = '✅ Alerts Enabled';
    document.getElementById('notifyBtn').style.background = 'linear-gradient(135deg, #00ff88, #00c96b)';
    showToast('🔔 Push notifications enabled!');

    // Test notification
    setTimeout(() => {
      new Notification('🥇 Golden Crossover Alerts Active', {
        body: 'You will be notified whenever a Nifty 50 stock shows a Golden Crossover!',
        icon: 'icon-192.png'
      });
    }, 1000);

  } else {
    showToast('⚠️ Permission denied. Enable in browser settings.');
    document.getElementById('notifyStatus').textContent = '❌ Permission denied. Enable in browser/OS settings.';
  }
}

// ============================================================
//  UTILITIES
// ============================================================

function startAutoRefresh() {
  if (state.refreshTimer) clearInterval(state.refreshTimer);
  state.refreshTimer = setInterval(() => {
    if (isMarketHours()) refreshData();
  }, CONFIG.REFRESH_INTERVAL);
}

function isMarketHours() {
  const now = new Date();
  // IST offset = UTC + 5:30
  const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  const day = ist.getUTCDay(); // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return false;
  
  const h = ist.getUTCHours();
  const m = ist.getUTCMinutes();
  const mins = h * 60 + m;
  const open  = CONFIG.MARKET_OPEN.hour  * 60 + CONFIG.MARKET_OPEN.minute;
  const close = CONFIG.MARKET_CLOSE.hour * 60 + CONFIG.MARKET_CLOSE.minute;
  return mins >= open && mins <= close;
}

function updateMarketStatus() {
  const el = document.getElementById('marketTime');
  const ist = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000));
  const timeStr = ist.toUTCString().slice(-12, -4); // rough IST time
  
  if (isMarketHours()) {
    el.textContent = `🟢 Market Live · ${timeStr} IST`;
    el.style.color = 'var(--green)';
    el.style.borderColor = 'rgba(0,255,136,0.3)';
    el.style.background  = 'rgba(0,255,136,0.1)';
  } else {
    el.textContent = `🔴 Market Closed · ${timeStr} IST`;
    el.style.color = 'var(--red)';
    el.style.borderColor = 'rgba(255,69,96,0.3)';
    el.style.background  = 'rgba(255,69,96,0.1)';
  }
}

function updateLastUpdated(text) {
  document.getElementById('lastUpdated').textContent = `Last updated: ${text}`;
}

function toggleView() {
  const btn = document.getElementById('viewToggle');
  const cards = document.getElementById('cardsView');
  const table = document.querySelector('.table-section');

  if (state.viewMode === 'card') {
    state.viewMode = 'table';
    btn.textContent = '📱 Card View';
    cards.style.display = 'none';
    table.style.display = 'block';
  } else {
    state.viewMode = 'card';
    btn.textContent = '📋 Table View';
    cards.style.display = 'flex';
    table.style.display = 'none';
  }
}

function showToast(msg, duration = 3000) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

function formatDate(d) {
  if (!d) return '--';
  return d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

function formatDateShort(d) {
  if (!d) return '';
  return d.toLocaleDateString('en-IN', { day:'2-digit', month:'short' });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── PERSIST CROSSOVER MAP ────────────────────────────────────
function saveCrossovers() {
  try { localStorage.setItem('gc_crossovers', JSON.stringify(state.lastCrossoverMap)); }
  catch(e) {}
}

function loadStoredCrossovers() {
  try {
    const stored = localStorage.getItem('gc_crossovers');
    if (stored) state.lastCrossoverMap = JSON.parse(stored);
  } catch(e) {}
}

// ── SERVICE WORKER ───────────────────────────────────────────
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.warn('SW failed:', err));
  }
}