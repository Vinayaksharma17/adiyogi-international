import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const adminSchema = new mongoose.Schema({
  clerkId:        { type: String, unique: true, sparse: true },
  username:       { type: String, unique: true, sparse: true },
  password:       { type: String },
  whatsappNumber: { type: String, default: '' },
  name:           { type: String, default: 'Admin' },
}, { timestamps: true });

adminSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

adminSchema.methods.comparePassword = async function (password) {
  if (!this.password) return false;
  return await bcrypt.compare(password, this.password);
};

export default mongoose.model('Admin', adminSchema);
