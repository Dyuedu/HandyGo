# Login/Register Spec

Date: 2026-05-18

## Scope
- UI/UX: Login, Register for User/Worker
- API: /api/auth/login, /api/auth/register, /api/auth/refresh, /api/auth/logout
- Token: JWT access + refresh (rotation)

## Roles
- USER -> UserProfile
- WORKER -> WorkerProfile

## UI Spec

### Login
Fields:
- username (required)
- password (required)

Actions:
- Submit -> POST /api/auth/login

States:
- Loading
- Success
- Error (show backend message)

Validation:
- username required
- password required

Non-functional:
- UI in Vietnamese
- Debounce validation 300-500ms
- Show lockout message if backend returns "Account is locked"

### Register (Step-based)
Step 1: Choose role
- role: USER | WORKER

Step 2: Account info
- username (required)
- password (required)
- confirmPassword (required, must match password)

Step 3a: User profile
- fullName (required)
- phone (required, unique)
- avatar (optional)

Step 3b: Worker profile
- jobType (required)
- businessLicenseUrl (optional)
- latitude (optional)
- longitude (optional)

Actions:
- Submit -> POST /api/auth/register

Validation:
- Password policy: min 8 chars, upper, lower, number, special
- Username: 4-50 chars, no spaces
- Phone: VN format regex

Non-functional:
- UI in Vietnamese
- Debounce validation 300-500ms
- Show explicit errors for duplicate username/phone

## Backend API Spec

### POST /api/auth/login
Request:
- username
- password

Response 200:
- accessToken
- refreshToken
- tokenType = Bearer
- accessTokenExpiresIn
- refreshTokenExpiresIn

Errors:
- 401: invalid credentials
- 403: account locked

### POST /api/auth/register
Current request: LoginRequest { username, password }

Proposed request:
- role: USER | WORKER
- profile:
  - User: fullName, phone, avatar
  - Worker: jobType, businessLicenseUrl, latitude, longitude

Response 200:
- message: Register successfully

Errors:
- 400: validation failed
- 409: username/phone exists

### POST /api/auth/refresh
Request:
- refreshToken

Response 200:
- accessToken
- refreshToken
- tokenType
- accessTokenExpiresIn
- refreshTokenExpiresIn

Errors:
- 401: invalid/revoked refresh token

### POST /api/auth/logout
Request:
- refreshToken (optional)

Behavior:
- Blacklist access token (JWT jti)
- Revoke refresh token if provided

Response 200:
- message: Logout successfully

## Token Handling
- Access token: JWT, expiration from app.jwt.expiration-ms
- Refresh token: JWT, expiration from app.jwt.refresh-expiration-ms
- Refresh rotation: old refresh token is revoked on successful refresh

## Security / Constraints
- Rate limit (proposed): 5 login attempts / 5 minutes / IP
- Lockout: UI shows account locked message
- Password hashing: BCrypt
