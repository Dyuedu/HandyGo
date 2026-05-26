import axiosClient from '../api/axiosClient'

const JOBPOSTS_BASE = '/api/v1/job-posts'

/**
 * Create a new job post
 * @param {object} payload
 * @param {string} payload.title - Job post title
 * @param {string} payload.description - Job post description
 * @param {string} payload.jobType - Job type (e.g., DIEN, NUOC)
 * @param {string} payload.address - Job location address
 * @param {number} payload.latitude - Job location latitude
 * @param {number} payload.longitude - Job location longitude
 */
export function createJobPost(payload) {
  return axiosClient.post(JOBPOSTS_BASE, payload)
}

/**
 * Get all job posts created by the authenticated user
 */
export function getMyJobPosts() {
  return axiosClient.get(`${JOBPOSTS_BASE}/my-posts`)
}

/**
 * Get a specific job post created by the authenticated user
 * @param {string} jobPostId - UUID of the job post
 */
export function getMyJobPostById(jobPostId) {
  return axiosClient.get(`${JOBPOSTS_BASE}/my-posts/${jobPostId}`)
}

/**
 * Update a job post created by the authenticated user
 * @param {string} jobPostId - UUID of the job post
 * @param {object} payload - Partial update payload
 */
export function updateJobPost(jobPostId, payload) {
  return axiosClient.patch(`${JOBPOSTS_BASE}/${jobPostId}`, payload)
}

/**
 * Delete a job post created by the authenticated user
 * @param {string} jobPostId - UUID of the job post
 */
export function deleteJobPost(jobPostId) {
  return axiosClient.delete(`${JOBPOSTS_BASE}/${jobPostId}`)
}

/**
 * Get all open job posts for discovery
 * Public endpoint - no auth required
 */
export function getAllOpenJobPosts() {
  return axiosClient.get(`${JOBPOSTS_BASE}/discover/open`)
}

/**
 * Get open job posts filtered by job type
 * Public endpoint - no auth required
 * @param {string} jobType - Job type to filter by
 */
export function getOpenJobPostsByJobType(jobType) {
  return axiosClient.get(`${JOBPOSTS_BASE}/discover/by-type`, {
    params: { jobType }
  })
}

/**
 * Get a public view of a specific job post
 * Public endpoint - no auth required
 * @param {string} jobPostId - UUID of the job post
 */
export function getJobPostById(jobPostId) {
  return axiosClient.get(`${JOBPOSTS_BASE}/${jobPostId}`)
}

export function applyToJobPost(jobPostId, payload = {}) {
  return axiosClient.post(`${JOBPOSTS_BASE}/${jobPostId}/applications`, payload)
}

export function getMyApplicationForJobPost(jobPostId) {
  return axiosClient.get(`${JOBPOSTS_BASE}/${jobPostId}/applications/me`)
}

export function getJobPostApplications(jobPostId) {
  return axiosClient.get(`${JOBPOSTS_BASE}/${jobPostId}/applications`)
}

export function acceptJobApplication(jobPostId, applicationId) {
  return axiosClient.patch(`${JOBPOSTS_BASE}/${jobPostId}/applications/${applicationId}/accept`)
}

export function rejectJobApplication(jobPostId, applicationId) {
  return axiosClient.patch(`${JOBPOSTS_BASE}/${jobPostId}/applications/${applicationId}/reject`)
}
