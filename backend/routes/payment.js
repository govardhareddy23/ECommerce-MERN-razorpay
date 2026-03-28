const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { protect } = require('../middleware/auth');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

const router = express.Router();

// Initialise Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ── POST /api/payment/create-order ───────────────────────────────────────
// Step 1: Create a Razorpay order from the backend
router.post('/create-order', protect, async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required.' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    if (product.stock < 1) {
      return res.status(400).json({ success: false, message: 'Product is out of stock.' });
    }

    // Amount in paise (Razorpay requires smallest currency unit)
    const amountInPaise = Math.round(product.price * 100);

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${req.user._id.toString().slice(-8)}_${Date.now()}`,
      notes: {
        productId: product._id.toString(),
        productName: product.name,
        userId: req.user._id.toString(),
      },
    });

    // Save a pending order in our DB
    const order = await Order.create({
      user: req.user._id,
      product: product._id,
      amount: product.price,
      razorpayOrderId: razorpayOrder.id,
      status: 'pending',
      productSnapshot: {
        name: product.name,
        price: product.price,
        image: product.image,
      },
    });

    res.status(201).json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: order._id,
      productName: product.name,
      userName: req.user.name,
      userEmail: req.user.email,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment order.' });
  }
});

// ── POST /api/payment/verify ─────────────────────────────────────────────
// Step 2: Verify Razorpay signature — NEVER trust frontend for payment status
router.post('/verify', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment verification parameters.',
      });
    }

    // ── Signature Verification (MANDATORY) ───────────────────────────────
    // Razorpay signs: order_id + "|" + payment_id with your secret key
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      // Signature mismatch — mark order as failed
      await Order.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { status: 'failed' }
      );
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed. Invalid signature.',
      });
    }

    // ── Payment is legitimate — update order ──────────────────────────────
    const order = await Order.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id, user: req.user._id },
      {
        status: 'paid',
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      },
      { new: true }
    ).populate('product');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // ── Update wallet ledger ──────────────────────────────────────────────
    const user = await User.findById(req.user._id);
    const newBalance = user.walletBalance - order.amount; // debit

    await User.findByIdAndUpdate(req.user._id, { walletBalance: newBalance });

    await Transaction.create({
      user: req.user._id,
      type: 'debit',
      amount: order.amount,
      description: `Purchase: ${order.productSnapshot.name}`,
      relatedOrder: order._id,
      balanceAfter: newBalance,
    });

    res.json({
      success: true,
      message: 'Payment verified and order placed successfully.',
      order,
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ success: false, message: 'Payment verification server error.' });
  }
});

module.exports = router;
