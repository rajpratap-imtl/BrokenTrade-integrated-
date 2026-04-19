import { WebSocketServer } from "ws";

import { verifySessionToken } from "./authService.js";
import * as marketDataService from "./marketDataService.js";
import { updatePositionsForCandle } from "./orderService.js";

const STREAM_PATH = "/stream";
const TICK_INTERVAL_MS = 1000;
const STREAM_SYMBOLS = ["HDFCBANK", "RELIANCE", "BTCUSD"];
const STREAM_TIMEFRAME = "M15";

function subscriptionKey({ symbol, timeframe }) {
  return `${symbol}:${timeframe || "M1"}`;
}

function sendJson(ws, payload) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function broadcastJson(wss, payload) {
  const message = JSON.stringify(payload);

  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
}

function sendPnlUpdate(wss, position) {
  const payload = {
    type: "PNL_UPDATE",
    positionId: position.id,
    userId: position.userId.toString(),
    symbol: position.symbol,
    pnl: position.pnl,
    price: position.currentPrice,
  };

  wss.clients.forEach((client) => {
    if (client.readyState === 1 && client.userId === payload.userId) {
      sendJson(client, payload);
    }
  });
}

export function attachWebSocketServer(server) {
  const wss = new WebSocketServer({ server, path: STREAM_PATH });
  const services = { marketDataService };
  const subscriptions = new Map();

  wss.on("connection", (ws) => {
    ws.subscriptions = new Map();

    ws.on("message", async (rawMessage) => {
      let message;
      try {
        message = JSON.parse(rawMessage.toString());
      } catch {
        sendJson(ws, { type: "error", message: "Invalid JSON message." });
        return;
      }

      if (message.type === "authenticate" && message.token) {
        try {
          const user = await verifySessionToken(message.token);
          ws.userId = user.id;
          sendJson(ws, { type: "authenticated" });
        } catch {
          sendJson(ws, { type: "authError" });
        }
        return;
      }

      if (message.type === "subscribeCandles") {
        const symbol = String(message.symbol || "").toUpperCase();
        const timeframe = message.timeframe || "M1";
        if (!symbol) return;

        const key = subscriptionKey({ symbol, timeframe });
        ws.subscriptions.set(key, { symbol, timeframe, exchange: message.exchange || "" });
        subscriptions.set(ws, ws.subscriptions);
        sendJson(ws, { type: "subscribed", channel: "candles", symbol, timeframe });
        return;
      }

      if (message.type === "unsubscribeCandles") {
        ws.subscriptions.delete(subscriptionKey(message));
        return;
      }

      if (message.type === "subscribeIndicator" || message.type === "unsubscribeIndicator") {
        sendJson(ws, {
          type: message.type === "subscribeIndicator" ? "subscribed" : "unsubscribed",
          channel: "indicator",
          clientIndicatorId: message.clientIndicatorId,
        });
      }
    });

    ws.on("close", () => {
      subscriptions.delete(ws);
    });
  });

  const interval = setInterval(() => {
    for (const [ws, clientSubscriptions] of subscriptions.entries()) {
      for (const subscription of clientSubscriptions.values()) {
        const candle = services.marketDataService.nextSyntheticCandle(
          subscription.symbol,
          subscription.timeframe,
          subscription.exchange,
        );
        sendJson(ws, {
          type: "candleUpdate",
          ...candle,
        });
      }
    }
  }, TICK_INTERVAL_MS);

  wss.on("close", () => {
    clearInterval(interval);
  });

  startMarketStream(services, wss);

  return wss;
}

export function startMarketStream(services, wss) {
  const interval = setInterval(async () => {
    for (const symbol of STREAM_SYMBOLS) {
      const candle = services.marketDataService.nextSyntheticCandle(symbol, STREAM_TIMEFRAME);
      broadcastJson(wss, {
        type: "CANDLE_UPDATE",
        symbol,
        timeframe: STREAM_TIMEFRAME,
        candle,
      });

      try {
        const positions = await updatePositionsForCandle(candle);
        for (const position of positions) {
          sendPnlUpdate(wss, position);
        }
      } catch (error) {
        if (error.name !== "MongooseError") {
          console.error("Failed to update live PnL:", error);
        }
      }
    }
  }, TICK_INTERVAL_MS);

  wss.on("close", () => {
    clearInterval(interval);
  });

  return interval;
}
