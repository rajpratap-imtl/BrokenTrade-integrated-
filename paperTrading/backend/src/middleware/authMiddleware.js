import jwt from "jsonwebtoken";
import SharedUser from "../models/sharedUser.js";
import { verifySessionToken } from "../services/authService.js";

function readBearerToken(req) {
  const authorization = req.headers.authorization || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

export async function protect(req, _res, next) {
  try {
    const token = readBearerToken(req);

    if (!token) {
      const error = new Error("Bearer token is required.");
      error.statusCode = 401;
      error.code = "AUTH_TOKEN_REQUIRED";
      throw error;
    }

    req.user = await verifySessionToken(token);
    next();
  } catch (error) {
    next(error);
  }
}

// New authentication middleware for shared authentication
export async function authenticateToken(req, res, next) {
  console.log('[PT Auth] ===== authenticateToken called =====');
  console.log('[PT Auth] Method:', req.method);
  console.log('[PT Auth] Path:', req.path);
  console.log('[PT Auth] All headers:', JSON.stringify(req.headers, null, 2));
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  console.log('[PT Auth] Authorization header:', authHeader ? 'present' : 'missing');
  if (authHeader) {
    console.log('[PT Auth] Full auth header:', authHeader);
  }
  console.log('[PT Auth] Token extracted:', token ? token.substring(0, 50) + '...' : 'null');
  console.log('[PT Auth] JWT_SECRET configured:', !!process.env.JWT_SECRET);

  if (!token) {
    console.log('[PT Auth] No token provided, returning MISSING_TOKEN error');
    return res.status(401).json({
      error: {
        code: 'MISSING_TOKEN',
        message: 'Authentication token is required',
      },
    });
  }

  try {
    console.log('[PT Auth] Verifying JWT token...');
    
    // Try to verify token (works for both BrokenTrade and PaperTrading tokens)
    let decoded;
    try {
      // First try with issuer/audience (PaperTrading tokens)
      console.log('[PT Auth] Trying to verify with issuer/audience...');
      decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: "paper-trading-backend",
        audience: "paper-trading-client",
      });
      console.log('[PT Auth] Token verified with issuer/audience');
    } catch (err) {
      // If that fails, try without issuer/audience (BrokenTrade tokens)
      console.log('[PT Auth] Issuer/audience verification failed:', err.message);
      if (err.name === 'JsonWebTokenError' && (err.message.includes('issuer') || err.message.includes('audience'))) {
        console.log('[PT Auth] Retrying without issuer/audience...');
        decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('[PT Auth] Token verified without issuer/audience');
      } else {
        throw err;
      }
    }
    
    console.log('[PT Auth] Token decoded successfully:', { id: decoded.id, sub: decoded.sub, email: decoded.email });
    
    // Fetch user from shared database
    // For BrokenTrade tokens, use 'id' field; for PaperTrading tokens, use 'sub'
    const userId = decoded.id || decoded.sub;
    console.log('[PT Auth] Fetching user from database, ID:', userId);
    let user = await SharedUser.findById(userId).select('-password');
    
    if (!user) {
      console.log('[PT Auth] User not found in database for ID:', userId);
      console.log('[PT Auth] Creating temporary user object from token data');
      
      // If user not found, create a temporary user object from token data
      // This allows BrokenTrade users to access PaperTrading
      user = {
        _id: userId,
        id: userId,
        email: decoded.email,
        name: decoded.name || 'User',
        type: decoded.type || 'Learner',
        coins: 100000,
      };
      
      console.log('[PT Auth] Temporary user created:', user.email);
    } else {
      console.log('[PT Auth] User found in database:', user.email);
    }

    req.user = user;
    console.log('[PT Auth] User attached to request, proceeding to next middleware');
    next();
  } catch (err) {
    console.log('[PT Auth] Token verification failed:', err.name, err.message);
    console.log('[PT Auth] Error stack:', err.stack);
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Your session has expired. Please log in again.',
        },
      });
    }
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid authentication token',
        },
      });
    }

    return res.status(500).json({
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed: ' + err.message,
      },
    });
  }
}
