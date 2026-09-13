import jwt from 'jsonwebtoken';
import { config } from '../config/environment.js';

export const authenticate = (req, res, next) => {
  const authorization = req.get('authorization') || '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  try {
    req.user = jwt.verify(token, config.JWT_SECRET);
    next();
  } catch (error) {
    console.warn('[AUTH] Rejected invalid bearer token');
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
};

export const issueToken = (username) => jwt.sign(
  { sub: username, namespace: `user_${username}` },
  config.JWT_SECRET,
  { expiresIn: config.JWT_EXPIRES_IN },
);
