import mongoose from 'mongoose';
import fs from 'fs';
import Course from '../models/Course.js';
import Faq from '../models/Faq.js';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

const mongoUri = process.env.MONGODB_URI;

const exportData = async () => {
  await mongoose.connect(mongoUri);
  console.log('✅ اتصال به دیتابیس برقرار شد.');

  const courses = await Course.find({});
  const faqs = await Faq.find({});

  fs.writeFileSync('./data/export_courses.json', JSON.stringify(courses, null, 2));
  fs.writeFileSync('./data/export_faq.json', JSON.stringify(faqs, null, 2));

  console.log(`📤 ${courses.length} دوره و ${faqs.length} FAQ خروجی گرفته شدند.`);
  console.log('📁 فایل‌ها در مسیر ./data ذخیره شدند.');

  mongoose.disconnect();
};

exportData().catch((err) => {
  console.error('❌ خطا در خروجی گرفتن:', err);
  mongoose.disconnect();
});
