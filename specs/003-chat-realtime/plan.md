# Implementation Plan: Chat & Real-time Messaging Module

**Branch**: `003-chat-realtime` | **Date**: 2026-05-19 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/003-chat-realtime/spec.md`

## Summary

Implement a real-time chat and notification system that enables bidirectional messaging between workers and customers. The system includes:
- **Real-time messaging**: Socket.io WebSocket connections for <1s message delivery with delivery/read status tracking
- **Conversation management**: REST API inbox listing active conversations with unread counts and message previews  
- **Booking status notifications**: Event-driven notification delivery (push + email) when bookings change status, with exponential backoff retry queuing
- **In-app & system notifications**: Toast notifications for active users plus offline-capable push/email for background users

The implementation uses Socket.io for real-time transport, PostgreSQL for persistent data storage, Redis/RabbitMQ for notification queuing, and custom Java services for async delivery logic.

## Technical Context

**Language/Version**: Java 17 (backend), JavaScript ES6+ (frontend)  
**Primary Dependencies**: 
- Backend: Spring Boot 4.0.2, Spring Data JPA, Spring Data Redis, Socket.io (via socket.io-server Java library)
- Frontend: React 19, Vite 8, Socket.io client library
  
**Storage**: PostgreSQL (Messages, Conversations, Notifications, NotificationLog tables); Redis (notification queue, session management)  
**Real-time Transport**: Socket.io (WebSocket + polling fallback) for bidirectional messaging  
**Testing**: Backend: JUnit 5 + Mockito; Frontend: Jest/Vitest + React Testing Library  
**Target Platform**: Web-based (web browser via React frontend + Java Spring Boot API server)  
**Project Type**: Web service (REST API + real-time WebSocket backend; React SPA frontend)  
**Performance Goals**:
  - Message delivery: <1s P95 latency (SC-001)
  - Inbox load: <2s (SC-002)
  - Notification delivery: <10s for push, <60s for email (SC-003, SC-004)
  - Typing indicator: <500ms (SC-006)
  - Concurrent capacity: 500 active chat rooms (1000 concurrent users) (SC-005)
  
**Constraints**:
  - Messages must be persisted and delivered reliably (99% no-loss, SC-008)
  - Rate limiting: max 10 messages/minute per user (FR-014)
  - Notification retry: max 3 attempts with exponential backoff (FR-007)
  - XSS protection on message content (FR-012)
  
**Scale/Scope**: 
  - Assumes existing user authentication (JWT reuse from login module)
  - Assumes existing booking system (subscribes to booking.status_changed events)
  - Initial scope: 2-person conversations (1:1 chat), group chat deferred to v2

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- ✅ **Monorepo paths and Docker readiness**: Backend code lives in `mock-backend/mock/src/main/java/com/group/mock/controller/ChatController.java` and `service/NotificationService.java`; frontend UI in `mock-frontend/src/modules/chat/`; docker-compose.yml at repo root handles service orchestration
- ✅ **Backend (Spring Boot 4.x)**: Uses PostgreSQL (Messages, Conversations, Notifications tables via Spring Data JPA); layered architecture with ChatController → ChatService → ChatRepository; all endpoints follow REST JSON schema `{success, data, error, timestamp, requestId}` with pagination (`page`, `size`, `sort`)
- ✅ **Frontend (React Vite)**: Chat UI uses React 19 + Vite 8 with ES6+; lightweight CSS for message rendering; responsive design for mobile/tablet webview; `.env`-based config for Socket.io server URL; loading and error state handling in Inbox and Chat Detail screens
- ✅ **Business rules**: Notifications are asynchronous (queued to Redis/RabbitMQ, not blocking user flows); booking status changes trigger events that NotificationService subscribes to; message persistence is transactional
- ✅ **Security, logging, testing**: JWT Bearer auth required for all chat endpoints; Socket.io connection authenticated with JWT; rate limiting on message sending (10/min); structured logging with requestId; no secrets in code; JUnit 5 tests for ChatController and NotificationService; integration tests for Socket.io and event listeners

**Gate Status**: ✅ **PASS** — All constitution principles satisfied. Monorepo structure confirmed, backend/frontend standards met, security and testing requirements covered.

## Project Structure

### Documentation (this feature)

```text
specs/003-chat-realtime/
├── spec.md              # Feature specification
├── plan.md              # This file (Phase 0-1 implementation plan)
├── research.md          # Phase 0 output (research on Socket.io + Redis/RabbitMQ integration)
├── data-model.md        # Phase 1 output (Message, Conversation, Notification, NotificationLog entities)
├── quickstart.md        # Phase 1 output (quick-start guide for running chat module locally)
├── contracts/           # Phase 1 output
│   ├── README.md        # Contract documentation index
│   ├── chat-api.md      # REST API contracts (GET /api/v1/chats, POST /api/v1/messages)
│   └── chat-events.md   # Socket.io event contracts (message.sent, message.delivered, message.read, user.typing)
├── checklists/
│   ├── requirements.md  # Specification quality checklist
│   └── [future: implementation checklist]
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Option 2: Web application (Spring Boot backend + React frontend)

