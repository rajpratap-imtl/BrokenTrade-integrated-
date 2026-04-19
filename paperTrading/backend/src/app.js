import cors from "cors";
import express from "express";

import authRoutes from "./routes/authRoutes.js";
import indicatorRoutes from "./routes/indicatorRoutes.js";
import marketRoutes from "./routes/marketRoutes.js";
import tradingRoutes from "./routes/tradingRoutes.js";
import { authenticateToken } from "./middleware/authMiddleware.js";

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

// Public routes
app.use("/api/auth", authRoutes);

// Protected trading routes - require authentication
// Note: leaderboard route in tradingRoutes is public (no middleware)
app.use("/api", tradingRoutes);

// Protected routes - require authentication
app.use("/api/data-accessor", authenticateToken, marketRoutes);
app.use("/api/indicator-api", authenticateToken, indicatorRoutes);
app.use("/", marketRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.originalUrl} was not found.`,
    },
  });
});

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
