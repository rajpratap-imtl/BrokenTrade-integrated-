import { generateSyntheticCandles } from "./marketDataService.js";

const INDICATORS = [
  {
    id: "sma",
    name: "Simple Moving Average",
    parameters: { period: { default: 20, min: 1, max: 200 } },
    outputs: { value: { plotOptions: {} } },
    overlay: true,
  },
  {
    id: "rsi",
    name: "Relative Strength Index",
    parameters: { period: { default: 14, min: 1, max: 100 } },
    outputs: { value: { plotOptions: {} } },
    overlay: false,
  },
  {
    id: "macd",
    name: "MACD",
    parameters: {
      fast: { default: 12, min: 1, max: 100 },
      slow: { default: 26, min: 1, max: 200 },
      signal: { default: 9, min: 1, max: 100 },
    },
    outputs: {
      macd: { plotOptions: {} },
      signal: { plotOptions: {} },
      histogram: { plotOptions: {} },
    },
    overlay: false,
  },
  {
    id: "bbands",
    name: "Bollinger Bands",
    parameters: {
      period: { default: 20, min: 1, max: 200 },
      stdDev: { default: 2, min: 0.1, max: 5 },
    },
    outputs: {
      upper: { plotOptions: {} },
      middle: { plotOptions: {} },
      lower: { plotOptions: {} },
    },
    overlay: true,
  },
];

function numberParam(parameters, name, fallback) {
  const raw = parameters?.[name];
  const value = typeof raw === "object" && raw !== null ? raw.value : raw;
  return Number(value || fallback);
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function ema(values, period) {
  const multiplier = 2 / (period + 1);
  const out = [];
  let previous = values[0];

  for (const value of values) {
    previous = value * multiplier + previous * (1 - multiplier);
    out.push(previous);
  }

  return out;
}

function round(value) {
  return Number(value.toFixed(6));
}

function calculateIndicator(indicatorId, candles, parameters = {}) {
  const closes = candles.map((candle) => candle.close);

  if (indicatorId === "rsi") {
    const period = numberParam(parameters, "period", 14);
    return candles.map((candle, index) => {
      if (index < period) return { timestamp_ms: candle.timestamp_ms, value: 50 };
      let gains = 0;
      let losses = 0;
      for (let i = index - period + 1; i <= index; i += 1) {
        const change = closes[i] - closes[i - 1];
        if (change >= 0) gains += change;
        else losses += Math.abs(change);
      }
      const rs = losses === 0 ? 100 : gains / losses;
      return { timestamp_ms: candle.timestamp_ms, value: round(100 - 100 / (1 + rs)) };
    });
  }

  if (indicatorId === "macd") {
    const fast = numberParam(parameters, "fast", 12);
    const slow = numberParam(parameters, "slow", 26);
    const signalPeriod = numberParam(parameters, "signal", 9);
    const fastEma = ema(closes, fast);
    const slowEma = ema(closes, slow);
    const macdLine = fastEma.map((value, index) => value - slowEma[index]);
    const signalLine = ema(macdLine, signalPeriod);
    return candles.map((candle, index) => ({
      timestamp_ms: candle.timestamp_ms,
      macd: round(macdLine[index]),
      signal: round(signalLine[index]),
      histogram: round(macdLine[index] - signalLine[index]),
    }));
  }

  if (indicatorId === "bbands") {
    const period = numberParam(parameters, "period", 20);
    const stdDev = numberParam(parameters, "stdDev", 2);
    return candles.map((candle, index) => {
      const window = closes.slice(Math.max(0, index - period + 1), index + 1);
      const middle = average(window);
      const variance = average(window.map((value) => (value - middle) ** 2));
      const band = Math.sqrt(variance) * stdDev;
      return {
        timestamp_ms: candle.timestamp_ms,
        upper: round(middle + band),
        middle: round(middle),
        lower: round(middle - band),
      };
    });
  }

  const period = numberParam(parameters, "period", 20);
  return candles.map((candle, index) => {
    const window = closes.slice(Math.max(0, index - period + 1), index + 1);
    return { timestamp_ms: candle.timestamp_ms, value: round(average(window)) };
  });
}

export function listIndicators() {
  return INDICATORS.map(({ id, name }) => ({ id, name }));
}

export function getIndicatorPayload(indicatorId, query, body = {}) {
  const indicator = INDICATORS.find((item) => item.id === String(indicatorId).toLowerCase()) || INDICATORS[0];
  const candles = generateSyntheticCandles(query.symbol, {
    timeframe: query.timeframe || "M1",
    endMs: query.end_ms,
    limit: query.limit || 500,
    exchange: query.exchange,
  });
  const parameters = body.parameters || {};

  return {
    indicator_info: {
      name: indicator.name,
      parameters: indicator.parameters,
      outputs: indicator.outputs,
      overlay: indicator.overlay,
    },
    indicator_data: calculateIndicator(indicator.id, candles, parameters),
  };
}
