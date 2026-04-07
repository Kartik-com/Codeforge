import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter, authLimiter, aiLimiter } from './middleware/rateLimit.js';
import authRoutes from './routes/auth.js';
import problemRoutes from './routes/problems.js';
import submissionRoutes from './routes/submissions.js';
import statsRoutes from './routes/stats.js';
import aiRoutes from './routes/ai.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS
app.use(cors({
  origin: true, // Allow all origins for easier deployment readiness
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting for API routes
app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);
app.use('/api/ai/', aiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    time: new Date().toISOString(),
    aiConfigured: !!config.openaiApiKey && config.openaiApiKey !== 'your-openai-api-key-here',
  });
});

// Serve frontend in production (Deployment Ready)
// The dist folder will exist one level up from server (i.e. ../client/dist) or we can specify it cleanly
const clientBuildPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientBuildPath));

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// Error handler
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`\n🔥 CodeForge AI Server running on port ${config.port}`);
  console.log(`   Environment: ${config.nodeEnv}`);
  console.log(`   AI: ${config.openaiApiKey ? '✅ Configured' : '⚠️ Not configured (fallback mode)'}`);
  console.log(`   Serving static UI from: ${clientBuildPath}\n`);
});

export default app;
