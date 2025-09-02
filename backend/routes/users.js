const express = require('express');
const User = require('../models/User');
const App = require('../models/App');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// @desc    Get user's wishlist
// @route   GET /api/users/wishlist
// @access  Private
router.get('/wishlist', async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('wishlist', 'title description shortDescription icon price category images ratings.average ratings.count downloads');

    res.json(user.wishlist);
  } catch (error) {
    console.error('Wishlist fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get user's purchases
// @route   GET /api/users/purchases
// @access  Private
router.get('/purchases', async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('purchases.app', 'title description shortDescription icon price category images ratings.average ratings.count downloads');

    res.json(user.purchases);
  } catch (error) {
    console.error('Purchases fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get user's profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('wishlist', 'title icon price')
      .populate('purchases.app', 'title icon price');

    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update user's profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', async (req, res) => {
  try {
    const { firstName, lastName, bio, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update profile fields
    if (firstName !== undefined) user.profile.firstName = firstName;
    if (lastName !== undefined) user.profile.lastName = lastName;
    if (bio !== undefined) user.profile.bio = bio;
    if (avatar !== undefined) user.profile.avatar = avatar;

    const updatedUser = await user.save();
    res.json(updatedUser.getPublicProfile());
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get user's apps
// @route   GET /api/users/my-apps
// @access  Private
router.get('/my-apps', async (req, res) => {
  try {
    const apps = await App.find({ developer: req.user._id })
      .sort({ createdAt: -1 });

    res.json(apps);
  } catch (error) {
    console.error('User apps fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get user's app statistics
// @route   GET /api/users/app-stats
// @access  Private
router.get('/app-stats', async (req, res) => {
  try {
    const totalApps = await App.countDocuments({ developer: req.user._id });
    const approvedApps = await App.countDocuments({ 
      developer: req.user._id, 
      status: 'approved' 
    });
    const pendingApps = await App.countDocuments({ 
      developer: req.user._id, 
      status: 'pending' 
    });
    const rejectedApps = await App.countDocuments({ 
      developer: req.user._id, 
      status: 'rejected' 
    });

    // Get total downloads across all user's apps
    const totalDownloads = await App.aggregate([
      { $match: { developer: req.user._id } },
      { $group: { _id: null, total: { $sum: '$downloads' } } }
    ]);

    // Get total revenue (if any paid apps)
    const totalRevenue = await App.aggregate([
      { $match: { developer: req.user._id, price: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);

    res.json({
      totalApps,
      approvedApps,
      pendingApps,
      rejectedApps,
      totalDownloads: totalDownloads[0]?.total || 0,
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (error) {
    console.error('App stats fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get user's activity
// @route   GET /api/users/activity
// @access  Private
router.get('/activity', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Get user's recent apps
    const recentApps = await App.find({ developer: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('title status createdAt');

    // Get user's recent purchases
    const recentPurchases = await User.findById(req.user._id)
      .populate('purchases.app', 'title icon price')
      .select('purchases')
      .then(user => user.purchases.sort((a, b) => b.purchasedAt - a.purchasedAt).slice(0, 10));

    const totalApps = await App.countDocuments({ developer: req.user._id });

    res.json({
      recentApps,
      recentPurchases,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalApps / limit),
        totalItems: totalApps,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Activity fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Check if user has purchased an app
// @route   GET /api/users/has-purchased/:appId
// @access  Private
router.get('/has-purchased/:appId', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const hasPurchased = user.purchases.some(
      purchase => purchase.app.toString() === req.params.appId
    );

    res.json({ hasPurchased });
  } catch (error) {
    console.error('Purchase check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Check if app is in user's wishlist
// @route   GET /api/users/in-wishlist/:appId
// @access  Private
router.get('/in-wishlist/:appId', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const inWishlist = user.wishlist.includes(req.params.appId);

    res.json({ inWishlist });
  } catch (error) {
    console.error('Wishlist check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
