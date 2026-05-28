import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import { connectDB } from './config/db.js';
import { seedApiKeys } from './config/seed.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { initCronJobs } from './schedulers/dailyContentJob.js';

// Routes
import contentRoutes from './routes/contentRoutes.js';
import apiKeyRoutes from './routes/apiKeyRoutes.js';
import notionRoutes from './routes/notionRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import logRoutes from './routes/logRoutes.js';

dotenv.config();

const app = express();

// Connect to Database
connectDB().then(() => {
  // Seed API keys from .env if needed
  seedApiKeys();
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(apiLimiter);

// API Routes
app.use('/api/content', contentRoutes);
app.use('/api/keys', apiKeyRoutes);
app.use('/api/notion', notionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/logs', logRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'AI Content SaaS API is running...' });
});

// Initialize Cron Jobs
initCronJobs();

// Error Handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
