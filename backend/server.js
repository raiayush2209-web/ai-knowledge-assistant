import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { config } from './config/environment.js';
import { ensurePineconeIndex } from './config/database.js';
import routes from './routes/index.js';
import authRoutes from './routes/auth.js';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Validate required environment variables
if (!config.PINECONE_API_KEY) {
  console.error('[ERROR] PINECONE_API_KEY not set in environment variables');
  process.exit(1);
}
if (!config.GEMINI_API_KEY) {
  console.error('[ERROR] GEMINI_API_KEY not set in environment variables');
  process.exit(1);
}
if (!config.JWT_SECRET || !config.AUTH_USERNAME || !config.AUTH_PASSWORD) {
  console.error('[ERROR] JWT_SECRET, AUTH_USERNAME, and AUTH_PASSWORD must be configured');
  process.exit(1);
}

// Middleware
app.use(helmet());
const corsOptions = {
  origin: config.NODE_ENV === 'production' ? config.FRONTEND_URL : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/', routes);

app.use((error, req, res, next) => {
  console.error('[HTTP ERROR]', error.message);
  if (res.headersSent) return next(error);
  const status = error.code === 'LIMIT_FILE_SIZE' || error.code === 'LIMIT_FILE_COUNT' ? 413 : 400;
  return res.status(status).json({ success: false, message: status === 413 ? 'Request is too large.' : 'Invalid request.' });
});

// Production static file serving
if (config.NODE_ENV === 'production') {
  // Try multiple possible paths for frontend build
  const possiblePaths = [
    path.join(__dirname, '..', 'frontend', 'dist'),  // Relative: ../frontend/dist
    path.join(__dirname, '..', '..', 'frontend', 'dist'),  // From subdirectory: ../../frontend/dist
    '/opt/render/project/frontend/dist',  // Render specific path
    process.env.FRONTEND_BUILD_PATH || '',  // Environment variable override
  ].filter(Boolean);

  let frontendPath = null;
  for (const tryPath of possiblePaths) {
    if (existsSync(tryPath)) {
      frontendPath = tryPath;
      console.log(`[SERVER] Frontend build found at: ${frontendPath}`);
      break;
    }
  }

  if (frontendPath) {
    app.use(express.static(frontendPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(frontendPath, 'index.html'));
    });
  } else {
    console.warn('[SERVER] Frontend build not found. Serving API only.');
    console.warn('[SERVER] Checked paths:', possiblePaths.join(' | '));
  }
}

// Server startup
let server;
const startServer = async () => {
  try {
    await ensurePineconeIndex();
    server = app.listen(config.PORT, () => {
      console.log(`AI Knowledge Assistant backend running at http://localhost:${config.PORT}`);
      console.log(`Pinecone index: ${config.INDEX_NAME}`);
    });
  } catch (error) {
    console.error('Failed to initialize Pinecone or start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
const shutdown = () => {
  console.log('Shutting down gracefully...');
  if (server) {
    server.close(() => {
      console.log('Closed out remaining connections.');
      process.exit(0);
    });
    
    // Force close after 10s
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);