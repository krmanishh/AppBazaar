import express from 'express'
import { body, validationResult } from 'express-validator'
import { protect, ownerOrAdmin } from '../middleware/auth.js'
import Auction from '../models/Auction.js'
import User from '../models/User.js'

const router = express.Router()

// Validation middleware
const validateAuction = [
  body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
  body('description').trim().isLength({ min: 20, max: 2000 }).withMessage('Description must be between 20 and 2000 characters'),
  body('platform').isIn(['iOS', 'Android', 'Web', 'Cross-Platform', 'Desktop', 'Other']).withMessage('Invalid platform'),
  body('category').isIn(['Productivity', 'Entertainment', 'Social', 'Business', 'Education', 'Health', 'Finance', 'Gaming', 'Utility', 'Other']).withMessage('Invalid category'),
  body('budget.min').isFloat({ min: 0 }).withMessage('Minimum budget must be a positive number'),
  body('budget.max').isFloat({ min: 0 }).withMessage('Maximum budget must be a positive number'),
  body('deadline').isISO8601().withMessage('Invalid deadline date'),
  body('requirements').isArray({ min: 1 }).withMessage('At least one requirement is required'),
  body('requirements.*').trim().isLength({ min: 5, max: 200 }).withMessage('Each requirement must be between 5 and 200 characters'),
  body('features').isArray().withMessage('Features must be an array'),
  body('features.*').trim().isLength({ min: 5, max: 200 }).withMessage('Each feature must be between 5 and 200 characters'),
  body('tags').isArray().withMessage('Tags must be an array'),
  body('tags.*').trim().isLength({ min: 2, max: 20 }).withMessage('Each tag must be between 2 and 20 characters')
]

const validateBid = [
  body('amount').isFloat({ min: 0 }).withMessage('Bid amount must be a positive number'),
  body('proposal').trim().isLength({ min: 50, max: 2000 }).withMessage('Proposal must be between 50 and 2000 characters'),
  body('timeline').isInt({ min: 1, max: 365 }).withMessage('Timeline must be between 1 and 365 days')
]

