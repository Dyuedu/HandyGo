# Job Post Management Feature

## Overview

This feature allows users (customers) to create and manage their own job posts with full CRUD authorization. Only the owner of a job post can modify or delete it.

## Backend Implementation

### API Endpoints

#### Authenticated Endpoints (ROLE_USER required)

**Create Job Post**
- **POST** `/api/v1/job-posts`
- Creates a new job post for the authenticated user
- Request body:
  ```json
  {
    "title": "Fix leaking faucet",
    "description": "Kitchen faucet is leaking",
    "jobType": "NUOC",
    "address": "123 Main St, City",
    "latitude": 10.762622,
    "longitude": 106.660172
  }
  ```

**Get My Job Posts**
- **GET** `/api/v1/job-posts/my-posts`
- Returns all job posts created by the authenticated user

**Get My Job Post by ID**
- **GET** `/api/v1/job-posts/my-posts/{id}`
- Returns a specific job post owned by the authenticated user

**Update Job Post**
- **PATCH** `/api/v1/job-posts/{id}`
- Updates a job post owned by the authenticated user
- Partial updates allowed

**Delete Job Post**
- **DELETE** `/api/v1/job-posts/{id}`
- Deletes a job post owned by the authenticated user

#### Public Endpoints (No authentication required)

**Get All Open Job Posts**
- **GET** `/api/v1/job-posts/discover/open`
- Returns all open job posts

**Get Open Job Posts by Type**
- **GET** `/api/v1/job-posts/discover/by-type?jobType=DIEN`
- Returns open job posts filtered by job type

**Get Job Post by ID**
- **GET** `/api/v1/job-posts/{id}`
- Returns public view of a specific job post

## Frontend Components

### JobPostManagement
Location: `src/modules/jobpost/JobPostManagement.jsx`

Component for users to manage their own job posts. Features:
- View list of created job posts
- Create new job posts with form
- Edit existing job posts
- Delete job posts
- Real-time updates with React Query

### JobPostDiscovery
Location: `src/modules/jobpost/JobPostDiscovery.jsx`

Component for browsing available job posts. Features:
- View all open job posts
- Filter by job type (DIEN, NUOC, HARM, CLEAN)
- Click to view job details

### JobPostDetail
Location: `src/modules/jobpost/JobPostDetail.jsx`

Component to view detailed information about a job post. Features:
- Full job post details
- Location coordinates display
- Action buttons (Apply, Contact)

## Service Functions

Location: `src/services/jobPostService.js`

### Authenticated Functions
- `createJobPost(payload)` - Create a new job post
- `getMyJobPosts()` - Get all user's job posts
- `getMyJobPostById(jobPostId)` - Get a specific user's job post
- `updateJobPost(jobPostId, payload)` - Update user's job post
- `deleteJobPost(jobPostId)` - Delete user's job post

### Public Functions
- `getAllOpenJobPosts()` - Get all open job posts
- `getOpenJobPostsByJobType(jobType)` - Get open job posts by type
- `getJobPostById(jobPostId)` - Get a specific job post

## Authorization

### Backend Authorization Strategy
The backend uses a username-based authorization check:
1. Extract username from Spring Security's `Authentication` object
2. Load the Account entity from database
3. Verify user has ROLE_USER for creation
4. For updates/deletes, verify the job post owner by comparing customer ID

### Error Handling
- `ACCOUNT_NOT_FOUND` (401) - User not authenticated
- `PROFILE_NOT_FOUND` (404) - User profile not found
- `JOBPOST_NOT_FOUND` (404) - Job post not found
- `FORBIDDEN` (403) - User doesn't have permission to access resource

## Database Schema

### JobPost Entity
```
- id: UUID (Primary Key)
- customer_id: UUID (Foreign Key to UserProfile)
- title: String
- description: String
- jobType: String (DIEN, NUOC, HARM, CLEAN, etc.)
- address: String
- latitude: Double
- longitude: Double
- status: String (OPEN, CLOSED)
- created_at: LocalDateTime (auto-set)
```

## Integration Steps

### 1. Add Routes to Frontend
Update `src/routes/AppRoutes.jsx`:
```jsx
import { JobPostManagement, JobPostDetail, JobPostDiscovery } from '../modules/jobpost'

// Add to routes:
<Route path="/job-posts/manage" element={<PrivateRoute><JobPostManagement /></PrivateRoute>} />
<Route path="/job-posts/discover" element={<JobPostDiscovery />} />
<Route path="/job-posts/:jobPostId" element={<JobPostDetail />} />
```

### 2. Add Navigation Links
Update navigation/menu to include links to:
- Job post management page
- Job discovery page

## Job Types Supported
- `DIEN` - Electrical work
- `NUOC` - Plumbing/Water
- `HARM` - General repairs
- `CLEAN` - Cleaning services

## Future Enhancements
- Map view integration for job location visualization
- Application management (workers applying for jobs)
- Review/rating system for completed jobs
- Job post search with distance filtering
- Estimated completion time tracking
- Payment integration
