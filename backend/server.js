import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import { requestDetailsLogger } from './middleware/logger.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import chatRoutes from './routes/chatRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import logRoutes from './routes/logRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from a .env file in the current directory
dotenv.config({ path: path.resolve(__dirname, '.env') });

connectDB();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestDetailsLogger);

app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/logs', logRoutes);

app.get('/api', (req, res) => {
  res.json({ message: 'Cando AI Chatbot API is online.' });
});

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✅ Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});