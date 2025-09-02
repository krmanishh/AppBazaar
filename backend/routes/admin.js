const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const App = require('../models/App');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// Apply admin middleware to all routes
router.use(protect, admin);

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin only)
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, status } = req.query;
    
    // Build filter
    const filter = {};
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } }
      ];
    }
    if (role) filter.role = role;
    if (status !== undefined) filter.isActive = status === 'active';

    const skip = (page - 1) * limit;
    
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private (Admin only)
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('wishlist', 'title icon price')
      .populate('purchases.app', 'title icon price');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('User fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private (Admin only)
router.put('/users/:id', [
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Invalid role'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { role, isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deactivating themselves
    if (user._id.toString() === req.user._id.toString() && isActive === false) {
      return res.status(400).json({ message: 'Cannot deactivate your own account' });
    }

    // Update fields
    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    const updatedUser = await user.save();
    res.json(updatedUser.getPublicProfile());
  } catch (error) {
    console.error('User update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    // Prevent admin from deleting other admins
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin accounts' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('User deletion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get all apps (including pending)
// @route   GET /api/admin/apps
// @access  Private (Admin only)
router.get('/apps', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, category, search } = req.query;
    
    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search) {
      filter.$text = { $search: search };
    }

    const skip = (page - 1) * limit;
    
    const apps = await App.find(filter)
      .populate('developer', 'username profile.firstName profile.lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await App.countDocuments(filter);

    res.json({
      apps,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Apps fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update app status
// @route   PUT /api/admin/apps/:id/status
// @access  Private (Admin only)
router.put('/apps/:id/status', [
  body('status')
    .isIn(['draft', 'pending', 'approved', 'rejected'])
    .withMessage('Invalid status'),
  body('rejectionReason')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Rejection reason cannot exceed 500 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { status, rejectionReason } = req.body;
    const app = await App.findById(req.params.id);

    if (!app) {
      return res.status(404).json({ message: 'App not found' });
    }

    app.status = status;
    
    // Add rejection reason if status is rejected
    if (status === 'rejected' && rejectionReason) {
      app.rejectionReason = rejectionReason;
    } else {
      app.rejectionReason = undefined;
    }

    const updatedApp = await app.save();
    
    const populatedApp = await App.findById(updatedApp._id)
      .populate('developer', 'username profile.firstName profile.lastName');

    res.json(populatedApp);
  } catch (error) {
    console.error('App status update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Toggle app featured status
// @route   PUT /api/admin/apps/:id/featured
// @access  Private (Admin only)
router.put('/apps/:id/featured', async (req, res) => {
  try {
    const app = await App.findById(req.params.id);

    if (!app) {
      return res.status(404).json({ message: 'App not found' });
    }

    app.isFeatured = !app.isFeatured;
    const updatedApp = await app.save();
    
    const populatedApp = await App.findById(updatedApp._id)
      .populate('developer', 'username profile.firstName profile.lastName');

    res.json(populatedApp);
  } catch (error) {
    console.error('App featured toggle error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
router.get('/dashboard', async (req, res) => {
  try {
    // Get counts
    const totalUsers = await User.countDocuments();
    const totalApps = await App.countDocuments();
    const pendingApps = await App.countDocuments({ status: 'pending' });
    const approvedApps = await App.countDocuments({ status: 'approved' });
    const rejectedApps = await App.countDocuments({ status: 'rejected' });

    // Get recent activity
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('username email createdAt');

    const recentApps = await App.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title status developer createdAt')
      .populate('developer', 'username');

    // Get category distribution
    const categoryStats = await App.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      stats: {
        totalUsers,
        totalApps,
        pendingApps,
        approvedApps,
        rejectedApps
      },
      recentActivity: {
        users: recentUsers,
        apps: recentApps
      },
      categoryStats
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get system health
// @route   GET /api/admin/health
// @access  Private (Admin only)
router.get('/health', async (req, res) => {
  try {
    // Check database connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Get memory usage
    const memoryUsage = process.memoryUsage();
    
    // Get uptime
    const uptime = process.uptime();

    res.json({
      status: 'healthy',
      database: dbStatus,
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB'
      },
      uptime: Math.round(uptime) + ' seconds',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
