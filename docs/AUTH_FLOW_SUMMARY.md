# 🔐 Authentication Flow Documentation

## Project Overview

**Tech Stack**: Java 17 (Backend) + JavaScript ES6 (Frontend) + Spring Boot 4.0.2 + React 19 + Redis

This document provides a comprehensive analysis of the current login/registration flow with Redis integration.

---

## 📋 API Endpoints Summary

| Endpoint | Method | Purpose | Request | Response | Redis Ops |
|----------|--------|---------|---------|----------|-----------|
| `/api/auth/login` | POST | User login | `{username, password}` | `{accessToken, refreshToken, role, expiresIn}` | Store rt:{jti} |
| `/api/auth/register` | POST | User registration | FormData: `{role, username, password, fullName, phone}` | `{success, message}` | - |
| `/api/auth/refresh` | POST | Refresh access token | `{refreshToken}` | `{accessToken, refreshToken}` | GET rt:{jti}, DELETE rt:{old_jti}, SET rt:{new_jti} |
| `/api/auth/logout` | POST | Logout | `{refreshToken}` + Authorization header | `{success, message}` | SET bl:access:{jti}, DELETE rt:{jti} |
| `/api/auth/google-login` | POST | Google OAuth login | `{accessToken}` | `{accessToken, refreshToken, role}` | Store rt:{jti} |

---

## 🔄 Complete Flow Diagrams

### 1. Login Flow (Detailed)

```
User Input
    ↓
Frontend: Validate Form
    ↓
POST /api/auth/login
    ↓
Backend: LoginAttemptService.assertNotLocked(username)
    ├─ [LOCKED] → 403 FORBIDDEN
    └─ [ALLOWED] → Continue
    ↓
Spring Security: AuthenticationManager.authenticate()
    ├─ Load UserDetails from DB
    ├─ BCryptPasswordEncoder.matches()
    │   ├─ [FAIL] → recordFailure() → Check lockout → 401 UNAUTHORIZED
    │   └─ [SUCCESS] → recordSuccess() → Clear attempts → Continue
    ↓
JwtProvider: Generate Tokens
    ├─ accessToken (JTI + claims, 15 min)
    └─ refreshToken (JTI + claims, 7 days)
    ↓
RefreshTokenService: Store in Redis
    └─ SET rt:{jti} = username, TTL: 7 days
    ↓
Fetch Account Details
    ├─ role (USER/WORKER)
    └─ workerVerificationStatus
    ↓
Response: {accessToken, refreshToken, expiresIn, role, workerStatus}
    ↓
Frontend: AuthContext.signIn()
    ├─ authStore.saveSession() → localStorage
    └─ Set mode = CUSTOMER/TECHNICIAN
    ↓
Redirect to Dashboard
```

### 2. Token Refresh Flow

```
Frontend: Access Token Expiring
    ↓
POST /api/auth/refresh with refreshToken
    ↓
Backend: RefreshTokenService.validateAndRotate()
    ├─ Decode refreshToken
    ├─ GET rt:{jti} from Redis
    │   ├─ [NOT FOUND] → 401 UNAUTHORIZED
    │   └─ [FOUND] → Verify subject matches → Continue
    ├─ DELETE rt:{old_jti} from Redis (revoke old)
    ├─ Generate new refreshToken
    ├─ SET rt:{new_jti} in Redis (store new)
    ├─ Generate new accessToken
    └─ Return {accessToken, refreshToken}
    ↓
Frontend: authStore.saveSession()
    └─ Update localStorage with new tokens
    ↓
Continue with new accessToken
```

### 3. Logout Flow

```
User: Click Logout
    ↓
Frontend: authStore.getSession()
    ↓
POST /api/auth/logout (with refreshToken + accessToken in header)
    ↓
Backend: TokenBlacklistService.blacklistAccessToken()
    └─ SET bl:access:{jti} = "1", TTL: token expiry
    ↓
Backend: RefreshTokenService.revokeRefreshToken()
    └─ DELETE rt:{jti} from Redis
    ↓
Response: {success: true}
    ↓
Frontend: clearSession()
    ├─ localStorage.removeItem('auth')
    ├─ AuthContext.clearAuthSession()
    └─ Redirect to Login Page
```

### 4. Protected Request After Logout

```
Frontend: GET /api/user/profile with Authorization header
    ↓
Backend: JwtBlacklistFilter intercepts
    ├─ Extract JTI from JWT
    ├─ EXISTS bl:access:{jti}? (check Redis)
    │   ├─ [EXISTS] → 401 UNAUTHORIZED "Token revoked"
    │   └─ [NOT FOUND] → Continue to handler
    ↓
Spring Security: Validate JWT signature
    ↓
Route to controller
    ↓
Response: Resource or 401
```

---

## 📦 Redis Data Structures

