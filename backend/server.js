import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// --- راه‌حل: بارگذاری .env در همین ابتدا و با مسیردهی صحیح ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });
// --- پایان راه‌حل ---

import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import { requestDetailsLogger } from './middleware/logger.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

// --- Import New Routes ---
import aiRoutes from './routes/ai.js';
import courseRoutes from './routes/courses.js';
import instructorRoutes from './routes/instructors.js';
import faqRoutes from './routes/faq.js';
// import adminRoutes from './routes/adminRoutes.js';
// import logRoutes from './routes/logRoutes.js';

// (dotenv.config() از اینجا حذف شد چون به بالای فایل منتقل شد)

// Connect to MongoDB (will safely skip if MONGODB_URI is not set)
connectDB();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestDetailsLogger); // Log all incoming requests

// --- Use New API Routes ---
app.use('/api/ai', aiRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/instructors', instructorRoutes);
app.use('/api/faq', faqRoutes);

// --- Old routes (can be kept if admin panel is still used) ---
// app.use('/api/admin', adminRoutes);
// app.use('/api/logs', logRoutes);

app.get('/api', (req, res) => {
  res.json({ message: 'Cando AI Chatbot API is online.' });
});

// --- Serve Frontend Static Files (if in production) ---
if (process.env.NODE_ENV === 'production') {
  const frontendDistPath = path.resolve(__dirname, '..', 'frontend', 'dist');

  // Check if the dist directory exists
  if (fs.existsSync(frontendDistPath)) {
    app.use(express.static(frontendDistPath));

    // Handle SPA fallback
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
  console.log(
    `✅ Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
  );
});