import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/lib/models/Student';
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

    const fid = new mongoose.Types.ObjectId(formId);
    
    const structuredData = await Student.aggregate([
      { $match: { formId: fid } },
      {
        $lookup: {
          from: 'submissions',
          localField: '_id',
          foreignField: 'studentId',
          as: 'submissions'
        }
      },
      { $sort: { name: 1 } }
    ]);
    
    const result = structuredData.map(student => ({
      ...student,
      submissions: student.submissions.sort((a, b) => new Date(a.date) - new Date(b.date))
    }));

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
