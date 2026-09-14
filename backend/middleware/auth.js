import jwt from 'jsonwebtoken';
import { config } from '../config/environment.js';

export const COOKIE_NAME = 'auth_token';

/**
 * Cookie options configured for cross-site cookie handling:
 * When frontend is on Vercel (https://...) and backend is on Render (https://...),
 * sameSite must be 'none' and secure must be true.
 * For local development on HTTP, sameSite can be 'lax' and secure false.
 */
export const getAuthCookieOptions = () => {
  const isProduction = config.NODE_ENV === 'production' || process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    path: '/',
  };
};

/**
 * Extract token from cookies or Authorization header (fallback for backward compatibility/curl)
 */
export const extractToken = (req) => {
  if (req.cookies && req.cookies[COOKIE_NAME]) {
    return req.cookies[COOKIE_NAME];
  }

  const authorization = req.get('authorization') || '';
  const [scheme, token] = authorization.split(' ');
  if (scheme === 'Bearer' && token) {
    return token;
  }

  return null;
};

/**
 * Middleware to authenticate requests using JWT.
 * Attaches decoded user { id, username, namespace } to req.user
 */
export const authenticate = (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in.',
    });
  }

  if (!config.JWT_SECRET) {
    console.error('[AUTH ERROR] JWT_SECRET is not configured.');
    return res.status(500).json({
      success: false,
      message: 'Internal authentication configuration error.',
    });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    const userId = decoded.sub || decoded.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token claims.',
      });
    }

    req.user = {
      id: userId,
      username: decoded.username,
      namespace: `user_${userId}`,
    };

    next();
  } catch (error) {
    console.warn('[AUTH] Token verification failed:', error.name);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.',
    });
  }
};

/**
 * Issue a signed JWT for the user.
 * Minimum claims: sub (User MongoDB _id), username.
 */
export const issueToken = (user) => {
  if (!config.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set in environment variables');
  }

  const userId = user._id ? user._id.toString() : user.id;

  return jwt.sign(
    {
      sub: userId,
      username: user.username,
    },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN || '7d' }
  );
};
