import mongoose from 'mongoose'

const auctionSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  platform: {
    type: String,
    required: true,
    enum: ['iOS', 'Android', 'Web', 'Cross-Platform', 'Desktop', 'Other']
  },
  category: {
    type: String,
    required: true,
    enum: ['Productivity', 'Entertainment', 'Social', 'Business', 'Education', 'Health', 'Finance', 'Gaming', 'Utility', 'Other']
  },
  budget: {
    min: {
      type: Number,
      required: true,
      min: 0
    },
    max: {
      type: Number,
      required: true,
      min: 0
    }
  },
  deadline: {
    type: Date,
    required: true
  },
  requirements: [{
    type: String,
    trim: true
  }],
  features: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['open', 'in-progress', 'completed', 'cancelled'],
    default: 'open'
  },
  bids: [{
    developer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    proposal: {
      type: String,
      required: true
    },
    timeline: {
      type: Number, // in days
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    submittedAt: {
      type: Date,
      default: Date.now
    }
  }],
  acceptedBid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tags: [{
    type: String,
    trim: true
  }],
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    mimetype: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  views: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
})

// Index for search
auctionSchema.index({
  title: 'text',
  description: 'text',
  requirements: 'text',
  features: 'text'
})

// Virtual for time remaining
auctionSchema.virtual('timeRemaining').get(function() {
  if (this.status === 'open') {
    const now = new Date()
    const remaining = this.expiresAt - now
    return Math.max(0, remaining)
  }
  return 0
})

// Virtual for is expired
auctionSchema.virtual('isExpired').get(function() {
  return this.expiresAt < new Date()
})

// Method to check if auction is still open
auctionSchema.methods.isOpen = function() {
  return this.status === 'open' && !this.isExpired
}

// Method to add bid
auctionSchema.methods.addBid = function(bidData) {
  if (!this.isOpen()) {
    throw new Error('Auction is not open for bidding')
  }
  
  // Check if developer already has a bid
  const existingBidIndex = this.bids.findIndex(bid => 
    bid.developer.toString() === bidData.developer.toString()
  )
  
  if (existingBidIndex !== -1) {
    // Update existing bid
    this.bids[existingBidIndex] = {
      ...this.bids[existingBidIndex],
      ...bidData,
      submittedAt: new Date()
    }
  } else {
    // Add new bid
    this.bids.push(bidData)
  }
  
  return this.save()
}

// Method to accept bid
auctionSchema.methods.acceptBid = function(bidId) {
  const bid = this.bids.id(bidId)
  if (!bid) {
    throw new Error('Bid not found')
  }
  
  if (bid.status !== 'pending') {
    throw new Error('Bid is not pending')
  }
  
  // Reject all other bids
  this.bids.forEach(b => {
    if (b._id.toString() !== bidId) {
      b.status = 'rejected'
    }
  })
  
  // Accept the selected bid
  bid.status = 'accepted'
  this.acceptedBid = bid.developer
  this.status = 'in-progress'
  
  return this.save()
}

// Pre-save middleware to set expiresAt if not provided
auctionSchema.pre('save', function(next) {
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days default
  }
  next()
})

const Auction = mongoose.model('Auction', auctionSchema)

export default Auction
