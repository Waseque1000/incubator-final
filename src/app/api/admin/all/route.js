import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Admin from '@/lib/models/Admin';
import { verifyToken } from '@/lib/middleware/auth';

export async function GET(req) {
  try {
    await dbConnect();
    const decoded = verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ message: 'Access Denied' }, { status: 401 });
    }

    const admins = await Admin.find().select('-password').sort({ createdAt: -1 });
    return NextResponse.json(admins);
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
