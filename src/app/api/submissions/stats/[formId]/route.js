import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/lib/models/Student';
import Submission from '@/lib/models/Submission';
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

    const stats = await Student.aggregate([
      { $match: { formId: fid } },
      {
        $lookup: {
          from: 'submissions',
          localField: '_id',
          foreignField: 'studentId',
          as: 'studentSubmissions'
        }
      },
      {
        $group: {
          _id: null,
          totalStudents: { $sum: 1 },
          allSubmissions: { $push: '$studentSubmissions' }
        }
      }
    ]);

    const moduleStats = await Submission.aggregate([
      { $match: { formId: fid } },
      { $sort: { date: -1 } },
      {
        $group: {
          _id: '$studentId',
          latestModule: { $first: '$currentModule' },
          pendingGuideline: { 
            $sum: { 
              $cond: [{ $and: ['$needGuideline', { $ne: ['$guidelineResolved', true] }] }, 1, 0] 
            } 
          }
        }
      }
    ]);

    let totalPending = 0;
    let highestMod = 0;
    const distribution = {};

    moduleStats.forEach(stat => {
      totalPending += stat.pendingGuideline;
      const modMatch = stat.latestModule?.match(/\d+/);
      const mod = modMatch ? parseInt(modMatch[0]) : 0;
      if (mod > highestMod) highestMod = mod;
      if (mod > 0) distribution[mod] = (distribution[mod] || 0) + 1;
    });

    const formattedDistribution = Object.keys(distribution).map(mod => ({
      name: `Mod ${mod}`,
      count: distribution[mod],
      level: parseInt(mod)
    })).sort((a, b) => a.level - b.level);

    return NextResponse.json({
      totalStudents: stats[0]?.totalStudents || 0,
      totalPendingGuidelines: totalPending,
      highestModule: highestMod,
      moduleDistribution: formattedDistribution
    });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
