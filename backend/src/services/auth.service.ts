import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser, UserRole } from '../models/user.model';
import { PasswordResetToken } from '../models/passwordResetToken.model';
import { env } from '../config/env';
import { Logger } from '../utils/logger';

const BCRYPT_SALT_ROUNDS = 12;

export interface JwtAuthPayload {
  userId: string;
  role: UserRole;
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  lastViewedChangelogDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class AuthError extends Error {
  statusCode: number;
  code: string;

  constructor(code: string, message: string, statusCode = 400) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class AuthService {
  /**
   * Hashes plain text password using bcrypt.
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  }

  /**
   * Compares plain text password with hashed password.
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Hashes a sensitive token (refresh token, verification token, reset token) via SHA-256.
   */
  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generates a cryptographically secure random token string.
   */
  static generateRandomToken(bytes = 32): string {
    return crypto.randomBytes(bytes).toString('hex');
  }

  /**
   * Signs a short-lived JWT access token (15m).
   */
  static signAccessToken(payload: JwtAuthPayload): string {
    return jwt.sign(
      {
        userId: payload.userId,
        role: payload.role,
        jti: this.generateRandomToken(16),
      },
      env.JWT_ACCESS_SECRET,
      {
        expiresIn: env.ACCESS_TOKEN_EXPIRES_IN as jwt.SignOptions['expiresIn'],
      }
    );
  }

  /**
   * Signs a long-lived JWT refresh token (7d).
   */
  static signRefreshToken(payload: JwtAuthPayload): string {
    return jwt.sign(
      {
        userId: payload.userId,
        role: payload.role,
        jti: this.generateRandomToken(16),
      },
      env.JWT_REFRESH_SECRET,
      {
        expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as jwt.SignOptions['expiresIn'],
      }
    );
  }

  /**
   * Verifies access token and extracts payload.
   */
  static verifyAccessToken(token: string): JwtAuthPayload {
    try {
      return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtAuthPayload;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new AuthError('ACCESS_TOKEN_EXPIRED', 'Access token has expired', 401);
      }
      throw new AuthError('INVALID_ACCESS_TOKEN', 'Invalid access token', 401);
    }
  }

  /**
   * Verifies refresh token and extracts payload.
   */
  static verifyRefreshToken(token: string): JwtAuthPayload {
    try {
      return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtAuthPayload;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new AuthError('REFRESH_TOKEN_EXPIRED', 'Refresh token has expired', 401);
      }
      throw new AuthError('INVALID_REFRESH_TOKEN', 'Invalid refresh token', 401);
    }
  }

  /**
   * Converts a Mongoose user document to a safe profile object.
   */
  static toSafeUser(user: IUser): SafeUser {
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      lastViewedChangelogDate: user.lastViewedChangelogDate,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Registers a new user with hashed password and simulated email verification token.
   */
  static async signup(
    name: string,
    email: string,
    password: string
  ): Promise<{ user: SafeUser; verificationToken: string }> {
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new AuthError(
        'EMAIL_ALREADY_EXISTS',
        'An account with this email address already exists',
        409
      );
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Generate simulated email verification token
    const rawVerificationToken = this.generateRandomToken();
    const verificationTokenHash = this.hashToken(rawVerificationToken);
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'user',
      isEmailVerified: false,
      emailVerificationToken: verificationTokenHash,
      emailVerificationExpires: verificationExpires,
    });

    Logger.info(`[Simulation] Email verification token generated for ${normalizedEmail}: ${rawVerificationToken}`);

