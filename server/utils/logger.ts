/**
 * Simple logger utility
 * Supports structured logging with objects
 */

export const logger = {
  info: (message: string, data?: Record<string, any>) => {
    if (data) {
      console.log(`[INFO] ${message}`, JSON.stringify(data));
    } else {
      console.log(`[INFO] ${message}`);
    }
  },
  error: (message: string, data?: Record<string, any>) => {
    if (data) {
      console.error(`[ERROR] ${message}`, JSON.stringify(data));
    } else {
      console.error(`[ERROR] ${message}`);
    }
  },
  warn: (message: string, data?: Record<string, any>) => {
    if (data) {
      console.warn(`[WARN] ${message}`, JSON.stringify(data));
    } else {
      console.warn(`[WARN] ${message}`);
    }
  },
};