### Refresh Token Storage (`rt:` prefix)

```
Key: rt:abc123def456xyz789
Value: john_doe
TTL: 604800 seconds (7 days)

Purpose: 
- Store active refresh tokens
- Enable token rotation on refresh
- Enable revocation on logout
```

### Token Blacklist (`bl:access:` prefix)

```
Key: bl:access:jti_of_access_token
Value: "1" (just marker)
TTL: 480000 seconds (~13.3 hours, matches token expiry)

Purpose:
- Mark access tokens as revoked
- Prevent reuse after logout
- Auto-expires with token
```

---

## 🔐 JWT Token Structure

### Access Token
- **Header**: `{alg: "HS256", typ: "JWT"}`
- **Payload**:
  - `sub`: username
  - `jti`: unique ID
  - `iat`: issued at timestamp
  - `exp`: expiration timestamp
  - `roles`: ["ROLE_USER" or "ROLE_WORKER"]
- **Signature**: HMACSHA256(header.payload, secret)
- **Expiry**: 480000ms (~15 minutes effective)
- **Storage**: Frontend localStorage

### Refresh Token
- **Header**: `{alg: "HS256", typ: "JWT"}`
- **Payload**:
  - `sub`: username
  - `jti`: unique ID
  - `iat`: issued at
  - `exp`: expiration
- **Signature**: HMACSHA256(header.payload, secret)
- **Expiry**: 604800000ms (7 days)
- **Storage**: Backend Redis + Frontend localStorage

---

## 🛡️ Security Features

### Brute-Force Protection
- **Service**: LoginAttemptService (in-memory, not Redis)
- **Mechanism**:
  - Track failed attempts per username
  - Max 5 attempts within 10-minute window
  - Lock account for 10 minutes after threshold
  - Clear attempts on successful login
- **Storage**: ConcurrentHashMap (single-server only)
- **Note**: Can be moved to Redis for distributed deployments

### Password Security
- **Algorithm**: BCrypt with Spring Security
- **Encoding**: PasswordEncoder.encode() on registration
- **Validation**: PasswordEncoder.matches() on login

### Token Management
- **Access Token Rotation**: On refresh endpoint
- **Refresh Token Rotation**: On refresh endpoint
  - Old token deleted from Redis immediately
  - New token issued with new JTI
  - Prevents token reuse
- **Logout Revocation**:
  - Access token blacklisted in Redis
  - Refresh token deleted from Redis
  - Duration: automatic TTL expiry

### Stateless Authorization
- **Design**: JWT-based, no session table
- **Scalability**: Works across multiple servers
- **Validation**: 
  - JWT signature verified locally
  - Only Redis blacklist checked (fast)
  - No database lookup required

---

## 📊 Database Schema (Auth-Related)

### Account Table
```sql
CREATE TABLE account (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,  -- USER, WORKER, ADMIN
    status VARCHAR(50) NOT NULL, -- ACTIVE, LOCKED, INACTIVE
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### UserProfile Table
```sql
CREATE TABLE user_profile (
    id SERIAL PRIMARY KEY,
    account_id INT NOT NULL UNIQUE,
    full_name VARCHAR(255),
    phone VARCHAR(20) UNIQUE,
    address VARCHAR(255),
    FOREIGN KEY (account_id) REFERENCES account(id)
);
```

### WorkerProfile Table
```sql
CREATE TABLE worker_profile (
    id SERIAL PRIMARY KEY,
    account_id INT NOT NULL UNIQUE,
    job_type VARCHAR(100),
    professional_certificate_url VARCHAR(255),
    verification_status VARCHAR(50), -- PENDING, VERIFIED, REJECTED
    FOREIGN KEY (account_id) REFERENCES account(id)
);
```

---

## ⚙️ Configuration (application.yml)

```yaml
spring:
  datasource:
    url: "jdbc:postgresql://aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres"
    username: postgres.prqowmqmkeqhpkkxqfdz
    password: tdJtSnYhVeCR6BQA
    driver-class-name: org.postgresql.Driver

  data:
    redis:
      host: localhost
      port: 6379

  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false

app:
  jwt:
    expiration-ms: 480000000000      # Access token expiry (15 min effective)
    refresh-expiration-ms: 604800000  # Refresh token expiry (7 days)
    secret: dhfjkahsdjhkjdfhksfksfhklfjklfjksl@111

auth:
  login-attempt:
    max-attempts: 5              # Failed attempt threshold
    window-minutes: 10           # Time window for counting
    block-duration-minutes: 10   # Lock duration
