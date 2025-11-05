import mongoose from "mongoose";

export default async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI is missing in ENV");
    process.exit(1);
  }
  try {
    const conn = await mongoose.connect(uri, {
      dbName: undefined, // db in URI
      autoIndex: false,
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`🗄️  MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("❌ MongoDB connection error:", err?.message || err);
    process.exit(1);
  }
}
