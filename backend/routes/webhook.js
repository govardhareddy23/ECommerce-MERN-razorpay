const express = require('express');
const crypto = require('crypto');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

const router = express.Router();

// ── POST /api/webhook ─────────────────────────────────────────────────────
// Razorpay will POST to this endpoint on payment events.
// IMPORTANT: Use express.raw() for this route so we get the raw body
// needed for signature verification. See server.js for route registration.

router.post('/', async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    if (!signature || !webhookSecret) {
      return res.status(400).json({ message: 'Missing signature or webhook secret.' });
    }

    // ── Verify webhook signature ───────────────────────────────────────────
    // Razorpay signs the raw request body with the webhook secret
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(req.body) // req.body is a Buffer here (raw)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.warn('❌ Webhook signature mismatch — possible spoofed request');
      return res.status(400).json({ message: 'Invalid signature.' });
    }

    // ── Parse and handle event ────────────────────────────────────────────
    const event = JSON.parse(req.body.toString());
    console.log(`📩 Webhook received: ${event.event}`);

    switch (event.event) {
      case 'payment.captured': {
        const paymentEntity = event.payload.payment.entity;
        const razorpayOrderId = paymentEntity.order_id;
        const razorpayPaymentId = paymentEntity.id;

        // Find the related order
        const order = await Order.findOne({ razorpayOrderId });

        if (order && order.status !== 'paid') {
          order.status = 'paid';
          order.razorpayPaymentId = razorpayPaymentId;
          await order.save();

          // Update wallet ledger for buyer and owner if not already done
          const txExists = await Transaction.findOne({ relatedOrder: order._id });
          if (!txExists) {
            // 1. Debit buyer
            const buyerParams = await User.findById(order.user);
            if (buyerParams) {
              const newBuyerBalance = (buyerParams.walletBalance || 0) - order.amount;
              await User.findByIdAndUpdate(order.user, { walletBalance: newBuyerBalance });
              await Transaction.create({
                user: order.user,
                type: 'debit',
                amount: order.amount,
                description: `[Webhook] Purchase: ${order.productSnapshot.name}`,
                relatedOrder: order._id,
                balanceAfter: newBuyerBalance,
              });
            }

            // 2. Credit owner
            const Product = require('../models/Product');
            const productDoc = await Product.findById(order.product);
            if (productDoc && productDoc.owner) {
              const ownerId = productDoc.owner;
              const ownerParams = await User.findById(ownerId);
              if (ownerParams) {
                const newBalance = (ownerParams.walletBalance || 0) + order.amount;
                await User.findByIdAndUpdate(ownerId, { walletBalance: newBalance });
                await Transaction.create({
                  user: ownerId,
                  type: 'credit',
                  amount: order.amount,
                  description: `[Webhook] Sale: ${order.productSnapshot.name}`,
                  relatedOrder: order._id,
                  balanceAfter: newBalance,
                });
              }
            }
          }
          console.log(`✅ Order ${order._id} marked as paid via webhook`);
        }
        break;
      }

      case 'payment.failed': {
        const paymentEntity = event.payload.payment.entity;
        const razorpayOrderId = paymentEntity.order_id;

        await Order.findOneAndUpdate(
          { razorpayOrderId, status: 'pending' },
          { status: 'failed' }
        );
        console.log(`❌ Payment failed for order: ${razorpayOrderId}`);
        break;
      }

      default:
        console.log(`ℹ  Unhandled event: ${event.event}`);
    }

    // Always return 200 to acknowledge receipt
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    // Still 200 to prevent Razorpay retries on server errors
    res.status(200).json({ received: true, error: 'Processing error' });
  }
});

module.exports = router;
