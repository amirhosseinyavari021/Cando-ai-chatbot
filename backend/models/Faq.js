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
    collection: 'candosite_faq', // <-- SPECIFIED COLLECTION
  }
);

// --- Indexes ---
faqSchema.index(
  { question: 'text', answer: 'text' },
  { default_language: 'none' }
);

faqSchema.index({ tags: 1 });

const Faq = mongoose.model('Faq', faqSchema);
export default Faq;