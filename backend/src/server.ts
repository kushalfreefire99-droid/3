import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import path from 'path';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables FIRST before any other imports
dotenv.config({ path: join(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import { generateRouter } from './routes/generate.js';
import { buildRouter } from './routes/build.js';
import { healthRouter } from './routes/health.js';
import { adminRouter } from './routes/admin.js';
import { authRouter } from './routes/auth.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { loadStorage } from './storage/fileStorage.js';
import { discordBot } from './services/discordBot.js';

// Load storage from files
console.log('[SERVER] Loading storage...');
await loadStorage();

// Start Discord bot
console.log('[SERVER] Starting Discord bot...');
discordBot.start().catch(err => {
  console.error('[SERVER] Failed to start Discord bot:', err);
});

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(globalLimiter);

// Routes
app.use('/api', generateRouter);
app.use('/api/build', buildRouter);
app.use('/api', healthRouter);
app.use('/api/admin', adminRouter);
app.use('/api/auth', authRouter);

// Serve static files from frontend build in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));
  
  // Handle React routing - send all non-API requests to index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
