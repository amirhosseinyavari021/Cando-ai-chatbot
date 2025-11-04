import mongoose from 'mongoose';

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
    'شهریه حضوری با تخTفیف': { type: String },
    'شهریه آنلاین': { type: String }, // Added for completeness
    'شهریه آنلاین با تخTفیف': { type: String },
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
    collection: 'candosite_courses', // <-- SPECIFIED COLLECTION
  }
);

// --- Indexes ---
courseSchema.index(
  {
    'دوره': 10,
    'استاد': 6,
    'توضیح': 5,
    title: 3,
    instructor_name: 2,
    tags: 1,
  },
  {
    name: 'course_weighted_text_search_index',
    default_language: 'none',
  }
);

courseSchema.index({ mode: 1, registration_status: 1 });

const Course = mongoose.model('Course', courseSchema);

export default Course;