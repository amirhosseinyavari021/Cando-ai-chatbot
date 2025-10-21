import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  userId: { type: String, required: true, default: 'anonymous' },
  requestType: { type: String, enum: ['TEXT'], required: true },
  // Added OpenRouter model ID
  modelUsed: { type: String, enum: ['QWEN2.5_3B', 'QWEN2_1.8B', 'QWEN2_7B', 'OPENROUTER_GPTOSS', 'NONE'], required: true },
  status: { type: String, enum: ['SUCCESS', 'ERROR'], required: true },
  errorMessage: { type: String },
  prompt: { type: String },
  response: { type: String },
  latency: { type: Number },
}, { timestamps: false });

// Pre-save hook remains the same for Ollama models if they are still logged
logSchema.pre('save', function (next) {
  if (this.modelUsed === 'Qwen2.5:3B') { this.modelUsed = 'QWEN2.5_3B'; }
  else if (this.modelUsed === 'qwen2:1.8b-instruct') { this.modelUsed = 'QWEN2_1.8B'; }
  else if (this.modelUsed === 'qwen2:7b-instruct') { this.modelUsed = 'QWEN2_7B'; }
  // No mapping needed for OPENROUTER_GPTOSS as it's already the identifier
  next();
});

const Log = mongoose.model('Log', logSchema);
export default Log;