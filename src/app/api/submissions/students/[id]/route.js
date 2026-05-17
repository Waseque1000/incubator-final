import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/lib/models/Student';
import { verifyToken } from '@/lib/middleware/auth';

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const decoded = verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ message: 'Access Denied' }, { status: 401 });
    }

    const { assignedModule, batch, name, phone } = await req.json();
    const update = {};
    if (assignedModule !== undefined) update.assignedModule = assignedModule;
    if (batch !== undefined) update.batch = batch;
    if (name !== undefined) update.name = name;
    if (phone !== undefined) update.phone = phone;

    const student = await Student.findByIdAndUpdate(id, update, { new: true });
    return NextResponse.json(student);
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 400 });
  }
}
