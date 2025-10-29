import mongoose from 'mongoose';

const faqSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true },
    category: { type: String, index: true },
    tags: [{ type: String }],
    lang: { type: String, default: 'fa' },
    confidence: { type: Number, default: 1.0 },
  },
  {
    timestamps: true,
    collection: 'faq',
  }
);

// --- Indexes from Contract ---

// 1. Text Index
faqSchema.index(
  { question: 'text', answer: 'text' },
  { default_language: 'none' }
);

// 2. Tags Index
faqSchema.index({ tags: 1 });

const Faq = mongoose.model('Faq', faqSchema);
export default Faq;