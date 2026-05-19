# Feature Specification: Core Map & Discovery Module

**Feature Branch**: `002-map-discovery`  
**Created**: 2026-05-19  
**Status**: Draft  
**Input**: User description: "Module Core Map & Discovery (Người mở đường) - Help workers and customers see each other on a map with backend APIs and interactive map UI"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Customer Finds Workers on Map (Priority: P1)

A customer opens the app and wants to find available workers in their area for a specific service (e.g., electrical work, plumbing). The customer should see a real-time map with worker icons clustered by service type, allowing quick discovery of nearby workers.

**Why this priority**: This is the core value proposition - connecting customers with workers. Without map discovery, the entire feature is non-functional. This is the MVP entry point.

**Independent Test**: Can be fully tested by (1) opening the map with a known worker location, (2) filtering by service type, and (3) verifying workers appear at correct coordinates. Delivers immediate worker discoverability.

**Acceptance Scenarios**:

1. **Given** customer is on main map screen and there are workers nearby, **When** customer loads the map, **Then** customer sees worker icons pinned at their GPS locations
2. **Given** customer is viewing all worker icons, **When** customer selects a service type filter (e.g., "Điện - Electrical"), **Then** map only shows workers offering that service
3. **Given** customer views worker icon on map, **When** customer hovers/taps the icon, **Then** worker preview card appears showing name, service type, rating, and distance

---

### User Story 2 - Customer Posts Urgent Task Request (Priority: P1)

A customer has an urgent task and wants to quickly post a request. Workers in the area should be notified proactively so they can respond. The customer can describe their need without completing a full form.

**Why this priority**: Task posting is the second critical flow - it closes the loop between discovery and engagement. Without this, workers and customers see each other but cannot easily connect.

**Independent Test**: Can be fully tested by (1) submitting a task post, (2) verifying nearby workers receive a notification, and (3) confirming the post appears in the system. Delivers worker notification capability.

**Acceptance Scenarios**:

1. **Given** customer is on the main screen, **When** customer taps "Post Task" button, **Then** form screen opens with fields for service type, location, description, and budget
2. **Given** customer fills out task form, **When** customer submits the post, **Then** system validates required fields and shows success confirmation
3. **Given** task is successfully posted, **When** nearby workers (within 5km radius) are checked, **Then** each receives a push notification about the new task
4. **Given** customer has posted multiple tasks, **When** customer views their post history, **Then** all posts are listed with status (open, assigned, completed)

---

### User Story 3 - Worker Discovers Available Tasks (Priority: P2)

A worker views the map and wants to see tasks available in their area. Workers should see posted customer requests on the map or in a dedicated task list view.

**Why this priority**: Completes the two-way discovery flow. While P1 focuses on customer→worker, this enables worker→task initiation. Secondary because notifications (P1) already push opportunities to workers.

**Independent Test**: Can be fully tested by (1) posting a customer task, (2) viewing the map as a worker, and (3) confirming the task appears at the customer's location. Delivers worker-to-task visibility.

**Acceptance Scenarios**:

1. **Given** worker is viewing the map, **When** customer posts a task nearby, **Then** task marker appears on the map at the customer's location
2. **Given** worker sees a task marker, **When** worker taps it, **Then** task detail popup shows customer location, description, budget, and distance
3. **Given** worker is interested in a task, **When** worker taps "Accept" or "Contact", **Then** system initiates communication flow with the customer

---

### Edge Cases

- What happens when there are no workers within a 5km radius? → Show empty state with message "No workers nearby. Refine your search or post a task request."
- How does the system handle workers with stale/outdated location data? → Enforce location refresh on app open; mark locations older than 30 minutes as "inactive."
- What if a customer posts a task but the location is invalid or unserviceable? → System should display error and guide customer to adjust location.
- How does the system handle concurrent task posts from the same customer? → Allow multiple concurrent posts; each post is independent.
- What if a worker is offline when a task notification is sent? → Store notification in queue; deliver when worker comes online.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST retrieve and display workers near the customer's coordinates via `GET /api/v1/map/techs` endpoint with lat/lng parameters
- **FR-002**: System MUST filter workers by service type on the frontend and apply optional backend filtering for performance
- **FR-003**: Customers MUST be able to submit a task request via `POST /api/v1/posts` with service type, location, description, and estimated budget
- **FR-004**: System MUST validate all required fields on task posts before persistence and return validation errors to the user
- **FR-005**: System MUST send notifications to workers within a 5km radius when a customer posts a task, using simple proximity-based logic (no complex ML required for v1)
- **FR-006**: System MUST display task posts on the map and in a list view accessible to workers
- **FR-007**: Map MUST display both worker locations (icons) and customer task locations (different marker style) simultaneously
- **FR-008**: System MUST support filtering by multiple service types (electrical, plumbing, cleaning, etc.) on the frontend
- **FR-009**: System MUST track worker location updates; locations MUST refresh at least once per app session or when explicitly requested
- **FR-010**: System MUST log all API requests with request ID for debugging and analytics

