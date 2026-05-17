import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Form from '@/lib/models/Form';
import { verifyToken } from '@/lib/middleware/auth';

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const decoded = verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ message: 'Access Denied' }, { status: 401 });
    }

    const body = await req.json();
    const form = await Form.findByIdAndUpdate(id, body, { new: true });
    return NextResponse.json(form);
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 400 });
  }
}
