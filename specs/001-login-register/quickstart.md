# Quickstart: Login/Register

## Prerequisites
- Java 17
- Node.js 20+
- PostgreSQL and Redis running

## Backend

```bash
cd mock-backend/mock
./mvnw spring-boot:run
```

## Frontend

```bash
cd mock-frontend
npm install
npm run dev
```

## Smoke Test

1. Register a user via POST /api/auth/register
2. Sign in via POST /api/auth/login
3. Refresh token via POST /api/auth/refresh
4. Logout via POST /api/auth/logout
