import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { ApiError } from '../utils/api-error.js';
import * as adminRepo from '../repositories/admin.repository.js';
import * as orderRepo from '../repositories/order.repository.js';
import * as productRepo from '../repositories/product.repository.js';
import { sendWhatsAppMessage, getWAStatus } from './whatsapp.service.js';

const OTP_EXPIRY_MINUTES = 10;

export async function login(username, password) {
  const admin = await adminRepo.findByUsername(username);
  if (!admin) throw new ApiError(404, 'Admin not found');
  if (!(await admin.comparePassword(password))) {
    throw new ApiError(401, 'Invalid password');
  }
  const token = jwt.sign({ id: admin._id }, env.JWT_SECRET, { expiresIn: '7d' });
  return { token, name: admin.name, whatsappNumber: admin.whatsappNumber };
}

export async function setup(data) {
  const count = await adminRepo.countAdmins();
  if (count > 0) throw new ApiError(400, 'Admin already exists');
  const recoveryCode = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8-char hex like A1B2C3D4
  const hashedRecoveryCode = await bcrypt.hash(recoveryCode, 10);
  await adminRepo.createAdmin({ ...data, recoveryCode: hashedRecoveryCode });
  return { message: 'Admin created successfully', recoveryCode };
}

export async function getDashboard() {
  const [
    totalOrders,
    pendingOrders,
    confirmedOrders,
    deliveredOrders,
    totalProducts,
    recentOrders,
    revenue,
  ] = await Promise.all([
    orderRepo.countOrders(),
    orderRepo.countOrders({ status: 'Pending' }),
    orderRepo.countOrders({ status: 'Confirmed' }),
    orderRepo.countOrders({ status: 'Delivered' }),
    productRepo.countActive(),
    orderRepo.findRecentOrders(10),
    orderRepo.getRevenue(),
  ]);

  return {
    totalOrders,
    pendingOrders,
    confirmedOrders,
    deliveredOrders,
    totalProducts,
    totalRevenue: revenue[0]?.total || 0,
    recentOrders,
  };
}

export async function getOrders({ page = 1, limit = 20, status } = {}) {
  const filter = status ? { status } : {};
  const [orders, total] = await Promise.all([
    orderRepo.findWithPagination(filter, { page, limit }),
    orderRepo.countOrders(filter),
  ]);
  return { orders, total, pages: Math.ceil(total / limit) };
}

export async function updateOrderStatus(id, status) {
  return orderRepo.updateStatus(id, status);
}

export async function getProfile(adminId) {
  const admin = await adminRepo.findById(adminId);
  if (!admin) throw new ApiError(404, 'Admin not found');
  return { name: admin.name, username: admin.username, whatsappNumber: admin.whatsappNumber };
}

export async function updateProfile(adminId, { name, username, whatsappNumber }) {
  // Check username uniqueness if changing
  const existing = await adminRepo.findByUsername(username);
  if (existing && String(existing._id) !== String(adminId)) {
    throw new ApiError(409, 'Username is already taken');
  }
  const admin = await adminRepo.updateAdmin(adminId, { name, username, whatsappNumber });
  if (!admin) throw new ApiError(404, 'Admin not found');
  return { name: admin.name, username: admin.username, whatsappNumber: admin.whatsappNumber };
}

