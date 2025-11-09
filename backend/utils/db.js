// backend/utils/db.js
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is missing in .env");

let _client;
let _db;

export async function getDb() {
  if (_db) return _db;
  if (!_client) {
    _client = new MongoClient(uri, { maxPoolSize: 10 });
    await _client.connect();
  }
  _db = _client.db(); // DB name از URI برداشته میشه
  console.log("✅ MongoDB connected");
  return _db;
}
