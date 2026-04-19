import { loginUser, registerUser } from "../services/authService.js";

export async function register(req, res, next) {
  try {
    const session = await registerUser(req.body);

    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const session = await loginUser(req.body);

    res.json(session);
  } catch (error) {
    next(error);
  }
}

export function getMe(req, res) {
  res.json({
    user: req.user.toJSON(),
  });
}
