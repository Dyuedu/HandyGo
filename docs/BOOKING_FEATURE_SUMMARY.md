# Booking Feature Summary - Mock Project

**Date:** May 20, 2026  
**Status:** In Progress  
**Last Updated:** Current Session

---

## 📋 Table of Contents

1. [Feature Overview](#feature-overview)
2. [Completed Features](#completed-features)
3. [Missing Features (TODO)](#missing-features-todo)
4. [Technical Architecture](#technical-architecture)
5. [State Transition Diagram](#state-transition-diagram)
6. [API Endpoints](#api-endpoints)
7. [Frontend Components](#frontend-components)
8. [Database Schema](#database-schema)

---

## Feature Overview

### Purpose
The **Booking Feature** is the core transaction system that connects customers (users) with technicians (workers) to schedule and manage service tasks. It enables:
- Creation of service booking requests
- Status management throughout the booking lifecycle
- Discount/voucher application
- Customer confirmation workflows
- Integration with payment and notification systems

### Key Entities
- **Booking**: Main entity representing a service request
- **BookingStatusHistory**: Audit trail of status transitions
- **Customer** (UserProfile): Person requesting the service
- **Worker** (WorkerProfile): Technician/service provider
- **Voucher**: Discount codes applied at booking creation

---

## Completed Features

### ✅ Backend (Java/Spring Boot)

#### 1. **Booking Creation & Management**
- **Endpoint:** `POST /api/v1/bookings`
- **Features:**
  - Create new booking with customer, worker, address, and service code
  - Apply voucher discount at creation time
  - Automatic calculation of: total amount → discount → final amount
  - Precision handling: BigDecimal with HALF_UP rounding (4 decimal places)
  - Comprehensive validation:
    - User must have ROLE_USER to create booking
    - Worker must exist
    - Total amount must be positive
    - Voucher must be valid and applicable
  - Response: `201 CREATED` with full Booking object

#### 2. **Status Transition Management**
- **Status Flow:**
  ```
  PENDING → ACCEPTED/DECLINED/CANCELLED
  ACCEPTED → PROCESSING
  PROCESSING → WAITING_CUSTOMER_CONFIRMATION
  WAITING_CUSTOMER_CONFIRMATION → FINISHED
  Terminal states: FINISHED, DECLINED, CANCELLED
  ```
- **Validation:** `BookingStateTransitionValidator` enforces strict transitions
- **Response on invalid transition:** `409 CONFLICT` with error code `INVALID_BOOKING_TRANSITION`

#### 3. **Status Change Operations**
- **Accept Booking:** `PATCH /api/v1/bookings/{id}/accept` → PENDING → ACCEPTED
- **Decline Booking:** `PATCH /api/v1/bookings/{id}/decline` → PENDING → DECLINED
- **Start Processing:** `PATCH /api/v1/bookings/{id}/processing` → ACCEPTED → PROCESSING
- **Mark Completed:** `PATCH /api/v1/bookings/{id}/complete` → PROCESSING → WAITING_CUSTOMER_CONFIRMATION
- **Confirm Completion:** `PATCH /api/v1/bookings/{id}/confirm` → WAITING_CUSTOMER_CONFIRMATION → FINISHED

#### 4. **Booking Retrieval & Filtering**
- **List Bookings:** `GET /api/v1/bookings`
  - Query parameter: `status` (optional, repeatable for multiple statuses)
  - Returns list filtered by user's role (customer sees their bookings as customer, worker sees their bookings as technician)
  - Returns only bookings belonging to authenticated user
- **Get Detail:** `GET /api/v1/bookings/{id}` → Full booking object with related entities

#### 5. **Data Persistence**
- **Database Table:** `bookings` (PostgreSQL)
- **Audit Fields:**
  - `created_at`: Auto-populated at creation
  - `updated_at`: Auto-updated on any modification
  - `id`: UUID (auto-generated, searchable, non-sequential)
- **Stored Relationships:** Customer, Worker, Voucher relationships maintained
- **Transactional Integrity:** All operations are `@Transactional`

#### 6. **Status History Tracking**
- **Entity:** `BookingStatusHistory`
- **Tracking:** Each status change is recorded with:
  - Previous status
  - New status
  - Timestamp
  - Associated booking reference
- **Use Case:** Audit trail for dispute resolution and analytics

---

### ✅ Frontend (React/Vite)

#### 1. **Booking Service (API Client)**
- **File:** `src/services/bookingService.js`
- **Functions:**
  - `createBooking(payload)`: POST new booking
  - `getBookings(params)`: GET list with filtering
  - `getBookingById(bookingId)`: GET single booking detail
  - `acceptBooking(bookingId)`: Accept pending booking
  - `declineBooking(bookingId)`: Decline pending booking
  - `startProcessing(bookingId)`: Begin work
  - `markCompleted(bookingId)`: Technician marks work done
  - `confirmCompletion(bookingId)`: Customer confirms completion

#### 2. **React Query Hooks** (TanStack Query)
- **File:** `src/modules/booking/hooks/useBookingQueries.js`
- **Hooks Provided:**
  - `useBookings(params)`: Query for list (automatic refetch on params change)
  - `useBookingDetail(bookingId)`: Query for single booking (conditional fetch)
  - `useCreateBooking()`: Mutation for creation (auto-refetch list after success)
  - `useAcceptBooking()`: Mutation for accept
  - `useDeclineBooking()`: Mutation for decline
  - `useStartProcessing()`: Mutation to start work
  - `useMarkCompleted()`: Mutation to mark done
  - `useConfirmCompletion()`: Mutation for customer confirmation
- **Features:**
  - Automatic query key management
  - Cache invalidation on mutations
  - Error/loading states
  - Pagination-ready structure

#### 3. **Booking Activity Page**
- **File:** `src/modules/booking/pages/BookingActivityPage.jsx`
- **Features:**
  - Three-tab interface:
    - **Pending:** Shows PENDING status bookings
    - **Processing:** Shows ACCEPTED, PROCESSING, WAITING_CUSTOMER_CONFIRMATION
    - **Finished:** Shows FINISHED, DECLINED, CANCELLED
  - List view with:
    - Booking ID
    - Worker/Customer name (depends on role)
    - Address
    - Amount (formatted as Vietnamese Dong: ₫)
    - Status badge with color-coded styling
    - Link to detail page
  - Dynamic tab filtering based on role

#### 4. **Booking Detail Page**
- **File:** `src/modules/booking/pages/BookingDetailPage.jsx`
- **Features:**
  - Full booking information display
  - Role-based action buttons:
    - **Customer Actions:**
      - Accept/Decline booking (from PENDING)
      - Confirm completion (from WAITING_CUSTOMER_CONFIRMATION)
    - **Technician Actions:**
      - Accept/Decline booking (from PENDING)
      - Start processing (from ACCEPTED)
      - Mark completed (from PROCESSING)
  - Currency formatting (VND)
  - Modal confirmation for sensitive actions
  - Loading states and error handling
  - Related booking history/status updates (placeholder for future enhancement)

#### 5. **Customer Confirmation Modal**
- **File:** `src/modules/booking/components/CustomerConfirmationModal.jsx`
- **Purpose:** Modal dialog for customer to confirm work completion
- **Features:**
  - Triggered when technician marks work complete
  - "Confirm Completion" button → FINISHED state
  - Auto-refresh booking list after confirmation
  - Error handling and loading state

#### 6. **Styling**
- **File:** `src/modules/booking/pages/BookingPages.css`
- **Features:**
  - Responsive layout
  - Status badge styles (pending=yellow, processing=blue, finished=green)
  - Button styling consistent with project design
  - Mobile-friendly card layout

---

## Missing Features (TODO)

### 🚫 High Priority (P1) - Critical for MVP

#### 1. **Push Notifications on Booking Status Changes**
- **Spec Reference:** `specs/003-chat-realtime/spec.md` - User Story 3
- **Requirement:** When booking status changes, both customer and worker receive:
  - Push notification (if app installed/active)
  - Email notification
  - Deep link back to booking/chat
- **Why Missing:** Event-driven notification system not yet implemented
- **Implementation Needed:**
  - Add `BookingEventListener.java` to subscribe to booking.status_changed events
  - Integrate with notification service (Redis/RabbitMQ queue)
  - Configure email template engine (Thymeleaf or similar)
  - Add retry logic with exponential backoff
  - Add push notification provider integration (Firebase Cloud Messaging, etc.)

#### 2. **Email Notifications**
- **Requirement:** Booking confirmation, status change, completion notifications via email
- **Missing:**
  - Email configuration in `application.yaml` (SMTP settings)
  - Email templates for:
    - Booking created
    - Booking accepted/declined
    - Work started
    - Completion request
  - `NotificationService` integration with email provider
  - Async email sending (via RabbitMQ/Redis queue)
- **Implementation:** Add email sending logic to BookingService status change methods

#### 3. **Booking Cancellation by Customer**
- **Current State:** Only technician can decline; customer cannot explicitly cancel accepted bookings
- **Missing:**
  - New endpoint: `PATCH /api/v1/bookings/{id}/cancel` (customer only)
  - New status transition: ACCEPTED → CANCELLED (customer-initiated)
  - Business logic for handling in-progress cancellations
  - Refund logic integration
  - Notification to technician on cancellation

#### 4. **Booking Rescheduling**
- **Requirement:** Allow customer or technician to propose new date/time
- **Missing:**
  - `bookingDate` field currently stored but not used in creation
  - New entity: `BookingRescheduleRequest` with:
    - Original booking ID
    - Proposed date/time
    - Requestor type (CUSTOMER/WORKER)
    - Status (PENDING/ACCEPTED/REJECTED)
  - Endpoints:
    - `POST /api/v1/bookings/{id}/reschedule` - propose reschedule
    - `PATCH /api/v1/bookings/{id}/reschedule/{rescheduleId}/accept` - accept proposal
    - `PATCH /api/v1/bookings/{id}/reschedule/{rescheduleId}/reject` - reject proposal

#### 5. **Service Duration & Timeframe Validation**
- **Requirement:** Track estimated vs actual duration, prevent over-booking
- **Missing:**
  - Fields in Booking entity:
    - `estimated_duration_minutes` (int)
    - `actual_duration_minutes` (int, null until completed)
    - `scheduled_at` (LocalDateTime)
    - `started_at` (LocalDateTime, null until processing)
    - `completed_at` (LocalDateTime, null until finished)
  - Validation logic:
    - Prevent technician from accepting overlapping bookings
    - Warning if actual duration significantly exceeds estimate
  - Frontend: Display timeframe and duration estimate

#### 6. **Service Ratings & Reviews**
- **Requirement:** Customers rate technicians after booking completion
- **Missing:**
  - New entity: `BookingRating` with:
    - `booking_id` (FK)
    - `rating` (1-5 stars)
    - `comment` (text)
    - `rated_by` (customer_id)
    - `created_at`
  - Endpoints:
    - `POST /api/v1/bookings/{id}/rating` - create rating
    - `GET /api/v1/bookings/{id}/rating` - get rating
  - Validation: Only customer can rate, only after FINISHED status
  - Frontend: Rating component on BookingDetailPage after completion

---

### 🟡 Medium Priority (P2) - Important but not urgent

#### 1. **Booking Search & Advanced Filtering**
- **Current:** Only status filtering available
- **Missing:**
  - Date range filter: `from_date`, `to_date`
  - Amount range: `min_amount`, `max_amount`
  - Service type filter: `service_code`
  - Address search (text match)
  - Worker rating filter: `min_rating`
  - Sorting: By date, amount, status
  - Pagination metadata in response

#### 2. **Booking Edit After Creation**
- **Current:** No editing allowed after booking created
- **Missing:**
  - `PATCH /api/v1/bookings/{id}` to edit:
    - Address (only if PENDING)
    - Service code (only if PENDING)
    - Total amount (only if PENDING, triggers new voucher recalculation)
  - Validation: Only customer can edit, only in PENDING state
  - Frontend: Edit form modal on BookingDetailPage

#### 3. **Bulk Operations Dashboard** (Admin/Analytics)
- **Missing:**
  - `GET /api/v1/admin/bookings/stats` - Dashboard metrics:
    - Total bookings count (by status)
    - Revenue (total, by date range)
    - Average booking value
    - Completion rate
    - Top services
    - Top technicians
  - Admin-only endpoints
  - Time-based aggregation (daily, weekly, monthly)

#### 4. **Retry Logic for Failed Operations**
- **Current:** No automatic retry on transient failures
- **Missing:**
  - Implement idempotency keys for status transitions
  - Add retry scheduler for failed state changes (e.g., if payment fails)
  - Max retry count (e.g., 3 attempts)
  - Exponential backoff configuration

---

### 🔵 Low Priority (P3) - Nice to have

#### 1. **Booking Expiration**
- **Requirement:** Auto-expire PENDING bookings after X days
- **Missing:**
  - Configuration: `booking.pending.expiry_days` (default 7)
  - Scheduled job: `@Scheduled` task to move expired PENDING → CANCELLED
  - Notification: Email/push to customer on expiration

#### 2. **Booking Analytics for Workers**
- **Requirement:** Workers see their performance metrics
- **Missing:**
  - `GET /api/v1/bookings/my-stats` endpoint with:
    - Total bookings accepted/completed
    - Average rating
    - Earnings (if integrated with wallet)
    - Response rate
    - Completion time trend

#### 3. **Duplicate Booking Detection**
- **Requirement:** Warn if customer is about to book same service from same worker
- **Missing:**
  - Check logic on booking creation
  - Return warning in response (non-blocking)
  - Frontend: Modal alert to confirm

#### 4. **Booking History Export**
- **Requirement:** Download booking history as CSV/PDF
- **Missing:**
  - `GET /api/v1/bookings/export` endpoint
  - Format support: CSV, PDF
  - Date range filtering
  - Frontend: Export button on BookingActivityPage

---

## Technical Architecture

### Backend Stack
- **Framework:** Spring Boot 4.0.2
- **Database:** PostgreSQL
- **ORM:** Spring Data JPA + Hibernate
- **Validation:** Jakarta Bean Validation (formerly JSR-380)
- **Transaction Management:** Spring `@Transactional`
- **Build Tool:** Maven (with pom.xml)

### Frontend Stack
- **Framework:** React 19
- **Build Tool:** Vite 8
- **State Management:** TanStack React Query (formerly React Query)
- **HTTP Client:** Axios (via `axiosClient`)
- **Styling:** CSS3 (plain CSS, no frameworks)
- **Routing:** React Router

### Communication Pattern
```
Frontend (React)
    ↓ HTTP/HTTPS
Frontend Service Layer (bookingService.js)
    ↓ CORS-enabled
Backend API Controller (BookingController.java)
    ↓ Dependency Injection
Backend Service Layer (BookingServiceImpl.java)
    ↓ ORM/Transactions
Backend Repository (BookingRepository.java)
    ↓ SQL/JDBC
PostgreSQL Database
```

---

## State Transition Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    BOOKING LIFECYCLE                         │
└──────────────────────────────────────────────────────────────┘

                         ┌─────────────┐
                         │   PENDING   │ ← Initial state (createBooking)
                         └─────────────┘
                          │     │     │
                ┌─────────┘     │     └─────────┐
                │               │               │
                ▼               ▼               ▼
          ┌─────────────┐ ┌─────────────┐ ┌──────────────┐
          │  ACCEPTED   │ │  DECLINED   │ │  CANCELLED   │
          └─────────────┘ └─────────────┘ └──────────────┘
          (TERMINAL: ✓)   (TERMINAL: ✓)    (TERMINAL: ✓)
                │
                ▼
          ┌─────────────┐
          │ PROCESSING  │
          └─────────────┘
                │
                ▼
    ┌─────────────────────────────────┐
    │ WAITING_CUSTOMER_CONFIRMATION   │
    └─────────────────────────────────┘
                │
                ▼
          ┌─────────────┐
          │  FINISHED   │
          └─────────────┘
          (TERMINAL: ✓)

Legend:
  → : Valid transition
  (TERMINAL: ✓) : Final state (no outgoing transitions)
```

---

## API Endpoints

### Base URL
```
POST   /api/v1/bookings
GET    /api/v1/bookings
GET    /api/v1/bookings/{id}
PATCH  /api/v1/bookings/{id}/accept
PATCH  /api/v1/bookings/{id}/decline
PATCH  /api/v1/bookings/{id}/processing
PATCH  /api/v1/bookings/{id}/complete
PATCH  /api/v1/bookings/{id}/confirm
```

### Request/Response Examples

#### Create Booking
```bash
POST /api/v1/bookings
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "workerId": "550e8400-e29b-41d4-a716-446655440000",
  "serviceCode": "SERVICE_001",
  "address": "123 Main St, District 1, Ho Chi Minh City",
  "totalAmount": 500000,
  "voucherId": 1
}

Response (201 CREATED):
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "customer": { "id": "...", "name": "John Doe", ... },
  "worker": { "id": "...", "name": "Jane Smith", ... },
  "serviceCode": "SERVICE_001",
  "address": "123 Main St, District 1, Ho Chi Minh City",
  "status": "PENDING",
  "totalAmount": 500000.0000,
  "discountAmount": 50000.0000,
  "finalAmount": 450000.0000,
  "createdAt": "2026-05-20T10:30:00Z",
  "updatedAt": "2026-05-20T10:30:00Z"
}
```

#### List Bookings (with filtering)
```bash
GET /api/v1/bookings?status=PENDING&status=ACCEPTED
Authorization: Bearer <JWT_TOKEN>

Response (200 OK):
[
  {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "status": "PENDING",
    ...
  },
  ...
]
```

#### Invalid Transition
```bash
PATCH /api/v1/bookings/{id}/processing
(Booking is in PENDING state, not ACCEPTED)

Response (409 CONFLICT):
{
  "error": {
    "code": "INVALID_BOOKING_TRANSITION",
    "message": "Cannot transition booking from PENDING to PROCESSING"
  }
}
```

---

## Frontend Components

### File Structure
```
mock-frontend/src/modules/booking/
├── components/
│   └── CustomerConfirmationModal.jsx    ← Confirmation dialog
├── hooks/
│   ├── index.js
│   └── useBookingQueries.js            ← React Query hooks
└── pages/
    ├── BookingActivityPage.jsx         ← List view (tabbed)
    ├── BookingDetailPage.jsx           ← Detail view with actions
    └── BookingPages.css                ← Shared styles
```

### Component Props & Usage

#### BookingActivityPage
- **No props required**
- **Uses hooks:** `useBookings()`, `useAuth()`
- **Displays:** Tabbed interface with 3 tabs (Pending, Processing, Finished)

#### BookingDetailPage
- **URL params:** `bookingId` (from React Router)
- **Uses hooks:** `useBookingDetail()`, `useAuth()`, status mutation hooks
- **Displays:** Full booking details with role-based action buttons

#### CustomerConfirmationModal
- **Props:**
  - `open` (boolean) - Show/hide modal
  - `bookingId` (string UUID) - Booking to confirm
  - `onClose` (function) - Close handler
- **Uses hooks:** `useQueryClient()` (for cache invalidation)
- **Triggered by:** BookingDetailPage when customer needs to confirm

---

## Database Schema

### Bookings Table
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES user_profiles(id),
  worker_id UUID NOT NULL REFERENCES worker_profiles(id),
  service_code VARCHAR(100),
  booking_date TIMESTAMP,
  address TEXT,
  status VARCHAR(40) NOT NULL DEFAULT 'PENDING',
  total_amount NUMERIC(19,4) NOT NULL,
  discount_amount NUMERIC(19,4) NOT NULL DEFAULT 0,
  final_amount NUMERIC(19,4),
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_worker ON bookings(worker_id);
CREATE INDEX idx_bookings_status ON bookings(status);
```

### BookingStatusHistory Table
```sql
CREATE TABLE booking_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  previous_status VARCHAR(40),
  new_status VARCHAR(40) NOT NULL,
  changed_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_history_booking ON booking_status_history(booking_id);
```

---

## 🎯 Next Steps (Recommended Priority)

1. **P1 (This Sprint):**
   - Implement booking cancellation by customer
   - Add push notification system
   - Add email notifications on status changes

2. **P2 (Next Sprint):**
   - Implement booking ratings & reviews
   - Add advanced filtering (date range, amount range)
   - Implement booking edit for PENDING bookings

3. **P3 (Future):**
   - Analytics dashboard
   - Bulk operations
   - Export functionality
   - Rescheduling feature

---

## 📞 Related Documentation

- **Specs:** `specs/001-login-register/`, `specs/003-chat-realtime/`
- **API Contracts:** `specs/001-login-register/contracts/auth-api.md`
- **Constitution:** `docs/specs/CONSTITUTION.md`
- **Auth Flow:** `docs/AUTH_FLOW_SUMMARY.md`

---

**Prepared by:** GitHub Copilot  
**For:** Mock Project Development Team  
**Status:** Ready for Review & Implementation
