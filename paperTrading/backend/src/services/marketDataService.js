const TIMEFRAME_MINUTES = {
  M1: 1,
  M5: 5,
  M15: 15,
  M30: 30,
  H1: 60,
  H4: 240,
  D1: 1440,
};

const BASE_MARKETS = [
  { symbol: "AAPL", exchange: "NASDAQ", market_type: "Stock", basePrice: 192, volatility: 0.012, min_move: 0.01 },
  { symbol: "BTCUSD", exchange: "CRYPTO", market_type: "Crypto", basePrice: 69000, volatility: 0.035, min_move: 0.01 },
  { symbol: "EURUSD", exchange: "FX", market_type: "Forex", basePrice: 1.08, volatility: 0.004, min_move: 0.00001 },
  { symbol: "RELIANCE", exchange: "NSE", market_type: "Stock", basePrice: 2920, volatility: 0.014, min_move: 0.05 },
  { symbol: "TCS", exchange: "NSE", market_type: "Stock", basePrice: 3840, volatility: 0.012, min_move: 0.05 },
  { symbol: "INFY", exchange: "NSE", market_type: "Stock", basePrice: 1490, volatility: 0.013, min_move: 0.05 },
  { symbol: "HDFCBANK", exchange: "NSE", market_type: "Stock", basePrice: 1680, volatility: 0.011, min_move: 0.05 },
  { symbol: "ICICIBANK", exchange: "NSE", market_type: "Stock", basePrice: 1120, volatility: 0.012, min_move: 0.05 },
  { symbol: "SBIN", exchange: "NSE", market_type: "Stock", basePrice: 780, volatility: 0.016, min_move: 0.05 },
  { symbol: "NIFTY50", exchange: "NSE", market_type: "Index", basePrice: 22500, volatility: 0.008, min_move: 0.05 },
  { symbol: "SENSEX", exchange: "BSE", market_type: "Index", basePrice: 74000, volatility: 0.008, min_move: 0.05 },
];

const customMarkets = new Map();
const liveCandleStore = new Map();
const marketStateStore = new Map();

function normalizeSymbol(symbol) {
  return String(symbol || "").trim().toUpperCase();
}

function marketKey(symbol, exchange = "") {
  return `${normalizeSymbol(symbol)}:${String(exchange || "").trim().toUpperCase()}`;
}

function toPublicMarket(market) {
  return {
    symbol: market.symbol,
    exchange: market.exchange,
    market_type: market.market_type,
    min_move: market.min_move,
    base_price: market.basePrice,
    volatility_profile: market.volatility >= 0.03 ? "high" : market.volatility <= 0.005 ? "low" : "medium",
  };
}

