# ReleaseHub Backend — Architecture & Design

## Overview
ReleaseHub is a Changelog & Product Updates platform backend built with Node.js, Express, TypeScript, and MongoDB/Mongoose.

---

## Architecture Layers

### 1. Config Layer (`src/config`)
- `env.ts`: Centralized, typed environment variable validation and defaults (`PORT`, `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ACCESS_TOKEN_EXPIRES_IN`, `REFRESH_TOKEN_EXPIRES_IN`, `CLIENT_URL`, `COOKIE_SECURE`, `COOKIE_SAME_SITE`, `RESET_PASSWORD_EXPIRES_MINUTES`).
- `database.ts`: Resilient MongoDB connection manager with lifecycle event monitoring and graceful shutdown handlers.

### 2. Server & Application Separation (`src/app.ts` & `src/server.ts`)
- `app.ts`: Creates Express application instance, registers security middleware (Helmet, CORS with credentials, express-rate-limit), sets up JSON & URL-encoded body parsers, cookie-parser, mounts versioned routes, and provides fallback 404 & centralized error handling. It is decoupled from network listening so it can be imported by automated tests.
- `server.ts`: Application entry point. Connects to MongoDB, starts HTTP server on `PORT`, and handles termination signals (`SIGINT`, `SIGTERM`, unhandled rejections).

### 3. Data Models (`src/models`)
- **User**: Represents users and admins. Normalizes and validates email addresses, conceals `passwordHash`, `refreshTokenHash`, `emailVerificationToken`, and `emailVerificationExpires` from queries and serialization (`select: false`), supports role-based access (`user` vs `admin`).
- **Changelog**: Represents product updates. Supports markdown content, categorisation (`new`, `improved`, `fixed`), publication workflow (`draft`, `published`), author relationships, and optimized chronological compound indexes.
- **Reaction**: Represents lightweight feedback (`heart`, `celebrate`, `rocket`). Enforces database-level uniqueness with a compound unique index on `{ user, changelog, type }`.
- **PasswordResetToken**: Stores SHA-256 hashed tokens with automatic MongoDB TTL expiration based on `expiresAt`.

### 4. Authentication, JWT & Security
- **Dual-Token JWT Authentication**:
  - **Access Token**: Short-lived (15 minutes). Signed with `JWT_ACCESS_SECRET` containing minimal payload (`{ userId, role, jti }`).
  - **Refresh Token**: Long-lived (7 days). Signed with `JWT_REFRESH_SECRET` containing minimal payload (`{ userId, role, jti }`).
- **Refresh Token Rotation**:
  - Every refresh rotation issues a new token pair and rotates the stored SHA-256 token hash on the `User` model.
  - Reused or revoked refresh tokens immediately trigger session revocation (reuse detection).
- **HTTP-Only Cookies**:
  - `access_token`: `httpOnly: true`, `path: '/'`, `maxAge: 15m`, environment-configured `secure` and `sameSite`.
  - `refresh_token`: `httpOnly: true`, `path: '/api/v1/auth'`, `maxAge: 7d`, environment-configured `secure` and `sameSite`.
- **Password Hashing**:
  - Bcrypt with 12 salt rounds. Plaintext passwords are never stored or logged.
- **Email Verification Simulation**:
  - Generates cryptographically secure random verification token. Stored as SHA-256 hash with 24-hour expiration. Simulated for dev/testing without paid email dependencies.
- **Password Reset**:
  - Cryptographically secure reset token hashed with SHA-256 in `PasswordResetToken` collection. Enforces TTL expiration and single-use validation (`usedAt`). Generic responses prevent account enumeration.

### 5. Middleware Layer (`src/middleware`)
- `auth.middleware.ts`: `requireAuth` extracts access token from HTTP-only cookie (or Bearer fallback), verifies JWT, confirms user existence in database, and attaches safe `req.user`.
- `admin.middleware.ts`: `requireAdmin` enforces that `req.user.role === 'admin'`, returning `403 Forbidden` for non-admin users.
- `validation.middleware.ts`: `validateRequest` higher-order middleware executing input validation rules and returning standardized validation error envelopes.
- `rateLimiter.middleware.ts`: `apiLimiter` (general endpoints) and `authLimiter` (sensitive authentication endpoints: signup, login, refresh, password reset, email verification) returning standard `TOO_MANY_REQUESTS` error envelopes.
- `error.middleware.ts`: Centralized error handler capturing Mongoose validation errors, duplicate key errors (11000), cast errors, and malformed JSON payloads.

### 6. Validation Layer (`src/validators`)
- `auth.validators.ts`: Input validators enforcing name length, email format, password strength (min 8 chars, uppercase, lowercase, number), and token validity for all authentication actions.

### 7. Service Layer (`src/services`)
- `auth.service.ts`: Isolated business logic for hashing, token signing/verification, user registration, email verification, credentials verification, refresh token rotation, logout, and password reset.

### 8. Response Standard (`src/utils/apiResponse.ts`)
- Success: `{ "success": true, "data": ... }`
- Error: `{ "success": false, "error": { "code": "...", "message": "..." } }`

---

## API Routes (`/api/v1`)

### Health
- `GET /api/v1/health`

### Authentication
- `POST /api/v1/auth/signup`: User registration with email normalization, password hashing, and simulated verification token.
- `POST /api/v1/auth/verify-email`: Verify email with token.
- `POST /api/v1/auth/login`: Authenticate credentials, set HTTP-only access and refresh cookies.
- `POST /api/v1/auth/refresh`: Rotate refresh token and update cookies.
- `POST /api/v1/auth/logout`: Invalidate refresh token and clear cookies.
- `GET /api/v1/auth/me`: Get authenticated user profile (`requireAuth`).
- `POST /api/v1/auth/forgot-password`: Request password reset (enumeration-safe).
- `POST /api/v1/auth/reset-password`: Complete password reset with token.
- `GET /api/v1/auth/admin-only`: Verified admin-only endpoint (`requireAuth` + `requireAdmin`).
