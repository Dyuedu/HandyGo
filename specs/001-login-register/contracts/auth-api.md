# Auth API Contract

Base path: /api/auth

## POST /login

Request:
```json
{
  "username": "string",
  "password": "string"
}
```

Response 200:
```json
{
  "success": true,
  "data": {
    "accessToken": "string",
    "refreshToken": "string",
    "tokenType": "Bearer",
    "accessTokenExpiresIn": 3600,
    "refreshTokenExpiresIn": 604800
  },
  "error": null,
  "timestamp": "2026-05-18T12:00:00Z",
  "requestId": "uuid"
}
```

Errors:
- 401 invalid credentials
- 403 account locked

## POST /register

Request (User):
```json
{
  "role": "USER",
  "username": "string",
  "password": "string",
  "profile": {
    "fullName": "string",
    "phone": "string",
    "avatar": "string"
  }
}
```

Request (Worker):
```json
{
  "role": "WORKER",
  "username": "string",
  "password": "string",
  "profile": {
    "jobType": "string",
    "businessLicenseUrl": "string",
    "latitude": 10.123,
    "longitude": 106.456
  }
}
```

Response 200:
```json
{
  "success": true,
  "data": {
    "message": "Register successfully"
  },
  "error": null,
  "timestamp": "2026-05-18T12:00:00Z",
  "requestId": "uuid"
}
```

Errors:
- 400 validation failed
- 409 username or phone exists

## POST /refresh

Request:
```json
{
  "refreshToken": "string"
}
```

Response 200:
```json
{
  "success": true,
  "data": {
    "accessToken": "string",
    "refreshToken": "string",
    "tokenType": "Bearer",
    "accessTokenExpiresIn": 3600,
    "refreshTokenExpiresIn": 604800
  },
  "error": null,
  "timestamp": "2026-05-18T12:00:00Z",
  "requestId": "uuid"
}
```

Errors:
- 401 invalid or revoked refresh token

## POST /logout

Request:
```json
{
  "refreshToken": "string"
}
```

Response 200:
```json
{
  "success": true,
  "data": {
    "message": "Logout successfully"
  },
  "error": null,
  "timestamp": "2026-05-18T12:00:00Z",
  "requestId": "uuid"
}
```
