import Order from "../models/order.js";
import Position from "../models/position.js";
import Trade from "../models/trade.js";
import User from "../models/user.js";
import { generateLiveCandle } from "./marketDataService.js";

const STARTING_BALANCE = 100000;
const MAX_POSITION_VALUE = 500000;

function normalizeSymbol(symbol) {
  return String(symbol || "").trim().toUpperCase();
}

function makeError(message, statusCode = 400, code = "TRADING_ERROR") {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

function calculatePnl(position) {
  return (position.currentPrice - position.avgPrice) * position.quantity;
}

export async function getAccount(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw makeError("User account was not found.", 404, "ACCOUNT_NOT_FOUND");
  }

  return {
    balance: user.balance,
    startingBalance: STARTING_BALANCE,
    profit: user.balance - STARTING_BALANCE,
  };
}

export async function placeOrder(userId, { symbol, type, quantity }) {
  const normalizedSymbol = normalizeSymbol(symbol);
  const normalizedType = String(type || "").trim().toUpperCase();
  const orderQuantity = Number(quantity);

  if (!normalizedSymbol) {
    throw makeError("Symbol is required.", 400, "ORDER_SYMBOL_REQUIRED");
  }

  if (!["BUY", "SELL"].includes(normalizedType)) {
    throw makeError("Order type must be BUY or SELL.", 400, "ORDER_TYPE_INVALID");
  }

  if (!Number.isFinite(orderQuantity) || orderQuantity <= 0) {
    throw makeError("Quantity must be greater than zero.", 400, "ORDER_QUANTITY_INVALID");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw makeError("User account was not found.", 404, "ACCOUNT_NOT_FOUND");
  }

  const marketCandle = generateLiveCandle(normalizedSymbol, "M15");
  const price = Number(marketCandle.close);
  const notional = price * orderQuantity;

  if (normalizedType === "BUY") {
    if (notional > user.balance) {
      throw makeError("Insufficient paper balance.", 400, "INSUFFICIENT_BALANCE");
    }

    if (notional > MAX_POSITION_VALUE) {
      throw makeError("Order exceeds maximum position size.", 400, "POSITION_LIMIT_EXCEEDED");
    }

    let position = await Position.findOne({ userId, symbol: normalizedSymbol });
    if (position) {
      const totalQuantity = position.quantity + orderQuantity;
      const totalCost = position.avgPrice * position.quantity + notional;
      position.quantity = totalQuantity;
      position.avgPrice = totalCost / totalQuantity;
      position.currentPrice = price;
      position.pnl = calculatePnl(position);
      await position.save();
    } else {
      position = await Position.create({
        userId,
        symbol: normalizedSymbol,
        quantity: orderQuantity,
        avgPrice: price,
        currentPrice: price,
        pnl: 0,
      });
    }

    user.balance -= notional;
    await user.save();

    const order = await Order.create({
      userId,
      symbol: normalizedSymbol,
      type: normalizedType,
      quantity: orderQuantity,
      price,
      status: "FILLED",
    });

    return { order, position, account: await getAccount(userId) };
  }

  const position = await Position.findOne({ userId, symbol: normalizedSymbol });
  if (!position || position.quantity < orderQuantity) {
    throw makeError("Not enough position quantity to sell.", 400, "POSITION_NOT_ENOUGH");
  }

  const profit = (price - position.avgPrice) * orderQuantity;
  user.balance += notional;
  await user.save();

  const trade = await Trade.create({
    userId,
    symbol: normalizedSymbol,
    entryPrice: position.avgPrice,
    exitPrice: price,
    quantity: orderQuantity,
    profit,
  });

  position.quantity -= orderQuantity;
  position.currentPrice = price;
  position.pnl = calculatePnl(position);

  if (position.quantity <= 0) {
    await position.deleteOne();
  } else {
    await position.save();
  }

  const order = await Order.create({
    userId,
    symbol: normalizedSymbol,
    type: normalizedType,
    quantity: orderQuantity,
    price,
    status: "FILLED",
  });

  return { order, trade, position: position.quantity > 0 ? position : null, account: await getAccount(userId) };
}

export async function listPositions(userId) {
  return Position.find({ userId }).sort({ updatedAt: -1 });
}

export async function listTrades(userId) {
  return Trade.find({ userId }).sort({ createdAt: -1 }).limit(100);
}

export async function getLeaderboard() {
  const users = await User.find({ isActive: true })
    .select("email balance createdAt")
    .sort({ balance: -1 })
    .limit(25)
    .lean();

  return users.map((user, index) => ({
    rank: index + 1,
    email: user.email,
    balance: user.balance,
    profit: user.balance - STARTING_BALANCE,
    createdAt: user.createdAt,
  }));
}

export async function updatePositionsForCandle(candle) {
  if (!candle?.symbol || !Number.isFinite(Number(candle.close))) {
    return [];
  }

  const symbol = normalizeSymbol(candle.symbol);
  const currentPrice = Number(candle.close);
  const positions = await Position.find({ symbol });

  await Promise.all(
    positions.map(async (position) => {
      position.currentPrice = currentPrice;
      position.pnl = calculatePnl(position);
      await position.save();
      return position;
    }),
  );

  return positions;
}

export async function resetAccount(userId) {
  await Promise.all([
    Order.deleteMany({ userId }),
    Position.deleteMany({ userId }),
    Trade.deleteMany({ userId }),
    User.findByIdAndUpdate(userId, { balance: STARTING_BALANCE }),
  ]);

  return getAccount(userId);
}
