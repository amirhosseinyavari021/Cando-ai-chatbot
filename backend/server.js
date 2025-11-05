// ============================================
// 🧠 Cando Chatbot Backend (Refactored)
// ============================================

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import asyncHandler from 'express-async-handler'; // <-- (NEW) Import a-sync handler
import connectDB from './config/db.js';
import aiRoutes from './routes/aiRoutes.js';
import { getAIResponse } from './controllers/aiController.js'; // <-- (NEW) Import controller
import { notFound, errorHandler } from './middleware/errorHandler.js';
import logger from './middleware/logger.js';

// --- Connect to Database ---
connectDB();

const app = express();
const PORT = process.env.PORT || 5001;

// --- Core Middleware ---
app.use(cors());
app.use(express.json({ limit: '10mb' }));
// Use 'morgan' for logging HTTP requests, integrating with our logger
app.use(
  morgan('dev', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

// ============================================
// 📍 API Routes
// ============================================

// --- AI Chat Routes ---
// All AI-related traffic (e.g., /api/ai/chat) is handled here.
app.use('/api/ai', aiRoutes);

// --- (NEW FIX) Catch old frontend endpoint ---
// The frontend is still calling /api/chat/stream, which we removed.
// This adds it back and points it directly to the new getAIResponse controller.
app.post('/api/chat/stream', asyncHandler(getAIResponse));
app.post('/api/ai/ask', asyncHandler(getAIResponse)); // Also ensure legacy /ask works

// ============================================
// ❌ Error Handling
// ============================================
app.use(notFound);
app.use(errorHandler);

// ============================================
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});