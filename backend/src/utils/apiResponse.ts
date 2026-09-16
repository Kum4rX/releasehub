import { Response } from 'express';

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorPayload;
}

export class ApiResponse {
  /**
   * Send a standardized success response.
   */
  static success<T>(
    res: Response,
    data: T,
    statusCode = 200
  ): Response<ApiSuccessResponse<T>> {
    return res.status(statusCode).json({
      success: true,
      data,
    });
  }

  /**
   * Send a standardized error response.
   */
  static error(
    res: Response,
    code: string,
    message: string,
    statusCode = 400,
    details?: unknown
  ): Response<ApiErrorResponse> {
    const errorPayload: ApiErrorPayload = {
      code,
      message,
    };

    if (details !== undefined) {
      errorPayload.details = details;
    }

    return res.status(statusCode).json({
      success: false,
      error: errorPayload,
    });
  }
}
