import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config/environment.js';
import { ensurePineconeIndex } from './config/database.js';
import routes from './routes/index.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Routes
app.use('/', routes);

// Production static file serving
if (config.NODE_ENV === 'production') {
  app.use(express.static(path.join(process.cwd(), '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(process.cwd(), '../frontend/dist', 'index.html'));
  });
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