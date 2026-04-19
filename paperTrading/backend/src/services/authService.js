import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import User from "../models/user.js";

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 12);

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required for authentication.");
  }

  return process.env.JWT_SECRET;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function validateCredentials(email, password) {
  if (!email || !password) {
    const error = new Error("Email and password are required.");
    error.statusCode = 400;
    error.code = "AUTH_VALIDATION_ERROR";
    throw error;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const error = new Error("A valid email address is required.");
    error.statusCode = 400;
    error.code = "AUTH_INVALID_EMAIL";
    throw error;
  }

  if (String(password).length < 8) {
    const error = new Error("Password must be at least 8 characters.");
    error.statusCode = 400;
    error.code = "AUTH_WEAK_PASSWORD";
    throw error;
  }
}

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    getJwtSecret(),
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      issuer: "paper-trading-backend",
      audience: "paper-trading-client",
    },
  );
}

function buildSession(user) {
  return {
    user: user.toJSON(),
    token: signToken(user),
  };
}

export async function registerUser({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  validateCredentials(normalizedEmail, password);

  const existingUser = await User.findOne({ email: normalizedEmail }).lean();
  if (existingUser) {
    const error = new Error("An account with this email already exists.");
    error.statusCode = 409;
    error.code = "AUTH_EMAIL_EXISTS";
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await User.create({
    email: normalizedEmail,
    passwordHash,
  });

  return buildSession(user);
}

export async function loginUser({ email, password }) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    const error = new Error("Email and password are required.");
    error.statusCode = 400;
    error.code = "AUTH_VALIDATION_ERROR";
    throw error;
  }

  const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");
  if (!user || !user.isActive) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    error.code = "AUTH_INVALID_CREDENTIALS";
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    error.code = "AUTH_INVALID_CREDENTIALS";
    throw error;
  }

  user.lastLoginAt = new Date();
  await user.save();

  return buildSession(user);
}

export async function verifySessionToken(token) {
  try {
    // Try to verify with issuer/audience first (for PaperTrading-generated tokens)
    try {
      const payload = jwt.verify(token, getJwtSecret(), {
        issuer: "paper-trading-backend",
        audience: "paper-trading-client",
      });

      const user = await User.findById(payload.sub);
      if (!user || !user.isActive) {
        const error = new Error("Session is no longer valid.");
        error.statusCode = 401;
        error.code = "AUTH_SESSION_INVALID";
        throw error;
      }

      return user;
    } catch (err) {
      // If issuer/audience verification fails, try without them (for BrokenTrade tokens)
      if (err.name === 'JsonWebTokenError' && err.message.includes('issuer')) {
        const payload = jwt.verify(token, getJwtSecret());
        
        // For BrokenTrade tokens, use 'id' field instead of 'sub'
        const userId = payload.id || payload.sub;
        const user = await User.findById(userId);
        
        if (!user || !user.isActive) {
          const error = new Error("Session is no longer valid.");
          error.statusCode = 401;
          error.code = "AUTH_SESSION_INVALID";
          throw error;
        }

        return user;
      }
      throw err;
    }
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }

    const authError = new Error("Invalid or expired session token.");
    authError.statusCode = 401;
    authError.code = "AUTH_TOKEN_INVALID";
    throw authError;
  }
}
