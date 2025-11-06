import dotenv from "dotenv";
dotenv.config();
console.log("✅ Environment preloaded:", process.env.PORT, !!process.env.OPENAI_API_KEY);

