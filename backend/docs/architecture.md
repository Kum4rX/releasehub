# ReleaseHub Backend — Architecture & Design

## Overview
ReleaseHub is a Changelog & Product Updates platform backend built with Node.js, Express, TypeScript, and MongoDB/Mongoose.

---

## Architecture Layers

### 1. Config Layer (`src/config`)
- `env.ts`: Centralized, typed environment variable validation and defaults (`PORT`, `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ACCESS_TOKEN_EXPIRES_IN`, `REFRESH_TOKEN_EXPIRES_IN`, `CLIENT_URL`, `COOKIE_SECURE`, `COOKIE_SAME_SITE`, `RESET_PASSWORD_EXPIRES_MINUTES`).
- `database.ts`: Resilient MongoDB connection manager with lifecycle event monitoring and graceful shutdown handlers.

### 2. Server & Application Separation (`src/app.ts` & `src/server.ts`)
- `app.ts`: Creates Express application instance, registers security middleware (Helmet, CORS with credentials, express-rate-limit), sets up JSON & URL-encoded body parsers, cookie-parser, mounts versioned routes (`/api/v1`), and provides fallback 404 & centralized error handling. It is decoupled from network listening so it can be imported by automated tests.
- `server.ts`: Application entry point. Connects to MongoDB, starts HTTP server on `PORT`, and handles termination signals (`SIGINT`, `SIGTERM`, unhandled rejections).

### 3. Data Models (`src/models`)
- **User**: Represents users and admins. Normalizes and validates email addresses, conceals `passwordHash`, `refreshTokenHash`, `emailVerificationToken`, and `emailVerificationExpires` from queries and serialization (`select: false`), supports role-based access (`user` vs `admin`), and tracks `lastViewedChangelogDate` for unread notifications.
- **Changelog**: Represents product updates. Supports markdown content, categorisation (`new`, `improved`, `fixed`), publication workflow (`draft`, `published`), author relationships, unique URL-safe slugs, and compound indexes:
  - `status: 1, publishedAt: -1` (fast chronological timeline querying)
  - `status: 1, category: 1, publishedAt: -1` (fast category-filtered chronological timeline querying)
- **Reaction**: Represents user feedback (`heart`, `celebrate`, `rocket`). Enforces database-level uniqueness via a compound unique index on `{ user, changelog, type }`.
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

### 5. Changelog & Reactions Engine (Milestone 3)
- **Slug Generation & Collision Handling** (`src/utils/slug.util.ts`):
  - Automatically transforms title strings into lowercased, hyphenated, alphanumeric slugs.
  - Checks MongoDB for collision and suffixes with incrementing counters (`-1`, `-2`, etc.) ensuring 100% uniqueness without throwing duplicate key exceptions.
- **Pagination & Query Engine** (`src/utils/pagination.util.ts`):
  - Standard pagination envelope containing: `page`, `limit`, `totalItems`, `totalPages`, `hasNextPage`, `hasPreviousPage`.
  - Caps page size safely at 50 items.
  - Case-insensitive search regex across `title`, `contentMarkdown`, and `tags`.
- **Route Resolution Ordering**:
  - Specific static and sub-routes (`/admin`, `/admin/:id`, `/feed`, `/:slug/related`, `/:id/reactions`) are mounted before dynamic `/:slug` route to eliminate parameter collisions.
- **Optional Authentication** (`optionalAuth`):
  - Allows public endpoints (e.g. single changelog detail) to optionally detect logged-in users and attach their personalized reaction states (`userReactions: { heart: boolean, celebrate: boolean, rocket: boolean }`) while maintaining anonymous public access.
- **Atomic Reaction Tracking**:
  - MongoDB aggregation `$facet` and `$group` pipeline aggregates counts for `heart`, `celebrate`, and `rocket`.
  - Cascading cleanup deletes all reactions upon changelog removal.

### 6. Notifications, Profile & Insights Engine (Milestone 4)
- **What's New / Notification Center** (`src/services/notification.service.ts`):
  - Derives notifications directly from the `Changelog` collection (`status: 'published'`) without duplicate collections.
  - Unread tracking is determined dynamically by comparing `Changelog.publishedAt` against `User.lastViewedChangelogDate`.
  - When `lastViewedChangelogDate` is `null` (e.g., newly registered user), all published updates are treated as unread (`isUnread: true`).
  - `POST /api/v1/notifications/read` updates `lastViewedChangelogDate` to the current timestamp, instantly resetting `unreadCount` to `0`.
  - Subsequent published updates with `publishedAt > lastViewedChangelogDate` automatically register as unread.
- **User Profile Management & Security** (`src/services/user.service.ts`):
  - `GET /api/v1/users/me` returns sanitized profile: `id`, `name`, `email`, `role`, `isEmailVerified`, `lastViewedChangelogDate`, `createdAt`, `updatedAt`.
  - Sensitive internal fields (`passwordHash`, `refreshTokenHash`, verification/reset tokens) are never exposed.
  - `PATCH /api/v1/users/me` allows updating `name` (trimmed, 2-100 characters). `email` and `role` are strictly immutable and protected against escalation.
- **Admin Insights Aggregations** (`src/services/admin.service.ts`):
  - Aggregates high-level metrics across collections:
    - Changelog statistics (`total`, `published`, `draft`).
    - Reaction totals and granular type breakdown (`heart`, `celebrate`, `rocket`).
    - User statistics (`total`, `verified`).
    - Recent activity: Top 5 published changelogs with reaction breakdowns.

