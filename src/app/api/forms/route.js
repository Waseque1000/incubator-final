import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Form from '@/lib/models/Form';
import Student from '@/lib/models/Student';
import Submission from '@/lib/models/Submission';
import Admin from '@/lib/models/Admin';
import { verifyToken } from '@/lib/middleware/auth';

// Get all forms with stats (Admin)
export async function GET(req) {
  try {
    await dbConnect();
    const decoded = verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ message: 'Access Denied' }, { status: 401 });
    }

    const forms = await Form.find().sort({ createdAt: -1 }).lean();
    const today = new Date().toISOString().split('T')[0];

    const formsWithStats = await Promise.all(forms.map(async (form) => {
      const totalParticipants = await Student.countDocuments({ formId: form._id });
      const todayUpdates = await Submission.countDocuments({ formId: form._id, date: today });
      const isUpdatedToday = new Date(form.updatedAt).toISOString().split('T')[0] === today;
      
      return { ...form, totalParticipants, todayUpdates, isUpdatedToday };
    }));

    return NextResponse.json(formsWithStats);
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// Create new form (Admin)
export async function POST(req) {
  try {
    await dbConnect();
    const decoded = verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ message: 'Access Denied' }, { status: 401 });
    }

    const { formName, formSlug, startDate, endDate, createdBy, customFields } = await req.json();
    
    let finalAdminName = createdBy;
    if (!finalAdminName) {
      const currentAdmin = await Admin.findById(decoded._id);
      finalAdminName = currentAdmin ? currentAdmin.name : 'Administrator';
    }
    
    const form = new Form({ 
      formName, 
      formSlug, 
      startDate, 
      endDate, 
      customFields,
      createdBy: finalAdminName
    });
    await form.save();
    return NextResponse.json(form, { status: 201 });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 400 });
  }
}
