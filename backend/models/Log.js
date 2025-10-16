import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  userId: { type: String, required: true, default: 'anonymous' },
  requestType: { type: String, enum: ['TEXT', 'IMAGE'], required: true },
  modelUsed: { type: String, enum: ['OLLAMA3', 'LIARA', 'NONE', 'KNOWLEDGE_BASE'], required: true },
  status: { type: String, enum: ['SUCCESS', 'ERROR', 'FALLBACK_SUCCESS'], required: true },
  errorMessage: { type: String },
  prompt: { type: String },
  response: { type: String },
  latency: { type: Number }, // Time taken in ms
}, { timestamps: false });

const Log = mongoose.model('Log', logSchema);
export default Log;