require('dotenv').config();
const mongoose = require('mongoose');
const { logger } = require('~/config');
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  logger.error('MONGO_URI environment variable is not defined');
  throw new Error('Please define the MONGO_URI environment variable');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDb() {
  if (cached.conn && cached.conn?._readyState === 1) {
    logger.info('Using existing MongoDB connection');
    return cached.conn;
  }

  const disconnected = cached.conn && cached.conn?._readyState !== 1;
  if (!cached.promise || disconnected) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 30000, // Increased timeout for server selection
      connectTimeoutMS: 30000, // Increased timeout for initial connection
      socketTimeoutMS: 60000, // Increased socket timeout
      family: 4, // Use IPv4, skip trying IPv6
      maxPoolSize: 10,
      minPoolSize: 1,
      retryWrites: true,
      retryReads: true,
      // DNS resolution options
      dnsRetryInterval: 5000,
      dnsRetryCount: 5,
      // Network error handling
      heartbeatFrequencyMS: 10000,
      waitQueueTimeoutMS: 30000
    };

    mongoose.set('strictQuery', true);

    // Add retry logic for initial connection with longer intervals
    let retries = 10;
    const retryInterval = 5000; // 5 seconds

    while (retries > 0) {
      try {
        logger.info('Attempting to connect to MongoDB...');
        cached.promise = await mongoose.connect(MONGO_URI, opts);
        logger.info('Successfully connected to MongoDB');
        return cached.promise;
      } catch (error) {
        retries--;
        if (retries === 0) {
          logger.error('Failed to connect to MongoDB after all retries:', error);
          throw error;
        }
        logger.warn(`Failed to connect to MongoDB: ${error.message}. Retrying in ${retryInterval}ms... (${retries} attempts remaining)`);
        await new Promise(resolve => setTimeout(resolve, retryInterval));
      }
    }
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    logger.error('Error while establishing MongoDB connection:', error);
    throw error;
  }
}

module.exports = connectDb;