    return {
      user: this.toSafeUser(user),
      verificationToken: rawVerificationToken,
    };
  }

  /**
   * Verifies user email with token.
   */
  static async verifyEmail(rawToken: string): Promise<{ message: string }> {
    const hashedToken = this.hashToken(rawToken.trim());

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      throw new AuthError(
        'INVALID_VERIFICATION_TOKEN',
        'Invalid email verification token',
        400
      );
    }

    if (
      user.emailVerificationExpires &&
      user.emailVerificationExpires.getTime() < Date.now()
    ) {
      throw new AuthError(
        'EXPIRED_VERIFICATION_TOKEN',
        'Email verification token has expired',
        400
      );
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return { message: 'Email verified successfully' };
  }

  /**
   * Authenticates user with email and password, generating tokens and setting refresh hash.
   */
  static async login(
    email: string,
    password: string
  ): Promise<{ user: SafeUser; accessToken: string; refreshToken: string }> {
    const normalizedEmail = email.trim().toLowerCase();

    // Explicitly select passwordHash
    const user = await User.findOne({ email: normalizedEmail }).select(
      '+passwordHash +refreshTokenHash'
    );

    if (!user) {
      throw new AuthError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    const isMatch = await this.comparePassword(password, user.passwordHash);
    if (!isMatch) {
      throw new AuthError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    const payload: JwtAuthPayload = {
      userId: user._id.toString(),
      role: user.role,
    };

    const accessToken = this.signAccessToken(payload);
    const refreshToken = this.signRefreshToken(payload);

    // Save hashed refresh token on user for rotation & revocation
    user.refreshTokenHash = this.hashToken(refreshToken);
    await user.save();

    return {
      user: this.toSafeUser(user),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Rotates refresh token: verifies token, checks stored hash, issues new pair.
   */
  static async refresh(
    rawRefreshToken: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = this.verifyRefreshToken(rawRefreshToken);

    const user = await User.findById(payload.userId).select('+refreshTokenHash');
    if (!user) {
      throw new AuthError('UNAUTHORIZED', 'User not found', 401);
    }

    const incomingHash = this.hashToken(rawRefreshToken);

    // If no refresh token stored or hash doesn't match, revoke session (reuse detection)
    if (!user.refreshTokenHash || user.refreshTokenHash !== incomingHash) {
      user.refreshTokenHash = undefined;
      await user.save();
      throw new AuthError(
        'INVALID_REFRESH_TOKEN',
        'Refresh token has been revoked or already used',
        401
      );
    }

    const newPayload: JwtAuthPayload = {
      userId: user._id.toString(),
      role: user.role,
    };

    const newAccessToken = this.signAccessToken(newPayload);
    const newRefreshToken = this.signRefreshToken(newPayload);

    // Rotate: update stored hash
    user.refreshTokenHash = this.hashToken(newRefreshToken);
    await user.save();

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Logs out user: clears active refresh token hash in DB.
   */
  static async logout(userId?: string, rawRefreshToken?: string): Promise<{ message: string }> {
    if (userId) {
      await User.findByIdAndUpdate(userId, { refreshTokenHash: undefined });
    } else if (rawRefreshToken) {
      try {
        const payload = this.verifyRefreshToken(rawRefreshToken);
        await User.findByIdAndUpdate(payload.userId, { refreshTokenHash: undefined });
      } catch {
        // Safe logout even if token is already expired/invalid
      }
    }

    return { message: 'Logged out successfully' };
  }

  /**
   * Generates a password reset token and stores hash in PasswordResetToken model.
   * Always returns generic response preventing account enumeration.
   */
  static async forgotPassword(
    email: string
  ): Promise<{ message: string; resetToken?: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const genericResponse = {
      message: 'If an account with that email exists, a password reset link has been sent.',
    };

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return genericResponse;
    }

    const rawToken = this.generateRandomToken();
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(
      Date.now() + env.RESET_PASSWORD_EXPIRES_MINUTES * 60 * 1000
    );

    // Delete any existing active reset tokens for this user
    await PasswordResetToken.deleteMany({ user: user._id });

    // Store hashed token with TTL
    await PasswordResetToken.create({
      user: user._id,
      tokenHash,
      expiresAt,
    });

    Logger.info(`[Simulation] Password reset token generated for ${normalizedEmail}: ${rawToken}`);

    // In non-production, return simulated resetToken for testing/development
    return {
      ...genericResponse,
      ...(env.NODE_ENV !== 'production' ? { resetToken: rawToken } : {}),
    };
  }

  /**
   * Resets password using token and updates user credentials.
   */
  static async resetPassword(
    rawToken: string,
    newPassword: string
  ): Promise<{ message: string }> {
    const tokenHash = this.hashToken(rawToken.trim());

    const tokenDoc = await PasswordResetToken.findOne({ tokenHash });

    if (!tokenDoc) {
      throw new AuthError(
        'INVALID_RESET_TOKEN',
        'Invalid or expired password reset token',
        400
      );
    }

    if (tokenDoc.expiresAt.getTime() < Date.now()) {
      throw new AuthError(
        'EXPIRED_RESET_TOKEN',
        'Password reset token has expired',
        400
      );
    }

    if (tokenDoc.usedAt) {
      throw new AuthError(
        'TOKEN_ALREADY_USED',
        'This password reset token has already been used',
        400
      );
    }

    const user = await User.findById(tokenDoc.user).select(
      '+passwordHash +refreshTokenHash'
    );
    if (!user) {
      throw new AuthError('USER_NOT_FOUND', 'Associated user not found', 400);
    }

    // Hash new password
    user.passwordHash = await this.hashPassword(newPassword);
    // Invalidate existing sessions
    user.refreshTokenHash = undefined;
    await user.save();

    // Mark token as used
    tokenDoc.usedAt = new Date();
    await tokenDoc.save();

    return {
      message: 'Password has been reset successfully. You may now log in with your new password.',
    };
  }

  /**
   * Retrieves safe profile for authenticated user.
   */
  static async getMe(userId: string): Promise<SafeUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AuthError('USER_NOT_FOUND', 'User profile not found', 404);
    }

    return this.toSafeUser(user);
  }
}
