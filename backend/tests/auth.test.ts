process.env.NODE_ENV = 'test';

import http from 'http';
import { app } from '../src/app';
import { connectDB, disconnectDB } from '../src/config/database';
import { User, PasswordResetToken } from '../src/models';
import { AuthService } from '../src/services/auth.service';
import { Logger } from '../src/utils/logger';

let server: http.Server;
let baseUrl: string;

// Helper to extract cookies from Set-Cookie header array
const extractCookies = (res: Response): { accessCookie?: string; refreshCookie?: string } => {
  const setCookieHeaders = res.headers.getSetCookie
    ? res.headers.getSetCookie()
    : [res.headers.get('set-cookie') || ''];

  let accessCookie: string | undefined;
  let refreshCookie: string | undefined;

  for (const cookieStr of setCookieHeaders) {
    if (cookieStr.startsWith('access_token=')) {
      accessCookie = cookieStr.split(';')[0];
    }
    if (cookieStr.startsWith('refresh_token=')) {
      refreshCookie = cookieStr.split(';')[0];
    }
  }

  return { accessCookie, refreshCookie };
};

const runTests = async () => {
  Logger.info('====================================================');
  Logger.info('STARTING COMPREHENSIVE MILESTONE 2 AUTHENTICATION TESTS');
  Logger.info('====================================================');

  await connectDB();

  server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, () => resolve()));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Could not start test server');
  baseUrl = `http://localhost:${address.port}/api/v1/auth`;

  let testPassedCount = 0;
  const assert = (condition: boolean, testName: string) => {
    if (!condition) {
      Logger.error(`FAILED: ${testName}`);
      throw new Error(`Test assertion failed: ${testName}`);
    }
    testPassedCount++;
    Logger.info(`PASSED [${testPassedCount}/27]: ${testName}`);
  };

  try {
    // Cleanup prior test records
    await User.deleteMany({ email: /test.*@example\.com/ });
    await PasswordResetToken.deleteMany({});

    // Variables shared across tests
    const testEmail = 'test.user@example.com';
    const testPassword = 'StrongPassword123!';
    let verificationToken = '';
    let accessCookie = '';
    let refreshCookie = '';
    let testUserId = '';

    // -------------------------------------------------------------
    // TEST 1: Signup success
    // -------------------------------------------------------------
    const signupRes = await fetch(`${baseUrl}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: testEmail,
        password: testPassword,
      }),
    });
    const signupData = await signupRes.json();
    assert(
      signupRes.status === 201 &&
        signupData.success === true &&
        signupData.data.user.email === testEmail &&
        signupData.data.user.role === 'user' &&
        signupData.data.user.isEmailVerified === false,
      '1. Signup success'
    );
    verificationToken = signupData.data.verificationToken;
    testUserId = signupData.data.user.id;

    // -------------------------------------------------------------
    // TEST 2: Duplicate email rejection
    // -------------------------------------------------------------
    const dupRes = await fetch(`${baseUrl}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Another User',
        email: testEmail,
        password: testPassword,
      }),
    });
    const dupData = await dupRes.json();
    assert(
      dupRes.status === 409 &&
        dupData.success === false &&
        dupData.error.code === 'EMAIL_ALREADY_EXISTS',
      '2. Duplicate email rejection'
    );

    // -------------------------------------------------------------
    // TEST 3: Invalid signup data (weak password)
    // -------------------------------------------------------------
    const invalidRes = await fetch(`${baseUrl}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'A',
        email: 'bad-email',
        password: 'weak',
      }),
    });
    const invalidData = await invalidRes.json();
    assert(
      invalidRes.status === 400 &&
        invalidData.success === false &&
        invalidData.error.code === 'VALIDATION_ERROR',
      '3. Invalid signup data rejection'
    );

    // -------------------------------------------------------------
    // TEST 4: Password hashing verification
    // -------------------------------------------------------------
    const dbUser = await User.findById(testUserId).select('+passwordHash');
    assert(
      dbUser !== null &&
        dbUser.passwordHash !== testPassword &&
        dbUser.passwordHash.startsWith('$2'),
      '4. Password hashing verified'
    );

    // -------------------------------------------------------------
    // TEST 5: Email verification success
    // -------------------------------------------------------------
    const verifyRes = await fetch(`${baseUrl}/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: verificationToken }),
    });
    const verifyData = await verifyRes.json();
    const updatedUser = await User.findById(testUserId);
    assert(
      verifyRes.status === 200 &&
        verifyData.success === true &&
        updatedUser?.isEmailVerified === true,
      '5. Email verification success'
    );

    // -------------------------------------------------------------
    // TEST 6: Invalid verification token rejection
    // -------------------------------------------------------------
    const invalidVerifyRes = await fetch(`${baseUrl}/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'completely-invalid-token-12345' }),
    });
    const invalidVerifyData = await invalidVerifyRes.json();
    assert(
      invalidVerifyRes.status === 400 &&
        invalidVerifyData.success === false &&
        invalidVerifyData.error.code === 'INVALID_VERIFICATION_TOKEN',
      '6. Invalid verification token rejection'
    );

    // -------------------------------------------------------------
    // TEST 7: Expired verification token rejection
    // -------------------------------------------------------------
    const expiredUser = await User.create({
      name: 'Expired User',
      email: 'test.expired@example.com',
      passwordHash: await AuthService.hashPassword(testPassword),
      isEmailVerified: false,
      emailVerificationToken: AuthService.hashToken('expired-token'),
      emailVerificationExpires: new Date(Date.now() - 10000), // Expired 10s ago
    });
    const expiredVerifyRes = await fetch(`${baseUrl}/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'expired-token' }),
    });
    const expiredVerifyData = await expiredVerifyRes.json();
    assert(
      expiredVerifyRes.status === 400 &&
        expiredVerifyData.success === false &&
        expiredVerifyData.error.code === 'EXPIRED_VERIFICATION_TOKEN',
      '7. Expired verification token rejection'
    );

    // -------------------------------------------------------------
    // TEST 8: Login success
    // -------------------------------------------------------------
    const loginRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });
    const loginData = await loginRes.json();
    const cookies = extractCookies(loginRes);
    accessCookie = cookies.accessCookie || '';
    refreshCookie = cookies.refreshCookie || '';

    assert(
      loginRes.status === 200 &&
        loginData.success === true &&
        loginData.data.user.email === testEmail,
      '8. Login success'
    );

    // -------------------------------------------------------------
    // TEST 9: Invalid password rejection
    // -------------------------------------------------------------
    const badPwRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword123!',
      }),
    });
    const badPwData = await badPwRes.json();
    assert(
      badPwRes.status === 401 &&
        badPwData.success === false &&
        badPwData.error.code === 'INVALID_CREDENTIALS',
      '9. Invalid password rejection'
    );

    // -------------------------------------------------------------
    // TEST 10: Invalid email rejection
    // -------------------------------------------------------------
    const badEmailRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        password: testPassword,
      }),
    });
    const badEmailData = await badEmailRes.json();
    assert(
      badEmailRes.status === 401 &&
        badEmailData.success === false &&
        badEmailData.error.code === 'INVALID_CREDENTIALS',
      '10. Invalid email rejection'
    );

    // -------------------------------------------------------------
    // TEST 11: Access token cookie present
    // -------------------------------------------------------------
    assert(
      accessCookie.length > 0 && accessCookie.includes('access_token='),
      '11. Access token cookie present'
    );

    // -------------------------------------------------------------
    // TEST 12: Refresh token cookie present
    // -------------------------------------------------------------
    assert(
      refreshCookie.length > 0 && refreshCookie.includes('refresh_token='),
      '12. Refresh token cookie present'
    );

    // -------------------------------------------------------------
    // TEST 13: Protected /auth/me with valid cookie
    // -------------------------------------------------------------
    const meRes = await fetch(`${baseUrl}/me`, {
      method: 'GET',
      headers: {
        Cookie: accessCookie,
      },
    });
    const meData = await meRes.json();
    assert(
      meRes.status === 200 &&
        meData.success === true &&
        meData.data.user.email === testEmail &&
        meData.data.user.passwordHash === undefined,
      '13. Protected /auth/me returns user profile'
    );

    // -------------------------------------------------------------
    // TEST 14: /auth/me without authentication
    // -------------------------------------------------------------
    const unauthMeRes = await fetch(`${baseUrl}/me`, {
      method: 'GET',
    });
    const unauthMeData = await unauthMeRes.json();
    assert(
      unauthMeRes.status === 401 &&
        unauthMeData.success === false &&
        unauthMeData.error.code === 'UNAUTHORIZED',
      '14. /auth/me without authentication rejected'
    );

    // -------------------------------------------------------------
    // TEST 15: Refresh token success
    // -------------------------------------------------------------
    const refreshRes = await fetch(`${baseUrl}/refresh`, {
      method: 'POST',
      headers: {
        Cookie: refreshCookie,
      },
    });
    const refreshData = await refreshRes.json();
    const rotatedCookies = extractCookies(refreshRes);
    const newAccessCookie = rotatedCookies.accessCookie || '';
    const newRefreshCookie = rotatedCookies.refreshCookie || '';

    assert(
      refreshRes.status === 200 &&
        refreshData.success === true &&
        newAccessCookie.length > 0 &&
        newRefreshCookie.length > 0,
      '15. Refresh token success'
    );

    // -------------------------------------------------------------
    // TEST 16: Refresh token rotation
    // -------------------------------------------------------------
    assert(
      newRefreshCookie !== refreshCookie,
      '16. Refresh token was rotated to a new token'
    );

    // -------------------------------------------------------------
    // TEST 17: Invalid refresh token / reused token rejected
    // -------------------------------------------------------------
    const reusedRefreshRes = await fetch(`${baseUrl}/refresh`, {
      method: 'POST',
      headers: {
        Cookie: refreshCookie, // Using the previous old refresh token
      },
    });
    const reusedRefreshData = await reusedRefreshRes.json();
    assert(
      reusedRefreshRes.status === 401 &&
        reusedRefreshData.success === false &&
        reusedRefreshData.error.code === 'INVALID_REFRESH_TOKEN',
      '17. Reused / invalid refresh token rejected'
    );

    // -------------------------------------------------------------
    // TEST 18: Logout
    // -------------------------------------------------------------
    const logoutRes = await fetch(`${baseUrl}/logout`, {
      method: 'POST',
      headers: {
        Cookie: newAccessCookie,
      },
    });
    const logoutData = await logoutRes.json();
    assert(
      logoutRes.status === 200 &&
        logoutData.success === true &&
        logoutData.data.message === 'Logged out successfully',
      '18. Logout cleared authentication'
    );

    // -------------------------------------------------------------
    // TEST 19: Forgot password success
    // -------------------------------------------------------------
    const forgotRes = await fetch(`${baseUrl}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail }),
    });
    const forgotData = await forgotRes.json();
    assert(
      forgotRes.status === 200 &&
        forgotData.success === true &&
        forgotData.data.message.includes('password reset link has been sent'),
      '19. Forgot password success'
    );
    const resetToken = forgotData.data.resetToken;

    // -------------------------------------------------------------
    // TEST 20: Forgot password with unknown email returns generic response
    // -------------------------------------------------------------
    const forgotUnknownRes = await fetch(`${baseUrl}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'unknown.user.999@example.com' }),
    });
    const forgotUnknownData = await forgotUnknownRes.json();
    assert(
      forgotUnknownRes.status === 200 &&
        forgotUnknownData.success === true &&
        forgotUnknownData.data.message.includes('password reset link has been sent') &&
        forgotUnknownData.data.resetToken === undefined,
      '20. Forgot password with unknown email returns safe generic response'
    );

    // -------------------------------------------------------------
    // TEST 21: Reset password success
    // -------------------------------------------------------------
    const newPassword = 'BrandNewPassword456!';
    const resetRes = await fetch(`${baseUrl}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: resetToken,
        password: newPassword,
      }),
    });
    const resetData = await resetRes.json();

    // Verify login with new password
    const loginWithNewPwRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: newPassword,
      }),
    });
    assert(
      resetRes.status === 200 &&
        resetData.success === true &&
        loginWithNewPwRes.status === 200,
      '21. Reset password success and login with new password works'
    );

    // -------------------------------------------------------------
    // TEST 22: Invalid reset token rejected
    // -------------------------------------------------------------
    const invalidResetRes = await fetch(`${baseUrl}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'fake-invalid-token',
        password: 'AnotherPassword789!',
      }),
    });
    const invalidResetData = await invalidResetRes.json();
    assert(
      invalidResetRes.status === 400 &&
        invalidResetData.success === false &&
        invalidResetData.error.code === 'INVALID_RESET_TOKEN',
      '22. Invalid reset token rejected'
    );

    // -------------------------------------------------------------
    // TEST 23: Expired reset token rejected
    // -------------------------------------------------------------
    const expiredTokenRaw = 'expired-reset-raw';
    await PasswordResetToken.create({
      user: testUserId,
      tokenHash: AuthService.hashToken(expiredTokenRaw),
      expiresAt: new Date(Date.now() - 60000), // Expired 1 min ago
    });
    const expiredResetRes = await fetch(`${baseUrl}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: expiredTokenRaw,
        password: 'AnotherPassword789!',
      }),
    });
    const expiredResetData = await expiredResetRes.json();
    assert(
      expiredResetRes.status === 400 &&
        expiredResetData.success === false &&
        expiredResetData.error.code === 'EXPIRED_RESET_TOKEN',
      '23. Expired reset token rejected'
    );

    // -------------------------------------------------------------
    // TEST 24: Reused reset token rejected
    // -------------------------------------------------------------
    const reusedResetRes = await fetch(`${baseUrl}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: resetToken, // Already used in test 21
        password: 'YetAnotherPassword123!',
      }),
    });
    const reusedResetData = await reusedResetRes.json();
    assert(
      reusedResetRes.status === 400 &&
        reusedResetData.success === false &&
        reusedResetData.error.code === 'TOKEN_ALREADY_USED',
      '24. Reused reset token rejected'
    );

    // -------------------------------------------------------------
    // TEST 25: Admin authorization
    // -------------------------------------------------------------
    const adminEmail = 'test.admin@example.com';
    const adminUser = await User.create({
      name: 'Admin User',
      email: adminEmail,
      passwordHash: await AuthService.hashPassword('AdminPassword123!'),
      role: 'admin',
      isEmailVerified: true,
    });
    const adminToken = AuthService.signAccessToken({
      userId: adminUser._id.toString(),
      role: 'admin',
    });
    const adminRouteRes = await fetch(`${baseUrl}/admin-only`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    const adminRouteData = await adminRouteRes.json();
    assert(
      adminRouteRes.status === 200 &&
        adminRouteData.success === true &&
        adminRouteData.data.message === 'Welcome Admin',
      '25. Admin authorization success with admin role'
    );

    // -------------------------------------------------------------
    // TEST 26: Normal user denied from admin middleware (403 Forbidden)
    // -------------------------------------------------------------
    const normalUserToken = AuthService.signAccessToken({
      userId: testUserId,
      role: 'user',
    });
    const normalOnAdminRes = await fetch(`${baseUrl}/admin-only`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${normalUserToken}`,
      },
    });
    const normalOnAdminData = await normalOnAdminRes.json();
    assert(
      normalOnAdminRes.status === 403 &&
        normalOnAdminData.success === false &&
        normalOnAdminData.error.code === 'FORBIDDEN',
      '26. Normal user denied from admin middleware with 403 Forbidden'
    );

    // -------------------------------------------------------------
    // TEST 27: Rate limiting behavior
    // -------------------------------------------------------------
    // Verify rate limit headers are returned on auth endpoint
    const rateLimitCheckRes = await fetch(`${baseUrl}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const rateLimitHeader = rateLimitCheckRes.headers.get('ratelimit-limit') ||
      rateLimitCheckRes.headers.get('x-ratelimit-limit') ||
      rateLimitCheckRes.headers.get('ratelimit-policy');
    assert(
      rateLimitHeader !== null && rateLimitHeader !== undefined,
      '27. Rate limiting headers present on auth endpoints'
    );

    Logger.info('====================================================');
    Logger.info('ALL 27 MILESTONE 2 AUTHENTICATION TESTS PASSED CLEANLY!');
    Logger.info('====================================================');
  } catch (error) {
    Logger.error('Test suite failed:', error);
    process.exitCode = 1;
  } finally {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await disconnectDB();
  }
};

runTests();
