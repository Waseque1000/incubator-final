import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Form from '@/lib/models/Form';
import { verifyToken } from '@/lib/middleware/auth';

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const decoded = verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ message: 'Access Denied' }, { status: 401 });
    }

    const form = await Form.findById(id);
    if (!form) return NextResponse.json({ message: 'Form not found' }, { status: 404 });
    return NextResponse.json(form);
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
