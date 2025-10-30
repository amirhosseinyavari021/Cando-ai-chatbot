// backend/services/conversationMemory.js
import mongoose from 'mongoose';

const convSchema = new mongoose.Schema(
  {
    sessionId: { type: String, index: true },
    userId: { type: String, index: true },
    turns: [
      {
        role: { type: String, enum: ['user', 'assistant'], required: true },
        text: { type: String, required: true },
        ts: { type: Date, default: Date.now },
      },
    ],
    updatedAt: { type: Date, default: Date.now },
  },
  { minimize: true }
);

convSchema.index({ sessionId: 1 }, { unique: true });

let Conversation;
try {
  Conversation = mongoose.model('Conversation');
} catch {
  Conversation = mongoose.model('Conversation', convSchema);
}

const MAX_TURNS = 8;

export async function appendTurn({ sessionId, userId, role, text }) {
  const update = {
    $push: { turns: { $each: [{ role, text, ts: new Date() }], $slice: -MAX_TURNS } },
    $set: { updatedAt: new Date(), userId },
  };
  await Conversation.updateOne({ sessionId }, update, { upsert: true });
}

export async function getHistory(sessionId) {
  const doc = await Conversation.findOne({ sessionId }).lean();
  if (!doc?.turns?.length) return '';
  const lines = doc.turns.map((t) => `${t.role === 'user' ? 'User' : 'Assistant'}: ${t.text}`);
  let out = lines.join('\n');
  if (out.length > 1000) out = out.slice(-1000);
  return out;
}
