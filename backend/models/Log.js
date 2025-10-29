import mongoose from 'mongoose';

const logSchema = new mongoose.Schema(
  {
    timestamp: { type: Date, default: Date.now },
    userId: { type: String, required: true, default: 'anonymous' },
    requestType: { type: String, enum: ['TEXT', 'VOICE'], required: true },
    modelUsed: { type: String, required: true },
    status: { type: String, enum: ['SUCCESS', 'ERROR', 'FALLBACK_SUCCESS'], required: true },
    errorMessage: { type: String },
    prompt: { type: String },
    response: { type: String },
    latency: { type: Number },
  },
  { timestamps: false } // Disable default timestamps, we have our own
);

const Log = mongoose.model('Log', logSchema);
export default Log;