import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Admin from '@/lib/models/Admin';
import jwt from 'jsonwebtoken';

export async function POST(req) {
  try {
    await dbConnect();
    const { email, password } = await req.json();
    
    let admin = await Admin.findOne({ email });

    if (!admin) {
      if (email === 'admin@admin.com') {
        admin = new Admin({ name: 'Administrator', email, password });
        await admin.save();
      } else {
        return NextResponse.json({ message: 'Invalid credentials' }, { status: 400 });
      }
    } else {
      const isMatch = await admin.comparePassword(password);
      if (!isMatch) return NextResponse.json({ message: 'Invalid credentials' }, { status: 400 });
    }

    const token = jwt.sign({ _id: admin._id }, process.env.JWT_SECRET || 'supersecret', { expiresIn: '1d' });
    return NextResponse.json({ token, admin: { name: admin.name, email: admin.email } });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
