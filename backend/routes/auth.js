import express from 'express';
import { issueToken } from '../middleware/auth.js';
import { config } from '../config/environment.js';

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};

  if (username !== config.AUTH_USERNAME || password !== config.AUTH_PASSWORD) {
    console.warn('[AUTH] Failed login attempt');
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  return res.json({ success: true, token: issueToken(username) });
});

export default router;
