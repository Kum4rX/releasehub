# ReleaseHub Backend — Milestone 1

A clean, scalable MERN backend foundation for ReleaseHub (a Changelog & Product Updates platform), implemented with Node.js, Express, TypeScript, and MongoDB.

---

## Tech Stack

- **Runtime**: Node.js (>= 20.0.0)
- **Language**: TypeScript (v5)
- **Web Framework**: Express (v4)
- **Database & ODM**: MongoDB with Mongoose (v8)
- **Security & Utilities**:
  - Helmet (HTTP security headers)
  - CORS (Configured for credentials with specific client origin)
  - cookie-parser (HTTP-only cookie handling)
  - express-rate-limit (Rate limiting defense)
  - dotenv (Environment configuration)
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
│   │   └── health.controller.ts # Health check controller
│   ├── middleware/
│   │   ├── auth.middleware.ts        # Authentication foundation
│   │   ├── admin.middleware.ts       # Authorization foundation
│   │   ├── validation.middleware.ts  # Request validation wrapper
│   │   ├── error.middleware.ts       # Central error & 404 handlers
│   │   ├── rateLimiter.middleware.ts # API rate limiter
│   │   └── index.ts
│   ├── models/
│   │   ├── user.model.ts               # User schema & indexes
│   │   ├── changelog.model.ts          # Changelog schema & compound indexes
│   │   ├── reaction.model.ts           # Reaction schema & unique compound index
│   │   ├── passwordResetToken.model.ts # Password reset token with TTL index
│   │   └── index.ts
│   ├── routes/
│   │   ├── health.routes.ts # Health route definition
│   │   └── index.ts         # Central API v1 router
│   ├── services/
│   │   └── index.ts         # Services foundation
│   ├── validators/
│   │   └── index.ts         # Validators foundation
│   ├── utils/
│   │   ├── apiResponse.ts   # Standardized API response format
│   │   └── logger.ts        # Structured logger
│   ├── app.ts               # Express application configuration
│   └── server.ts            # Server entrypoint with graceful shutdown
│
├── scripts/
│   └── seed.ts              # Database index sync and seed foundation
├── tests/
│   └── health.test.ts       # Automated health endpoint verification
├── docs/
│   └── architecture.md      # Backend architecture documentation
├── postman/
│   └── ReleaseHub_Milestone_1.postman_collection.json # API collection
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

## MongoDB Setup

Ensure MongoDB is installed and running on your system:

- Default database: `releasehub`
- Default URI: `mongodb://127.0.0.1:27017/releasehub`

To verify database connection and synchronize all indexes (including compound unique index for Reactions and TTL index for PasswordResetToken):

```bash
npm run seed
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

### Run Tests
Executes the health endpoint test:
```bash
npm test
```

---

## Implemented API Endpoints

### Health Check

```http
GET /api/v1/health
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "releasehub-api"
  }
}
```
