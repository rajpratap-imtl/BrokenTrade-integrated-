import { Router } from "express";

import {
  calculateIndicator,
  listAvailableIndicators,
} from "../controllers/indicatorController.js";

const router = Router();

router.get("/indicators", listAvailableIndicators);
router.post("/indicators/:indicatorId", calculateIndicator);

export default router;
