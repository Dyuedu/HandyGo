<!--
Sync Impact Report
- Version change: template -> 1.0.0
- Modified principles: placeholders -> I. Monorepo and Docker Readiness; II. Backend Standards (Spring Boot); III. Frontend Standards (React Vite); IV. Business and State Rules; V. Security, Logging, and Testing
- Added sections: Technology Stack; Workflow and Review
- Removed sections: None
- Templates requiring updates:
	- .specify/templates/plan-template.md: OK updated
	- .specify/templates/spec-template.md: OK updated
	- .specify/templates/tasks-template.md: OK updated
- Follow-up TODOs: TODO(RATIFICATION_DATE): initial ratification date not recorded
-->
# Mock Project Constitution (Spring Boot + React Vite)

## Core Principles

### I. Monorepo and Docker Readiness
- The repository MUST keep backend in `mock-backend/` and frontend in `mock-frontend/`.
- `docker-compose.yml` MUST remain at repo root; each app MUST have a Dockerfile before release.
- If the domain changes, specs, plans, and tasks MUST be updated to stay in sync.

### II. Backend Standards (Spring Boot 4.x)
- PostgreSQL is the primary database.
- All configuration MUST live in `src/main/resources/application.yaml` (no `.properties`).
- Layered architecture is mandatory: Controller -> Service -> Repository -> Entity.
- APIs MUST be RESTful and return JSON with a consistent schema: `success`, `data`, `error`, `timestamp`, `requestId`.
- Errors MUST include `error.code`, `error.message`, and optional `error.details`.
- List endpoints MUST support `page`, `size`, `sort` and return `totalElements`, `totalPages`, `page`, `size`.
- Use UUIDs for user-facing entities; small config tables may use BIGINT auto-increment.
- Schema changes MUST use Flyway or Liquibase; never edit applied migrations.
- Inputs MUST use Bean Validation (`jakarta.validation`) before reaching services.

### III. Frontend Standards (React Vite)
- Frontend uses React + Vite with ES6+, HTML5, and CSS3.
- UI MUST be lightweight; prefer CSS Modules or Tailwind and avoid heavy UI kits unless required.
- Drag/drop or map flows MUST use native Web APIs or lightweight libraries; Google Maps API runs client-side.
- UI MUST be responsive for laptop and tablet/mobile webview.
- Every request MUST surface loading and error states; env config uses `.env` with `.env.example`.

### IV. Business and State Rules
- Booking state transitions MUST be validated strictly before persistence.
- Wallet and frozen-balance updates MUST be transactional to prevent race conditions.
- Notifications MUST be asynchronous to avoid blocking user flows.
- Payment operations MUST use idempotency keys for retries.
- Cache-aside rules for account and wallet data MUST be maintained and invalidated on balance changes.

### V. Security, Logging, and Testing
- Secrets MUST NOT be hardcoded; use environment variables in backend and frontend configs.
- Secret and credential files MUST be gitignored.
- Auth MUST use JWT Bearer with short-lived access tokens and long-lived refresh tokens, revocable via Redis.
- Logs MUST be structured (JSON or key-value) with `requestId`/`traceId` and no PII or secrets.
- Sensitive endpoints MUST apply rate limiting or throttling.
- Backend tests MUST include JUnit 5 unit tests for services and integration tests for key repositories/APIs.
- Frontend tests MUST be added when complex logic or hooks are introduced.
- Code MUST pass existing lint/format rules before commit.

## Technology Stack
- Backend: Java + Spring Boot 4.x
- Frontend: React + Vite
- Data: PostgreSQL, Redis
- Payments: VNPay integration
- Packaging: Docker and docker-compose

## Workflow and Review
- Domain changes require updates to specs, plans, and tasks.
- API response schema and pagination rules MUST be verified during review.
- Security, logging, and testing requirements MUST be validated in PRs.
- Use docs/vnpay-wallet-history.md as runtime guidance for VNPay and wallet flows.

## Governance
- This constitution supersedes all other practices.
- Amendments MUST update this file and any impacted templates, and bump version via semver.
- Compliance is reviewed in every PR against the constitution check gates.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): initial ratification date not recorded | **Last Amended**: 2026-05-17
