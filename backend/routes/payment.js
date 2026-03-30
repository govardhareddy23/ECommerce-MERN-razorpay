const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { protect } = require('../middleware/auth');
const Product = require('../models/Product');
const Order = require('../models/Order');
const CartOrder = require('../models/CartOrder');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ── POST /api/payment/create-order ───────────────────────────────────────
// Single-product checkout
router.post('/create-order', protect, async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ success: false, message: 'Product ID is required.' });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    if (product.stock < 1) return res.status(400).json({ success: false, message: 'Product is out of stock.' });

    const amountInPaise = Math.round(product.price * 100);

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${req.user._id.toString().slice(-8)}_${Date.now()}`,
      notes: { productId: product._id.toString(), userId: req.user._id.toString() },
    });

    const order = await Order.create({
      user: req.user._id,
      product: product._id,
      amount: product.price,
      razorpayOrderId: razorpayOrder.id,
      status: 'pending',
      productSnapshot: { name: product.name, price: product.price, image: product.image },
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
// Single-product verify
router.post('/verify', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment verification parameters.' });
    }

    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      await Order.findOneAndUpdate({ razorpayOrderId: razorpay_order_id }, { status: 'failed' });
      return res.status(400).json({ success: false, message: 'Payment verification failed. Invalid signature.' });
    }

    const order = await Order.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id, user: req.user._id },
      { status: 'paid', razorpayPaymentId: razorpay_payment_id, razorpaySignature: razorpay_signature },
      { new: true }
    ).populate('product');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    // 1. Debit Buyer
    const buyer = await User.findById(req.user._id);
    if (buyer) {
      const newBuyerBal = buyer.walletBalance - order.amount;
      await User.findByIdAndUpdate(req.user._id, { walletBalance: newBuyerBal });
      await Transaction.create({
        user: req.user._id, type: 'debit', amount: order.amount,
        description: `Purchase: ${order.productSnapshot.name}`,
        relatedOrder: order._id, balanceAfter: newBuyerBal,
      });
    }

    // 2. Credit Owner
    if (order.product && order.product.owner) {
      const owner = await User.findById(order.product.owner);
      if (owner) {
        const newOwnerBal = owner.walletBalance + order.amount;
        await User.findByIdAndUpdate(order.product.owner, { walletBalance: newOwnerBal });
        await Transaction.create({
          user: order.product.owner, type: 'credit', amount: order.amount,
          description: `Sale: ${order.productSnapshot.name}`,
          relatedOrder: order._id, balanceAfter: newOwnerBal,
        });
      }
    }

    res.json({ success: true, message: 'Payment verified and order placed successfully.', order });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ success: false, message: 'Payment verification server error.' });
  }
});

// ── POST /api/payment/create-cart-order ──────────────────────────────────
// Cart (multi-product) checkout — single Razorpay order for total amount
router.post('/create-cart-order', protect, async (req, res) => {
  try {
    const { items } = req.body; // [{ productId, qty }]
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty.' });
    }

    let totalAmount = 0;
    const enrichedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ success: false, message: `Product not found: ${item.productId}` });
      if (product.stock < 1) return res.status(400).json({ success: false, message: `${product.name} is out of stock.` });

      const qty = item.qty || 1;
      totalAmount += product.price * qty;
      enrichedItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        qty,
      });
    }

    const amountInPaise = Math.round(totalAmount * 100);

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `cart_${req.user._id.toString().slice(-8)}_${Date.now()}`,
      notes: { userId: req.user._id.toString(), itemCount: enrichedItems.length },
    });

    const cartOrder = await CartOrder.create({
      user: req.user._id,
      items: enrichedItems,
      totalAmount,
      razorpayOrderId: razorpayOrder.id,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      cartOrderId: cartOrder._id,
      amount: amountInPaise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      userName: req.user.name,
      userEmail: req.user.email,
    });
  } catch (error) {
    console.error('Create cart order error:', error);
    res.status(500).json({ success: false, message: 'Failed to create cart payment order.' });
  }
});

// ── POST /api/payment/verify-cart ────────────────────────────────────────
// Verify cart payment, then create individual Order docs + update wallets
router.post('/verify-cart', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, cartOrderId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !cartOrderId) {
      return res.status(400).json({ success: false, message: 'Missing parameters.' });
    }

    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      await CartOrder.findByIdAndUpdate(cartOrderId, { status: 'failed' });
      return res.status(400).json({ success: false, message: 'Payment verification failed. Invalid signature.' });
    }

    const cartOrder = await CartOrder.findById(cartOrderId);
    if (!cartOrder) return res.status(404).json({ success: false, message: 'Cart order not found.' });

    // Mark cart order paid
    cartOrder.status = 'paid';
    cartOrder.razorpayPaymentId = razorpay_payment_id;
    cartOrder.razorpaySignature = razorpay_signature;
    await cartOrder.save();

    // Create individual Order per item + update wallets
    const createdOrders = [];
    const buyer = await User.findById(req.user._id);
    let runningBuyerBal = buyer ? buyer.walletBalance : 0;

    for (const item of cartOrder.items) {
      // Use the cart's razorpayOrderId for reference (suffixed by item index to stay unique)
      const suffixedOrderId = `${razorpay_order_id}_item_${item.product}`;

      // Check if already created (idempotency)
      const alreadyExists = await Order.findOne({ razorpayOrderId: suffixedOrderId });
      if (alreadyExists) { createdOrders.push(alreadyExists); continue; }

      const order = await Order.create({
        user: req.user._id,
        product: item.product,
        amount: item.price * item.qty,
        razorpayOrderId: suffixedOrderId,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: 'paid',
        productSnapshot: { name: item.name, price: item.price, image: item.image },
      });
      createdOrders.push(order);

      // Debit buyer per item
      if (buyer) {
        runningBuyerBal -= item.price * item.qty;
        await Transaction.create({
          user: req.user._id, type: 'debit', amount: item.price * item.qty,
          description: `Cart Purchase: ${item.name}`,
          relatedOrder: order._id, balanceAfter: runningBuyerBal,
        });
      }

      // Credit owner per item
      const product = await Product.findById(item.product);
      if (product && product.owner) {
        const owner = await User.findById(product.owner);
        if (owner) {
          const newOwnerBal = owner.walletBalance + item.price * item.qty;
          await User.findByIdAndUpdate(product.owner, { walletBalance: newOwnerBal });
          await Transaction.create({
            user: product.owner, type: 'credit', amount: item.price * item.qty,
            description: `Cart Sale: ${item.name}`,
            relatedOrder: order._id, balanceAfter: newOwnerBal,
          });
        }
      }
    }

    // Save final buyer balance
    if (buyer) {
      await User.findByIdAndUpdate(req.user._id, { walletBalance: runningBuyerBal });
    }

    res.json({ success: true, message: 'Cart payment verified.', orders: createdOrders });
  } catch (error) {
    console.error('Verify cart error:', error);
    res.status(500).json({ success: false, message: 'Cart payment verification server error.' });
  }
});

module.exports = router;
