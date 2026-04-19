import { Router } from "express";

import {
  createMarket,
  deleteCandles,
  deleteMarket,
  listCandles,
  listMarkets,
  uploadCandles,
} from "../controllers/marketController.js";

const router = Router();

router.get("/markets", listMarkets);
router.post("/markets", createMarket);
router.delete("/markets/:symbol", deleteMarket);
router.get("/candles/:symbol", listCandles);
router.post("/candles", uploadCandles);
router.delete("/candles/:symbol", deleteCandles);

export default router;
