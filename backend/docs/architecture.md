# ReleaseHub Backend — Architecture & Design (Milestone 1)

## Overview
ReleaseHub is a Changelog & Product Updates platform backend built with Node.js, Express, TypeScript, and MongoDB/Mongoose.

## Architecture Layers
1. **Config Layer (`src/config`)**:
   - `env.ts`: Centralized, typed environment variable validation and defaults.
   - `database.ts`: Resilient MongoDB connection manager with lifecycle event monitoring and graceful shutdown handlers.

2. **Server & Application Separation (`src/app.ts` & `src/server.ts`)**:
   - `app.ts`: Creates Express application instance, registers security middleware (Helmet, CORS, rate limiting), sets up JSON & URL-encoded body parsers, mounts route modules, and provides fallback 404 & centralized error handling. It is decoupled from network listening so it can be imported by automated tests.
   - `server.ts`: Application entry point. Connects to MongoDB, starts HTTP server on `PORT`, and handles termination signals (`SIGINT`, `SIGTERM`, unhandled rejections).

3. **Data Models (`src/models`)**:
   - **User**: Represents team members and admins. Normalizes and validates email addresses, conceals `passwordHash` by default in queries and serialization, supports role-based access (`user` vs `admin`).
   - **Changelog**: Represents product updates. Supports markdown content, categorisation (`new`, `improved`, `fixed`), publication workflow (`draft`, `published`), author relationships, and optimized chronological compound indexes.
   - **Reaction**: Represents lightweight feedback (`heart`, `celebrate`, `rocket`). Enforces database-level uniqueness with a compound unique index on `{ user, changelog, type }`.
   - **PasswordResetToken**: Stores hashed tokens with automatic MongoDB TTL expiration based on `expiresAt`.

4. **Middleware Foundation (`src/middleware`)**:
   - `auth.middleware.ts`: Skeleton for Bearer token extraction and Express Request user decoration (ready for Milestone 2).
   - `admin.middleware.ts`: Role-based access control checking `req.user.role === 'admin'`.
   - `validation.middleware.ts`: Generic validator wrapper for request body, query, or params.
   - `rateLimiter.middleware.ts`: Rate limiting via `express-rate-limit` returning standard API error envelopes.
   - `error.middleware.ts`: Global error handler converting Mongoose validation errors, duplicate key errors (11000), cast errors, and malformed JSON into clean JSON responses.

5. **Utilities (`src/utils`)**:
   - `apiResponse.ts`: Uniform response format across all endpoints:
     - Success: `{ "success": true, "data": ... }`
     - Error: `{ "success": false, "error": { "code": "...", "message": "..." } }`
   - `logger.ts`: Timestamped structured logging.

6. **API Routes (`src/routes`)**:
   - Versioned base path: `/api/v1`
   - Health check: `GET /api/v1/health`
