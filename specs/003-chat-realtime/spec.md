# Feature Specification: Chat & Real-time Messaging Module

**Feature Branch**: `003-chat-realtime`  
**Created**: 2026-05-19  
**Status**: Draft  
**Input**: User description: "Chat & Real-time Module - Handle direct interactions and real-time notifications between workers and customers with Socket.io/Firebase and push notification system"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Worker and Customer Exchange Real-Time Messages (Priority: P1)

A worker and customer need to communicate about a specific task or booking. They should be able to exchange messages in real-time with immediate delivery and read status indication. This is the core engagement mechanism after discovery and task posting.

**Why this priority**: Real-time messaging is essential for closing the transaction loop. Without this, customers and workers cannot negotiate details, confirm availability, or discuss payment/scope changes. This is the critical P1 flow.

**Independent Test**: Can be fully tested by (1) initiating a conversation from a booking or task, (2) sending messages from both sides, (3) verifying messages arrive within 1 second, and (4) displaying read/delivery status. Delivers immediate two-way communication.

**Acceptance Scenarios**:

1. **Given** a customer and worker are matched via booking, **When** customer initiates chat, **Then** chat room is created and customer can type and send a message
2. **Given** customer sends a message, **When** worker receives it, **Then** message appears in worker's inbox within 1 second and shows "delivered" status
3. **Given** message is delivered, **When** worker reads it, **Then** customer sees "read" indicator with timestamp of when worker read it
4. **Given** worker replies to customer, **When** customer receives the message, **Then** message renders with worker avatar, timestamp, and proper formatting
5. **Given** both users are in a chat room, **When** one user types, **Then** the other user sees a typing indicator ("Worker is typing...") in real-time
6. **Given** conversation is active, **When** either user sends an emoji or formatted text, **Then** special characters and emoji render correctly

---

### User Story 2 - User Views All Active Conversations in Inbox (Priority: P1)

A user (customer or worker) needs a central view of all active conversations to manage multiple ongoing interactions. The inbox should show recent conversations sorted by most recent message, with unread count and last message preview.

**Why this priority**: Inbox is the gateway to all conversations. Without a clear, organized inbox, users cannot manage multiple concurrent chats or prioritize which conversations to focus on. Essential for usability as communication volume grows.

**Independent Test**: Can be fully tested by (1) creating multiple conversations, (2) loading the inbox, (3) verifying list appears within 2 seconds, (4) displaying unread counts and last message previews, and (5) sorting by recency. Delivers conversation management capability.

**Acceptance Scenarios**:

1. **Given** user has multiple active conversations, **When** user navigates to Inbox, **Then** all conversations are listed with most recent first
2. **Given** inbox is displayed, **When** user sees a conversation, **Then** conversation card shows: other party's name/avatar, last message preview, timestamp of last message, and unread count badge
3. **Given** user has unread messages, **When** user opens inbox, **Then** unread count badge is visible on conversation and at top-level inbox count
4. **Given** user opens a conversation from inbox, **When** unread messages are viewed, **Then** unread count resets to 0 and badge disappears
5. **Given** new message arrives in background, **When** user is viewing inbox, **Then** conversation bubble moves to top and unread badge appears/increments
6. **Given** user has archived/completed conversations, **When** user views inbox, **Then** only active conversations are shown by default; archived conversations are accessible in separate tab

---

### User Story 3 - System Sends Push and Email Notifications on Booking Status Changes (Priority: P1)

When a booking status changes (e.g., accepted, started, completed), both the customer and worker should receive notifications via push notification (if app is installed/active) and email. These notifications should drive users back to the chat/booking to take further action.

**Why this priority**: Notifications are critical for engagement and preventing communication gaps. When a booking changes status, users MUST be informed so they can respond appropriately. This is P1 because it bridges the booking and chat modules and drives user retention.

**Independent Test**: Can be fully tested by (1) changing a booking status via backend API, (2) verifying push notification is sent within 10 seconds, (3) verifying email is queued, and (4) confirming affected users receive notifications. Delivers critical status update delivery.

**Acceptance Scenarios**:

1. **Given** a booking status changes to "accepted", **When** change is persisted, **Then** system sends push notification to customer: "Worker [Name] accepted your booking for [Service]"
2. **Given** a booking status changes to "started", **When** change is persisted, **Then** system sends email to customer with booking details, worker contact, and link to chat
3. **Given** a booking is marked "completed", **When** change is persisted, **Then** system sends push notification to both parties prompting them to review and rate
4. **Given** user has push notifications enabled, **When** notification arrives, **Then** notification appears on device within 10 seconds
5. **Given** user receives a notification, **When** user taps it, **Then** app navigates to the relevant chat or booking detail screen
6. **Given** booking status changes, **When** user is offline, **Then** notification is queued and delivered when user comes online or via email fallback

