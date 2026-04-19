import {
  getAccount,
  getLeaderboard,
  listPositions,
  listTrades,
  placeOrder,
  resetAccount,
} from "../services/orderService.js";

export async function createOrder(req, res, next) {
  try {
    res.status(201).json(await placeOrder(req.user.id, req.body));
  } catch (error) {
    next(error);
  }
}

export async function getPositions(req, res, next) {
  try {
    res.json(await listPositions(req.user.id));
  } catch (error) {
    next(error);
  }
}

export async function getTrades(req, res, next) {
  try {
    res.json(await listTrades(req.user.id));
  } catch (error) {
    next(error);
  }
}

export async function getAccountSummary(req, res, next) {
  try {
    res.json(await getAccount(req.user.id));
  } catch (error) {
    next(error);
  }
}

export async function getLeaderboardRows(_req, res, next) {
  try {
    res.json(await getLeaderboard());
  } catch (error) {
    next(error);
  }
}

export async function resetTrainingAccount(req, res, next) {
  try {
    res.json(await resetAccount(req.user.id));
  } catch (error) {
    next(error);
  }
}
