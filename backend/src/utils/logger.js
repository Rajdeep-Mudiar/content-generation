import winston from 'winston';
import { Log } from '../models/Log.js';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Custom function to log to DB as well
export const dbLogger = async (level, message, context, details = {}) => {
  logger.log(level, `${context}: ${message}`, details);
  try {
    await Log.create({ level, message, context, details });
  } catch (err) {
    console.error('Failed to save log to DB:', err);
  }
};

export default logger;
