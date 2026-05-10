import * as orderRepo from '../repositories/order.repository.js';
import * as productRepo from '../repositories/product.repository.js';
import * as adminRepo from '../repositories/admin.repository.js';
import { ApiError } from '../utils/api-error.js';

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
  let admin = await adminRepo.findByClerkId(adminId);
  if (!admin) {
    admin = await adminRepo.createAdmin({
      clerkId: adminId,
      name: 'Admin',
      username: '',
      whatsappNumber: '',
    });
  }
  return { name: admin.name, username: admin.username, whatsappNumber: admin.whatsappNumber };
}

export async function updateProfile(adminId, { name, username, whatsappNumber }) {
  if (username) {
    const existing = await adminRepo.findByUsername(username);
    if (existing && existing.clerkId !== adminId) {
      throw new ApiError(409, 'Username is already taken');
    }
  }
  const admin = await adminRepo.updateByClerkId(adminId, { name, username, whatsappNumber });
  if (!admin) throw new ApiError(404, 'Admin not found');
  return { name: admin.name, username: admin.username, whatsappNumber: admin.whatsappNumber };
}

export async function changePassword(adminId, { newPassword }) {
  const admin = await adminRepo.findByClerkId(adminId);
  if (!admin) throw new ApiError(404, 'Admin not found');
  admin.password = newPassword;
  await admin.save();
}

