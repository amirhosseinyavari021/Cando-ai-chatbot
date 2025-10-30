// ================== Load Environment Variables (.env) ==================
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Force dotenv to load .env from backend folder explicitly
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

// Debug logs (you can remove them later)
console.log(`🧩 .env loaded from: ${envPath}`);
console.log('🔑 OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Loaded' : '❌ Missing');
console.log('🧠 AI_PRIMARY_PROMPT_ID:', process.env.AI_PRIMARY_PROMPT_ID ? '✅ Loaded' : '❌ Missing');
// ======================================================================

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import connectDB from './config/db.js';
import { requestDetailsLogger } from './middleware/logger.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

// --- Import New Routes ---
import aiRoutes from './routes/ai.js';
import courseRoutes from './routes/courses.js';
// 🔸 instructors.js موقتاً غیرفعال شده تا ارور نده
// import instructorRoutes from './routes/instructors.js';
import faqRoutes from './routes/faq.js';
// import adminRoutes from './routes/adminRoutes.js';
// import logRoutes from './routes/logRoutes.js';

// --- Connect to MongoDB ---
connectDB();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestDetailsLogger); // Log all incoming requests

// --- Use API Routes ---
app.use('/api/ai', aiRoutes);
app.use('/api/courses', courseRoutes);
// app.use('/api/instructors', instructorRoutes);
app.use('/api/faq', faqRoutes);

// --- Base API route ---
app.get('/api', (req, res) => {
  res.json({ message: 'Cando AI Chatbot API is online.' });
});

// --- Serve Frontend (Production Mode) ---
if (process.env.NODE_ENV === 'production') {
  const frontendDistPath = path.resolve(__dirname, '..', 'frontend', 'dist');

  if (fs.existsSync(frontendDistPath)) {
    app.use(express.static(frontendDistPath));

    app.get('*', (req, res) => {
      res.sendFile(path.resolve(frontendDistPath, 'index.html'));
    });
  } else {
    console.warn(`⚠️  Production mode: 'frontend/dist' directory not found.`);
    console.warn(`   Run 'npm run build' in the 'frontend' directory.`);
  }
}

// --- Error Handlers ---
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✅ Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
