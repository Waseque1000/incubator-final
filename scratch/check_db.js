import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env.local' });

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // We don't have the model compiled, so we can just use the raw collection
    const db = mongoose.connection.db;
    const admins = await db.collection('admins').find({}).toArray();
    console.log('Admins found:', admins);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}
check();
