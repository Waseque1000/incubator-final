import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Submission from '@/lib/models/Submission';
import mongoose from 'mongoose';
import { verifyToken } from '@/lib/middleware/auth';

export async function POST(req, { params }) {
  try {
    await dbConnect();
    const { formId } = await params;
    const decoded = verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ message: 'Access Denied' }, { status: 401 });
    }

    const { emails } = await req.json();
    if (!emails || !Array.isArray(emails)) {
      return NextResponse.json({ message: 'Invalid email list' }, { status: 400 });
    }

    const fid = new mongoose.Types.ObjectId(formId);

    const submissions = await Submission.find({ formId: fid })
      .populate('studentId')
      .lean();

    const submittedEmails = new Set(submissions.map(s => s.studentId?.email?.toLowerCase()));

    const results = emails.map(email => {
      const normalizedEmail = email.trim().toLowerCase();
      return {
        email: normalizedEmail,
        hasSubmitted: submittedEmails.has(normalizedEmail)
      };
    });

    return NextResponse.json(results);
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
