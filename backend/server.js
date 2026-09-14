import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { config } from './config/environment.js';
import { ensurePineconeIndex, connectMongoDB } from './config/database.js';
import routes from './routes/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Trust reverse proxy (Render, Vercel, etc.) for secure cookies & rate-limiting
app.set('trust proxy', 1);

// Validate required environment variables
if (!config.PINECONE_API_KEY) {
  console.error('[ERROR] PINECONE_API_KEY not set in environment variables');
  process.exit(1);
}

 const allowedOrigins = [
  "https://aiknowledgeassistentapplication.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.error(`[CORS] Blocked origin: ${origin}`);
    return callback(new Error(`CORS blocked: ${origin}`));
  },

  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "PATCH",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
  ],

  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

app.use(cookieParser());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Routes
app.use('/', routes);

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
const startServer = async () => {
  try {
    await connectMongoDB();
  } catch (err) {
    console.warn('[SERVER] Warning: MongoDB failed to connect at startup. Authentication routes requiring DB will return 500 until DB is available.', err.message);
  }
  await ensurePineconeIndex();
  app.listen(config.PORT, () => {
    console.log(`AI Knowledge Assistant backend running at http://localhost:${config.PORT}`);
    console.log(`Pinecone index: ${config.INDEX_NAME}`);
  });
};

startServer().catch((error) => {
  console.error('Startup error:', error);
  process.exit(1);
});