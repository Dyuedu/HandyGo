# Implementation Plan: Login/Register

**Branch**: `001-login-register` | **Date**: 2026-05-18 | **Spec**: [specs/001-login-register/spec.md](specs/001-login-register/spec.md)
**Input**: Feature specification from `/specs/001-login-register/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Deliver login and registration flows for User and Worker roles with JWT access/refresh sessions, refresh rotation, lockout throttling, Cloudinary-backed worker professional certificate upload, and consistent API response schema. Frontend provides Vietnamese UI with validation and explicit error states; backend aligns auth endpoints with shared response/error format.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: Java 17 (backend), JavaScript ES6 (frontend)  
**Primary Dependencies**: Spring Boot 4.0.2, Spring Security, Spring Data JPA, Spring Data Redis, React 19, Vite 8, Cloudinary Upload API  
**Storage**: PostgreSQL, Redis, Cloudinary for worker professional certificate PDF/image files  
**Testing**: JUnit 5 (backend). Frontend tests not configured; rely on manual QA + eslint.  
**Target Platform**: Linux server (backend), modern browsers (frontend)  
**Project Type**: Web application (backend + frontend)  
**Performance Goals**: 99% sign-in responses within 2 seconds  
**Constraints**: Rate limiting, lockout threshold, JWT access/refresh with rotation, response schema compliance  
**Scale/Scope**: Initial release for User/Worker auth flows only; Admin registration excluded

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Monorepo paths and Docker readiness are documented (mock-backend/, mock-frontend/, root docker-compose).
- Backend design follows Spring Boot 4.x, PostgreSQL, layered architecture, REST JSON schema, pagination, migrations, validation.
- Frontend plan uses React Vite, lightweight UI approach, responsive layout, `.env` and `.env.example`, loading/error states.
- Business rules include booking state validation, transactional wallet updates, idempotency, async notifications, cache-aside.
- Security, logging, and testing requirements are satisfied (no secrets, JWT + Redis, structured logs, rate limits, required tests).

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
mock-backend/
└── mock/
  ├── src/
  │   ├── main/
  │   └── test/
  └── pom.xml

mock-frontend/
├── src/
└── package.json
```

**Structure Decision**: Web application split across mock-backend and mock-frontend.

## Phase 0: Research

Output: [specs/001-login-register/research.md](specs/001-login-register/research.md)

## Phase 1: Design & Contracts

Output:
- [specs/001-login-register/data-model.md](specs/001-login-register/data-model.md)
- [specs/001-login-register/contracts/auth-api.md](specs/001-login-register/contracts/auth-api.md)
- [specs/001-login-register/quickstart.md](specs/001-login-register/quickstart.md)

## Constitution Check (Post-Design)

- Response schema in contracts matches constitution requirement.
- Auth endpoints include rate limiting and lockout behavior in plan.
- Frontend UX includes loading/error states and Vietnamese copy.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
