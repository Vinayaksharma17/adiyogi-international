import { asyncHandler } from '../utils/async-handler.js';
import * as adminService from '../services/admin.service.js';

export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const result = await adminService.login(username, password);
  res.json(result);
});

export const setup = asyncHandler(async (req, res) => {
  const result = await adminService.setup(req.body);
  res.status(201).json(result);
});

export const getDashboard = asyncHandler(async (req, res) => {
  const result = await adminService.getDashboard();
  res.json(result);
});

export const getOrders = asyncHandler(async (req, res) => {
  const { page, limit, status } = req.query;
  const result = await adminService.getOrders({ page, limit, status });
  res.json(result);
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await adminService.updateOrderStatus(req.params.id, req.body.status);
  res.json(order);
});
