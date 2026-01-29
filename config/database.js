const mongoose = require('mongoose');

// MongoDB connection function
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('❌ MONGO_URI is missing in .env file');
      process.exit(1);
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
