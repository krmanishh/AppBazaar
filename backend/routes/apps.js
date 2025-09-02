const express = require('express');
const { body, validationResult, query } = require('express-validator');
const App = require('../models/App');
const User = require('../models/User');
const { protect, ownerOrAdmin, hasPurchased } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all apps with search and filtering
// @route   GET /api/apps
// @access  Public
router.get('/', [
  query('search').optional().isString(),
  query('category').optional().isString(),
  query('minPrice').optional().isNumeric(),
  query('maxPrice').optional().isNumeric(),
  query('sortBy').optional().isIn(['title', 'price', 'rating', 'downloads', 'createdAt']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 12
    } = req.body;

    // Build filter object
    const filter = { status: 'approved' };
    
    if (search) {
      filter.$text = { $search: search };
    }
    
    if (category) {
      filter.category = category;
    }
    
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = parseFloat(maxPrice);
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const apps = await App.find(filter)
      .populate('developer', 'username profile.firstName profile.lastName')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-ratings.reviews');

    // Get total count for pagination
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

// @desc    Get featured apps
// @route   GET /api/apps/featured
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const featuredApps = await App.find({ 
      status: 'approved', 
      isFeatured: true 
    })
    .populate('developer', 'username profile.firstName profile.lastName')
    .limit(6)
    .select('-ratings.reviews');

    res.json(featuredApps);
  } catch (error) {
    console.error('Featured apps fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get app by ID
// @route   GET /api/apps/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const app = await App.findById(req.params.id)
      .populate('developer', 'username profile.firstName profile.lastName profile.avatar')
      .populate('ratings.reviews.user', 'username profile.firstName profile.lastName profile.avatar');

    if (!app) {
      return res.status(404).json({ message: 'App not found' });
    }

    // Increment downloads count
    app.downloads += 1;
    await app.save();

    res.json(app);
  } catch (error) {
    console.error('App fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Create new app
// @route   POST /api/apps
// @access  Private
router.post('/', protect, [
  body('title')
    .isLength({ min: 1, max: 100 })
    .withMessage('Title is required and cannot exceed 100 characters'),
  body('description')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Description is required and cannot exceed 2000 characters'),
  body('shortDescription')
    .isLength({ min: 1, max: 200 })
    .withMessage('Short description is required and cannot exceed 200 characters'),
  body('category')
    .isIn([
      'Productivity', 'Entertainment', 'Education', 'Health & Fitness',
      'Social Media', 'Gaming', 'Business', 'Lifestyle', 'Travel',
      'Music', 'Photo & Video', 'Utilities', 'Finance', 'News',
      'Weather', 'Other'
    ])
    .withMessage('Invalid category'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a non-negative number'),
  body('images')
    .isArray({ min: 1 })
    .withMessage('At least one image is required'),
  body('icon')
    .notEmpty()
    .withMessage('App icon is required'),
  body('features')
    .optional()
    .isArray()
    .withMessage('Features must be an array'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
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

    const appData = {
      ...req.body,
      developer: req.user._id,
      isFree: req.body.price === 0
    };

    const app = await App.create(appData);
    
    const populatedApp = await App.findById(app._id)
      .populate('developer', 'username profile.firstName profile.lastName');

    res.status(201).json(populatedApp);
  } catch (error) {
    console.error('App creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update app
// @route   PUT /api/apps/:id
// @access  Private (Owner or Admin)
router.put('/:id', protect, ownerOrAdmin(App), [
  body('title')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
  body('description')
    .optional()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('shortDescription')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('Short description cannot exceed 200 characters'),
  body('category')
    .optional()
    .isIn([
      'Productivity', 'Entertainment', 'Education', 'Health & Fitness',
      'Social Media', 'Gaming', 'Business', 'Lifestyle', 'Travel',
      'Music', 'Photo & Video', 'Utilities', 'Finance', 'News',
      'Weather', 'Other'
    ])
    .withMessage('Invalid category'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a non-negative number'),
  body('images')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one image is required'),
  body('icon')
    .optional()
    .notEmpty()
    .withMessage('App icon is required')
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

    const app = await App.findById(req.params.id);
    if (!app) {
      return res.status(404).json({ message: 'App not found' });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'developer' && key !== 'status') {
        app[key] = req.body[key];
      }
    });

    app.isFree = app.price === 0;
    app.lastUpdated = new Date();

    const updatedApp = await app.save();
    
    const populatedApp = await App.findById(updatedApp._id)
      .populate('developer', 'username profile.firstName profile.lastName');

    res.json(populatedApp);
  } catch (error) {
    console.error('App update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete app
// @route   DELETE /api/apps/:id
// @access  Private (Owner or Admin)
router.delete('/:id', protect, ownerOrAdmin(App), async (req, res) => {
  try {
    const app = await App.findById(req.params.id);
    if (!app) {
      return res.status(404).json({ message: 'App not found' });
    }

    await App.findByIdAndDelete(req.params.id);
    res.json({ message: 'App deleted successfully' });
  } catch (error) {
    console.error('App deletion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Add/Remove from wishlist
// @route   POST /api/apps/:id/wishlist
// @access  Private
router.post('/:id/wishlist', protect, async (req, res) => {
  try {
    const app = await App.findById(req.params.id);
    if (!app) {
      return res.status(404).json({ message: 'App not found' });
    }

    const user = await User.findById(req.user._id);
    const isInWishlist = user.wishlist.includes(req.params.id);

    if (isInWishlist) {
      // Remove from wishlist
      user.wishlist = user.wishlist.filter(id => id.toString() !== req.params.id);
      await user.save();
      res.json({ message: 'Removed from wishlist', inWishlist: false });
    } else {
      // Add to wishlist
      user.wishlist.push(req.params.id);
      await user.save();
      res.json({ message: 'Added to wishlist', inWishlist: true });
    }
  } catch (error) {
    console.error('Wishlist toggle error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Purchase app
// @route   POST /api/apps/:id/purchase
// @access  Private
router.post('/:id/purchase', protect, async (req, res) => {
  try {
    const app = await App.findById(req.params.id);
    if (!app) {
      return res.status(404).json({ message: 'App not found' });
    }

    const user = await User.findById(req.user._id);
    
    // Check if already purchased
    const alreadyPurchased = user.purchases.some(
      purchase => purchase.app.toString() === req.params.id
    );

    if (alreadyPurchased) {
      return res.status(400).json({ message: 'App already purchased' });
    }

    // Add to purchases
    user.purchases.push({
      app: req.params.id,
      price: app.price
    });

    await user.save();

    res.json({ message: 'App purchased successfully' });
  } catch (error) {
    console.error('App purchase error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Add review and rating
// @route   POST /api/apps/:id/review
// @access  Private (Must have purchased)
router.post('/:id/review', protect, hasPurchased, [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Comment cannot exceed 500 characters')
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

    const { rating, comment } = req.body;
    const app = await App.findById(req.params.id);

    if (!app) {
      return res.status(404).json({ message: 'App not found' });
    }

    // Check if user already reviewed
    const existingReviewIndex = app.ratings.reviews.findIndex(
      review => review.user.toString() === req.user._id.toString()
    );

    if (existingReviewIndex !== -1) {
      // Update existing review
      app.ratings.reviews[existingReviewIndex].rating = rating;
      app.ratings.reviews[existingReviewIndex].comment = comment || '';
      app.ratings.reviews[existingReviewIndex].createdAt = new Date();
    } else {
      // Add new review
      app.ratings.reviews.push({
        user: req.user._id,
        rating,
        comment: comment || ''
      });
    }

    // Update average rating
    app.updateAverageRating();
    await app.save();

    const updatedApp = await App.findById(req.params.id)
      .populate('developer', 'username profile.firstName profile.lastName')
      .populate('ratings.reviews.user', 'username profile.firstName profile.lastName profile.avatar');

    res.json(updatedApp);
  } catch (error) {
    console.error('Review submission error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get user's apps
// @route   GET /api/apps/user/my-apps
// @access  Private
router.get('/user/my-apps', protect, async (req, res) => {
  try {
    const apps = await App.find({ developer: req.user._id })
      .sort({ createdAt: -1 });

    res.json(apps);
  } catch (error) {
    console.error('User apps fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
