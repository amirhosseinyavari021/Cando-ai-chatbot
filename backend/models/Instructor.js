import mongoose from 'mongoose';

const instructorSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    gender: { type: String, default: null },
    degree: { type: String, default: null },
    experience_years: { type: Number, default: null },
    subjects: [{ type: String }],
    bio: { type: String, default: null },
  },
  {
    timestamps: true,
    collection: 'instructors',
  }
);

// --- Indexes from Contract ---

// 1. Text Index
instructorSchema.index({ name: 'text' }, { default_language: 'none' });

const Instructor = mongoose.model('Instructor', instructorSchema);
export default Instructor;