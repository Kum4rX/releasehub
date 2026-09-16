import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { Logger } from '../utils/logger';
import { env } from '../config/env';

export interface CustomError extends Error {
  statusCode?: number;
  code?: number | string;
  errors?: Record<string, { message: string }>;
  keyValue?: Record<string, unknown>;
}

/**
 * Global 404 Not Found Middleware
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  ApiResponse.error(
    res,
    'NOT_FOUND',
    `Cannot ${req.method} ${req.originalUrl}`,
    404
  );
};

/**
 * Global Centralized Error Handling Middleware
 */
export const errorHandler = (
  err: CustomError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let errorCode = typeof err.code === 'string' ? err.code : 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected error occurred';
  let details: unknown = undefined;

  // Handle malformed JSON body
  if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    errorCode = 'BAD_REQUEST';
    message = 'Malformed JSON in request body';
  }

  // Handle Mongoose Duplicate Key Error (E11000)
  if (err.code === 11000 && err.keyValue) {
    statusCode = 409;
    errorCode = 'DUPLICATE_KEY';
    const field = Object.keys(err.keyValue)[0] || 'field';
    message = `A record with this ${field} already exists`;
  }

  // Handle Mongoose Validation Errors
  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = Object.values(err.errors).map((e) => e.message);
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    errorCode = 'INVALID_IDENTIFIER';
    message = 'Invalid resource identifier format';
  }

  // Log error (with stack trace in development)
  if (statusCode >= 500) {
    Logger.error(`[Unhandled Exception] ${err.message}`, err.stack);
  } else {
    Logger.warn(`[Client Error ${statusCode}] ${message}`);
  }

  if (env.NODE_ENV === 'development' && statusCode >= 500 && !details) {
    details = err.stack;
  }

  ApiResponse.error(res, errorCode, message, statusCode, details);
};
