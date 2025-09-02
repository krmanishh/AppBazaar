const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes
const protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: 'User account is deactivated' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Middleware to check if user is admin
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
};

// Middleware to check if user is the owner of the resource or admin
const ownerOrAdmin = (resourceModel) => {
  return async (req, res, next) => {
    try {
      const resource = await resourceModel.findById(req.params.id);
      
      if (!resource) {
        return res.status(404).json({ message: 'Resource not found' });
      }

      // Check if user is admin or owner
      if (req.user.role === 'admin' || resource.developer.toString() === req.user._id.toString()) {
        next();
      } else {
        res.status(403).json({ message: 'Access denied. You can only modify your own resources.' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  };
};

// Middleware to check if user has purchased the app
const hasPurchased = async (req, res, next) => {
  try {
    const appId = req.params.id;
    const user = await User.findById(req.user._id).populate('purchases.app');
    
    const hasPurchased = user.purchases.some(purchase => 
      purchase.app._id.toString() === appId
    );

    if (hasPurchased) {
      next();
    } else {
      res.status(403).json({ message: 'You must purchase this app to access this feature' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  protect,
  admin,
  ownerOrAdmin,
  hasPurchased
};
