const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes — requires valid JWT
const protect = async (req, res, next) => {
  try {
    let token;

    // Extract token from Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request (exclude password)
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.',
      });
    }

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired.' });
    }
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Admin-only route guard
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ success: false, message: 'Admin access required.' });
};

// Seller-only route guard
const sellerOnly = (req, res, next) => {
  if (req.user && req.user.role === 'seller') {
    return next();
  }
  res.status(403).json({ success: false, message: 'Seller access required.' });
};

// Admin or Seller route guard
const adminOrSeller = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'seller')) {
    return next();
  }
  res.status(403).json({ success: false, message: 'Admin or Seller access required.' });
};

module.exports = { protect, adminOnly, sellerOnly, adminOrSeller };
