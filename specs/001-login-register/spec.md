# Feature Specification: Login/Register

**Feature Branch**: `001-login-register`  
**Created**: 2026-05-18  
**Status**: Draft  
**Input**: User description: "login/register"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sign in to access account (Priority: P1)

As an existing user or worker, I want to sign in with my credentials so I can access my account and continue using the service.

**Why this priority**: Sign-in is the entry point to all authenticated features and is the most common user journey.

**Independent Test**: Can be fully tested by signing in with valid and invalid credentials and observing access granted or denied.

**Acceptance Scenarios**:

1. **Given** a registered account with valid credentials, **When** the user signs in, **Then** the user is authenticated and can access protected features.
2. **Given** an account with incorrect credentials, **When** the user attempts to sign in, **Then** the user is shown a clear error and is not authenticated.
3. **Given** a locked account, **When** the user attempts to sign in, **Then** the user is informed the account is locked and access is denied.

---

### User Story 2 - Register as a user (Priority: P2)

As a new customer, I want to create a user account so I can sign in and use the service.

**Why this priority**: User registration is required to grow the customer base and enable sign-in for new users.

**Independent Test**: Can be fully tested by completing registration with valid data and verifying that sign-in works afterward.

**Acceptance Scenarios**:

1. **Given** no existing account for the chosen username and phone, **When** the user submits the registration form, **Then** the account is created and sign-in is possible.
2. **Given** a username or phone already exists, **When** the user submits registration, **Then** the user sees a clear duplicate error and the account is not created.

---

### User Story 3 - Register as a worker (Priority: P3)

As a service provider, I want to create a worker account so I can offer services on the platform.

**Why this priority**: Worker onboarding enables the supply side of the marketplace and is essential for service fulfillment.

**Independent Test**: Can be tested by registering a worker account and confirming it can sign in and see verification status.

**Acceptance Scenarios**:

1. **Given** valid worker details, **When** the worker completes registration, **Then** the account is created and can sign in.
2. **Given** a worker account that is pending verification, **When** the worker signs in, **Then** the user is shown a pending verification status and restricted from worker-only actions that require verification.

---

### Edge Cases

- What happens when required fields are missing or invalid?
- How does the system handle duplicate usernames or phone numbers?
- What happens after repeated failed sign-in attempts?
- How does the system handle refresh credential reuse or expiration?
- What happens when the network drops during sign-in or registration?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow existing users and workers to sign in using a username and password.
- **FR-002**: System MUST allow new users to register with required profile details.
- **FR-003**: System MUST allow new workers to register with required worker details.
- **FR-004**: System MUST validate required fields and enforce the password policy before account creation.
- **FR-005**: System MUST prevent duplicate usernames and phone numbers from being registered.
- **FR-006**: System MUST issue an access session and a refresh session upon successful sign-in.
- **FR-007**: System MUST support refreshing an access session using a refresh session and MUST invalidate the prior refresh session after successful use.
- **FR-008**: System MUST support logout that invalidates the active access session and any provided refresh session.
- **FR-009**: System MUST throttle repeated failed sign-in attempts and lock access for 10 minutes after 5 failed attempts within 10 minutes, per username.
- **FR-010**: System MUST present user-facing authentication messages in Vietnamese for both frontend UI and backend error responses.
- **FR-011**: System MUST show a worker verification status after worker sign-in until verification is completed, and restrict access to worker-only actions that require verification (creating job offers, accepting bookings, and withdrawing wallet balance).
- **FR-012**: All auth endpoints MUST return a consistent response envelope with `success`, `data`, `error`, `timestamp`, and `requestId`.
- **FR-013**: Auth error responses MUST include `error.code`, `error.message`, and optional `error.details`.
- **FR-014**: Auth events MUST be logged with `requestId`/`traceId` and without PII or secrets.
- **FR-015**: Registration validation MUST enforce: username 4-50 chars, no spaces; password min 8 chars with upper/lower/number/special; phone matches VN format when provided.

## Constitution Alignment *(mandatory)*

- Confirm monorepo layout and Docker readiness are satisfied.
- Confirm API response schema, validation, and error reporting are addressed consistently.
- Confirm security expectations are covered (rate limiting, lockout, session invalidation).
- Confirm logging expectations for authentication events are covered.
- Confirm testing expectations for auth flows are covered.

### Key Entities *(include if feature involves data)*

- **Account**: Login identity with username, password, status, and role.
- **User Profile**: User-facing profile including full name, phone, and avatar.
- **Worker Profile**: Worker-facing profile including job type, license reference, location, and verification status.
- **Session Credential**: Access session and refresh session issued on sign-in.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of users can complete sign-in within 60 seconds on first attempt.
- **SC-002**: 90% of new registrations complete in under 3 minutes.
- **SC-003**: 99% of sign-in attempts receive a response within 2 seconds.
- **SC-004**: Lockout activates after the defined failed-attempt threshold and prevents further sign-in for the defined lockout window.

## Assumptions

- The feature targets a web UI for end users and workers.
- Registration is supported only for User and Worker roles; Admin registration is out of scope.
- Phone verification and email verification are out of scope for v1.
- Worker verification is handled outside this feature and only the status is shown here.
- Existing authentication storage and account data are reused.
