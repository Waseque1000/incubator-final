import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Admin from '@/lib/models/Admin';
import { verifyToken } from '@/lib/middleware/auth';

export async function POST(req) {
  try {
    await dbConnect();
    const decoded = verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ message: 'Access Denied' }, { status: 401 });
    }

    const { name, email, password } = await req.json();
    const existing = await Admin.findOne({ email });
    if (existing) {
      return NextResponse.json({ message: 'Admin with this email already exists' }, { status: 400 });
    }

    const admin = new Admin({ name, email, password });
    await admin.save();
    return NextResponse.json({ message: 'Admin added successfully', admin: { name: admin.name, email: admin.email } }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
