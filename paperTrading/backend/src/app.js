import cors from "cors";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

import authRoutes from "./routes/authRoutes.js";
import indicatorRoutes from "./routes/indicatorRoutes.js";
import marketRoutes from "./routes/marketRoutes.js";
import tradingRoutes from "./routes/tradingRoutes.js";
import { authenticateToken } from "./middleware/authMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(
  cors({
    origin: [
      process.env.BT_FRONTEND_URL || "http://localhost:5173",
      process.env.PT_FRONTEND_URL || "http://localhost:5174"
    ],
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// API routes (must come before static file serving)
// Public routes
app.use("/api/auth", authRoutes);

// Protected trading routes - require authentication
// Note: leaderboard route in tradingRoutes is public (no middleware)
app.use("/api", tradingRoutes);

// Protected routes - require authentication
app.use("/api/data-accessor", authenticateToken, marketRoutes);
app.use("/api/indicator-api", authenticateToken, indicatorRoutes);

// ✅ SERVE FRONTEND STATIC FILES
// Serve the built frontend from the dist folder
// __dirname is paperTrading/backend/src, so we need to go up one level to backend, then to dist
const frontendDistPath = path.join(__dirname, "../dist");
console.log('[PT Backend] __dirname:', __dirname);
console.log('[PT Backend] frontendDistPath:', frontendDistPath);
console.log('[PT Backend] index.html exists:', fs.existsSync(path.join(frontendDistPath, 'index.html')));
app.use(express.static(frontendDistPath));

// Catch-all route to serve index.html for client-side routing
// This must come AFTER all API routes
app.get("*", (req, res) => {
  // Only serve index.html for non-API routes
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(frontendDistPath, "index.html"));
  } else {
    // If it's an API route that wasn't matched, return 404
    res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: `Route ${req.method} ${req.originalUrl} was not found.`,
      },
    });
  }
});

// Error handler
app.use((err, _req, res, _next) => {
  const status = err.statusCode || 500;

  res.status(status).json({
    error: {
      code: err.code || "INTERNAL_SERVER_ERROR",
      message: err.message || "Unexpected server error.",
    },
  });
});

export default app;