mock-backend/
└── mock/
    ├── src/
    │   ├── main/
    │   │   ├── java/com/group/mock/
    │   │   │   ├── controller/
    │   │   │   │   ├── ChatController.java              # REST endpoints: GET /api/v1/chats, POST /api/v1/messages, etc.
    │   │   │   │   └── NotificationController.java      # REST endpoints for notification status, preferences
    │   │   │   ├── service/
    │   │   │   │   ├── ChatService.java                 # Core chat logic (message persistence, conversation management)
    │   │   │   │   ├── NotificationService.java         # Notification queueing and delivery orchestration
    │   │   │   │   ├── SocketIoService.java             # Socket.io event handling and real-time message delivery
    │   │   │   │   └── BookingEventListener.java        # Subscribes to booking.status_changed events
    │   │   │   ├── repository/
    │   │   │   │   ├── MessageRepository.java           # Spring Data JPA for Message entity
    │   │   │   │   ├── ConversationRepository.java      # Spring Data JPA for Conversation entity
    │   │   │   │   ├── NotificationRepository.java      # Spring Data JPA for Notification entity
    │   │   │   │   └── NotificationLogRepository.java   # Spring Data JPA for NotificationLog entity
    │   │   │   ├── entity/
    │   │   │   │   ├── Message.java                     # JPA entity: sender_id, receiver_id, content, status, timestamps
    │   │   │   │   ├── Conversation.java                # JPA entity: user1_id, user2_id, last_message_timestamp, unread_count
    │   │   │   │   ├── Notification.java                # JPA entity: type, recipient_id, content, method, status, retry_count
    │   │   │   │   ├── NotificationLog.java             # JPA entity: audit trail of all notifications
    │   │   │   │   └── NotificationQueue.java           # Redis/RabbitMQ queue item representation
    │   │   │   ├── dto/
    │   │   │   │   ├── MessageDto.java                  # DTO for message API responses
    │   │   │   │   ├── ConversationDto.java             # DTO for conversation list responses
    │   │   │   │   └── NotificationDto.java             # DTO for notification responses
    │   │   │   ├── exception/
    │   │   │   │   ├── ConversationNotFoundException.java
    │   │   │   │   └── MessageValidationException.java
    │   │   │   ├── config/
    │   │   │   │   ├── SocketIoConfiguration.java       # Socket.io server setup
    │   │   │   │   └── RedisConfiguration.java          # Redis client for notification queue
    │   │   │   └── util/
    │   │   │       ├── MessageValidator.java            # Validate message content (length, charset, XSS)
    │   │   │       ├── NotificationQueueUtil.java       # Redis/RabbitMQ queue operations
    │   │   │       └── JwtUtil.java                     # JWT authentication utility
    │   │   └── resources/
    │   │       └── db/migration/                         # Flyway migrations for Message, Conversation, Notification tables
    │   │           ├── V1__Create_messages_table.sql
    │   │           ├── V2__Create_conversations_table.sql
    │   │           ├── V3__Create_notifications_table.sql
    │   │           └── V4__Create_notification_logs_table.sql
    │   └── test/
    │       ├── java/com/group/mock/
    │       │   ├── controller/ChatControllerTest.java   # JUnit 5 tests for REST endpoints
    │       │   ├── service/ChatServiceTest.java         # JUnit 5 tests for chat logic
    │       │   ├── service/NotificationServiceTest.java # JUnit 5 tests for notification delivery
    │       │   ├── service/SocketIoServiceTest.java     # Integration tests for Socket.io events
    │       │   └── repository/ChatRepositoryTest.java   # Integration tests for JPA repositories
    │       └── resources/application-test.yml           # Test configuration
    └── pom.xml                                           # Maven POM with Socket.io, Spring Data, Redis dependencies

