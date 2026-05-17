import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/lib/models/Student';
import Form from '@/lib/models/Form';
import mongoose from 'mongoose';
import { verifyToken } from '@/lib/middleware/auth';

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { formId } = await params;
    const decoded = verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ message: 'Access Denied' }, { status: 401 });
    }

    const form = await Form.findById(formId);
    if (!form) return NextResponse.json({ message: 'Form not found' }, { status: 404 });
    
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    const durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const requiredDays = Math.ceil(durationDays * 0.6);

    const rewardsData = await Student.aggregate([
      { $match: { formId: new mongoose.Types.ObjectId(formId) } },
      {
        $lookup: {
          from: 'submissions',
          localField: '_id',
          foreignField: 'studentId',
          as: 'subs'
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          phone: 1,
          submissionCount: { $size: '$subs' },
          isEligible: { $gte: [{ $size: '$subs' }, requiredDays] },
          requiredDays: { $literal: requiredDays }
        }
      },
      { $sort: { submissionCount: -1 } }
    ]);

    return NextResponse.json(rewardsData);
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
