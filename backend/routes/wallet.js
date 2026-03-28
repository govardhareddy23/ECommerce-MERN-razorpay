const express = require('express');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/wallet ───────────────────────────────────────────────────────
// Get wallet balance + transaction history
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('walletBalance name email');

    const transactions = await Transaction.find({ user: req.user._id })
      .populate('relatedOrder', 'razorpayOrderId status')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      walletBalance: user.walletBalance,
      transactions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ── POST /api/wallet/add-funds ────────────────────────────────────────────
// Simulation only: add money to wallet (for demo/testing purposes)
router.post('/add-funds', protect, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0 || amount > 100000) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be between 1 and 100,000.',
      });
    }

    const user = await User.findById(req.user._id);
    const newBalance = user.walletBalance + Number(amount);

    await User.findByIdAndUpdate(req.user._id, { walletBalance: newBalance });

    await Transaction.create({
      user: req.user._id,
      type: 'credit',
      amount: Number(amount),
      description: 'Wallet top-up (simulation)',
      balanceAfter: newBalance,
    });

    res.json({
      success: true,
      message: `₹${amount} added to wallet.`,
      walletBalance: newBalance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
