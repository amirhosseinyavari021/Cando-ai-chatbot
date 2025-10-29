import mongoose from 'mongoose';

const connectDB = async () => {
  // 1. Check if MONGODB_URI is set
  if (!process.env.MONGODB_URI) {
    console.warn('⚠️  MONGODB_URI is not set. Skipping MongoDB connection.');
    console.warn(
      'The application will run, but database features (AI, courses, auth, logging) will not work.'
    );
    return;
  }

  // 2. Check for existing idempotent connection
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (mongoose.connection.readyState >= 1) {
    console.log('🗄️  MongoDB is already connected.');
    return;
  }

  // 3. Attempt to connect
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`🗄️  MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

export default connectDB;