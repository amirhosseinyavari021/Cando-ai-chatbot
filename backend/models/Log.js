import mongoose from 'mongoose';

const logSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      index: true,
      default: 'anonymous',
    },
    prompt: {
      type: String,
      required: true,
    },
    response: {
      type: String,
      required: true,
    },
    provider: {
      type: String,
    },
    modelUsed: {
      type: String,
    },
    latency: {
      type: Number, // in ms
    },
    contextUsed: {
      type: Boolean,
      default: false,
    },
    requestType: {
      type: String,
      // FIX: 'ai_query' اضافه شد
      enum: ['faq', 'course', 'instructor', 'general', 'ai_query'],
      default: 'general',
    },
    status: {
      type: String,
      // FIX: 'success' اضافه شد
      enum: ['pending', 'failed', 'partial', 'success'],
      default: 'pending',
    },
    feedback: {
      type: Number, // e.g., 1 for upvote, -1 for downvote
    },
    error: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Log = mongoose.model('Log', logSchema);
export default Log;