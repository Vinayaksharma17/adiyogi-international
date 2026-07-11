import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const setupSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  whatsappNumber: z.string().min(1, 'WhatsApp number is required'),
  name: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled']),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  whatsappNumber: z.string().min(1, 'WhatsApp number is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

export const forgotPasswordSchema = z.object({
  username: z.string().min(1, 'Username is required'),
});

export const verifyOtpSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be a 6-digit number'),
});

export const resetPasswordSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be a 6-digit number'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

export const resetWithRecoveryCodeSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  recoveryCode: z.string().min(1, 'Recovery code is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

