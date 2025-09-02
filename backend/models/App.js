const mongoose = require('mongoose');

const appSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'App title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'App description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    required: [true, 'Short description is required'],
    maxlength: [200, 'Short description cannot exceed 200 characters']
  },
  developer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Productivity',
      'Entertainment',
      'Education',
      'Health & Fitness',
      'Social Media',
      'Gaming',
      'Business',
      'Lifestyle',
      'Travel',
      'Music',
      'Photo & Video',
      'Utilities',
      'Finance',
      'News',
      'Weather',
      'Other'
    ]
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
    default: 0
  },
  isFree: {
    type: Boolean,
    default: true
  },
  images: [{
    type: String,
    required: [true, 'At least one image is required']
  }],
  icon: {
    type: String,
    required: [true, 'App icon is required']
  },
  screenshots: [{
    type: String
  }],
  features: [{
    type: String,
    maxlength: [100, 'Feature description cannot exceed 100 characters']
  }],
  requirements: {
    minOS: {
      type: String,
      default: 'iOS 12.0 / Android 5.0'
    },
    minRAM: {
      type: String,
      default: '2GB'
    },
    minStorage: {
      type: String,
      default: '100MB'
    }
  },
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    },
    reviews: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
      },
      comment: {
        type: String,
        maxlength: [500, 'Review comment cannot exceed 500 characters']
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  downloads: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected'],
    default: 'draft'
  },
  tags: [{
    type: String,
    maxlength: [20, 'Tag cannot exceed 20 characters']
  }],
  version: {
    type: String,
    default: '1.0.0'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  isFeatured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for search functionality
appSchema.index({
  title: 'text',
  description: 'text',
  shortDescription: 'text',
  tags: 'text'
});

// Virtual for average rating calculation
appSchema.virtual('averageRating').get(function() {
  if (this.ratings.count === 0) return 0;
  return this.ratings.average;
});

// Method to update average rating
appSchema.methods.updateAverageRating = function() {
  if (this.ratings.reviews.length === 0) {
    this.ratings.average = 0;
    this.ratings.count = 0;
  } else {
    const totalRating = this.ratings.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.ratings.average = totalRating / this.ratings.reviews.length;
    this.ratings.count = this.ratings.reviews.length;
  }
};

// Pre-save middleware to update average rating
appSchema.pre('save', function(next) {
  this.updateAverageRating();
  next();
});

module.exports = mongoose.model('App', appSchema);
