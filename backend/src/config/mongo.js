const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sored';

async function connectMongo() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected:', MONGODB_URI);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
}

module.exports = connectMongo;
