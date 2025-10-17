import mongoose from 'mongoose';

const connectDB = async () => {
  // Check if the database URL is provided
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️  DATABASE_URL is not set. Skipping MongoDB connection.');
    console.warn('The application will run, but database features (logging, auth, FAQs) will not work until it is set.');
    return; // Exit the function gracefully without crashing
  }

  try {
    // Attempt to connect ONLY if the URL is provided
    const conn = await mongoose.connect(process.env.DATABASE_URL);
    console.log(`🗄️  MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1); // Exit process only if the connection fails
  }
};

export default connectDB;