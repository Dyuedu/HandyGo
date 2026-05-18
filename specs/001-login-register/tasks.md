# Tasks: Login/Register

**Input**: Design documents from `/specs/001-login-register/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Backend tests are REQUIRED for auth services and endpoints; frontend tests are optional for this feature.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and shared scaffolding

- [ ] T001 Create frontend env example for API base URL in mock-frontend/.env.example
- [ ] T002 [P] Create frontend HTTP client wrapper in mock-frontend/src/api/httpClient.js

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [ ] T003 Create API response envelope DTO in mock-backend/mock/src/main/java/com/group/mock/entity/DTO/response/ApiResponse.java
- [ ] T004 [P] Add requestId filter for response metadata in mock-backend/mock/src/main/java/com/group/mock/configuration/RequestIdFilter.java
- [ ] T005 Add global exception handler mapping auth errors to response schema in mock-backend/mock/src/main/java/com/group/mock/exception/GlobalExceptionHandler.java
- [ ] T006 Implement login attempt tracking (lockout + rate limit) in mock-backend/mock/src/main/java/com/group/mock/service/LoginAttemptService.java
- [ ] T007 [P] Wire login attempt filter for /api/auth/login in mock-backend/mock/src/main/java/com/group/mock/configuration/LoginAttemptFilter.java
- [ ] T008 Add lockout/rate-limit config in mock-backend/mock/src/main/resources/application.yaml

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Sign in to access account (Priority: P1) 🎯 MVP

**Goal**: Users and workers can sign in with clear errors and receive access/refresh sessions.

**Independent Test**: Sign in with valid and invalid credentials and verify token response and error handling.

### Tests for User Story 1 (REQUIRED) ⚠️

- [ ] T009 [P] [US1] Add login endpoint integration test in mock-backend/mock/src/test/java/com/group/mock/controller/AuthControllerLoginTest.java
- [ ] T010 [P] [US1] Add lockout behavior test in mock-backend/mock/src/test/java/com/group/mock/service/LoginAttemptServiceTest.java

### Implementation for User Story 1

- [ ] T011 [US1] Add validation annotations to LoginRequest in mock-backend/mock/src/main/java/com/group/mock/entity/DTO/request/LoginRequest.java
- [ ] T012 [US1] Update AuthController login to use ApiResponse and lockout checks in mock-backend/mock/src/main/java/com/group/mock/controller/AuthController.java
- [ ] T013 [US1] Ensure AuthTokenResponse uses response schema and includes expiry fields in mock-backend/mock/src/main/java/com/group/mock/entity/DTO/response/AuthTokenResponse.java
- [ ] T014 [P] [US1] Build login page UI in mock-frontend/src/pages/Login.jsx
- [ ] T015 [P] [US1] Add login validation helpers in mock-frontend/src/utils/validation.js
- [ ] T016 [US1] Implement login API call in mock-frontend/src/api/auth.js
- [ ] T017 [US1] Add token storage and session bootstrap in mock-frontend/src/state/authStore.js

**Checkpoint**: User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Register as a user (Priority: P2)

**Goal**: New users can register with required profile details and then sign in.

**Independent Test**: Register a user and then sign in successfully.

### Tests for User Story 2 (REQUIRED) ⚠️

- [ ] T018 [P] [US2] Add user registration integration test in mock-backend/mock/src/test/java/com/group/mock/controller/AuthControllerRegisterUserTest.java
- [ ] T019 [P] [US2] Add user registration service test in mock-backend/mock/src/test/java/com/group/mock/service/AccountServiceUserRegisterTest.java

### Implementation for User Story 2

- [ ] T020 [P] [US2] Create RegisterRequest + UserProfile payload in mock-backend/mock/src/main/java/com/group/mock/entity/DTO/request/RegisterRequest.java
- [ ] T021 [US2] Implement user registration in mock-backend/mock/src/main/java/com/group/mock/service/Impl/AccountServiceImpl.java
- [ ] T022 [US2] Update AuthController register for USER flow in mock-backend/mock/src/main/java/com/group/mock/controller/AuthController.java
- [ ] T023 [P] [US2] Build user registration UI in mock-frontend/src/pages/RegisterUser.jsx
- [ ] T024 [US2] Implement user register API call in mock-frontend/src/api/auth.js
- [ ] T025 [US2] Add Vietnamese auth messages in mock-frontend/src/constants/authMessages.js

**Checkpoint**: User Stories 1 and 2 should be independently functional

---

## Phase 5: User Story 3 - Register as a worker (Priority: P3)

**Goal**: Workers can register with required job details and view verification status.

**Independent Test**: Register a worker, sign in, and verify status messaging appears.

### Tests for User Story 3 (REQUIRED) ⚠️

- [ ] T026 [P] [US3] Add worker registration integration test in mock-backend/mock/src/test/java/com/group/mock/controller/AuthControllerRegisterWorkerTest.java
- [ ] T027 [P] [US3] Add worker registration service test in mock-backend/mock/src/test/java/com/group/mock/service/AccountServiceWorkerRegisterTest.java

### Implementation for User Story 3

- [ ] T028 [P] [US3] Extend RegisterRequest for WorkerProfile fields in mock-backend/mock/src/main/java/com/group/mock/entity/DTO/request/RegisterRequest.java
- [ ] T029 [US3] Implement worker registration in mock-backend/mock/src/main/java/com/group/mock/service/Impl/AccountServiceImpl.java
- [ ] T030 [US3] Add worker verification status field to login response in mock-backend/mock/src/main/java/com/group/mock/entity/DTO/response/AuthTokenResponse.java
- [ ] T031 [US3] Update auth contract with worker status field in specs/001-login-register/contracts/auth-api.md
- [ ] T032 [P] [US3] Build worker registration UI in mock-frontend/src/pages/RegisterWorker.jsx
- [ ] T033 [US3] Implement worker register API call in mock-frontend/src/api/auth.js
- [ ] T034 [US3] Render worker verification status after login in mock-frontend/src/pages/Login.jsx

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T035 [P] Update quickstart smoke steps if endpoints or payloads changed in specs/001-login-register/quickstart.md
- [ ] T036 Run quickstart smoke test steps from specs/001-login-register/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Depends on shared auth API responses
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Depends on shared auth API responses

### Within Each User Story

- Tests MUST be written and FAIL before implementation when required by the constitution or spec
- DTOs/models before services
- Services before controllers
- Backend endpoints before frontend wiring

### Parallel Opportunities

- Phase 1 tasks can run in parallel
- Foundational tasks marked [P] can run in parallel
- Tests for each user story marked [P] can run in parallel
- Frontend UI tasks and backend DTO tasks can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch tests for User Story 1 together:
Task: "Add login endpoint integration test in mock-backend/mock/src/test/java/com/group/mock/controller/AuthControllerLoginTest.java"
Task: "Add lockout behavior test in mock-backend/mock/src/test/java/com/group/mock/service/LoginAttemptServiceTest.java"

# Launch UI and validation tasks in parallel:
Task: "Build login page UI in mock-frontend/src/pages/Login.jsx"
Task: "Add login validation helpers in mock-frontend/src/utils/validation.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently

### Incremental Delivery

1. Complete Setup + Foundational
2. Add User Story 1 -> Test independently -> Demo
3. Add User Story 2 -> Test independently -> Demo
4. Add User Story 3 -> Test independently -> Demo

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
