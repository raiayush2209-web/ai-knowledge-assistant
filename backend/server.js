import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { config } from './config/environment.js';
import { ensurePineconeIndex } from './config/database.js';
import routes from './routes/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Validate required environment variables
if (!config.PINECONE_API_KEY) {
  console.error('[ERROR] PINECONE_API_KEY not set in environment variables');
  process.exit(1);
}
if (!config.MISTRAL_API_KEY) {
  console.error('[ERROR] MISTRAL_API_KEY not set in environment variables');
  process.exit(1);
}

// Middleware
app.use(cors());
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