import { Db, MongoClient } from "mongodb";

const uri = process.env.MONGO_URI || "";

const client = new MongoClient(uri);

let db: Db;

export async function connectDB() {
  try {
    await client.connect();
    db = client.db("dgii-api");
    console.log("✅ Connect to MongoDB Atlas");
  } catch (error) {
    console.error("❌ Error connect MongoDB:", error);
    process.exit(1);
  }
}

export function getDB(): Db {
  if (!db) {
    throw new Error("The database not connect. Call to connectDB first.");
  }
  return db;
}
