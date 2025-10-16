import mongoose from 'mongoose';

const faqSchema = new mongoose.Schema({
  question: { type: String, required: true, trim: true },
  answer: { type: String, required: true },
  language: { type: String, enum: ['en', 'fa'], default: 'en' },
  keywords: [{ type: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const Faq = mongoose.model('Faq', faqSchema);
export default Faq;