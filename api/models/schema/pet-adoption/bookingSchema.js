const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const paymentSchema = new Schema({
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['pending', 'authorized', 'captured', 'refunded', 'failed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'other'],
    required: true
  },
  transactionId: String,
  refundId: String,
  capturedAt: Date,
  refundedAt: Date
});

const bookingSchema = new Schema({
  serviceProvider: {
    type: Schema.Types.ObjectId,
    ref: 'ServiceProvider',
    required: true,
    index: true
  },
  client: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  pets: [{
    petId: {
      type: Schema.Types.ObjectId,
      ref: 'Pet',
      required: true
    },
    specialInstructions: String,
    medications: [{
      name: String,
      dosage: String,
      frequency: String,
      instructions: String
    }]
  }],
  service: {
    type: {
      type: String,
      enum: ['walking', 'sitting', 'daycare', 'boarding', 'training', 'grooming'],
      required: true
    },
    description: String,
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: [Number], // [longitude, latitude]
      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
      }
    }
  },
  schedule: {
    startTime: {
      type: Date,
      required: true,
      index: true
    },
    endTime: {
      type: Date,
      required: true
    },
    duration: Number, // in minutes
    recurring: {
      isRecurring: Boolean,
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'biweekly', 'monthly']
      },
      endDate: Date
    }
  },
  status: {
    type: String,
    enum: [
      'pending',
      'confirmed',
      'in_progress',
      'completed',
      'cancelled_by_client',
      'cancelled_by_provider',
      'no_show'
    ],
    default: 'pending',
    required: true,
    index: true
  },
  payment: paymentSchema,
  pricing: {
    baseRate: {
      type: Number,
      required: true
    },
    additionalPetFee: Number,
    specialServiceFee: Number,
    discount: {
      amount: Number,
      reason: String
    },
    total: {
      type: Number,
      required: true
    }
  },
  checklist: {
    preService: [{
      task: String,
      completed: Boolean,
      completedAt: Date,
      notes: String
    }],
    postService: [{
      task: String,
      completed: Boolean,
      completedAt: Date,
      notes: String
    }]
  },
  updates: [{
    type: {
      type: String,
      enum: ['photo', 'video', 'text', 'location', 'checklist'],
      required: true
    },
    content: Schema.Types.Mixed,
    timestamp: {
      type: Date,
      default: Date.now
    },
    location: {
      coordinates: [Number],
      address: String
    }
  }],
  review: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: Date,
    updatedAt: Date,
    response: {
      comment: String,
      createdAt: Date
    }
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  cancellation: {
    reason: String,
    cancelledBy: {
      type: String,
      enum: ['client', 'provider']
    },
    cancelledAt: Date,
    refundAmount: Number,
    refundStatus: {
      type: String,
      enum: ['pending', 'processed', 'denied']
    }
  },
  metadata: {
    source: String,
    notes: String,
    tags: [String]
  }
}, {
  timestamps: true
});

// Indexes
bookingSchema.index({ 'schedule.startTime': 1, status: 1 });
bookingSchema.index({ serviceProvider: 1, 'schedule.startTime': 1 });
bookingSchema.index({ client: 1, 'schedule.startTime': 1 });
bookingSchema.index({ 'service.location.coordinates': '2dsphere' });

// Virtual for booking duration in hours
bookingSchema.virtual('durationHours').get(function() {
  return this.schedule.duration / 60;
});

// Method to check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function() {
  if (this.status !== 'confirmed') return false;

  const now = new Date();
  const bookingStart = new Date(this.schedule.startTime);
  const hoursUntilBooking = (bookingStart - now) / (1000 * 60 * 60);

  // Check if booking is more than 24 hours away
  return hoursUntilBooking > 24;
};

// Static method to find overlapping bookings
bookingSchema.statics.findOverlapping = async function(
  providerId,
  startTime,
  endTime,
  excludeBookingId = null
) {
  const query = {
    serviceProvider: providerId,
    status: { $in: ['pending', 'confirmed', 'in_progress'] },
    'schedule.startTime': { $lt: endTime },
    'schedule.endTime': { $gt: startTime }
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  return this.find(query);
};

// Static method to calculate provider earnings
bookingSchema.statics.calculateEarnings = async function(
  providerId,
  startDate,
  endDate
) {
  return this.aggregate([
    {
      $match: {
        serviceProvider: providerId,
        status: 'completed',
        'schedule.startTime': { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: '$pricing.total' },
        completedBookings: { $sum: 1 },
        totalDuration: { $sum: '$schedule.duration' }
      }
    }
  ]);
};

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = { Booking, bookingSchema };
