import dotenv from 'dotenv';
import path from 'path';

// Load .env file from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export interface EnvConfig {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  MONGODB_URI: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  ACCESS_TOKEN_EXPIRES_IN: string;
  REFRESH_TOKEN_EXPIRES_IN: string;
  CLIENT_URL: string;
  ALLOWED_ORIGINS: string[];
  COOKIE_SECURE: boolean;
  COOKIE_SAME_SITE: 'lax' | 'strict' | 'none';
  RESET_PASSWORD_EXPIRES_MINUTES: number;
}

const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

const getEnvBoolean = (key: string, defaultValue: boolean): boolean => {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
};

const getAllowedOrigins = (): string[] => {
  const rawClientUrl = process.env.CLIENT_URL;
  const origins: string[] = [];

  if (rawClientUrl) {
    rawClientUrl.split(',').forEach((url) => {
      const trimmed = url.trim();
      if (trimmed && !origins.includes(trimmed)) {
        origins.push(trimmed);
      }
    });
  }

  // In non-production environments, ensure standard Vite development origins are supported
  if (process.env.NODE_ENV !== 'production') {
    const devDefaults = [
      'http://localhost:5174',
      'http://localhost:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:5173',
    ];
    devDefaults.forEach((defaultOrigin) => {
      if (!origins.includes(defaultOrigin)) {
        origins.push(defaultOrigin);
      }
    });
  }

  if (origins.length === 0) {
    origins.push('http://localhost:5174');
  }

  return origins;
};

const allowedOrigins = getAllowedOrigins();

export const env: EnvConfig = {
  PORT: getEnvNumber('PORT', 5000),
  NODE_ENV: (process.env.NODE_ENV as EnvConfig['NODE_ENV']) || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/releasehub',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'dev_jwt_access_secret_change_in_prod',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev_jwt_refresh_secret_change_in_prod',
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  CLIENT_URL: allowedOrigins[0] || 'http://localhost:5174',
  ALLOWED_ORIGINS: allowedOrigins,
  COOKIE_SECURE: getEnvBoolean('COOKIE_SECURE', false),
  COOKIE_SAME_SITE: (process.env.COOKIE_SAME_SITE as EnvConfig['COOKIE_SAME_SITE']) || 'lax',
  RESET_PASSWORD_EXPIRES_MINUTES: getEnvNumber('RESET_PASSWORD_EXPIRES_MINUTES', 30),
};