export async function changePassword(adminId, { currentPassword, newPassword }) {
  const admin = await adminRepo.findById(adminId);
  if (!admin) throw new ApiError(404, 'Admin not found');
  const valid = await admin.comparePassword(currentPassword);
  if (!valid) throw new ApiError(401, 'Current password is incorrect');
  admin.password = newPassword;
  await admin.save(); // triggers bcrypt pre-save hook

  sendWhatsAppMessage(
    admin.whatsappNumber,
    `🔐 *Password Changed*\n\nYour admin password was updated at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}.\nIf this wasn't you, contact support immediately.`
  ).catch(() => {});
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function forgotPassword(username) {
  const admin = await adminRepo.findByUsername(username);
  if (!admin) throw new ApiError(404, 'Admin not found');

  const waStatus = getWAStatus();
  if (!waStatus.isReady) {
    return {
      whatsappAvailable: false,
      message: 'WhatsApp is not connected. Please use your recovery code to reset your password.',
    };
  }

  const otp = generateOtp();
  const hashedOtp = await bcrypt.hash(otp, 10);
  admin.resetOtp = hashedOtp;
  admin.resetOtpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  await admin.save();

  const sent = await sendWhatsAppMessage(
    admin.whatsappNumber,
    `🔑 *Password Reset OTP*\n\nYour OTP is: *${otp}*\nValid for ${OTP_EXPIRY_MINUTES} minutes.\nDo not share this with anyone.`
  );

  if (!sent) {
    return {
      whatsappAvailable: false,
      message: 'Failed to send OTP via WhatsApp. Please use your recovery code instead.',
    };
  }

  return {
    whatsappAvailable: true,
    message: `OTP sent to your registered WhatsApp number (${admin.whatsappNumber.slice(0, 4)}****${admin.whatsappNumber.slice(-2)})`,
  };
}

export async function verifyOtp(username, otp) {
  const admin = await adminRepo.findByUsername(username);
  if (!admin || !admin.resetOtp) throw new ApiError(400, 'Invalid or expired OTP');
  if (!admin.resetOtpExpiry || admin.resetOtpExpiry < new Date()) {
    admin.resetOtp = undefined;
    admin.resetOtpExpiry = undefined;
    await admin.save();
    throw new ApiError(400, 'OTP has expired. Please request a new one.');
  }
  const valid = await bcrypt.compare(otp, admin.resetOtp);
  if (!valid) throw new ApiError(400, 'Invalid OTP');
  return { message: 'OTP verified successfully' };
}

export async function resetPassword(username, otp, newPassword) {
  const admin = await adminRepo.findByUsername(username);
  if (!admin || !admin.resetOtp) throw new ApiError(400, 'Invalid or expired OTP');
  if (!admin.resetOtpExpiry || admin.resetOtpExpiry < new Date()) {
    admin.resetOtp = undefined;
    admin.resetOtpExpiry = undefined;
    await admin.save();
    throw new ApiError(400, 'OTP has expired. Please request a new one.');
  }
  const valid = await bcrypt.compare(otp, admin.resetOtp);
  if (!valid) throw new ApiError(400, 'Invalid OTP');

  admin.password = newPassword;
  admin.resetOtp = undefined;
  admin.resetOtpExpiry = undefined;
  await admin.save(); // triggers bcrypt pre-save hook

  sendWhatsAppMessage(
    admin.whatsappNumber,
    `🔐 *Password Reset Successful*\n\nYour admin password was reset at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}.\nIf this wasn't you, contact support immediately.`
  ).catch(() => {});

  return { message: 'Password reset successfully. You can now login with your new password.' };
}

export async function resetWithRecoveryCode(username, recoveryCode, newPassword) {
  const admin = await adminRepo.findByUsername(username);
  if (!admin || !admin.recoveryCode) throw new ApiError(400, 'Invalid recovery code');

  const valid = await bcrypt.compare(recoveryCode, admin.recoveryCode);
  if (!valid) throw new ApiError(400, 'Invalid recovery code');

  admin.password = newPassword;
  admin.resetOtp = undefined;
  admin.resetOtpExpiry = undefined;
  await admin.save(); // triggers bcrypt pre-save hook

  sendWhatsAppMessage(
    admin.whatsappNumber,
    `🔐 *Password Reset via Recovery Code*\n\nYour admin password was reset at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}.\nIf this wasn't you, contact support immediately.`
  ).catch(() => {});

  return { message: 'Password reset successfully. You can now login with your new password.' };
}

