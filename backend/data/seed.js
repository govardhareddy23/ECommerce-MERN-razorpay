require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Product = require('../models/Product');
const User = require('../models/User');
const products = require('./products');

const seed = async () => {
  await connectDB();

  try {
    // Clear existing products
    await Product.deleteMany({});
    console.log('🗑  Cleared existing products');

    // Insert 20 products
    await Product.insertMany(products);
    console.log(`✅ Seeded ${products.length} products`);

    // Create a demo admin user (idempotent)
    const exists = await User.findOne({ email: 'admin@shop.com' });
    if (!exists) {
      await User.create({
        name: 'Admin',
        email: 'admin@shop.com',
        password: 'Admin@1234',
        role: 'admin',
      });
      console.log('✅ Admin user created: admin@shop.com / Admin@1234');
    } else {
      console.log('ℹ  Admin user already exists');
    }

    console.log('\n🚀 Seed complete! Run: npm run dev\n');
  } catch (err) {
    console.error('❌ Seed failed:', err);
  } finally {
    await mongoose.disconnect();
  }
};

seed();
