import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Submission from '@/lib/models/Submission';
import Student from '@/lib/models/Student'; // Required for populate
import { verifyToken } from '@/lib/middleware/auth';

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params; // This is formId
    const decoded = verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ message: 'Access Denied' }, { status: 401 });
    }

    const submissions = await Submission.find({ formId: id }).populate('studentId').sort({ date: 1 });
    return NextResponse.json(submissions);
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params; // This is submissionId
    const decoded = verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ message: 'Access Denied' }, { status: 401 });
    }

    const { currentModule, customData, assignedModule } = await req.json();
    const update = {};
    if (currentModule !== undefined) update.currentModule = currentModule;
    if (customData !== undefined) update.customData = customData;
    if (assignedModule !== undefined) update.assignedModule = assignedModule;
    
    const submission = await Submission.findByIdAndUpdate(id, update, { new: true });
    return NextResponse.json(submission);
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 400 });
  }
}
