import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  const dbName = process.env.MONGO_DB_NAME || 'ai_content_generation';
  
  if (!uri) {
    console.error('Error: MONGO_URI is not defined in environment variables');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      dbName: dbName
    });
    console.log(`MongoDB Connected: ${conn.connection.host} (DB: ${dbName})`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};
