// ============================================
// 🧠 Cando Chatbot Backend (Final Stable Build)
// ============================================

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
const { default: OpenAI } = await import('openai');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// ============================================
// 🗄️ Database
// ============================================
const mongoUri =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  'mongodb://127.0.0.1:27017/cando-ai-db';

mongoose
  .connect(mongoUri, { serverSelectionTimeoutMS: 5000 })
  .then(() => console.log('🗄️  MongoDB Connected:', mongoUri))
  .catch((err) => console.error('❌ MongoDB connection error:', err.message));

// ============================================
// 🤖 OpenAI Config
// ============================================
const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.AI_PRIMARY_MODEL || 'gpt-4.1';
const promptId = process.env.AI_PRIMARY_PROMPT_ID || 'none';
const aiTimeout = parseInt(process.env.AI_TIMEOUT_MS || '15000', 10);

if (!apiKey) {
  console.error('❌ Missing OPENAI_API_KEY in .env');
  process.exit(1);
}

const openai = new OpenAI({ apiKey });

console.log('🧠 AI Config initialized:');
console.log('   🔑 OPENAI_API_KEY:', apiKey ? '✅' : '❌');
console.log('   🧩 AI_PRIMARY_PROMPT_ID:', promptId && promptId !== 'none' ? '✅' : '❌');
console.log('   ⚙️  Model:', model);

// ============================================
// 🧩 Chat Endpoint (Handles both /ask + /stream)
// ============================================
app.all(['/api/ai/ask', '/api/chat/stream'], async (req, res) => {
  try {
    const userMessage = req.body.text || req.body.message;
    if (!userMessage) return res.status(400).json({ error: 'Empty message' });

    console.log(`🗣️ User: ${userMessage}`);

    // ✅ Correct placement of timeout option
    const completion = await openai.responses.create(
      {
        model,
        input: [
          {
            role: 'system',
            content: `You are Cando Chatbot, the AI assistant of Cando Academy. Use this PROMPT_ID: ${promptId}`,
          },
          { role: 'user', content: userMessage },
        ],
      },
      { timeout: aiTimeout }
    );

    const output =
      completion.output?.[0]?.content?.[0]?.text ||
      '⚠️ No response generated.';

    console.log(`🤖 AI → ${output.slice(0, 60)}...`);
    res.status(200).json({ text: output });
  } catch (err) {
    console.error('❌ AI error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// 404 Handler
// ============================================
app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

// ============================================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