---

### User Story 4 - User Receives In-App Notifications While Using the App (Priority: P2)

When a user is actively using the app (especially in the chat screen), they should see in-app toast notifications for important events (new messages from other conversations, booking status changes, payment confirmations).

**Why this priority**: In-app notifications provide immediate feedback and context without disrupting the current chat flow. While P1 focuses on push/email for when users are offline, this ensures users don't miss events while active in the app.

**Independent Test**: Can be fully tested by (1) sending a message to a user in a different conversation while they're viewing another chat, (2) verifying toast notification appears, and (3) confirming it doesn't block current UI. Delivers seamless in-app awareness.

**Acceptance Scenarios**:

1. **Given** user is viewing Chat Detail for Conversation A, **When** new message arrives in Conversation B, **Then** toast notification appears at top: "Worker [Name]: New message"
2. **Given** notification toast is displayed, **When** user taps it, **Then** app navigates to the relevant conversation
3. **Given** user is actively chatting, **When** booking status updates, **Then** subtle in-app notification appears (e.g., "Booking status updated to 'Started'")

---

### Edge Cases

- What happens if a user's internet connection drops during an active chat? → Messages should queue locally; once connection is restored, queued messages are sent with "resent" indicator.
- How does the system handle very long message threads (e.g., 1000+ messages in a conversation)? → Implement pagination with lazy-loading; only load last 50 messages initially, load earlier messages on scroll.
- What if a booking is deleted/cancelled after chat is started? → Chat room remains accessible for historical reference; send notification to both parties about cancellation.
- What if a user blocks another user? → Block relationship is enforced; blocked user cannot see new messages or send new messages (historical messages may remain for record-keeping).
- What if multiple devices are logged into the same account? → Notifications should be sent to all active devices; chat message counts appropriately across all devices.
- What happens if email notification fails to send? → Log the failure with retry logic (exponential backoff); mark notification as "pending" and retry up to 3 times.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST establish a real-time bidirectional connection (via Socket.io or Firebase) to enable instant message delivery between users
- **FR-002**: System MUST provide a REST endpoint `GET /api/v1/chats` that returns a list of all active conversations for the authenticated user with pagination support (`page`, `size`, `sort`)
- **FR-003**: System MUST persist all messages to the database (Messages table) with timestamp, sender ID, receiver ID, content, and delivery/read status
- **FR-004**: System MUST support message delivery status transitions: "pending" → "delivered" → "read" with timestamps
- **FR-005**: System MUST send push notifications to app users when booking status changes (accepted, started, completed, cancelled) within 10 seconds of status change
- **FR-006**: System MUST send email notifications to users when booking status changes, with booking details and a link back to the chat/booking detail
- **FR-007**: System MUST queue email notifications and attempt delivery with exponential backoff retry logic (max 3 retries)
- **FR-008**: System MUST validate all message inputs (non-empty, max length 5000 characters, valid character sets) before persistence
- **FR-009**: System MUST display real-time typing indicators to show when the other party is actively typing a message
- **FR-010**: System MUST maintain referential integrity: deleting a user soft-deletes their messages but preserves conversation history for audit purposes
- **FR-011**: System MUST implement message search capability allowing users to search within their conversations by keyword or date range
- **FR-012**: System MUST support emoji, links, and basic text formatting (bold, italic) in messages without corrupting data or introducing XSS vulnerabilities
- **FR-013**: System MUST log all chat events (message send, delivery, read, notification sent) with request ID and user ID for audit and debugging
- **FR-014**: System MUST rate-limit message sending to prevent spam (e.g., max 10 messages per minute per user)

### Constitution Alignment *(mandatory)*

- **Monorepo & Docker**: Chat backend lives in `mock-backend/mock/src/main/java/com/group/mock/controller/ChatController.java`; Socket.io setup in a dedicated service; NotificationService with custom queue delivery in `mock-backend/mock/src/main/java/com/group/mock/service/NotificationService.java`; chat UI in `mock-frontend/src/modules/chat/` (already exists)
- **Database & Transactions**: Messages and Notifications tables in PostgreSQL; notification queue/status tracking via Redis/RabbitMQ for reliability and replay capability
- **API Standards**: Chat endpoints (`GET /api/v1/chats`, `POST /api/v1/messages`) MUST follow standard response schema: `{success: boolean, data: {…}, error: {code, message}, timestamp, requestId}`
- **Real-time Transport**: Socket.io events (message.sent, message.delivered, message.read, user.typing) MUST be namespaced and authenticated with JWT
- **Event Integration**: Booking module publishes `booking.status_changed` event (via event bus or direct callback); NotificationService listens and enqueues notifications to Redis/RabbitMQ for async delivery
- **Notification Queue**: Use Redis or RabbitMQ to queue push and email notifications; custom delivery service polls queue and attempts delivery with exponential backoff retry (max 3 retries per notification)
- **Validation**: All message inputs validated via `jakarta.validation` on backend before persistence; XSS protection applied to message content
- **Security**: Chat endpoints require JWT Bearer authentication; messages only visible to involved parties (no cross-conversation visibility); rate limiting applied to prevent spam and abuse
- **Logging**: All message operations and notifications logged with `requestId`, user IDs, and event type; no PII in logs beyond user ID
- **Testing**: Backend MUST include JUnit 5 tests for ChatController and NotificationService; integration tests for Socket.io event handling and booking event listeners; frontend MUST test chat UI, inbox list, and real-time message updates

