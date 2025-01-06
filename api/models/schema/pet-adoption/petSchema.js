const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const petSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  species: {
    type: String,
    required: true,
    enum: ['dog', 'cat', 'other'],
    index: true
  },
  breed: {
    type: String,
    trim: true,
    index: true
  },
  age: {
    years: {
      type: Number,
      min: 0,
      required: true
    },
    months: {
      type: Number,
      min: 0,
      max: 11,
      required: true
    }
  },
  size: {
    type: String,
    enum: ['small', 'medium', 'large', 'xlarge'],
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'unknown'],
    required: true
  },
  description: {
    type: String,
    required: true,
    maxLength: 2000
  },
  photos: [{
    url: String,
    isMain: Boolean,
    caption: String,
    uploadDate: Date
  }],
  status: {
    type: String,
    enum: ['available', 'pending', 'adopted', 'fostered', 'unavailable'],
    default: 'available',
    required: true,
    index: true
  },
  shelter: {
    type: Schema.Types.ObjectId,
    ref: 'Shelter',
    required: true,
    index: true
  },
  health: {
    vaccinated: Boolean,
    spayedNeutered: Boolean,
    microchipped: Boolean,
    specialNeeds: Boolean,
    specialNeedsDescription: String,
    medicalHistory: [{
      condition: String,
      diagnosis: Date,
      treatment: String,
      resolved: Boolean
    }]
  },
  behavior: {
    goodWith: {
      children: Boolean,
      dogs: Boolean,
      cats: Boolean,
      other: Boolean
    },
    energyLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true
    },
    training: {
      houseTrained: Boolean,
      obedienceLevel: {
        type: String,
        enum: ['none', 'basic', 'intermediate', 'advanced']
      },
      knownCommands: [String]
    }
  },
  adoption: {
    fee: {
      type: Number,
      required: true,
      min: 0
    },
    requirements: [String],
    includedServices: [String]
  },
  metadata: {
    embeddings: {
      type: Schema.Types.Mixed,
      select: false // Only load when explicitly requested
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 1,
      index: true
    }
  }
}, {
  timestamps: true
});

// Indexes
petSchema.index({ 'metadata.matchScore': -1, createdAt: -1 });
petSchema.index({ species: 1, breed: 1, status: 1 });
petSchema.index({ 'behavior.energyLevel': 1, size: 1, status: 1 });

// Virtual for age in months (for easier querying)
petSchema.virtual('ageInMonths').get(function() {
  return (this.age.years * 12) + this.age.months;
});

// Instance method to check if pet is available
petSchema.methods.isAvailable = function() {
  return this.status === 'available';
};

// Static method to find matching pets
petSchema.statics.findMatches = async function(preferences, limit = 10) {
  const query = {
    status: 'available',
    species: preferences.species,
    'behavior.energyLevel': preferences.energyLevel,
    size: { $in: preferences.acceptableSizes }
  };

  if (preferences.breed) {
    query.breed = preferences.breed;
  }

  if (preferences.maxAge) {
    query.ageInMonths = { $lte: preferences.maxAge * 12 };
  }

  return this.find(query)
    .sort({ 'metadata.matchScore': -1 })
    .limit(limit)
    .populate('shelter', 'name location');
};

const Pet = mongoose.model('Pet', petSchema);

module.exports = { Pet, petSchema };
