import mongoose from 'mongoose';

/**
 * UPDATED: This schema now uses the exact Persian field names as requested
 * for RAG compatibility.
 *
 * 'strict: false' is enabled to allow for any other fields that may
 * exist in the database but are not defined here.
 */
const courseSchema = new mongoose.Schema(
  {
    'دوره': {
      type: String,
      required: true,
    },
    'استاد': {
      type: String,
    },
    'تاریخ شروع': {
      type: String, // Kept as String for flexibility with imported data
    },
    'شهریه آنلاین با تخفیف': {
      type: String, // Kept as String
    },
    'پیش نیاز (دوره) (Product)': {
      type: String,
    },
    'لینک سرفصل (دوره) (Product)': {
      type: String,
    },
    'شیوه برگزاری': {
      type: String, // e.g., "آنلاین", "حضوری"
    },
    'سانس': {
      type: String, // e.g., "17:00-19:00"
    },
    // Adding other fields from the old schema just in case,
    // but the Persian fields are primary.
    title: { type: String },
    instructor_name: { type: String },
    mode: { type: String },
    registration_status: { type: String },
  },
  {
    timestamps: true,
    // As requested: keep strict: false
    strict: false,
  }
);

// --- Indexes from Contract ---
// 1. Text Index (UPDATED to use Persian fields)
courseSchema.index(
  {
    'دوره': 'text',
    'استاد': 'text',
    // Also index the old fields for broader search
    title: 'text',
    instructor_name: 'text',
  },
  {
    default_language: 'none', // Use 'none' for multilingual fields
    name: 'course_text_search_index',
  }
);

// 2. Scalar Indexes
courseSchema.index({ 'شیوه برگزاری': 1, registration_status: 1 });
courseSchema.index({ 'استاد': 1 });

const Course = mongoose.model('Course', courseSchema);

export default Course;