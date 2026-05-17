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

    const admin = await Admin.findById(decoded._id).select('-password');
    if (!admin) {
      return NextResponse.json({ message: 'Admin not found' }, { status: 404 });
    }
    
    return NextResponse.json(admin);
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