function hashString(input) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededNoise(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function getTimeframeMs(timeframe) {
  const map = {
    M1: 2000,
    M5: 3000,
    M15: 5000,
    M30: 7000,
  };

  return map[timeframe] || map.M1;
}

function roundToMinMove(value, minMove) {
  return Number((Math.round(value / minMove) * minMove).toFixed(Math.max(0, String(minMove).split(".")[1]?.length || 0)));
}

function getAllMarketDefinitions() {
  return [...BASE_MARKETS, ...customMarkets.values()];
}

function getSeedPrice(symbol, exchange = "") {
  return findMarket(symbol, exchange).basePrice;
}

function getMarketState(key) {
  if (!marketStateStore.has(key)) {
    marketStateStore.set(key, {
      trend: "SIDEWAYS",
      volatility: 0.002,
      lastTrendChange: Date.now(),
    });
  }

  return marketStateStore.get(key);
}

export function updateMarketState(key) {
  const state = getMarketState(key);
  const now = Date.now();

  if (now - state.lastTrendChange > 20000) {
    const r = Math.random();

    if (r < 0.33) state.trend = "BULLISH";
    else if (r < 0.66) state.trend = "BEARISH";
    else state.trend = "SIDEWAYS";

    state.volatility = 0.001 + Math.random() * 0.004;
    state.lastTrendChange = now;
  }

  return state;
}

export function generatePriceMove(open, key) {
  const { trend, volatility } = getMarketState(key);
  let drift = 0;

  if (trend === "BULLISH") drift = 0.0005;
  if (trend === "BEARISH") drift = -0.0005;
  if (trend === "SIDEWAYS") drift = 0;

  const noise = (Math.random() - 0.5) * volatility;
  const revert = -0.1 * noise;
  let spike = 0;

  if (Math.random() > 0.98) {
    spike = (Math.random() - 0.5) * volatility * 8;
  }

  return open * (1 + drift + noise + revert + spike);
}

export function getMarkets() {
  return getAllMarketDefinitions().map(toPublicMarket);
}

export function addMarket(input) {
  const symbol = normalizeSymbol(input.symbol);
  const exchange = String(input.exchange || "LOCAL").trim().toUpperCase();

  if (!symbol) {
    const error = new Error("Symbol is required.");
    error.statusCode = 400;
    throw error;
  }

  const market = {
    symbol,
    exchange,
    market_type: input.market_type || "Stock",
    basePrice: Number(input.base_price || input.basePrice || 100),
    volatility: Number(input.volatility || 0.012),
    min_move: Number(input.min_move || 0.01),
  };

  customMarkets.set(marketKey(symbol, exchange), market);
  return toPublicMarket(market);
}

export function removeMarket(symbol, exchange = "") {
  const normalizedSymbol = normalizeSymbol(symbol);
  const removedCustom = customMarkets.delete(marketKey(normalizedSymbol, exchange));
  const isBaseMarket = BASE_MARKETS.some((market) => market.symbol === normalizedSymbol);

  return { removed: removedCustom || isBaseMarket };
}

export function findMarket(symbol, exchange = "") {
  const normalizedSymbol = normalizeSymbol(symbol);
  const normalizedExchange = String(exchange || "").trim().toUpperCase();

  return (
    getAllMarketDefinitions().find((market) => (
      market.symbol === normalizedSymbol &&
      (!normalizedExchange || market.exchange === normalizedExchange)
    )) ||
    BASE_MARKETS[0]
  );
}

export function generateSyntheticCandles(symbol, {
  timeframe = "M1",
  startMs = null,
  endMs = null,
  limit = 500,
  exchange = "",
} = {}) {
  const market = findMarket(symbol, exchange);
  const timeframeMs = getTimeframeMs(timeframe);
  const candleLimit = Math.max(1, Math.min(Number(limit) || 500, 5000));
  const alignedNow = Math.floor(Date.now() / timeframeMs) * timeframeMs;
  const lastTimestamp = endMs ? Math.floor((Number(endMs) - timeframeMs) / timeframeMs) * timeframeMs : alignedNow;
  const firstTimestamp = startMs
    ? Math.floor(Number(startMs) / timeframeMs) * timeframeMs
    : lastTimestamp - (candleLimit - 1) * timeframeMs;
  const symbolHash = hashString(`${market.symbol}:${market.exchange}`);
  const candles = [];

  for (let timestamp = firstTimestamp; timestamp <= lastTimestamp && candles.length < candleLimit; timestamp += timeframeMs) {
    const step = Math.floor(timestamp / timeframeMs);
    const regime = Math.sin((step + symbolHash) / 144);
    const trend = regime * market.volatility * market.basePrice * 0.08;
    const wave = Math.sin((step + symbolHash) / 19) * market.volatility * market.basePrice;
    const noise = (seededNoise(step + symbolHash) - 0.5) * market.volatility * market.basePrice * 1.8;
    const spikeSeed = seededNoise(Math.floor(step / 37) + symbolHash);
    const spike = spikeSeed > 0.985 ? (spikeSeed - 0.985) * market.basePrice * market.volatility * 12 : 0;
    const close = Math.max(market.min_move, market.basePrice + trend + wave + noise + spike);
    const previousClose = candles.length ? candles[candles.length - 1].close : close - noise * 0.4;
    const open = previousClose;
    const wick = Math.max(market.min_move, Math.abs(close - open) + market.basePrice * market.volatility * (0.15 + seededNoise(step) * 0.4));
    const high = Math.max(open, close) + wick * seededNoise(step + 11);
    const low = Math.max(market.min_move, Math.min(open, close) - wick * seededNoise(step + 23));

    candles.push({
      symbol: market.symbol,
      exchange: market.exchange,
      timeframe,
      timestamp_ms: timestamp,
      open: roundToMinMove(open, market.min_move),
      high: roundToMinMove(high, market.min_move),
      low: roundToMinMove(low, market.min_move),
      close: roundToMinMove(close, market.min_move),
      volume: Math.round(1000 + seededNoise(step + 41) * 25000),
    });
  }

  return candles.length > 0 ? candles : generateSyntheticCandles(symbol, { timeframe, limit: candleLimit, exchange });
}

export function generateLiveCandle(symbol, timeframe = "M1", exchange = "") {
  return nextSyntheticCandle(symbol, timeframe, exchange);
}

export function nextSyntheticCandle(symbol, timeframe = "M1", exchange = "") {
  const market = findMarket(symbol, exchange);
  const key = `${market.symbol}:${market.exchange}:${timeframe}`;
  const state = updateMarketState(key);
  const candles = liveCandleStore.get(key) || [];
  const last = candles[candles.length - 1];
  const timeframeMs = getTimeframeMs(timeframe);
  const now = Date.now();

  let timestamp;

  if (!last) {
    timestamp = now;
  } else {
    const lastTime = last.timestamp_ms;

    if (now - lastTime >= timeframeMs) {
      timestamp = lastTime + timeframeMs;
    } else {
      timestamp = lastTime;
    }
  }

  const open = last ? last.close : getSeedPrice(market.symbol, market.exchange);
  const close = generatePriceMove(open, key);
  const range = Math.max(Math.abs(close - open), open * state.volatility * 0.1);
  const high = Math.max(open, close) + range * Math.random();
  const low = Math.max(market.min_move, Math.min(open, close) - range * Math.random());

  const candle = {
    symbol: market.symbol,
    exchange: market.exchange,
    timeframe,
    timestamp_ms: timestamp,
    open: roundToMinMove(open, market.min_move),
    high: roundToMinMove(high, market.min_move),
    low: roundToMinMove(low, market.min_move),
    close: roundToMinMove(close, market.min_move),
    volume: Math.random() * 1000,
  };

  if (!last || timestamp !== last.timestamp_ms) {
    candles.push(candle);
  } else {
    candles[candles.length - 1] = candle;
  }

  liveCandleStore.set(key, candles);
  return candles[candles.length - 1];
}

export function clearCandles() {
  return { removed: true };
}
