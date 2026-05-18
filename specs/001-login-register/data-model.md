# Data Model: Login/Register

## Entities

### Account
Represents login identity and authorization.

Fields:
- id: UUID
- username: string (unique)
- password: string (bcrypt hash)
- status: enum (ACTIVE, LOCKED, etc.)
- role: Role

Relationships:
- 1:1 with UserProfile (for USER role)
- 1:1 with WorkerProfile (for WORKER role)

Validation:
- username required, 4-50 chars, no spaces
- password required, min 8 chars, upper/lower/number/special

### UserProfile
Represents end-user profile.

Fields:
- id: UUID (same as Account.id)
- fullName: string (required)
- phone: string (unique)
- createdAt: datetime

Relationships:
- 1:1 with Account

### WorkerProfile
Represents worker profile and verification state.

Fields:
- id: UUID (same as Account.id)
- jobType: string (required)
- professionalCertificateUrl: string (required; Cloudinary URL for uploaded PDF/image certificate)
- isVerified: boolean (default false)
- tierType: string (default FREE)
- tierExpiredAt: datetime (optional)
- avgRating: number (default 0.0)

Relationships:
- 1:1 with Account

### Role
Represents authorization role.

Fields:
- id: int
- name: string (unique)

### SessionCredential
Represents issued access and refresh sessions.

Fields:
- accessToken: JWT
- refreshToken: JWT
- tokenType: string (Bearer)
- accessTokenExpiresIn: number (seconds)
- refreshTokenExpiresIn: number (seconds)

## State/Status Rules
- Account status LOCKED prevents sign-in until lock expires.
- WorkerProfile isVerified indicates verification state; non-verified users can sign in but may be restricted.
