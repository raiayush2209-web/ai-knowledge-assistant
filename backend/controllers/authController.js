import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { issueToken, getAuthCookieOptions, COOKIE_NAME } from '../middleware/auth.js';

// Password strength validator: minimum 8 chars, at least one letter and one number
const isStrongPassword = (password) => {
  if (typeof password !== 'string' || password.length < 8) return false;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasLetter && hasNumber;
};

// Username validation: 3-30 chars, alphanumeric, dashes, underscores
const isValidUsername = (username) => {
  if (typeof username !== 'string') return false;
  const trimmed = username.trim();
  return /^[a-zA-Z0-9_-]{3,30}$/.test(trimmed);
};

// Email validation
const isValidEmail = (email) => {
  if (typeof email !== 'string') return false;
  const trimmed = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
};

/**
 * POST /api/auth/register
 * Body: { username, email, password }
 */
export const register = async (req, res) => {
  try {
    let { username, email, password } = req.body || {};

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username, email, and password are required.',
      });
    }

    username = username.trim();
    email = email.trim().toLowerCase();

    if (!isValidUsername(username)) {
      return res.status(400).json({
        success: false,
        error: 'Username must be 3-30 characters long and contain only letters, numbers, underscores, or dashes.',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address.',
      });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long and contain both letters and numbers.',
      });
    }

    // Check if username or email already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      if (existingUser.username.toLowerCase() === username.toLowerCase()) {
        return res.status(409).json({
          success: false,
          error: 'Username is already taken.',
        });
      }
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists.',
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = await User.create({
      username,
      email,
      passwordHash,
    });

    // Generate JWT
    const token = issueToken(newUser);

    // Set HTTP-only cookie
    res.cookie(COOKIE_NAME, token, getAuthCookieOptions());

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user: {
        id: newUser._id.toString(),
        username: newUser.username,
        email: newUser.email,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error('[REGISTER ERROR]', error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'Username or email is already registered.',
      });
    }
    return res.status(500).json({
      success: false,
      error: 'An error occurred during registration. Please try again.',
    });
  }
};

/**
 * POST /api/auth/login
 * Body: { identifier (or username or email), password }
 */
export const login = async (req, res) => {
  try {
    let { identifier, username, email, password } = req.body || {};
    const loginIdentifier = (identifier || username || email || '').trim();

    if (!loginIdentifier || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username/email and password are required.',
      });
    }

    // Lookup by username or lowercase email
    const user = await User.findOne({
      $or: [
        { username: loginIdentifier },
        { email: loginIdentifier.toLowerCase() },
      ],
    });

    // Generic invalid credential response to prevent user enumeration
    const invalidCredentialsMessage = 'Invalid username/email or password.';

    if (!user) {
      // Dummy compare to mitigate timing attacks
      await bcrypt.compare(password, '$2a$12$e8YqJmX8q2E0Z4oG7q9R9.4yv5BvH3qX3vB2a7l8v1k3r2t1a1b1c');
      return res.status(401).json({
        success: false,
        error: invalidCredentialsMessage,
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: invalidCredentialsMessage,
      });
    }

    // Generate JWT
    const token = issueToken(user);

    // Set HTTP-only cookie
    res.cookie(COOKIE_NAME, token, getAuthCookieOptions());

    return res.json({
      success: true,
      message: 'Logged in successfully.',
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('[LOGIN ERROR]', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred during login. Please try again.',
    });
  }
};

/**
 * POST /api/auth/logout
 */
export const logout = async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
    });

    return res.json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    console.error('[LOGOUT ERROR]', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred during logout.',
    });
  }
};

/**
 * GET /api/auth/me
 * Requires authenticate middleware
 */
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found or session expired.',
      });
    }

    return res.json({
      success: true,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('[GET CURRENT USER ERROR]', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user session.',
    });
  }
};
