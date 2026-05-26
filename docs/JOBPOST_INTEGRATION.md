# Job Post Management Integration Guide

## Quick Start

This guide shows how to integrate the Job Post Management feature into your application.

## Backend Setup

### 1. Run Database Migration
Execute the migration to create the `job_posts` table:
```bash
psql -U your_user -d your_db -f mock-backend/mock/migrations/create_job_posts_table.sql
```

### 2. Verify Spring Boot Loads Components
The following classes are now available:
- **Repositories**: `JobPostRepository`
- **Services**: `JobPostService`, `JobPostServiceImpl`
- **Controllers**: `JobPostController`
- **DTOs**: `CreateJobPostRequest`, `UpdateJobPostRequest`

The Spring application will automatically scan and register these components.

## Frontend Setup

### 1. Update AppRoutes.jsx
Add the following imports at the top:
```jsx
import { JobPostManagement, JobPostDetail, JobPostDiscovery } from '../modules/jobpost'
```

Add the routes inside the `<PrivateRoute>` element:
```jsx
<Route element={<MainLayout />}>
  {/* ... existing routes ... */}
  
  {/* Job Post Routes */}
  <Route path="/app/job-posts/manage" element={<JobPostManagement />} />
  <Route path="/app/job-posts/discover" element={<JobPostDiscovery />} />
  <Route path="/app/job-posts/:jobPostId" element={<JobPostDetail />} />
</Route>
```

### 2. Add Navigation Menu Items
Update your navigation component to include links to:
- `/app/job-posts/manage` - Manage my job posts
- `/app/job-posts/discover` - Discover available jobs

Example:
```jsx
<nav>
  {/* ... existing nav items ... */}
  <Link to="/app/job-posts/manage">My Job Posts</Link>
  <Link to="/app/job-posts/discover">Available Jobs</Link>
</nav>
```

### 3. Verify Dependencies
Ensure these packages are in `package.json`:
- `@tanstack/react-query` - ✓ Already present
- `react-router-dom` - ✓ Already present
- `axios` - ✓ Already present

## Usage Examples

### Creating a Job Post
```javascript
import { createJobPost } from '../services/jobPostService'

const payload = {
  title: 'Fix leaking kitchen faucet',
  description: 'Kitchen faucet is leaking and needs repair',
  jobType: 'NUOC',
  address: '123 Main St, Ho Chi Minh City',
  latitude: 10.762622,
  longitude: 106.660172
}

const response = await createJobPost(payload)
```

### Fetching User's Job Posts
```javascript
import { getMyJobPosts } from '../services/jobPostService'

const jobPosts = await getMyJobPosts()
```

### Updating a Job Post
```javascript
import { updateJobPost } from '../services/jobPostService'

const update = {
  title: 'Updated title',
  status: 'CLOSED'
}

const response = await updateJobPost(jobPostId, update)
```

### Deleting a Job Post
```javascript
import { deleteJobPost } from '../services/jobPostService'

await deleteJobPost(jobPostId)
```

### Discovering Available Jobs
```javascript
import { getAllOpenJobPosts, getOpenJobPostsByJobType } from '../services/jobPostService'

// Get all open jobs
const allJobs = await getAllOpenJobPosts()

// Get jobs by type
const electricalJobs = await getOpenJobPostsByJobType('DIEN')
```

## API Endpoints Reference

### Authenticated Endpoints (Require ROLE_USER)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/job-posts` | Create a new job post |
| GET | `/api/v1/job-posts/my-posts` | Get all user's job posts |
| GET | `/api/v1/job-posts/my-posts/{id}` | Get specific user's job post |
| PATCH | `/api/v1/job-posts/{id}` | Update user's job post |
| DELETE | `/api/v1/job-posts/{id}` | Delete user's job post |

### Public Endpoints (No Authentication Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/job-posts/discover/open` | Get all open job posts |
| GET | `/api/v1/job-posts/discover/by-type?jobType=DIEN` | Get open jobs by type |
| GET | `/api/v1/job-posts/{id}` | Get specific job post |

