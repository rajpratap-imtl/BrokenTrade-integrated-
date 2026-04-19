import {
  addMarket,
  clearCandles,
  generateSyntheticCandles,
  getMarkets,
  removeMarket,
} from "../services/marketDataService.js";

export function listMarkets(_req, res) {
  res.json(getMarkets());
}

export function createMarket(req, res, next) {
  try {
    res.status(201).json(addMarket(req.body));
  } catch (error) {
    next(error);
  }
}

export function deleteMarket(req, res) {
  res.json(removeMarket(req.params.symbol, req.query.exchange));
}

export function listCandles(req, res) {
  const candles = generateSyntheticCandles(req.params.symbol, {
    timeframe: req.query.timeframe || "M1",
    startMs: req.query.start_ms,
    endMs: req.query.end_ms,
    limit: req.query.limit,
    exchange: req.query.exchange,
  });

  res.json(candles);
}

export function uploadCandles(_req, res) {
  res.status(202).json({ accepted: true });
}

export function deleteCandles(_req, res) {
  res.json(clearCandles());
}
