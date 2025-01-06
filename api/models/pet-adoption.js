const petAdoption = require('./schema/pet-adoption');
const { logger } = require('~/config');

// Initialize pet adoption system
const initializePetAdoption = async () => {
  try {
    // Ensure indexes are created
    await Promise.all([
      petAdoption.Pet.init(),
      petAdoption.Shelter.init(),
      petAdoption.Adopter.init(),
      petAdoption.ServiceProvider.init(),
      petAdoption.Booking.init()
    ]);

    logger.info('Pet adoption system initialized successfully');
    return true;
  } catch (error) {
    logger.error('Failed to initialize pet adoption system:', error);
    return false;
  }
};

// Helper functions for LibreChat integration

// Convert pet data to embeddings for vector search
const generatePetEmbeddings = async (pet) => {
  try {
    const description = `${pet.name} is a ${pet.age.years} year old ${pet.breed} ${pet.species}. ` +
      `${pet.description} ${pet.behavior.energyLevel} energy level. ` +
      `Good with: ${Object.entries(pet.behavior.goodWith)
        .filter(([_, value]) => value)
        .map(([key]) => key)
        .join(', ')}`;

    // Use LibreChat's RAG service for embeddings
    const response = await fetch('http://rag-api.railway.internal:8000/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: description,
        model: 'text-embedding-3-small'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate embeddings');
    }

    const { embeddings } = await response.json();
    return embeddings;
  } catch (error) {
    logger.error('Error generating pet embeddings:', error);
    return null;
  }
};

// Find matching pets based on adopter preferences
const findMatchingPets = async (adopterPreferences) => {
  try {
    // Generate embeddings for adopter preferences
    const preferencesText = `Looking for a ${adopterPreferences.species} ` +
      `with ${adopterPreferences.energyLevel} energy level. ` +
      `Must be good with: ${Object.entries(adopterPreferences.goodWith)
        .filter(([_, value]) => value)
        .map(([key]) => key)
        .join(', ')}`;

    const preferenceEmbeddings = await generatePetEmbeddings({ description: preferencesText });
    if (!preferenceEmbeddings) return [];

    // Find pets using vector similarity
    const pets = await petAdoption.Pet.aggregate([
      {
        $match: {
          status: 'available',
          species: adopterPreferences.species,
          ...(adopterPreferences.breeds?.length > 0 && {
            breed: { $in: adopterPreferences.breeds }
          })
        }
      },
      {
        $addFields: {
          similarity: {
            $function: {
              body: function(a, b) {
                return a.reduce((sum, val, i) => sum + val * b[i], 0);
              },
              args: ['$metadata.embeddings', preferenceEmbeddings],
              lang: 'js'
            }
          }
        }
      },
      {
        $sort: { similarity: -1 }
      },
      {
        $limit: 10
      }
    ]);

    return pets;
  } catch (error) {
    logger.error('Error finding matching pets:', error);
    return [];
  }
};

// Find available service providers
const findAvailableProviders = async (
  serviceType,
  location,
  date,
  startTime,
  endTime,
  maxDistance = 10000
) => {
  try {
    const providers = await petAdoption.ServiceProvider.findAvailable(
      serviceType,
      location,
      date,
      startTime,
      endTime,
      maxDistance
    );

    return providers;
  } catch (error) {
    logger.error('Error finding available providers:', error);
    return [];
  }
};

// Export models and helper functions
module.exports = {
  ...petAdoption, // Export all models
  initializePetAdoption,
  generatePetEmbeddings,
  findMatchingPets,
  findAvailableProviders
};
