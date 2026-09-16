import { Response, CookieOptions } from 'express';
import { env } from '../config/env';

export const ACCESS_COOKIE_NAME = 'access_token';
export const REFRESH_COOKIE_NAME = 'refresh_token';

// 15 minutes in milliseconds
export const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000;
// 7 days in milliseconds
export const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const getBaseCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: env.COOKIE_SAME_SITE,
});

/**
 * Set HTTP-only access and refresh token cookies on the response.
 */
export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string
): void => {
  const baseOptions = getBaseCookieOptions();

  res.cookie(ACCESS_COOKIE_NAME, accessToken, {
    ...baseOptions,
    maxAge: ACCESS_TOKEN_MAX_AGE,
    path: '/',
  });

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    ...baseOptions,
    maxAge: REFRESH_TOKEN_MAX_AGE,
    path: '/api/v1/auth',
  });
};

/**
 * Clear authentication cookies on logout.
 */
export const clearAuthCookies = (res: Response): void => {
  const baseOptions = getBaseCookieOptions();

  res.clearCookie(ACCESS_COOKIE_NAME, {
    ...baseOptions,
    path: '/',
  });

  res.clearCookie(REFRESH_COOKIE_NAME, {
    ...baseOptions,
    path: '/api/v1/auth',
  });

  // Fallback clear for root path to guarantee cleanup across varied clients
  res.clearCookie(REFRESH_COOKIE_NAME, {
    ...baseOptions,
    path: '/',
  });
};
