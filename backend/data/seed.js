require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const products = require('./products');

const seed = async () => {
  await connectDB();

  try {
    // 1. Clear all collections
    await Product.deleteMany({});
    await User.deleteMany({});
    await Order.deleteMany({});
    await Transaction.deleteMany({});
    console.log('🗑  Cleared all existing data (Users, Products, Orders, Transactions)');

    // 2. Create the demo owner user
    const ownerUser = await User.create({
      name: 'Owner',
      email: 'owner@shop.com',
      password: 'owner@1234',
      role: 'owner',
    });
    console.log('✅ Owner user created: owner@shop.com / owner@1234');

    // 3. Attach the owner user ID to every product before insertion
    const productsWithOwner = products.map(product => ({
      ...product,
      owner: ownerUser._id,
    }));

    // 4. Insert Products
    await Product.insertMany(productsWithOwner);
    console.log(`✅ Seeded ${productsWithOwner.length} products with owner reference`);

    console.log('\n🚀 Seed complete! Run: npm run dev\n');
  } catch (err) {
    console.error('❌ Seed failed:', err);
  } finally {
    await mongoose.disconnect();
  }
};

seed();
