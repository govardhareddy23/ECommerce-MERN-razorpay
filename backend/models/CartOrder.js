const mongoose = require('mongoose');

// CartOrder holds the aggregated Razorpay order for multi-product cart checkout
const cartOrderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        name: String,
        price: Number,
        image: String,
        qty: { type: Number, default: 1 },
      },
    ],
    totalAmount: { type: Number, required: true },
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null },
    status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  },
  { timestamps: true }
);

cartOrderSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('CartOrder', cartOrderSchema);
