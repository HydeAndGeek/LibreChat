const { Pet, petSchema } = require('./petSchema');
const { Shelter, shelterSchema } = require('./shelterSchema');
const { Adopter, adopterSchema } = require('./adopterSchema');
const { ServiceProvider, serviceProviderSchema } = require('./serviceProviderSchema');
const { Booking, bookingSchema } = require('./bookingSchema');

// Set up any necessary middleware or hooks

// Pet middleware
petSchema.pre('save', async function(next) {
  if (this.isModified('status') && this.status === 'adopted') {
    // Update shelter capacity when pet is adopted
    const Shelter = this.model('Shelter');
    const shelter = await Shelter.findById(this.shelter);
    if (shelter) {
      const species = this.species.toLowerCase();
      if (shelter.capacity[species]) {
        shelter.capacity[species].current--;
        await shelter.save();
      }
    }
  }
  next();
});

// Booking middleware
bookingSchema.pre('save', async function(next) {
  if (this.isModified('status')) {
    const ServiceProvider = this.model('ServiceProvider');
    const provider = await ServiceProvider.findById(this.serviceProvider);

    if (this.status === 'completed') {
      // Update provider metrics
      provider.metrics.completedBookings++;
      provider.metrics.totalBookings++;

      if (this.review && this.review.rating) {
        const totalRating = provider.metrics.averageRating * provider.metrics.totalReviews;
        provider.metrics.totalReviews++;
        provider.metrics.averageRating =
          (totalRating + this.review.rating) / provider.metrics.totalReviews;
      }
    } else if (this.status.startsWith('cancelled_')) {
      provider.metrics.cancelledBookings++;
    }

    await provider.save();
  }
  next();
});

// ServiceProvider middleware
serviceProviderSchema.pre('save', async function(next) {
  if (this.isModified('status') && this.status === 'suspended') {
    // Cancel all pending bookings
    const Booking = this.model('Booking');
    await Booking.updateMany(
      {
        serviceProvider: this._id,
        status: 'pending'
      },
      {
        status: 'cancelled_by_provider',
        'cancellation.reason': 'Provider suspended',
        'cancellation.cancelledBy': 'provider',
        'cancellation.cancelledAt': new Date()
      }
    );
  }
  next();
});

// Adopter middleware
adopterSchema.pre('save', async function(next) {
  if (this.isModified('status') && this.status === 'banned') {
    // Update any pending adoptions
    const Pet = this.model('Pet');
    const adoptedPets = await Pet.find({
      'adoption.adopter': this._id,
      status: 'pending'
    });

    for (const pet of adoptedPets) {
      pet.status = 'available';
      pet.adoption = undefined;
      await pet.save();
    }
  }
  next();
});

// Export models with their relationships established
module.exports = {
  Pet,
  Shelter,
  Adopter,
  ServiceProvider,
  Booking,
  // Export schemas for potential reuse
  schemas: {
    petSchema,
    shelterSchema,
    adopterSchema,
    serviceProviderSchema,
    bookingSchema
  }
};
