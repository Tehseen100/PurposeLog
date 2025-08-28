import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`\nMongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(`\nMongoDB connection error: ${error}`);
    process.exit(1);
  }
};

export default connectDB;
