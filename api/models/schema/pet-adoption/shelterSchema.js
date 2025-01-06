const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const operatingHoursSchema = new Schema({
  day: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: true
  },
  open: {
    type: String,
    required: true,
    match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
  },
  close: {
    type: String,
    required: true,
    match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
  },
  closed: {
    type: Boolean,
    default: false
  }
});

const shelterSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  type: {
    type: String,
    enum: ['shelter', 'rescue', 'foster_network', 'sanctuary'],
    required: true
  },
  location: {
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
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    }
  },
  contact: {
    phone: String,
    email: {
      type: String,
      required: true
    },
    website: String,
    socialMedia: {
      facebook: String,
      instagram: String,
      twitter: String
    }
  },
  operatingHours: [operatingHoursSchema],
  capacity: {
    dogs: {
      current: Number,
      maximum: Number
    },
    cats: {
      current: Number,
      maximum: Number
    },
    other: {
      current: Number,
      maximum: Number
    }
  },
  services: {
    adoption: {
      type: Boolean,
      default: true
    },
    fostering: Boolean,
    veterinary: Boolean,
    grooming: Boolean,
    training: Boolean,
    boarding: Boolean,
    transportation: Boolean
  },
  requirements: {
    adoptionProcess: [String],
    fosterProcess: [String],
    documents: [String]
  },
  staff: [{
    role: {
      type: String,
      enum: ['manager', 'coordinator', 'veterinarian', 'caretaker', 'volunteer'],
      required: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    permissions: [{
      type: String,
      enum: ['manage_pets', 'manage_adoptions', 'manage_staff', 'manage_content', 'view_only']
    }]
  }],
  metrics: {
    adoptionRate: Number,
    returnRate: Number,
    averageLOS: Number, // Length of Stay
    successfulFosterings: Number
  },
  verification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    documents: [{
      type: String,
      documentType: String,
      verifiedAt: Date
    }],
    taxId: String,
    licenses: [{
      type: String,
      number: String,
      expiryDate: Date
    }]
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'suspended', 'inactive'],
    default: 'pending',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
shelterSchema.index({ 'location.coordinates': '2dsphere' });
shelterSchema.index({ status: 1, type: 1 });
shelterSchema.index({ 'verification.isVerified': 1, status: 1 });

// Virtual for total current pets
shelterSchema.virtual('totalPets').get(function() {
  return (this.capacity.dogs?.current || 0) +
         (this.capacity.cats?.current || 0) +
         (this.capacity.other?.current || 0);
});

// Method to check if shelter has capacity for new pet
shelterSchema.methods.hasCapacity = function(species) {
  const capacity = this.capacity[species.toLowerCase()];
  return capacity && capacity.current < capacity.maximum;
};

// Static method to find nearby shelters
shelterSchema.statics.findNearby = async function(coordinates, maxDistance = 50000) {
  return this.find({
    status: 'active',
    'verification.isVerified': true,
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: maxDistance
      }
    }
  });
};

const Shelter = mongoose.model('Shelter', shelterSchema);

module.exports = { Shelter, shelterSchema };
