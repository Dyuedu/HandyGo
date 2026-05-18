# Research: Login/Register

Date: 2026-05-18

## Decisions

### Lockout policy
- Decision: Lock account after 5 failed sign-in attempts within 10 minutes; lock duration is 10 minutes.
- Rationale: Balances security and user experience; aligns with common rate-limit thresholds.
- Alternatives considered:
  - 3 attempts / 15 minutes: more secure but higher false lockouts.
  - 10 attempts / 30 minutes: better UX but weaker defense.

### Refresh token rotation
- Decision: Rotate refresh tokens on every refresh and revoke previous token.
- Rationale: Matches existing backend implementation and reduces token replay risk.
- Alternatives considered:
  - Static refresh token until expiry: simpler but higher risk on token leakage.

### Frontend test approach
- Decision: No new frontend test framework required for initial login/register UI; rely on manual QA and existing linting.
- Rationale: Feature scope is simple UI/validation; current repo does not include a testing framework.
- Alternatives considered:
  - Add unit tests with Vitest: more coverage but adds setup overhead for a small change.

### API error schema alignment
- Decision: Wrap auth responses to match required schema (`success`, `data`, `error`, `timestamp`, `requestId`) across new/updated endpoints.
- Rationale: Required by constitution; ensures consistent error handling.
- Alternatives considered:
  - Leave current direct responses: faster but non-compliant.
