import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let isConnected = false;

export async function connectDB(): Promise<typeof mongoose> {
  if (isConnected) {
    return mongoose;
  }

  try {
    mongoose.connection.on('connected', () => {
      isConnected = true;
      logger.info('📦 MongoDB connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      logger.error({ err }, '❌ MongoDB connection error');
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      logger.warn('⚠️ MongoDB disconnected');
    });

    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true
    });

    isConnected = true;
    return conn;
  } catch (error) {
    logger.error({ error }, '❌ Initial MongoDB connection failed');
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  if (!isConnected) return;
  try {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB connection closed');
  } catch (err) {
    logger.error({ err }, 'Error closing MongoDB connection');
  }
}

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
