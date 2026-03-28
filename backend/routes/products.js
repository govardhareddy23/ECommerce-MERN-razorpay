const express = require('express');
const Product = require('../models/Product');
const { protect, sellerOnly, adminOnly } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/products ─────────────────────────────────────────────────────
// Public endpoint — no auth required, only shows approved products
router.get('/', async (req, res) => {
  try {
    const { category, sort, search } = req.query;
    // Default filter: only approved products
    const filter = { isApproved: true };

    if (category && category !== 'All') {
      filter.category = category;
    }
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    let query = Product.find(filter).populate('seller', 'name email');

    if (sort === 'price_asc') query = query.sort({ price: 1 });
    else if (sort === 'price_desc') query = query.sort({ price: -1 });
    else query = query.sort({ createdAt: -1 });

    const products = await query;
    res.json({ success: true, count: products.length, products });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ── GET /api/products/seller ──────────────────────────────────────────────
// Seller endpoint — get all products belonging to the logged-in seller
router.get('/seller', protect, sellerOnly, async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: products.length, products });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
});

// ── GET /api/products/admin/pending ───────────────────────────────────────
// Admin endpoint — get all unapproved products
router.get('/admin/pending', protect, adminOnly, async (req, res) => {
  try {
    const products = await Product.find({ isApproved: false })
      .populate('seller', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: products.length, products });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
});

// ── POST /api/products ────────────────────────────────────────────────────
// Seller endpoint — add a new product (defaults to isApproved: false)
router.post('/', protect, sellerOnly, async (req, res) => {
  try {
    const { name, description, price, image, category, stock } = req.body;

    if (!name || !description || !price || !image || !category) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const product = await Product.create({
      name,
      description,
      price,
      image,
      category,
      stock: stock !== undefined ? stock : 100,
      seller: req.user._id,
      isApproved: false, // Explicitly ensure false on creation
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
});

// ── PUT /api/products/:id/approve ─────────────────────────────────────────
// Admin endpoint — approve a product
router.put('/:id/approve', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ── DELETE /api/products/:id ──────────────────────────────────────────────
// Admin endpoint - delete a product (e.g., rejecting a pending product)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ── GET /api/products/:id ─────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller', 'name');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
