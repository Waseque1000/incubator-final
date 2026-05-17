import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Form from '@/lib/models/Form';
import Student from '@/lib/models/Student';
import Submission from '@/lib/models/Submission';
import { verifyToken } from '@/lib/middleware/auth';

// GET /api/forms/:slug (Student Public)
export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { param } = await params;
    
    // Check if it's a slug or ID. Students use slugs.
    const form = await Form.findOne({ formSlug: param, isClosed: false });
    if (!form) return NextResponse.json({ message: 'Form not found or closed' }, { status: 404 });
    return NextResponse.json(form);
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// DELETE /api/forms/:id (Admin)
export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const { param } = await params;
    const decoded = verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ message: 'Access Denied' }, { status: 401 });
    }

    await Form.findByIdAndDelete(param);
    // Cascade delete associated students and submissions
    await Student.deleteMany({ formId: param });
    await Submission.deleteMany({ formId: param });
    return NextResponse.json({ message: 'Form and all associated data deleted' });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
