import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Form from '@/lib/models/Form';
import Admin from '@/lib/models/Admin';
import { verifyToken } from '@/lib/middleware/auth';

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
