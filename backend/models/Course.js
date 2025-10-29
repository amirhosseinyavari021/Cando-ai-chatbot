import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    instructor_id: { type: String, required: true, index: true },
    instructor_name: { type: String, required: true, trim: true },
    days: [{ type: String }],
    hours: { type: String },
    start_date: { type: String },
    end_date: { type: String },
    capacity: { type: Number },
    syllabus: [{ type: String }],
    duration_hours: { type: Number },
    price: { type: Number },
    installment_available: { type: Boolean, default: false },
    level: { type: String },
    prerequisites: [{ type: String }],
    benefits: [{ type: String }],
    mode: {
      type: String,
      enum: ['online', 'in-person', 'hybrid'],
      required: true,
    },
    registration_status: {
      type: String,
      enum: ['open', 'closed', 'waitlist'],
      default: 'closed',
    },
    lang: { type: String, default: 'fa' },
    last_updated_at: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'last_updated_at' },
    collection: 'courses',
  }
);

// --- Indexes from Contract ---

// 1. Text Index
courseSchema.index(
  { title: 'text', instructor_name: 'text' },
  { default_language: 'none' } // Use 'none' for multilingual fields or if stemming is not desired
);

// 2. Scalar Indexes
// (instructor_id is already indexed via `index: true` in schema)
courseSchema.index({ mode: 1, registration_status: 1 });

const Course = mongoose.model('Course', courseSchema);
export default Course;