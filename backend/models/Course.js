import mongoose from 'mongoose';

/**
 * UPDATED: This schema now includes new Persian fields for detailed
 * course information (price, registration, explanations) and
 * a new weighted text index for smarter RAG searching.
 */
const courseSchema = new mongoose.Schema(
  {
    // --- Original Fields (kept for compatibility) ---
    title: { type: String },
    instructor_name: { type: String },
    mode: { type: String }, // e.g., 'آنلاین', 'حضوری'
    registration_status: { type: String }, // e.g., 'در حال ثبت نام'
    start_date: { type: String },
    price: { type: Number },

    // --- NEW Persian Fields (as requested) ---
    'دوره': { type: String, required: true },
    'استاد': { type: String },
    'توضیح': { type: String }, // Detailed explanation
    'شهریه حضوری': { type: String },
    'شهریه حضوری با تخفیف': { type: String },
    'شهریه آنلاین': { type: String }, // Added for completeness
    'شهریه آنلاین با تخفیف': { type: String },
    'لینک ثبت‌نام': { type: String },
    'نوع برگزاری': { type: String }, // e.g., 'حضوری', 'آنلاین', 'هردو'

    // --- Original Fields (remaining) ---
    capacity: { type: Number },
    duration_hours: { type: Number },
    prerequisites: { type: String },
    syllabus_link: { type: String },
    tags: { type: [String], index: true },
    instructor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Instructor',
      index: true,
    },
  },
  {
    timestamps: true,
    strict: false, // Allow other fields from DB
  }
);

// --- Indexes from Contract ---
// 1. UPDATED Weighted Text Index
courseSchema.index(
  {
    // New Persian fields with weights
    'دوره': 10,
    'استاد': 6,
    'توضیح': 5,
    'شهریه حضوری': 4,
    'شهریه آنلاین با تخفیف': 4,

    // Original fields (lower weight)
    title: 3,
    instructor_name: 2,
    tags: 1,
  },
  {
    name: 'course_weighted_text_search_index',
    default_language: 'none', // Use 'none' for multilingual/Persian fields
  }
);

// 2. Scalar Indexes (Unchanged)
courseSchema.index({ mode: 1, registration_status: 1 });

const Course = mongoose.model('Course', courseSchema);

export default Course;