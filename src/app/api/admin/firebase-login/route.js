import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Admin from '@/lib/models/Admin';
import admin from '@/lib/firebase-admin';
import jwt from 'jsonwebtoken';

export async function POST(req) {
  try {
    await dbConnect();
    const { idToken } = await req.json();
    
    // Verify the Firebase ID Token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { email, name, uid } = decodedToken;

    // Find or create admin in MongoDB
    let mongoAdmin = await Admin.findOne({ email });
    if (!mongoAdmin) {
      mongoAdmin = new Admin({ 
        name: name || 'Admin', 
        email, 
        password: 'firebase-auth-' + uid // Placeholder password
      });
      await mongoAdmin.save();
    }

    // Issue a custom JWT for our app's existing auth system
    const token = jwt.sign({ _id: mongoAdmin._id }, process.env.JWT_SECRET || 'supersecret', { expiresIn: '1d' });
    
    return NextResponse.json({ 
      token, 
      admin: { name: mongoAdmin.name, email: mongoAdmin.email } 
    });
  } catch (err) {
    console.error('Firebase Login Error:', err.message);
    return NextResponse.json({ message: 'Authentication failed' }, { status: 401 });
  }
}
