const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const availabilitySchema = new Schema({
  day: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: true
  },
  slots: [{
    startTime: {
      type: String,
      required: true,
      match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
    },
    endTime: {
      type: String,
      required: true,
      match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
    },
    booked: {
      type: Boolean,
      default: false
    }
  }],
  unavailable: {
    type: Boolean,
    default: false
  }
});

const serviceSchema = new Schema({
  type: {
    type: String,
    enum: ['walking', 'sitting', 'daycare', 'boarding', 'training', 'grooming'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  pricing: {
    baseRate: {
      type: Number,
      required: true,
      min: 0
    },
    rateType: {
      type: String,
      enum: ['per_hour', 'per_day', 'per_visit', 'per_session'],
      required: true
    },
    additionalPetRate: Number,
    specialRates: [{
      condition: String,
      rate: Number,
      description: String
    }]
  },
  features: [String],
  restrictions: {
    maxPets: Number,
    petSizeLimit: String,
    petTypes: [String]
  }
});

const serviceProviderSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'inactive'],
    default: 'pending'
  },
  personalInfo: {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    dateOfBirth: {
      type: Date,
      required: true
    },
    bio: {
      type: String,
      maxLength: 1000
    },
    profilePhoto: String,
    gallery: [String]
  },
  contact: {
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: [Number] // [longitude, latitude]
    }
  },
  services: [serviceSchema],
  availability: [availabilitySchema],
  experience: {
    yearsOfExperience: Number,
    qualifications: [{
      title: String,
      institution: String,
      year: Number,
      verified: Boolean
    }],
    specialties: [String],
    languages: [String]
  },
  verification: {
    identityVerified: {
      type: Boolean,
      default: false
    },
    documents: [{
      type: String,
      documentType: String,
      verifiedAt: Date
    }],
    backgroundCheck: {
      completed: Boolean,
      date: Date,
      status: String,
      expiryDate: Date
    },
    insurance: {
      provider: String,
      policyNumber: String,
      expiryDate: Date,
      coverage: [{
        type: String,
        amount: Number
      }]
    }
  },
  metrics: {
    totalBookings: {
      type: Number,
      default: 0
    },
    completedBookings: {
      type: Number,
      default: 0
    },
    cancelledBookings: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    responseRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    responseTime: {
      type: Number, // Average response time in minutes
      default: 0
    }
  },
  preferences: {
    serviceRadius: {
      type: Number, // Distance in kilometers
      default: 10
    },
    notificationPreferences: {
      email: Boolean,
      sms: Boolean,
      push: Boolean
    },
    bookingPreferences: {
      instantBooking: Boolean,
      minimumNotice: Number, // Hours
      cancellationPolicy: {
        type: String,
        enum: ['flexible', 'moderate', 'strict']
      }
    }
  },
  bankInfo: {
    accountHolder: String,
    accountNumber: {
      type: String,
      select: false // Only load when explicitly requested
    },
    routingNumber: {
      type: String,
      select: false
    },
    bankName: String
  }
}, {
  timestamps: true
});

// Indexes
serviceProviderSchema.index({ 'contact.coordinates': '2dsphere' });
serviceProviderSchema.index({ status: 1, 'verification.identityVerified': 1 });
serviceProviderSchema.index({ 'services.type': 1, status: 1 });
serviceProviderSchema.index({ 'metrics.averageRating': -1 });

// Virtual for full name
serviceProviderSchema.virtual('fullName').get(function() {
  return `${this.personalInfo.firstName} ${this.personalInfo.lastName}`;
});

// Method to check if provider is available at specific time
serviceProviderSchema.methods.isAvailable = function(date, startTime, endTime) {
  const dayOfWeek = date.toLocaleLowerCase();
  const daySchedule = this.availability.find(a => a.day === dayOfWeek);

  if (!daySchedule || daySchedule.unavailable) return false;

  return daySchedule.slots.some(slot =>
    slot.startTime <= startTime &&
    slot.endTime >= endTime &&
    !slot.booked
  );
};

// Static method to find available providers
serviceProviderSchema.statics.findAvailable = async function(
  serviceType,
  location,
  date,
  startTime,
  endTime,
  maxDistance = 10000
) {
  const dayOfWeek = date.toLocaleLowerCase();

  return this.find({
    status: 'active',
    'verification.identityVerified': true,
    'services.type': serviceType,
    'contact.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: location
        },
        $maxDistance: maxDistance
      }
    },
    availability: {
      $elemMatch: {
        day: dayOfWeek,
        unavailable: false,
        slots: {
          $elemMatch: {
            startTime: { $lte: startTime },
            endTime: { $gte: endTime },
            booked: false
          }
        }
      }
    }
  })
  .sort({ 'metrics.averageRating': -1 });
};

const ServiceProvider = mongoose.model('ServiceProvider', serviceProviderSchema);

module.exports = { ServiceProvider, serviceProviderSchema };