```

---

## 🔑 Key Java Classes

### AuthController
- Handles all auth endpoints
- Coordinates services
- Location: `com.group.mock.controller.AuthController`

### JwtProvider
- Generates access and refresh tokens
- Validates token structure
- Location: `com.group.mock.configuration.JwtProvider`

### RefreshTokenService
- Issues and stores refresh tokens
- Validates and rotates tokens
- Manages Redis storage with `rt:` prefix
- Location: `com.group.mock.service.RefreshTokenService`

### TokenBlacklistService
- Blacklists access tokens on logout
- Checks blacklist on protected requests
- Manages Redis storage with `bl:access:` prefix
- Location: `com.group.mock.service.TokenBlacklistService`

### JwtBlacklistFilter
- Spring Security filter
- Intercepts requests with JWT
- Checks Redis blacklist before processing
- Location: `com.group.mock.configuration.JwtBlacklistFilter`

### LoginAttemptService
- Tracks failed login attempts
- Implements lockout mechanism
- Uses ConcurrentHashMap (not Redis)
- Location: `com.group.mock.service.LoginAttemptService`

### AccountService
- Loads user details for authentication
- Handles user registration
- Location: `com.group.mock.service.AccountService`

---

## 🖥️ Frontend Components

### authService.js
- API calls: login, register, refresh, logout, googleLogin
- Location: `src/services/authService.js`

### AuthContext.jsx
- Global auth state management
- Functions: signIn, signOut, signInWithGoogle
- Location: `src/context/AuthContext.jsx`

### authStore.js
- localStorage persistence
- Functions: saveSession, loadSession, clearSession
- Location: `src/state/authStore.js`

### useAuth Hook
- Custom hook to access auth context
- Location: `src/hooks/useAuth.js`

### PrivateRoute.jsx
- Route protection
- Checks isAuthenticated
- Location: `src/routes/PrivateRoute.jsx`

### axiosClient.js
- API interceptor
- Injects accessToken in Authorization header
- Handles 401 → refresh flow
- Location: `src/api/axiosClient.js`

---

## 📝 Registration Validation Rules

**Username**:
- Length: 4-50 characters
- No spaces allowed
- Unique in database

**Password**:
- Minimum 8 characters
- Must contain: uppercase, lowercase, number, special character
- Not stored in plaintext (BCrypt hash)

**Phone** (if provided):
- Must match Vietnam format
- Unique in database

**Role**:
- USER: Customer account
- WORKER: Service provider account

---

## 🔄 Token Rotation on Refresh

### Why Rotate?
- Security best practice
- Detect token leaks
- Limit token lifetime exposure

### Process:
1. Client sends refreshToken
2. Backend validates against Redis `rt:{jti}`
3. Delete old `rt:{jti}` immediately
4. Generate new refreshToken with new JTI
5. Store new `rt:{new_jti}` in Redis
6. Generate new accessToken
7. Return both to client
8. Client updates localStorage

### Result:
- Old refresh token cannot be used again
- Leaked refresh tokens become useless after rotation
- Continuous security improvement on each refresh

---

## ✅ Security Checklist

- [x] Brute-force protection with account lockout
- [x] BCrypt password hashing
- [x] JWT signature verification
- [x] Token blacklisting on logout
- [x] Token rotation on refresh
- [x] Stateless authorization
- [x] Role-based access control (RBAC)
- [x] Worker verification status tracking
- [x] Request ID tracking for audit logs
- [x] Vietnamese error messages for users
- [x] Consistent API response envelope
- [x] No PII/secrets in logs

---

## 🚀 Deployment Considerations

1. **Distributed Systems**:
   - Move LoginAttemptService from in-memory to Redis
   - Multiple servers can access same lock state

2. **Redis Persistence**:
   - Enable AOF/RDB for token data
   - Don't lose token state on restart

3. **JWT Secret**:
   - Store in environment variables
   - Use strong 32+ character secret
   - Rotate periodically

4. **Token Expiry Times**:
   - Access token: 15 min (security)
   - Refresh token: 7 days (usability)
   - Adjust based on requirements

5. **HTTPS**:
   - Always use HTTPS in production
   - Tokens in Authorization header (secure)

---

## 📞 Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| "Account locked" on login | Too many failed attempts | Wait 10 minutes or check LoginAttemptService |
| "Invalid or revoked refresh token" | Token deleted from Redis | User must login again |
| "Token revoked" on protected request | Token blacklisted in Redis | User must login again |
| Unauthorized 401 repeatedly | Token blacklist in Redis full | Check Redis memory, set cleanup policy |
| Login works, but immediate logout | Redis connection failed | Check Redis is running on localhost:6379 |

---

## 📚 References

- **JWT**: https://tools.ietf.org/html/rfc7519
- **JJWT**: https://github.com/jwtk/jjwt
- **Spring Security**: https://spring.io/projects/spring-security
- **Redis**: https://redis.io/documentation
- **BCrypt**: https://en.wikipedia.org/wiki/Bcrypt

---

*Last Updated: May 20, 2026*
*Project: mock-project (HandyGo)*
*Branch: 003-chat-realtime*
