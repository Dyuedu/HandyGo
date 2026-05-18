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

Content-Type: `multipart/form-data`

Request (User):
```text
role=USER
username=string
password=string
fullName=string
phone=string
```

Request (Worker):
```text
role=WORKER
username=string
password=string
jobType=string
professionalCertificate=<PDF or image file>
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
- 400 professional certificate missing, too large, or not PDF/image
- 409 username or phone exists
- 502 Cloudinary upload failed

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
