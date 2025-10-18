import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  userId: { type: String, required: true, default: 'anonymous' },
  requestType: { type: String, enum: ['TEXT'], required: true },
  // Add new model identifier to enum
  modelUsed: { type: String, enum: ['QWEN2.5_3B', 'QWEN2_1.8B', 'QWEN2_7B', 'NONE'], required: true }, // QWEN2_1.8B kept for potential future use
  status: { type: String, enum: ['SUCCESS', 'ERROR'], required: true },
  errorMessage: { type: String },
  prompt: { type: String },
  response: { type: String },
  latency: { type: Number },
}, { timestamps: false });

// Update pre-save hook to map the new model name
logSchema.pre('save', function (next) {
  if (this.modelUsed === 'Qwen2.5:3B') { // Map the actual model name used in code
    this.modelUsed = 'QWEN2.5_3B';
  } else if (this.modelUsed === 'qwen2:1.8b-instruct') { // Keep mapping for 1.8b
    this.modelUsed = 'QWEN2_1.8B';
  } else if (this.modelUsed === 'qwen2:7b-instruct') { // Keep mapping for 7b
    this.modelUsed = 'QWEN2_7B';
  }
  next();
});

const Log = mongoose.model('Log', logSchema);
export default Log;