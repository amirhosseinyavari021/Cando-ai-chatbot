import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  userId: { type: String, required: true, default: 'anonymous' },
  requestType: { type: String, enum: ['TEXT'], required: true }, // Only TEXT
  // Updated model names
  modelUsed: { type: String, enum: ['QWEN2_7B', 'NONE'], required: true },
  status: { type: String, enum: ['SUCCESS', 'ERROR'], required: true },
  errorMessage: { type: String },
  prompt: { type: String },
  response: { type: String },
  latency: { type: Number },
}, { timestamps: false });

const Log = mongoose.model('Log', logSchema);
export default Log;