mock-frontend/
├── src/
│   ├── modules/
│   │   └── chat/
│   │       ├── pages/
│   │       │   ├── ChatDetail.jsx                       # Chat detail screen with message list, input, real-time updates
│   │       │   └── ChatInbox.jsx                        # Inbox screen with conversation list
│   │       ├── components/
│   │       │   ├── MessageBubble.jsx                    # Individual message component
│   │       │   ├── MessageInput.jsx                     # Message input with validation, send button, file upload
│   │       │   ├── TypingIndicator.jsx                 # Real-time typing indicator
    │       │   ├── ConversationCard.jsx                 # Conversation list item
    │       │   ├── NotificationToast.jsx                # In-app toast notification
    │       │   └── ChatHeader.jsx                       # Chat header with participant info
    │       ├── hooks/
    │       │   ├── useChat.js                           # Socket.io connection and message handling
    │       │   ├── useChatInbox.js                      # Conversation list and unread count management
    │       │   └── useNotifications.js                  # In-app notification management
    │       ├── services/
    │       │   ├── chatService.js                       # REST API calls (GET /api/v1/chats, POST /api/v1/messages)
    │       │   ├── socketService.js                     # Socket.io client initialization and event listeners
    │       │   └── notificationService.js               # Push notification permission and subscription
    │       ├── utils/
    │       │   ├── messageFormatter.js                  # Format messages with emoji, links, text styling
    │       │   ├── timestampUtils.js                    # Format timestamps for display
    │       │   └── xssProtection.js                     # Sanitize message content to prevent XSS
    │       ├── styles/
    │       │   ├── ChatDetail.css                       # Chat detail screen styles
    │       │   ├── ChatInbox.css                        # Inbox screen styles
    │       │   └── MessageBubble.css                    # Message bubble styles
    │       └── context/
    │           └── ChatContext.jsx                      # React context for shared chat state
    ├── .env.example                                     # Example config (Socket.io server URL, API base URL)
    └── package.json                                     # Dependencies: socket.io-client, axios, React

