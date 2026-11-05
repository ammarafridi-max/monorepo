import mongoose from 'mongoose';
import { logger } from '@travel-suite/utils';

export function createDb({ mongoUri }) {
  return {
    connectDB: async () => {
      await mongoose.connect(mongoUri);
      logger.info('MongoDB connected');
    },
    db: mongoose.connection,
  };
}
