import express from 'express'
import { body, validationResult } from 'express-validator'
import { protect } from '../middleware/auth.js'
import Payment from '../models/Payment.js'
import App from '../models/App.js'
import User from '../models/User.js'
import Razorpay from 'razorpay'
import crypto from 'crypto'

const router = express.Router()

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
})

// Validation middleware
const validatePayment = [
  body('appId').isMongoId().withMessage('Valid app ID is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number')
]

// @route   POST /api/payments/create-order
// @desc    Create Razorpay order
// @access  Private
router.post('/create-order', protect, validatePayment, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { appId, amount, auctionId } = req.body

    // Verify app exists
    const app = await App.findById(appId)
    if (!app) {
      return res.status(404).json({ message: 'App not found' })
    }

    // Check if user already purchased the app
    const existingPayment = await Payment.findOne({
      user: req.user.id,
      app: appId,
      status: 'completed'
    })

    if (existingPayment) {
      return res.status(400).json({ message: 'You have already purchased this app' })
    }

    // Create Razorpay order
    const orderOptions = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      receipt: `order_${Date.now()}`,
      notes: {
        appId: appId,
        userId: req.user.id,
        appName: app.title
      }
    }

    const order = await razorpay.orders.create(orderOptions)

    // Create payment record
    const paymentData = {
      user: req.user.id,
      app: appId,
      auction: auctionId || null,
      amount: amount,
      currency: 'INR',
      razorpayOrderId: order.id,
      description: `Purchase of ${app.title}`,
      metadata: {
        appName: app.title,
        appCategory: app.category,
        appDeveloper: app.developer
      }
    }

    const payment = await Payment.createPayment(paymentData)

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      paymentId: payment._id
    })
  } catch (error) {
    console.error('Error creating order:', error)
    res.status(500).json({ message: 'Failed to create order' })
  }
})

// @route   POST /api/payments/verify
// @desc    Verify Razorpay payment
// @access  Private
router.post('/verify', protect, async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ message: 'Missing payment verification data' })
    }

    // Verify signature
    const body = razorpayOrderId + '|' + razorpayPaymentId
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex')

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({ message: 'Invalid payment signature' })
    }

    // Find payment record
    const payment = await Payment.findByOrderId(razorpayOrderId)
    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' })
    }

    if (payment.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to verify this payment' })
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({ message: 'Payment has already been processed' })
    }

    // Mark payment as completed
    await payment.markCompleted(razorpayPaymentId, razorpaySignature)

    // Add app to user's purchases
    const user = await User.findById(req.user.id)
    if (!user.purchases.includes(payment.app)) {
      user.purchases.push(payment.app)
      await user.save()
    }

    // Increment app downloads
    const app = await App.findById(payment.app)
    if (app) {
      app.downloads += 1
      await app.save()
    }

    res.json({
      message: 'Payment verified successfully',
      payment: {
        id: payment._id,
        status: payment.status,
        amount: payment.amount,
        app: payment.app
      }
    })
  } catch (error) {
    console.error('Error verifying payment:', error)
    res.status(500).json({ message: 'Failed to verify payment' })
  }
})

// @route   GET /api/payments/user/payments
// @desc    Get user's payment history
// @access  Private
router.get('/user/payments', protect, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query

    const payments = await Payment.getUserPayments(req.user.id, status)
      .populate('app', 'title description icon category price')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })

    const total = await Payment.countDocuments({ user: req.user.id, isActive: true })

    res.json({
      payments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    })
  } catch (error) {
    console.error('Error fetching user payments:', error)
    res.status(500).json({ message: 'Failed to fetch payments' })
  }
})

// @route   GET /api/payments/:id
// @desc    Get payment by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('app', 'title description icon category price')
      .populate('user', 'username profile.firstName profile.lastName')

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' })
    }

    if (payment.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this payment' })
    }

    res.json(payment)
  } catch (error) {
    console.error('Error fetching payment:', error)
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Payment not found' })
    }
    res.status(500).json({ message: 'Failed to fetch payment' })
  }
})

// @route   POST /api/payments/refund
// @desc    Process refund (Admin only)
// @access  Private (Admin)
router.post('/refund', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' })
    }

    const { paymentId, amount, reason } = req.body

    if (!paymentId || !amount || !reason) {
      return res.status(400).json({ message: 'Payment ID, amount, and reason are required' })
    }

    const payment = await Payment.findById(paymentId)
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' })
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({ message: 'Only completed payments can be refunded' })
    }

    // Process refund through Razorpay
    try {
      const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
        amount: Math.round(amount * 100), // Convert to paise
        notes: {
          reason: reason
        }
      })

      // Update payment record
      await payment.processRefund(amount, reason)

      res.json({
        message: 'Refund processed successfully',
        refundId: refund.id,
        amount: amount
      })
    } catch (refundError) {
      console.error('Razorpay refund error:', refundError)
      res.status(500).json({ message: 'Failed to process refund through Razorpay' })
    }
  } catch (error) {
    console.error('Error processing refund:', error)
    res.status(500).json({ message: 'Failed to process refund' })
  }
})

// @route   GET /api/payments/stats/overview
// @desc    Get payment statistics overview
// @access  Private (Admin)
router.get('/stats/overview', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' })
    }

    const totalPayments = await Payment.countDocuments({ status: 'completed' })
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])

    const monthlyRevenue = await Payment.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: {
            year: { $year: '$completedAt' },
            month: { $month: '$completedAt' }
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ])

    const recentPayments = await Payment.find({ status: 'completed' })
      .populate('user', 'username profile.firstName profile.lastName')
      .populate('app', 'title category')
      .sort({ completedAt: -1 })
      .limit(10)

    res.json({
      totalPayments,
      totalRevenue: totalRevenue[0]?.total || 0,
      monthlyRevenue,
      recentPayments
    })
  } catch (error) {
    console.error('Error fetching payment stats:', error)
    res.status(500).json({ message: 'Failed to fetch payment statistics' })
  }
})

export default router