### Key Entities *(include if feature involves data)*

- **Message**: Represents a single chat message with sender ID, receiver ID, content, creation timestamp, delivery status (pending/delivered/read), read timestamp, and soft-delete flag
- **Conversation**: Groups related messages between two users; tracks last message timestamp, unread count, and is_active flag
- **Notification**: Represents a system-generated notification (e.g., booking status change) with type, recipient user ID, content, delivery method (push/email), status (pending/sent/failed), and retry count
- **NotificationLog**: Audit trail of all notifications sent, including timestamp, method, recipient, content, and delivery status (for compliance and debugging)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Real-time messages are delivered and appear on recipient's screen within 1 second (P95 latency) on typical network conditions
- **SC-002**: Inbox loads and displays full conversation list within 2 seconds
- **SC-003**: Push notifications for booking status changes are delivered within 10 seconds of status change (P95)
- **SC-004**: Email notifications are sent within 60 seconds of trigger event (P95); no messages should fail to send after 3 retry attempts
- **SC-005**: System supports 500 concurrent active chat rooms (1000 concurrent users) without message delivery latency degradation above 2 seconds
- **SC-006**: Typing indicator appears within 500ms of user starting to type
- **SC-007**: Read receipts are delivered within 1 second of message being opened
- **SC-008**: 99% of messages are correctly persisted and delivered (no message loss)
- **SC-009**: Users can search their message history and see results within 2 seconds
- **SC-010**: Notification spam prevention (rate limiting) reduces abusive users' ability to overwhelm chat partners by >90%

## Clarifications

### Session 2026-05-19
- Q: Real-time Transport Technology (Socket.io vs Firebase) → A: Socket.io only (WebSocket-based, server-hosted, standard for Java Spring Boot apps; Firebase explicitly deferred to future versions)
- Q: Booking Status Change Event Integration → A: Booking module publishes booking status change events; Chat/Notification module subscribes and sends notifications (event-driven, loose coupling)
- Q: Push and Email Notification Infrastructure → A: Custom push notification queue (Redis/RabbitMQ) with in-house delivery logic + SMTP for email (full control, leverages existing infrastructure)
- Q: Message Content Encryption → A: Messages encrypted in transit only (TLS); stored as plain text in database (simplest for MVP, enables full-text search; encryption-at-rest deferred to future versions)

## Assumptions

- **Real-time technology**: Feature uses Socket.io for WebSocket communication; Firebase is not used in MVP (deferred to future versions for optional fallback/failover)
- **User authentication**: Users are already authenticated; chat system reuses JWT Bearer tokens from login module
- **Notification channels**: Push notifications use custom notification queue (Redis/RabbitMQ) with in-house delivery service; email uses SMTP server (leverages existing infrastructure for full control)
- **Conversation initiation**: Conversations are initiated from booking/task matching (not open direct messaging between arbitrary users for v1)
- **Data retention**: Messages are retained indefinitely for audit purposes; archive/deletion is deferred to future versions
- **User blocking**: Basic user block functionality is assumed to exist (implemented by User/Relationship module); chat respects block relationships
- **Offline message delivery**: Messages queued while user offline are delivered when user reconnects (via Socket.io reconnection) or via push notification
- **Notification preferences**: Users can enable/disable push notifications; email notifications are sent regardless (can be configured per notification type in future)
- **Chat history visibility**: Only the two parties in a conversation can view messages; no admin/support escalation for v1
- **Message encryption**: Messages are encrypted in transit (TLS) but stored as plain text in the database for MVP (enables full-text search and simplifies implementation); encryption-at-rest is deferred to future versions if compliance requires it
- **Database**: PostgreSQL used for persistent storage; Redis used for real-time session management, notification queueing, and message caching
- **Payment integration**: Notification events reference booking/payment status changes from other modules (Payment module handles actual payment processing)
- **Search indexing**: Message search uses full-text search in PostgreSQL; Elasticsearch is optional future enhancement for high-volume deployments
