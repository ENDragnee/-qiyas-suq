import mongoose from "mongoose";

const DATABASE_URL =
  Bun.env.DATABASE_URL ||
  "mongodb://suq:qazwsxedc@localhost:27017/suq?authSource=suq";

let cachedConnection: typeof mongoose | null = null;

export async function ConnectDB() {
  if (cachedConnection) {
    return cachedConnection;
  }
  try {
    const connection = await mongoose.connect(DATABASE_URL);
    console.log("MongoDB Connected Successfully");
    cachedConnection = connection;

    return connection;
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
    throw err;
  }
}
