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
│   │   ├── auth.controller.ts       # Authentication request controller
│   │   ├── changelog.controller.ts  # Changelog & Reactions controller
│   │   └── health.controller.ts     # Health check controller
│   ├── middleware/
│   │   ├── auth.middleware.ts        # requireAuth & optionalAuth middlewares
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
│   │   ├── auth.routes.ts      # Authentication endpoints router
│   │   ├── changelog.routes.ts # Changelog & Reactions router
│   │   ├── health.routes.ts    # Health route definition
│   │   └── index.ts            # Central API v1 router
│   ├── services/
│   │   ├── auth.service.ts      # Authentication & crypto business logic
│   │   ├── changelog.service.ts # Changelog management, timeline & reactions logic
│   │   └── index.ts
│   ├── validators/
│   │   ├── auth.validators.ts      # Input validation for auth payloads
│   │   ├── changelog.validators.ts # Input validation for changelog & reactions
│   │   └── index.ts
│   ├── utils/
│   │   ├── apiResponse.ts   # Standardized API response format
│   │   ├── cookie.util.ts   # HTTP-only cookie configuration
│   │   ├── logger.ts        # Structured logger
│   │   ├── pagination.util.ts # Standard pagination calculator & metadata builder
│   │   └── slug.util.ts     # URL-safe slug generator with collision handling
│   ├── app.ts               # Express application configuration
│   └── server.ts            # Server entrypoint with graceful shutdown
│
├── scripts/
│   └── seed.ts              # Database index sync and seed foundation
├── tests/
│   ├── health.test.ts       # Automated health endpoint verification
│   ├── auth.test.ts         # Comprehensive 27-case auth test suite
│   └── changelog.test.ts    # Comprehensive 42-case changelog & reactions test suite
├── docs/
│   └── architecture.md      # Backend architecture documentation
├── postman/
│   └── ReleaseHub_Milestone_1.postman_collection.json # API collection (Health, Auth, Changelog, Reactions)
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

### Run All Tests
Executes the automated health test, full 27-case authentication test suite, and full 42-case changelog test suite:
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

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/signup` | Public | Register a new user |
| `POST` | `/api/v1/auth/verify-email` | Public | Verify email address using token |
| `POST` | `/api/v1/auth/login` | Public | Authenticate and set HTTP-only cookies |
| `GET` | `/api/v1/auth/me` | Authenticated | Retrieve current user profile |
| `POST` | `/api/v1/auth/refresh` | Public (Cookie) | Rotate refresh token |
| `POST` | `/api/v1/auth/logout` | Authenticated | Clear cookies & invalidate session |
| `POST` | `/api/v1/auth/forgot-password` | Public | Request password reset token |
| `POST` | `/api/v1/auth/reset-password` | Public | Complete password reset |
| `GET` | `/api/v1/auth/admin-only` | Admin Only | Verify admin role access |

---

### 3. Changelog Management (Admin) (`/api/v1/changelog/admin`)

All admin routes require `requireAuth` and `requireAdmin`.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/changelog/admin` | Create changelog (defaults to `draft`, generates unique slug) |
| `GET` | `/api/v1/changelog/admin` | List changelogs with pagination, status, category & search |
| `GET` | `/api/v1/changelog/admin/:id` | Retrieve single changelog by ID |
| `PUT` | `/api/v1/changelog/admin/:id` | Update changelog content (recalculates slug on title change) |
| `DELETE` | `/api/v1/changelog/admin/:id` | Delete changelog and cascade reaction cleanup |
| `POST` | `/api/v1/changelog/admin/:id/publish` | Set status to `published` and record `publishedAt` timestamp |
| `POST` | `/api/v1/changelog/admin/:id/unpublish` | Revert status to `draft` and clear `publishedAt` |

---

### 4. Public Changelog & Discovery (`/api/v1/changelog`)

Public timeline endpoints allow discovery for all visitors, with optional user context for personalized reaction indicators.

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/changelog` | Public | Timeline of published updates with pagination & reaction counts |
| `GET` | `/api/v1/changelog/feed` | Public | Clean JSON feed of recent published product updates |
| `GET` | `/api/v1/changelog/:slug` | Public | Update detail by slug with author details & reaction counts |
| `GET` | `/api/v1/changelog/:slug/related` | Public | Related published updates matching the same category |

#### Pagination Query Format
`GET /api/v1/changelog?page=1&limit=10&category=new&search=Dark`
- **Response Format**:
  ```json
  {
    "success": true,
    "data": {
      "items": [ ... ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "totalItems": 24,
        "totalPages": 3,
        "hasNextPage": true,
        "hasPreviousPage": false
      }
    }
  }
  ```

---

### 5. Reactions Engine (`/api/v1/changelog/:id/reactions`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/changelog/:id/reactions` | Authenticated | Add reaction (`heart`, `celebrate`, `rocket`) |
| `DELETE` | `/api/v1/changelog/:id/reactions/:type` | Authenticated | Remove specific reaction type |

- Enforces database-level uniqueness per `(user, changelog, type)`.
- Cannot react to draft/unpublished changelogs (returns `400 Bad Request`).
- Aggregates accurate reaction counts for public display.