// @route   GET /api/auctions
// @desc    Get all auctions with filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      platform,
      category,
      minBudget,
      maxBudget,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    const query = { isActive: true }
    
    if (status) query.status = status
    if (platform) query.platform = platform
    if (category) query.category = category
    if (minBudget) query['budget.min'] = { $gte: parseFloat(minBudget) }
    if (maxBudget) query['budget.max'] = { $lte: parseFloat(maxBudget) }
    if (search) {
      query.$text = { $search: search }
    }

    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1

    const auctions = await Auction.find(query)
      .populate('buyer', 'username profile.firstName profile.lastName')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec()

    const total = await Auction.countDocuments(query)

    res.json({
      auctions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    })
  } catch (error) {
    console.error('Error fetching auctions:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/auctions/featured
// @desc    Get featured auctions
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const featuredAuctions = await Auction.find({ 
      isActive: true, 
      status: 'open',
      expiresAt: { $gt: new Date() }
    })
      .populate('buyer', 'username profile.firstName profile.lastName')
      .sort({ views: -1, createdAt: -1 })
      .limit(6)
      .exec()

    res.json(featuredAuctions)
  } catch (error) {
    console.error('Error fetching featured auctions:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/auctions/:id
// @desc    Get auction by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate('buyer', 'username profile.firstName profile.lastName profile.avatar')
      .populate('bids.developer', 'username profile.firstName profile.lastName profile.avatar')
      .populate('acceptedBid', 'username profile.firstName profile.lastName profile.avatar')

    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' })
    }

    if (!auction.isActive) {
      return res.status(404).json({ message: 'Auction is not active' })
    }

    // Increment views
    auction.views += 1
    await auction.save()

    res.json(auction)
  } catch (error) {
    console.error('Error fetching auction:', error)
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Auction not found' })
    }
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/auctions
// @desc    Create new auction
// @access  Private
router.post('/', protect, validateAuction, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const auctionData = {
      ...req.body,
      buyer: req.user.id
    }

    const auction = new Auction(auctionData)
    await auction.save()

    const populatedAuction = await Auction.findById(auction._id)
      .populate('buyer', 'username profile.firstName profile.lastName')

    res.status(201).json(populatedAuction)
  } catch (error) {
    console.error('Error creating auction:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/auctions/:id
// @desc    Update auction
// @access  Private (owner only)
router.put('/:id', protect, ownerOrAdmin, validateAuction, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const auction = await Auction.findById(req.params.id)
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' })
    }

    // Check if auction can be updated
    if (auction.status !== 'open') {
      return res.status(400).json({ message: 'Cannot update auction that is not open' })
    }

    const updatedAuction = await Auction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('buyer', 'username profile.firstName profile.lastName')

    res.json(updatedAuction)
  } catch (error) {
    console.error('Error updating auction:', error)
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Auction not found' })
    }
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   DELETE /api/auctions/:id
// @desc    Delete auction
// @access  Private (owner only)
router.delete('/:id', protect, ownerOrAdmin, async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id)
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' })
    }

    // Check if auction can be deleted
    if (auction.status !== 'open') {
      return res.status(400).json({ message: 'Cannot delete auction that is not open' })
    }

    auction.isActive = false
    await auction.save()

    res.json({ message: 'Auction deleted successfully' })
  } catch (error) {
    console.error('Error deleting auction:', error)
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Auction not found' })
    }
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/auctions/:id/bid
// @desc    Submit bid on auction
// @access  Private
router.post('/:id/bid', protect, validateBid, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const auction = await Auction.findById(req.params.id)
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' })
    }

    if (!auction.isActive) {
      return res.status(400).json({ message: 'Auction is not active' })
    }

    if (auction.status !== 'open') {
      return res.status(400).json({ message: 'Auction is not open for bidding' })
    }

    if (auction.buyer.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot bid on your own auction' })
    }

    const bidData = {
      developer: req.user.id,
      amount: req.body.amount,
      proposal: req.body.proposal,
      timeline: req.body.timeline
    }

    await auction.addBid(bidData)

    const updatedAuction = await Auction.findById(req.params.id)
      .populate('buyer', 'username profile.firstName profile.lastName')
      .populate('bids.developer', 'username profile.firstName profile.lastName profile.avatar')

    res.json(updatedAuction)
  } catch (error) {
    console.error('Error submitting bid:', error)
    if (error.message === 'Auction is not open for bidding') {
      return res.status(400).json({ message: error.message })
    }
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Auction not found' })
    }
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/auctions/:id/bid/:bidId/accept
// @desc    Accept bid on auction
// @access  Private (owner only)
router.put('/:id/bid/:bidId/accept', protect, ownerOrAdmin, async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id)
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' })
    }

    if (auction.buyer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to accept bids on this auction' })
    }

    if (auction.status !== 'open') {
      return res.status(400).json({ message: 'Cannot accept bids on auction that is not open' })
    }

    await auction.acceptBid(req.params.bidId)

    const updatedAuction = await Auction.findById(req.params.id)
      .populate('buyer', 'username profile.firstName profile.lastName')
      .populate('bids.developer', 'username profile.firstName profile.lastName profile.avatar')
      .populate('acceptedBid', 'username profile.firstName profile.lastName profile.avatar')

    res.json(updatedAuction)
  } catch (error) {
    console.error('Error accepting bid:', error)
    if (error.message.includes('Bid not found') || error.message.includes('Bid is not pending')) {
      return res.status(400).json({ message: error.message })
    }
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Auction not found' })
    }
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/auctions/user/my-auctions
// @desc    Get user's auctions
// @access  Private
router.get('/user/my-auctions', protect, async (req, res) => {
  try {
    const auctions = await Auction.find({ buyer: req.user.id, isActive: true })
      .populate('bids.developer', 'username profile.firstName profile.lastName profile.avatar')
      .populate('acceptedBid', 'username profile.firstName profile.lastName profile.avatar')
      .sort({ createdAt: -1 })

    res.json(auctions)
  } catch (error) {
    console.error('Error fetching user auctions:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/auctions/user/my-bids
// @desc    Get user's bids
// @access  Private
router.get('/user/my-bids', protect, async (req, res) => {
  try {
    const auctions = await Auction.find({
      'bids.developer': req.user.id,
      isActive: true
    })
      .populate('buyer', 'username profile.firstName profile.lastName profile.avatar')
      .sort({ createdAt: -1 })

    // Filter to only show auctions where user has bid
    const userBids = auctions.map(auction => {
      const userBid = auction.bids.find(bid => bid.developer.toString() === req.user.id)
      return {
        auction: {
          _id: auction._id,
          title: auction.title,
          status: auction.status,
          buyer: auction.buyer,
          budget: auction.budget,
          deadline: auction.deadline,
          expiresAt: auction.expiresAt,
          createdAt: auction.createdAt
        },
        bid: userBid
      }
    })

    res.json(userBids)
  } catch (error) {
    console.error('Error fetching user bids:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
