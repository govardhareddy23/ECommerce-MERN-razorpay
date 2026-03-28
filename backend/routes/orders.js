const express = require('express');
const Order = require('../models/Order');
const { protect, adminOnly, sellerOnly } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/orders/my-orders ─────────────────────────────────────────────
router.get('/my-orders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('product', 'name price image category')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ── GET /api/orders/:id ───────────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('product', 'name price image')
      .populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Users can only view their own orders; admins can view all
    if (
      order.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorised.' });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ── GET /api/orders/seller/revenue ────────────────────────────────────────
router.get('/seller/revenue', protect, sellerOnly, async (req, res) => {
  try {
    const orders = await Order.find({ status: 'paid' })
      .populate({
        path: 'product',
        match: { seller: req.user._id },
        select: 'name price seller image',
      })
      .sort({ createdAt: -1 });

    // Filter out orders where product didn't match the seller
    const sellerOrders = orders.filter(order => order.product !== null);

    const totalRevenue = sellerOrders.reduce((sum, order) => sum + order.amount, 0);

    res.json({ success: true, count: sellerOrders.length, totalRevenue, orders: sellerOrders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
});

// ── GET /api/orders/admin/all ─────────────────────────────────────────────
// Admin only: view all orders
router.get('/admin/all', protect, adminOnly, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate('user', 'name email')
      .populate('product', 'name price category')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      orders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
