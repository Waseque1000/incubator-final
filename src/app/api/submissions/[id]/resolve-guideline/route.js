import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Submission from '@/lib/models/Submission';
import { verifyToken } from '@/lib/middleware/auth';

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const decoded = verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ message: 'Access Denied' }, { status: 401 });
    }

    const submission = await Submission.findByIdAndUpdate(id, { guidelineResolved: true }, { new: true });
    return NextResponse.json(submission);
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 400 });
  }
}