# Docker
docker-compose.yml (at repo root)               # Orchestrates mock-backend, mock-frontend, PostgreSQL, Redis/RabbitMQ services
```

**Structure Decision**: This feature uses Option 2 (Web application with Spring Boot backend + React frontend). The monorepo structure separates backend services, repositories, and entities into logical layers (Controller → Service → Repository → Entity) per Spring Boot conventions. Frontend modules are organized by feature (chat/) with pages, components, hooks, and utilities. Persistence uses PostgreSQL for relational data (messages, conversations, notifications); Redis or RabbitMQ is used for notification queuing and async delivery.

## Phase 0: Research & Technical Decisions

*Output: Resolve unknowns and document research findings in `research.md`*

### Research Tasks

1. **Socket.io integration with Spring Boot**
   - Research: Server-side Socket.io implementation options in Java (socket.io-server-java library vs alternative WebSocket frameworks)
   - Decision: Use `com.github.mrniko:netty-socketio` library for Spring Boot; it's battle-tested, supports namespaces/rooms, and integrates cleanly with Spring
   - Deliverable: `research.md` with Socket.io setup guide, authentication flow, and troubleshooting notes

2. **Redis vs RabbitMQ for notification queue**
   - Research: Compare Redis (simpler, already in docker-compose) vs RabbitMQ (more robust, better for large message volumes)
   - Decision: Use Redis for MVP (already configured in constitution, simpler setup); can migrate to RabbitMQ in future if queue complexity grows
   - Deliverable: `research.md` with queue architecture, retry logic implementation, and monitoring approach

3. **Flyway database migrations for Chat module**
   - Research: Design SQL migrations for Message, Conversation, Notification, NotificationLog tables
   - Decision: Create 4 sequential migrations (V1-V4) with proper indexes on conversation IDs, timestamps, and status fields
   - Deliverable: `research.md` with schema design decisions and performance considerations

4. **Real-time message delivery reliability**
   - Research: Strategies for ensuring 99% message delivery (duplicate detection, idempotency keys, acknowledgment patterns)
   - Decision: Implement sequence IDs + idempotency keys in Message entity; use Socket.io acknowledgments for delivery confirmation
   - Deliverable: `research.md` with failure recovery strategy and testing approach

5. **Frontend Socket.io client setup**
   - Research: Socket.io client library options for React (native socket.io-client vs wrappers)
   - Decision: Use native `socket.io-client` npm package; create custom React hooks (useChat, useChatInbox) to encapsulate Socket.io logic
   - Deliverable: `research.md` with setup guide, hook patterns, and performance optimization (connection pooling, reconnection logic)

### Known Unknowns → Research Phase Output

All unknowns from clarification session are resolved (Socket.io technology choice confirmed, event-driven booking integration confirmed, Redis/RabbitMQ decision confirmed). Research phase will document:
- ✅ Exact Socket.io Java library version and Spring Boot integration code
- ✅ Redis queue architecture (key naming conventions, retry exponential backoff formula)
- ✅ Flyway migration scripts with schema and indexes
- ✅ Socket.io event schema and namespacing strategy
- ✅ Frontend React hooks and Socket.io client configuration

**Phase 0 Deliverable**: `research.md` (auto-generated after research tasks complete)

---

## Phase 1: Design & Contracts

*Output: Generate data-model.md, contracts/, quickstart.md, and update agent context*

### 1.1 Data Model Design

**Entities to create in `data-model.md`**:

1. **Message**
   - Fields: id (UUID), conversation_id (UUID FK), sender_id (UUID FK), receiver_id (UUID FK), content (text, max 5000 chars), delivery_status (enum: pending/delivered/read), created_at, delivered_at, read_at, deleted_at (soft delete)
   - Relationships: Belongs to Conversation; sender/receiver references User
   - Validation: Content non-empty, max 5000 chars, no control characters
   - Indexing: conversation_id, created_at (for message history pagination); delivery_status for query optimization

2. **Conversation**
   - Fields: id (UUID), user1_id (UUID FK), user2_id (UUID FK), last_message_id (UUID FK), last_message_timestamp, unread_count_user1, unread_count_user2, is_active (boolean), created_at, updated_at
   - Relationships: HasMany Messages; References two User entities
   - Validation: user1_id < user2_id (canonical ordering to prevent duplicate conversations)
   - Indexing: (user1_id, user2_id) unique compound index; last_message_timestamp for sorting

3. **Notification**
   - Fields: id (UUID), type (enum: booking_status_change, message_received, payment_confirmed), recipient_id (UUID FK), booking_id (UUID FK optional), content (text), delivery_method (enum: push/email/in_app), status (enum: pending/sent/failed), retry_count (int, max 3), next_retry_at, created_at, sent_at, failed_reason
   - Relationships: References User; optional reference to Booking
   - Validation: status transitions only allowed in specific order (pending → sent or pending → failed)
   - Indexing: recipient_id, status, next_retry_at (for queue polling)

4. **NotificationLog**
   - Fields: id (UUID), notification_id (UUID FK), method_used (enum), recipient_email/push_token, sent_at, delivery_status (success/failed), error_message, created_at
   - Relationships: References Notification (read-only audit trail)
   - Validation: Created automatically when notification is processed
   - Indexing: notification_id, created_at (for compliance reporting)

**Deliverable**: `data-model.md` with entity schemas, relationships, validation rules, and performance considerations

### 1.2 API Contracts

**Contracts to create in `contracts/` directory**:

**File: `contracts/chat-api.md`**
- Endpoint: `GET /api/v1/chats`
  - Params: `page`, `size`, `sort` (by last_message_timestamp desc)
  - Response: `{success: true, data: {conversations: [...], totalElements, totalPages, page, size}, timestamp, requestId}`
  - Auth: JWT Bearer required

- Endpoint: `POST /api/v1/messages`
  - Body: `{conversationId, content}`
  - Response: `{success: true, data: {messageId, status: "pending", createdAt}, timestamp, requestId}`
  - Validation errors return `{success: false, error: {code: "VALIDATION_ERROR", message, details}}`

- Endpoint: `GET /api/v1/messages/{conversationId}`
  - Params: `page`, `size` (default last 50 messages)
  - Response: `{success: true, data: {messages: [...], totalElements, page, size}, timestamp, requestId}`

**File: `contracts/chat-events.md`**
- Socket.io namespace: `/chat` (authenticated with JWT query param)
- Events:
  - `message.send` (client → server): `{conversationId, content, clientId}`
  - `message.sent` (server → client): `{messageId, status: "pending", createdAt}`
  - `message.delivered` (server → client): `{messageId, status: "delivered", deliveredAt}`
  - `message.read` (client → server): `{messageId}`
  - `message.read` (server → client): `{messageId, status: "read", readAt}`
  - `user.typing` (client → server): `{conversationId}`
  - `user.typing` (server → other client): `{userId, userName, isTyping: true/false}`

**Deliverable**: `contracts/README.md` (index) + `contracts/chat-api.md` + `contracts/chat-events.md`

### 1.3 Quick-Start Guide

**Deliverable**: `quickstart.md` with:
- Local setup instructions (start PostgreSQL, Redis, backend, frontend)
- Example: Create a test conversation, send a message via REST API, verify Socket.io delivery
- Debugging: How to check WebSocket connection status, view Redis queue, tail backend logs
- Testing: How to run ChatControllerTest, SocketIoServiceTest
- Troubleshooting: Common issues (Socket.io connection refused, Redis unreachable, etc.)

### 1.4 Update Agent Context

Run `.specify/scripts/bash/update-agent-context.sh copilot` to register Socket.io + Redis/RabbitMQ as new technologies in the agent context file (`.github/copilot-instructions.md` or equivalent). This ensures future planning sessions are aware of the real-time and queueing patterns established in this module.

### Constitution Re-Check (Post-Design)

**Gate**: Re-validate that design satisfies all constitution principles:

- ✅ Monorepo: Paths confirmed in Project Structure section
- ✅ Backend Spring Boot: Layered architecture (Controller → Service → Repository) confirmed; REST API schema confirmed
- ✅ Frontend React Vite: Component structure, hooks, `.env` config confirmed
- ✅ Transactions & State: Message persistence is transactional; notification queue uses Redis for reliability
- ✅ Security: JWT auth for REST and Socket.io; XSS protection on messages; rate limiting implemented
- ✅ Logging: Structured logs with requestId on all operations
- ✅ Testing: JUnit 5 tests for services, integration tests for Socket.io, Jest tests for React components

**Gate Status**: ✅ **PASS** — Design satisfies all constitution constraints.

---

## Next Steps

**Phase 0 (Research)**: Generate `research.md` with Socket.io setup, Redis queue architecture, database schema design, and frontend hook patterns

**Phase 1 (Design)**: Generate:
  - `data-model.md` with Message, Conversation, Notification, NotificationLog entity definitions
  - `contracts/chat-api.md` with REST endpoint specifications
  - `contracts/chat-events.md` with Socket.io event contracts
  - `quickstart.md` with local setup and testing guide

**Phase 2 (Tasks)**: Run `/speckit.tasks` to generate task breakdown and implementation checklist

---

## Execution Log

- ✅ Spec loaded: `specs/003-chat-realtime/spec.md`
- ✅ Branch verified: `003-chat-realtime`
- ✅ Constitution check: PASS (all principles satisfied)
- ✅ Technical context: Java 17 + Spring Boot 4.0.2, React 19, Socket.io, PostgreSQL, Redis
- ✅ Project structure: Web application (Spring Boot + React) with Option 2 layout
- ✅ Research tasks: 5 key research areas identified
- ✅ Phase 0/1 planning: Data model, contracts, and quick-start identified for generation
- ⏳ Pending: Generate research.md, data-model.md, contracts/, quickstart.md (requires `/speckit.plan` execution or `/speckit.tasks`)
