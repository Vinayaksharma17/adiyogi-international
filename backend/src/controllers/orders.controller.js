import { asyncHandler } from '../utils/async-handler.js';
import * as ordersService from '../services/orders.service.js';

export const createOrder = asyncHandler(async (req, res) => {
  const result = await ordersService.createOrder(req.body);
  res.status(201).json(result);
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await ordersService.getOrderById(req.params.id);
  res.json(order);
});

export const getOrderInvoice = asyncHandler(async (req, res) => {
  const { order, filePath } = await ordersService.getOrderInvoice(req.params.id);
  res.setHeader('Content-Disposition', `attachment; filename="Invoice-${order.orderId}.pdf"`);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
  res.download(filePath, `Invoice-${order.orderId}.pdf`);
});
