import { Router } from "express";

import {
  createOrder,
  getAccountSummary,
  getLeaderboardRows,
  getPositions,
  getTrades,
  resetTrainingAccount,
} from "../controllers/tradingController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/orders", authenticateToken, createOrder);
router.get("/positions", authenticateToken, getPositions);
router.get("/trades", authenticateToken, getTrades);
router.get("/account", authenticateToken, getAccountSummary);
router.post("/account/reset", authenticateToken, resetTrainingAccount);
router.get("/leaderboard", getLeaderboardRows);  // Public route

export default router;
