// backend/utils/mongo.js
import mongoose from "mongoose";

let connected = false;

export async function connectMongo(uri) {
  if (connected) return mongoose;
  if (!uri) throw new Error("MONGODB_URI is empty");
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, { dbName: undefined });
  connected = true;
  console.log("🗄️  MongoDB Connected:", mongoose.connection.host || "local");
  return mongoose;
}

export function getDB() {
  if (!connected) throw new Error("Mongo is not connected yet");
  return mongoose.connection.db;
}
