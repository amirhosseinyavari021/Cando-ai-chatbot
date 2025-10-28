import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  // فیلدهای فارسی رو اینجا تعریف می‌کنیم تا مانگوس بشناسه
  'دوره': { type: String, trim: true },
  'استاد': { type: String, trim: true },
  'تاریخ شروع': { type: String },
  'شهریه حضوری': { type: String }, // برای انعطاف‌پذیری رشته در نظر می‌گیریم
  'شهریه آنلاین با تخفیف': { type: String },
  'لینک سرفصل (دوره) (Product)': { type: String },
  'پیش نیاز (دوره) (Product)': { type: String }
}, {
  strict: false, // اگه فیلد دیگه‌ای هم توی دیتابیس بود، گیر نده
  collection: 'courses' // صراحتاً میگیم به کالکشن courses وصل شو
});

// === مهم: ایندکس متنی جدید بر اساس فیلدهای فارسی ===
courseSchema.index({
  'دوره': 'text',
  'استاد': 'text',
  'پیش نیاز (دوره) (Product)': 'text' // این هم برای جستجو خیلی خوبه
}, {
  weights: {
    'دوره': 10,     // به "نام دوره" وزن بیشتری بده
    'استاد': 5,
    'پیش نیاز (دوره) (Product)': 3
  }
});

const Course = mongoose.model('Course', courseSchema);
export default Course;