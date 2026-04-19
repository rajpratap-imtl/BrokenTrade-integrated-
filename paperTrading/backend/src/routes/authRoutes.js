import { Router } from "express";

import { getMe, login, register } from "../controllers/authController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticateToken, getMe);

// Shared authentication endpoints
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      type: req.user.type,
      coins: req.user.coins,
    },
  });
});

router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'PaperTrading backend is running',
    requiresAuth: true 
  });
});

export default router;
