import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  batch: { type: String },
  assignedModule: { type: String },
  formId: { type: mongoose.Schema.Types.ObjectId, ref: 'Form', required: true }
}, { timestamps: true });

// Optimizing queries by formId and email
studentSchema.index({ formId: 1 });
studentSchema.index({ email: 1 });
studentSchema.index({ formId: 1, email: 1 });

export default mongoose.models.Student || mongoose.model('Student', studentSchema);
