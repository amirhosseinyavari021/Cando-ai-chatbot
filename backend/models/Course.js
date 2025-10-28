import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  instructor: { type: String, required: true, trim: true },
  description: { type: String },
  schedule: { type: String }, // مثلا: "شنبه‌ها و دوشنبه‌ها ساعت ۱۸ تا ۲۱"
  fee: { type: String }, // به صورت رشته ذخیره می‌کنیم که انعطاف‌پذیر باشه (مثلا "۵,۰۰۰,۰۰۰ تومان")
  link: { type: String }, // لینک ثبت‌نام یا اطلاعات بیشتر
  keywords: [{ type: String }],
}, { timestamps: true });

// === مهم ===
// ایندکس متنی برای جستجوی بهینه
// این به مانگو دی‌بی میگه که چطور توی این کالکشن جستجوی متنی انجام بده
courseSchema.index({ 
  name: 'text', 
  description: 'text', 
  instructor: 'text',
  keywords: 'text'
}, {
  weights: {
    name: 10,     // به "نام دوره" وزن بیشتری برای جستجو میدیم
    instructor: 5,
    keywords: 5,
    description: 2
  }
});

const Course = mongoose.model('Course', courseSchema);
export default Course;