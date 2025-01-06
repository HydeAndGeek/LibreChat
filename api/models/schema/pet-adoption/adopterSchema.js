const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const petPreferencesSchema = new Schema({
  species: {
    type: String,
    enum: ['dog', 'cat', 'other'],
    required: true
  },
  breeds: [String],
  ageRange: {
    min: {
      type: Number,
      min: 0
    },
    max: {
      type: Number,
      min: 0
    }
  },
  size: [{
    type: String,
    enum: ['small', 'medium', 'large', 'xlarge']
  }],
  gender: {
    type: String,
    enum: ['male', 'female', 'any']
  },
  energyLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'any']
  },
  goodWith: {
    children: Boolean,
    dogs: Boolean,
    cats: Boolean,
    other: Boolean
  },
  specialNeeds: {
    type: Boolean,
    default: false
  },
  trainingPreferences: {
    houseTrained: Boolean,
    minimumObedienceLevel: {
      type: String,
      enum: ['none', 'basic', 'intermediate', 'advanced']
    }
  }
});

const homeEnvironmentSchema = new Schema({
  type: {
    type: String,
    enum: ['house', 'apartment', 'condo', 'other'],
    required: true
  },
  ownership: {
    type: String,
    enum: ['own', 'rent'],
    required: true
  },
  hasYard: Boolean,
  yardDetails: {
    size: String,
    fenced: Boolean,
    fenceHeight: Number
  },
  otherPets: [{
    species: String,
    breed: String,
    age: Number,
    description: String
  }],
  householdMembers: [{
    relationship: String,
    age: Number,
    petExperience: Boolean
  }]
});

const adopterSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'restricted', 'banned'],
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
    occupation: String,
    income: {
      type: String,
      enum: ['0-30k', '30k-60k', '60k-100k', '100k+'],
      required: true
    }
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
  preferences: petPreferencesSchema,
  homeEnvironment: homeEnvironmentSchema,
  experience: {
    hasPets: Boolean,
    currentPets: Boolean,
    pastPets: [{
      type: String,
      species: String,
      duration: String,
      description: String
    }],
    vetReference: {
      name: String,
      phone: String,
      email: String
    }
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
      status: String
    },
    homeVisit: {
      completed: Boolean,
      date: Date,
      notes: String,
      approvedBy: Schema.Types.ObjectId
    }
  },
  adoptionHistory: [{
    petId: {
      type: Schema.Types.ObjectId,
      ref: 'Pet'
    },
    shelterId: {
      type: Schema.Types.ObjectId,
      ref: 'Shelter'
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'completed', 'rejected', 'cancelled']
    },
    applicationDate: Date,
    completionDate: Date,
    notes: String
  }],
  metadata: {
    preferenceEmbeddings: {
      type: Schema.Types.Mixed,
      select: false
    },
    matchScores: [{
      petId: Schema.Types.ObjectId,
      score: Number,
      timestamp: Date
    }]
  }
}, {
  timestamps: true
});

// Indexes
adopterSchema.index({ 'contact.coordinates': '2dsphere' });
adopterSchema.index({ status: 1, 'verification.identityVerified': 1 });
adopterSchema.index({ userId: 1, status: 1 });

// Virtual for full name
adopterSchema.virtual('fullName').get(function() {
  return `${this.personalInfo.firstName} ${this.personalInfo.lastName}`;
});

// Method to check if adopter is eligible
adopterSchema.methods.isEligible = function() {
  return this.status === 'approved' &&
         this.verification.identityVerified &&
         this.verification.backgroundCheck?.completed;
};

// Static method to find potential matches
adopterSchema.statics.findMatches = async function(petId, limit = 10) {
  const Pet = mongoose.model('Pet');
  const pet = await Pet.findById(petId);

  if (!pet) return [];

  return this.find({
    status: 'approved',
    'verification.identityVerified': true,
    'preferences.species': pet.species,
    'preferences.size': pet.size,
    $or: [
      { 'preferences.breeds': { $exists: false } },
      { 'preferences.breeds': { $in: [pet.breed] } }
    ]
  })
  .sort({ 'metadata.matchScores.score': -1 })
  .limit(limit);
};

const Adopter = mongoose.model('Adopter', adopterSchema);

module.exports = { Adopter, adopterSchema };
