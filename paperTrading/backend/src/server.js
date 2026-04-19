import "dotenv/config";
import http from "node:http";

import app from "./app.js";
import { connectDatabase, disconnectDatabase } from "./services/dbService.js";
import { attachWebSocketServer } from "./services/websocketService.js";

const port = Number(process.env.PORT || 5000);
const server = http.createServer(app);
let webSocketServer = null;

function listen(serverPort) {
  return new Promise((resolve, reject) => {
    const handleListenError = (error) => {
      server.off("listening", handleListening);
      reject(error);
    };

    const handleListening = () => {
      server.off("error", handleListenError);
      webSocketServer = attachWebSocketServer(server);
      console.log(`Backend listening on http://localhost:${serverPort}`);
      resolve();
    };

    server.once("error", handleListenError);
    server.once("listening", handleListening);
    server.listen(serverPort);
  });
}

async function startServer() {
  if (process.env.MONGODB_URI) {
    await connectDatabase();
  } else {
    console.warn("MONGODB_URI is not set. Auth persistence is disabled; market data will use synthetic fallback.");
  }

  await listen(port);
}

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down backend.`);
  if (webSocketServer) {
    webSocketServer.close();
  }
  server.close(async () => {
    await disconnectDatabase();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startServer().catch((error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${port} is already in use. Stop the existing backend process or run with another PORT value.`,
    );
  }
  console.error("Failed to start backend:", error);
  process.exit(1);
});