## Authorization Rules

1. **Create Job Post**: User must have ROLE_USER
2. **View Own Job Posts**: User must be the owner (customer)
3. **Update Job Post**: User must be the owner
4. **Delete Job Post**: User must be the owner
5. **View Public Jobs**: No authentication required
6. **View Job Details**: No authentication required

## Supported Job Types

- `DIEN` - Electrical work
- `NUOC` - Plumbing/Water services
- `HARM` - General repairs
- `CLEAN` - Cleaning services

## File Structure

```
mock-backend/
└── src/main/java/com/group/mock/
    ├── controller/
    │   └── JobPostController.java
    ├── entity/
    │   ├── JobPost.java
    │   └── DTO/request/
    │       ├── CreateJobPostRequest.java
    │       └── UpdateJobPostRequest.java
    ├── repository/
    │   └── JobPostRepository.java
    └── service/
        ├── JobPostService.java
        └── Impl/
            └── JobPostServiceImpl.java

mock-frontend/
├── src/
│   ├── modules/jobpost/
│   │   ├── JobPostManagement.jsx
│   │   ├── JobPostDetail.jsx
│   │   ├── JobPostDiscovery.jsx
│   │   └── index.js
│   ├── services/
│   │   └── jobPostService.js
│   └── styles/modules/
│       └── jobpost.css

migrations/
└── create_job_posts_table.sql
```

## Testing

### Manual Testing Steps

1. **Create Job Post**
   - Navigate to `/app/job-posts/manage`
   - Click "Create New Job Post"
   - Fill in all required fields
   - Click "Create Job Post"
   - Verify the job post appears in the list

2. **Edit Job Post**
   - Click "Edit" on an existing job post
   - Modify the details
   - Click "Update Job Post"
   - Verify changes are saved

3. **Delete Job Post**
   - Click "Delete" on a job post
   - Confirm deletion
   - Verify job post is removed from list

4. **Discover Jobs**
   - Navigate to `/app/job-posts/discover`
   - Verify all open jobs are displayed
   - Test filtering by job type
   - Click on a job to view details

### API Testing with cURL

```bash
# Create a job post
curl -X POST http://localhost:8080/api/v1/job-posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fix leaking faucet",
    "description": "Kitchen faucet is leaking",
    "jobType": "NUOC",
    "address": "123 Main St",
    "latitude": 10.762622,
    "longitude": 106.660172
  }'

# Get all open jobs
curl http://localhost:8080/api/v1/job-posts/discover/open

# Get jobs by type
curl http://localhost:8080/api/v1/job-posts/discover/by-type?jobType=DIEN
```

## Troubleshooting

### "Unauthorized" Error (401)
- Ensure you're logged in as a user with ROLE_USER
- Check that your access token is valid
- Verify the Authorization header is being sent

### "Forbidden" Error (403)
- You're trying to access or modify a job post you don't own
- Only the job post owner can edit or delete it

### "Job Post Not Found" (404)
- The job post ID might be incorrect
- The job post may have been deleted
- Verify you're using the correct UUID format

### Database Table Not Created
- Ensure the migration SQL was executed
- Check database connection settings
- Verify user has permissions to create tables

## Performance Considerations

1. **Indexes Created**:
   - `customer_id` - For quick user lookups
   - `status` - For filtering open/closed jobs
   - `job_type` - For job type filtering
   - `created_at` - For sorting by creation date

2. **Query Optimization**:
   - Uses readOnly transactions for GET operations
   - Lazy loading for relationships to reduce N+1 queries
   - Pagination recommended for large result sets (future enhancement)

## Future Enhancements

- [ ] Pagination for large job post lists
- [ ] Full-text search for job descriptions
- [ ] Map view with location clustering
- [ ] Advanced filtering (radius, price range, etc.)
- [ ] Job post categories/tags
- [ ] Application tracking for job posts
- [ ] Reviews and ratings for completed jobs
- [ ] Estimated budget calculator
- [ ] Job post templates for common job types