### Constitution Alignment *(mandatory)*

- **Monorepo & Docker**: Backend endpoints live in `mock-backend/mock/src/main/java/com/group/mock/controller/MapController.java`; frontend map UI in `mock-frontend/src/modules/map/` module (to be created)
- **API Standards**: All responses from `/api/v1/map/*` and `/api/v1/posts` MUST follow the standard schema: `{success: boolean, data: {…}, error: {code, message}, timestamp, requestId}`
- **Pagination**: List endpoints (e.g., GET /api/v1/posts) MUST support `page`, `size`, `sort` parameters and return `totalElements`, `totalPages`, `page`, `size`
- **Validation**: All POST/PUT inputs MUST use `jakarta.validation` annotations; validation errors MUST be caught and formatted consistently
- **Security**: Location data MUST be treated as sensitive PII; endpoints MUST require JWT Bearer authentication; rate limiting SHOULD be applied to prevent abuse
- **Logging**: All map queries and task posts MUST be logged with `requestId`; no raw coordinates or customer names in logs
- **Testing**: Backend MUST include JUnit 5 tests for MapController and PostController; frontend MUST include tests for map rendering and filter logic

### Key Entities *(include if feature involves data)*

- **Worker**: Represents a service provider with location (lat/lng), service types offered, availability status, rating, and unique ID (UUID)
- **Task/Post**: Represents a customer's service request with location, service type needed, description, estimated budget, status (open/assigned/completed), timestamps
- **ServiceType**: Represents available service categories (electrical, plumbing, cleaning, etc.) with ID and description
- **Notification**: Represents a push/in-app notification sent to workers about a new task, with delivery status and timestamp

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Customers can discover workers within 5km radius in under 10 seconds from map load
- **SC-002**: At least 95% of task notifications are delivered to nearby workers within 30 seconds of task posting
- **SC-003**: Map screen loads and displays initial worker icons in under 3 seconds with typical network conditions
- **SC-004**: System supports at least 1000 concurrent users viewing the map without performance degradation (response time stays under 2 seconds)
- **SC-005**: Service type filter reduces visible workers on map by 40-60% (typical filtering effectiveness)
- **SC-006**: 90% of customers successfully post a task on their first attempt (low form abandonment)
- **SC-007**: Task location accuracy is within 50 meters of customer's actual GPS position

## Assumptions

- **User connectivity**: Customers and workers have stable internet connectivity (4G/5G or WiFi) during map usage
- **Location services**: Mobile devices have location services enabled and provide GPS coordinates within normal urban accuracy (±10-50m)
- **Scope boundaries**: This feature focuses on discovery and initial notification; detailed chat/negotiation and payment are handled by separate modules (chat, payment)
- **Authentication**: Users are already authenticated via the login/register system; feature reuses existing JWT Bearer auth
- **Service types**: A predefined list of service types (electrical, plumbing, cleaning, etc.) is available; custom service types are not supported in v1
- **Geographic scope**: Feature initially targets urban areas with sufficient worker density; rural/remote areas may see limited results
- **Notification method**: Notifications use push notifications (if app is running) and in-app alerts; backend queueing handles offline workers
- **Worker availability**: Worker location is assumed fresh if updated within last 30 minutes; older locations are flagged as potentially stale
- **Database**: PostgreSQL is used for persistent storage of tasks and worker data; Redis is used for real-time notification queuing
- **AI/ML**: v1 uses simple proximity-based notification (distance ≤ 5km); advanced matching/ranking is deferred to future versions
