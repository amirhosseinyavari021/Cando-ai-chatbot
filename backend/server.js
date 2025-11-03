import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path, { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js'; // Added .js
import { errorHandler } from './middleware/errorHandler.js'; // Added .js
import { setupLogger, httpLogger } from './middleware/logger.js'; // Added .js

// Import routes
import aiRoutes from './routes/aiRoutes.js'; // Added .js
import adminRoutes from './routes/adminRoutes.js'; // Added .js
import logRoutes from './routes/logRoutes.js'; // Added .js
import roadmapRoutes from './routes/roadmap.js'; // Added .js

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// --- ESM-safe __dirname setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Setup app-level logger
setupLogger(app);
app.use(httpLogger);

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  })
);

// --- API Routes ---
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/roadmap', roadmapRoutes); // Use the new roadmap routes

// --- Serve Frontend ---
if (process.env.NODE_ENV === 'production') {
  const buildPath = join(__dirname, '../frontend/dist'); // Use join
  app.use(express.static(buildPath));

  app.get('*', (req, res) =>
    res.sendFile(path.resolve(buildPath, 'index.html'))
  );
} else {
  app.get('/', (req, res) => {
    res.send('Cando AI API is running...');
  });
}

// --- Error Handler ---
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
  )
);