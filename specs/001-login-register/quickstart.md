# Quickstart: Login/Register

## Prerequisites
- Java 17
- Node.js 20+
- PostgreSQL and Redis running
- Cloudinary credentials for worker certificate upload:
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`

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

1. Register a user via multipart POST /api/auth/register with `role`, `username`, `password`, `fullName`, and `phone`
2. Sign in via POST /api/auth/login
3. Register a worker via multipart POST /api/auth/register with `role`, `username`, `password`, `jobType`, and `professionalCertificate` PDF/image file
4. Refresh token via POST /api/auth/refresh
5. Logout via POST /api/auth/logout
