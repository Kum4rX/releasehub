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
│   │   ├── admin.controller.ts        # Admin insights controller
│   │   ├── auth.controller.ts         # Authentication request controller
│   │   ├── changelog.controller.ts    # Changelog & Reactions controller
│   │   ├── health.controller.ts       # Health check controller
│   │   ├── notification.controller.ts # What's New notification controller
│   │   └── user.controller.ts         # User profile controller
│   ├── middleware/
│   │   ├── auth.middleware.ts        # requireAuth & optionalAuth middlewares
│   │   ├── admin.middleware.ts       # Role authorization (requireAdmin)
│   │   ├── validation.middleware.ts  # Generic request validation wrapper
│   │   ├── error.middleware.ts       # Central error & 404 handlers
│   │   ├── rateLimiter.middleware.ts # API & Auth rate limiters
│   │   └── index.ts
│   ├── models/
│   │   ├── user.model.ts               # User schema, roles, hidden hashes, lastViewedChangelogDate
│   │   ├── changelog.model.ts          # Changelog schema & compound indexes
│   │   ├── reaction.model.ts           # Reaction schema & unique compound index
│   │   ├── passwordResetToken.model.ts # Password reset token with TTL index
│   │   └── index.ts
│   ├── routes/
│   │   ├── admin.routes.ts        # Admin insights router
│   │   ├── auth.routes.ts         # Authentication endpoints router
│   │   ├── changelog.routes.ts    # Changelog & Reactions router
│   │   ├── health.routes.ts       # Health route definition
│   │   ├── notification.routes.ts # What's New notification router
│   │   ├── user.routes.ts         # User profile router
│   │   └── index.ts               # Central API v1 router
│   ├── services/
│   │   ├── admin.service.ts        # Admin insights aggregation service
│   │   ├── auth.service.ts         # Authentication & crypto business logic
│   │   ├── changelog.service.ts    # Changelog management, timeline & reactions logic
│   │   ├── notification.service.ts # What's New & unread tracking service
│   │   ├── user.service.ts         # User profile management service
│   │   └── index.ts
│   ├── validators/
│   │   ├── auth.validators.ts      # Input validation for auth payloads
│   │   ├── changelog.validators.ts # Input validation for changelog & reactions
│   │   ├── user.validators.ts      # Input validation for profile update
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
│   ├── health.test.ts       # Automated health endpoint verification (1 test)
│   ├── auth.test.ts         # Comprehensive 27-case auth test suite (27 tests)
│   ├── changelog.test.ts    # Comprehensive 42-case changelog & reactions suite (42 tests)
│   └── milestone4.test.ts   # Notifications, profile & admin insights suite (26 tests)
├── docs/
│   └── architecture.md      # Backend architecture documentation
├── postman/
│   └── ReleaseHub_Milestone_1.postman_collection.json # API collection (Health, Auth, Changelog, Reactions, Notifications, Profile, Insights)
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
Executes the automated test suite across all four milestones (96 tests total):
```bash
npm test
```

---

## Implemented API Endpoints

### 1. Health

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Public | Service health & database readiness check |

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

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/changelog` | Public | Timeline of published updates with pagination & reaction counts |
| `GET` | `/api/v1/changelog/feed` | Public | Clean JSON feed of recent published product updates |
| `GET` | `/api/v1/changelog/:slug` | Public | Update detail by slug with author details & reaction counts |
| `GET` | `/api/v1/changelog/:slug/related` | Public | Related published updates matching the same category |

---

### 5. Reactions Engine (`/api/v1/changelog/:id/reactions`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/changelog/:id/reactions` | Authenticated | Add reaction (`heart`, `celebrate`, `rocket`) |
| `DELETE` | `/api/v1/changelog/:id/reactions/:type` | Authenticated | Remove specific reaction type |

---

### 6. Notifications / What's New (`/api/v1/notifications`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/notifications` | Authenticated | Retrieve What's New updates, unread count & per-item `isUnread` status |
| `POST` | `/api/v1/notifications/read` | Authenticated | Mark all notifications read by updating `lastViewedChangelogDate` to now |

#### Unread Calculation Logic
- Source of truth: `Changelog` collection (`status: 'published'`).
- An update is unread if its `publishedAt` is newer than the user's `lastViewedChangelogDate`.
- If `lastViewedChangelogDate` is `null` (new user), all published updates are treated as unread (`isUnread: true`).
- Drafts and unpublished updates never appear in notifications.

---

### 7. User Profile (`/api/v1/users`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/users/me` | Authenticated | Retrieve profile: `name`, `email`, `role`, `isEmailVerified`, `createdAt` |
| `PATCH` | `/api/v1/users/me` | Authenticated | Update user's `name` (2-100 chars). `email` and `role` are read-only. |

#### Profile Security
- Sensitive internal fields (`passwordHash`, `refreshTokenHash`, tokens) are never exposed.
- Attempts to alter `role` or `email` via `PATCH` are ignored; role escalation is strictly blocked.

---

### 8. Admin Insights (`/api/v1/admin`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/insights` | Admin Only | System metrics: changelog counts, reaction breakdowns, user totals, recent activity |

#### Insights Response Format
```json
{
  "success": true,
  "data": {
    "changelogs": {
      "total": 10,
      "published": 8,
      "draft": 2
    },
    "reactions": {
      "total": 24,
      "byType": {
        "heart": 12,
        "celebrate": 7,
        "rocket": 5
      }
    },
    "users": {
      "total": 15,
      "verified": 11
    },
    "recentActivity": [
      {
        "id": "60d0fe4f5311236168a109ca",
        "title": "Dark Mode Released",
        "slug": "dark-mode-released",
        "category": "new",
        "publishedAt": "2026-09-17T02:00:00.000Z",
        "reactions": {
          "heart": 5,
          "celebrate": 3,
          "rocket": 2,
          "total": 10
        }
      }
    ]
  }
}
```
