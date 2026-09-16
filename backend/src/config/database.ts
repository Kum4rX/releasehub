import mongoose from 'mongoose';
import { env } from './env';
import { Logger } from '../utils/logger';

/**
 * Connect to MongoDB database.
 */
export const connectDB = async (): Promise<typeof mongoose> => {
  try {
    mongoose.set('strictQuery', true);

    mongoose.connection.on('connected', () => {
      Logger.info(`MongoDB connected successfully to ${mongoose.connection.name}`);
    });

    mongoose.connection.on('error', (err) => {
      Logger.error(`MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      Logger.warn('MongoDB disconnected');
    });

    const conn = await mongoose.connect(env.MONGODB_URI);
    return conn;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    Logger.error(`Failed to connect to MongoDB: ${message}`);
    throw error;
  }
};

/**
 * Disconnect from MongoDB gracefully.
 */
export const disconnectDB = async (): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      Logger.info('MongoDB connection closed gracefully');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    Logger.error(`Error during MongoDB disconnection: ${message}`);
    throw error;
  }
};
