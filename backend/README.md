# ReleaseHub Backend

A clean, scalable, and secure MERN backend for **ReleaseHub** (a Changelog & Product Updates platform), implemented with Node.js, Express, TypeScript, and MongoDB.

---

## Tech Stack

- **Runtime**: Node.js (>= 20.0.0)
- **Language**: TypeScript (v5, strict mode)
- **Web Framework**: Express (v4)
- **Database & ODM**: MongoDB with Mongoose (v8)
- **Authentication & Security**:
  - `bcryptjs` (Password hashing with 12 salt rounds)
  - `jsonwebtoken` (Dual access/refresh JWT tokens with rotation)
  - `helmet` (HTTP security headers)
  - `cors` (Restricted client origin with credentials)
  - `cookie-parser` (Secure HTTP-only cookie parsing)
  - `express-rate-limit` (API & authentication rate limiting)
  - `dotenv` (Type-safe environment configuration)
- **Development Tooling**:
  - `tsx` (TypeScript execute & watch runner)
  - `tsc` (TypeScript compiler)

---

## Folder Structure

```text
backend/
├── src/
│   ├── config/
│   │   ├── env.ts          # Strongly-typed environment configuration
│   │   └── database.ts     # MongoDB connection & lifecycle management
│   ├── controllers/
│   │   ├── auth.controller.ts   # Authentication request controller
│   │   └── health.controller.ts # Health check controller
│   ├── middleware/
│   │   ├── auth.middleware.ts        # JWT verification (requireAuth)
│   │   ├── admin.middleware.ts       # Role authorization (requireAdmin)
│   │   ├── validation.middleware.ts  # Generic request validation wrapper
│   │   ├── error.middleware.ts       # Central error & 404 handlers
│   │   ├── rateLimiter.middleware.ts # API & Auth rate limiters
│   │   └── index.ts
│   ├── models/
│   │   ├── user.model.ts               # User schema, roles, hidden hashes
│   │   ├── changelog.model.ts          # Changelog schema & compound indexes
│   │   ├── reaction.model.ts           # Reaction schema & unique compound index
│   │   ├── passwordResetToken.model.ts # Password reset token with TTL index
│   │   └── index.ts
│   ├── routes/
│   │   ├── auth.routes.ts   # Authentication endpoints router
│   │   ├── health.routes.ts # Health route definition
│   │   └── index.ts         # Central API v1 router
│   ├── services/
│   │   ├── auth.service.ts  # Authentication & crypto business logic
│   │   └── index.ts
│   ├── validators/
│   │   ├── auth.validators.ts # Input validation for auth payloads
│   │   └── index.ts
│   ├── utils/
│   │   ├── apiResponse.ts   # Standardized API response format
│   │   ├── cookie.util.ts   # HTTP-only cookie configuration
│   │   └── logger.ts        # Structured logger
│   ├── app.ts               # Express application configuration
│   └── server.ts            # Server entrypoint with graceful shutdown
│
├── scripts/
│   └── seed.ts              # Database index sync and seed foundation
├── tests/
│   ├── health.test.ts       # Automated health endpoint verification
│   └── auth.test.ts         # Comprehensive 27-case auth test suite
├── docs/
│   └── architecture.md      # Backend architecture documentation
├── postman/
│   └── ReleaseHub_Milestone_1.postman_collection.json # API collection (Health & Auth)
│
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## Prerequisites

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- **MongoDB** running locally or a MongoDB Atlas URI

---

## Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

---

## Environment Setup

1. Copy `.env.example` to create `.env`:
   ```bash
   cp .env.example .env
   ```

2. Configure environment variables in `.env`:
   ```env
   PORT=5000
   NODE_ENV=development

   MONGODB_URI=mongodb://127.0.0.1:27017/releasehub

   JWT_ACCESS_SECRET=replace_with_strong_secret
   JWT_REFRESH_SECRET=replace_with_strong_secret

   ACCESS_TOKEN_EXPIRES_IN=15m
   REFRESH_TOKEN_EXPIRES_IN=7d

   CLIENT_URL=http://localhost:5173

   COOKIE_SECURE=false
   COOKIE_SAME_SITE=lax

   RESET_PASSWORD_EXPIRES_MINUTES=30
   ```

---

## Start Commands

### Development Mode
Starts the server with live reload using `tsx`:
```bash
npm run dev
```

### Build for Production
Compiles TypeScript to JavaScript in the `dist/` directory:
```bash
npm run build
```

### Production Mode
Runs the compiled JavaScript server:
```bash
npm start
```

### Run Database Index Sync / Seed
```bash
npm run seed
```

### Run Tests
Executes the automated health test and full 27-case authentication test suite:
```bash
npm test
```

---

## Implemented API Endpoints

### 1. Health

#### Health Check
`GET /api/v1/health`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "status": "ok",
      "service": "releasehub-api"
    }
  }
  ```

---

### 2. Authentication (`/api/v1/auth`)

#### User Signup
`POST /api/v1/auth/signup`
- **Body**: `{ "name": "John Doe", "email": "john@example.com", "password": "StrongPassword123!" }`
- **Response (201 Created)**: Returns safe user object and simulated `verificationToken` for development.

#### Email Verification
`POST /api/v1/auth/verify-email`
- **Body**: `{ "token": "<verification-token>" }`
- **Response (200 OK)**: Marks `isEmailVerified = true` and clears token.

#### User Login
`POST /api/v1/auth/login`
- **Body**: `{ "email": "john@example.com", "password": "StrongPassword123!" }`
- **Response (200 OK)**: Sets HTTP-only `access_token` (15m) and `refresh_token` (7d) cookies. Returns safe user object.

#### Current Authenticated User Profile
`GET /api/v1/auth/me`
- **Headers/Cookies**: Requires valid `access_token` cookie.
- **Response (200 OK)**: Returns safe user profile (without `passwordHash`).

#### Refresh Token Rotation
`POST /api/v1/auth/refresh`
- **Cookies**: Requires valid `refresh_token` cookie.
- **Response (200 OK)**: Rotates previous refresh token, saves new hashed token in DB, and sets new cookies.

#### Logout
`POST /api/v1/auth/logout`
- **Response (200 OK)**: Clears `access_token` and `refresh_token` cookies, invalidating active session in DB.

#### Forgot Password
`POST /api/v1/auth/forgot-password`
- **Body**: `{ "email": "john@example.com" }`
- **Response (200 OK)**: Safe generic response preventing account enumeration. Stores hashed token in `PasswordResetToken` collection with TTL expiry.

#### Reset Password
`POST /api/v1/auth/reset-password`
- **Body**: `{ "token": "<reset-token>", "password": "NewStrongPassword123!" }`
- **Response (200 OK)**: Hashes new password, updates user, marks token as used (`usedAt`), and revokes previous sessions.

#### Admin Authorization Check
`GET /api/v1/auth/admin-only`
- **Access**: Protected by `requireAuth` and `requireAdmin`.
- **Response**: `200 OK` for admin users, `403 FORBIDDEN` for normal users.