### 7. Middleware Layer (`src/middleware`)
- `auth.middleware.ts`:
  - `requireAuth`: Enforces valid authentication from cookies or Bearer tokens.
  - `optionalAuth`: Gracefully populates `req.user` if valid credentials exist, without blocking anonymous visitors.
- `admin.middleware.ts`: `requireAdmin` enforces that `req.user.role === 'admin'`, returning `403 Forbidden` for non-admin users.
- `validation.middleware.ts`: `validateRequest` higher-order middleware executing input validation rules and returning standardized validation error envelopes.
- `rateLimiter.middleware.ts`: `apiLimiter` (general endpoints) and `authLimiter` (sensitive authentication endpoints) returning standard `TOO_MANY_REQUESTS` error envelopes.
- `error.middleware.ts`: Centralized error handler capturing Mongoose validation errors, duplicate key errors (11000), cast errors, and malformed JSON payloads.

### 8. Validation Layer (`src/validators`)
- `auth.validators.ts`: Input validators for signup, login, email verification, and password reset.
- `changelog.validators.ts`: Input validators for changelog creation, updates, pagination queries, category enum validation, valid MongoDB ObjectIds, and reaction types.
- `user.validators.ts`: Input validators for profile update (`name` validation).

### 9. Service Layer (`src/services`)
- `auth.service.ts`: Isolated business logic for hashing, tokens, registration, email verification, credentials, rotation, logout, and password reset.
- `changelog.service.ts`: Administrative CRUD operations, publish/unpublish lifecycle, slug calculation, public timeline query engine with aggregation, public RSS/JSON feed generation, related items lookup, and reactions toggle.
- `notification.service.ts`: What's New feed aggregation, unread status calculation, and mark-all-read timestamp updates.
- `user.service.ts`: Safe user profile inspection and name updates.
- `admin.service.ts`: System insights and metrics aggregation.

### 10. Response Standard (`src/utils/apiResponse.ts`)
- Success: `{ "success": true, "data": ... }`
- Error: `{ "success": false, "error": { "code": "...", "message": "..." } }`

---

## API Routes (`/api/v1`)

### Health
- `GET /api/v1/health`

### Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/signup`: User registration.
- `POST /api/v1/auth/verify-email`: Verify email with token.
- `POST /api/v1/auth/login`: Authenticate credentials, set HTTP-only cookies.
- `POST /api/v1/auth/refresh`: Rotate refresh token and update cookies.
- `POST /api/v1/auth/logout`: Invalidate refresh token and clear cookies.
- `GET /api/v1/auth/me`: Get authenticated user profile (`requireAuth`).
- `POST /api/v1/auth/forgot-password`: Request password reset (enumeration-safe).
- `POST /api/v1/auth/reset-password`: Complete password reset with token.
- `GET /api/v1/auth/admin-only`: Verified admin-only endpoint (`requireAuth` + `requireAdmin`).

### Changelog Management & Admin (`/api/v1/changelog/admin`)
- `POST /api/v1/changelog/admin`: Create changelog (defaults to `draft`, admin-only).
- `GET /api/v1/changelog/admin`: List all changelogs with status/category/search filters & pagination (admin-only).
- `GET /api/v1/changelog/admin/:id`: Get changelog by ID (admin-only).
- `PUT /api/v1/changelog/admin/:id`: Update changelog and recalculate slug (admin-only).
- `DELETE /api/v1/changelog/admin/:id`: Delete changelog and cascade reactions (admin-only).
- `POST /api/v1/changelog/admin/:id/publish`: Publish changelog, set `publishedAt` (admin-only).
- `POST /api/v1/changelog/admin/:id/unpublish`: Unpublish changelog, revert to `draft` (admin-only).

### Public Changelog & Discovery (`/api/v1/changelog`)
- `GET /api/v1/changelog`: Public timeline of published updates with category/search filters, pagination, and reaction counts.
- `GET /api/v1/changelog/feed`: Clean JSON feed of published product updates.
- `GET /api/v1/changelog/:slug`: Public update detail with author info, reaction counts, and user's reaction states if logged in.
- `GET /api/v1/changelog/:slug/related`: Related published updates by category.

### Reactions Engine (`/api/v1/changelog/:id/reactions`)
- `POST /api/v1/changelog/:id/reactions`: Add reaction (`heart`, `celebrate`, `rocket`) to a published changelog (`requireAuth`).
- `DELETE /api/v1/changelog/:id/reactions/:type`: Remove reaction (`requireAuth`).

### Notifications / What's New (`/api/v1/notifications`)
- `GET /api/v1/notifications`: Retrieve What's New updates, overall unread count, and per-item `isUnread` status (`requireAuth`).
- `POST /api/v1/notifications/read`: Mark all notifications as read, setting `lastViewedChangelogDate` to current timestamp (`requireAuth`).

### User Profile (`/api/v1/users`)
- `GET /api/v1/users/me`: Retrieve sanitized user profile (`requireAuth`).
- `PATCH /api/v1/users/me`: Update profile name (`requireAuth`).

### Admin Insights (`/api/v1/admin`)
- `GET /api/v1/admin/insights`: Retrieve aggregated system metrics (`requireAuth` + `requireAdmin`).
