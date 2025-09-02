import mongoose from 'mongoose'

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  app: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'App',
    required: true
  },
  auction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auction'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  razorpayOrderId: {
    type: String,
    required: true,
    unique: true
  },
  razorpayPaymentId: {
    type: String,
    sparse: true
  },
  razorpaySignature: {
    type: String,
    sparse: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    default: 'razorpay'
  },
  description: {
    type: String
  },
  metadata: {
    type: Map,
    of: String
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  refundReason: {
    type: String
  },
  refundedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  failureReason: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Index for quick lookups
paymentSchema.index({ user: 1, status: 1 })
paymentSchema.index({ razorpayOrderId: 1 })
paymentSchema.index({ razorpayPaymentId: 1 })
paymentSchema.index({ createdAt: -1 })

// Virtual for payment status
paymentSchema.virtual('isSuccessful').get(function() {
  return this.status === 'completed'
})

paymentSchema.virtual('isPending').get(function() {
  return this.status === 'pending'
})

paymentSchema.virtual('isFailed').get(function() {
  return this.status === 'failed'
})

// Method to mark payment as completed
paymentSchema.methods.markCompleted = function(paymentId, signature) {
  this.razorpayPaymentId = paymentId
  this.razorpaySignature = signature
  this.status = 'completed'
  this.completedAt = new Date()
  return this.save()
}

// Method to mark payment as failed
paymentSchema.methods.markFailed = function(reason) {
  this.status = 'failed'
  this.failureReason = reason
  return this.save()
}

// Method to process refund
paymentSchema.methods.processRefund = function(amount, reason) {
  this.status = 'refunded'
  this.refundAmount = amount
  this.refundReason = reason
  this.refundedAt = new Date()
  return this.save()
}

// Static method to create payment
paymentSchema.statics.createPayment = function(paymentData) {
  return this.create(paymentData)
}

// Static method to find by razorpay order ID
paymentSchema.statics.findByOrderId = function(orderId) {
  return this.findOne({ razorpayOrderId: orderId })
}

// Static method to get user payments
paymentSchema.statics.getUserPayments = function(userId, status = null) {
  const query = { user: userId, isActive: true }
  if (status) {
    query.status = status
  }
  return this.find(query).populate('app').sort({ createdAt: -1 })
}

const Payment = mongoose.model('Payment', paymentSchema)

export default Payment
