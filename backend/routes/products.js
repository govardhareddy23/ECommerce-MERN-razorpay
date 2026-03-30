const express = require('express');
const Product = require('../models/Product');
const { protect, ownerOnly } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/products ─────────────────────────────────────────────────────
// Public endpoint — no auth required, shows all products
router.get('/', async (req, res) => {
  try {
    const { category, sort, search } = req.query;
    const filter = {};

    if (category && category !== 'All') {
      filter.category = category;
    }
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    let query = Product.find(filter).populate('owner', 'name email');

    if (sort === 'price_asc') query = query.sort({ price: 1 });
    else if (sort === 'price_desc') query = query.sort({ price: -1 });
    else query = query.sort({ createdAt: -1 });

    const products = await query;
    res.json({ success: true, count: products.length, products });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ── GET /api/products/owner ──────────────────────────────────────────────
// Owner endpoint — get all products belonging to the logged-in owner
router.get('/owner', protect, ownerOnly, async (req, res) => {
  try {
    const products = await Product.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: products.length, products });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
});

// ── POST /api/products ────────────────────────────────────────────────────
// Owner endpoint — add a new product
router.post('/', protect, ownerOnly, async (req, res) => {
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
      owner: req.user._id,
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
});

// ── DELETE /api/products/:id ──────────────────────────────────────────────
// Owner endpoint - delete a product
router.delete('/:id', protect, ownerOnly, async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, owner: req.user._id });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found or unauthorised.' });
    }
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ── GET /api/products/:id ─────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('owner', 'name');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
