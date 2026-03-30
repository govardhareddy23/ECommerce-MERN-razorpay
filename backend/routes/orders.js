const express = require('express');
const Order = require('../models/Order');
const { protect, ownerOnly } = require('../middleware/auth');

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
      .populate('product', 'name price image owner')
      .populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Users can view their own orders; owners can view orders for their products
    const isBuyer = order.user._id.toString() === req.user._id.toString();
    const isProductOwner = order.product && order.product.owner && order.product.owner.toString() === req.user._id.toString();

    if (!isBuyer && !isProductOwner) {
      return res.status(403).json({ success: false, message: 'Not authorised.' });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ── GET /api/orders/owner/revenue ────────────────────────────────────────
router.get('/owner/revenue', protect, ownerOnly, async (req, res) => {
  try {
    const orders = await Order.find({ status: 'paid' })
      .populate({
        path: 'product',
        match: { owner: req.user._id },
        select: 'name price owner image',
      })
      .sort({ createdAt: -1 });

    // Filter out orders where product didn't match the owner
    const ownerOrders = orders.filter(order => order.product !== null);

    const totalRevenue = ownerOrders.reduce((sum, order) => sum + order.amount, 0);

    res.json({ success: true, count: ownerOrders.length, totalRevenue, orders: ownerOrders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
});

module.exports = router;
