import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLanguage } from '../../i18n/LanguageContext'
import {
  acceptJobApplication,
  getJobPostApplications,
  getMyJobPostById,
  rejectJobApplication,
} from '../../services/jobPostService'
import '../../styles/modules/jobpost.css'

function JobPostApplicants() {
  const { jobPostId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useLanguage()
  const applicantsReturnPath = `/app/job-posts/${jobPostId}/applicants`

  const { data: jobPost } = useQuery({
    queryKey: ['myJobPost', jobPostId],
    queryFn: () => getMyJobPostById(jobPostId),
    enabled: !!jobPostId,
  })

  const { data: applications = [], isLoading, error } = useQuery({
    queryKey: ['jobPostApplications', jobPostId],
    queryFn: () => getJobPostApplications(jobPostId),
    enabled: !!jobPostId,
  })

  const acceptMutation = useMutation({
    mutationFn: (applicationId) => acceptJobApplication(jobPostId, applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries(['jobPostApplications', jobPostId])
      queryClient.invalidateQueries(['myJobPosts'])
      queryClient.invalidateQueries(['myJobPost', jobPostId])
      queryClient.invalidateQueries(['bookings'])
      navigate('/app/activity')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (applicationId) => rejectJobApplication(jobPostId, applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries(['jobPostApplications', jobPostId])
    },
  })

  const pending = applications.filter((a) => a.status === 'PENDING')
  const others = applications.filter((a) => a.status !== 'PENDING')

  const statusLabel = (status) => {
    switch (status) {
      case 'PENDING': return t('jobpost.application.status.pending')
      case 'ACCEPTED': return t('jobpost.application.status.accepted')
      case 'REJECTED': return t('jobpost.application.status.rejected')
      default: return status
    }
  }

  if (isLoading) return <div className="jobpost-loading">{t('jobpost.loading')}</div>
  if (error) return <div className="jobpost-error">{t('jobpost.loadError', { message: error.message })}</div>

  return (
    <div className="jobpost-applicants">
      <Link to="/app/job-posts/manage" className="jobpost-back-link">
        ← {t('jobpost.applicants.back')}
      </Link>

      <div className="jobpost-applicants-header">
        <h1>{t('jobpost.applicants.title')}</h1>
        {jobPost && <p className="jobpost-applicants-subtitle">{jobPost.title}</p>}
      </div>

      {applications.length === 0 ? (
        <p className="jobpost-muted">{t('jobpost.applicants.empty')}</p>
      ) : (
        <>
          {pending.length > 0 && (
            <section className="jobpost-applicants-section">
              <h2>{t('jobpost.applicants.pending')} ({pending.length})</h2>
              <div className="jobpost-applicants-list">
                {pending.map((app) => (
                  <article key={app.id} className="jobpost-applicant-card">
                    <div className="jobpost-applicant-info">
                      <h3>{app.workerName}</h3>
                      <p>{app.workerPhone || t('jobpost.applicants.noPhone')}</p>
                      <p className="jobpost-applicant-meta">
                        {t(`jobpost.type.${app.jobType}`)} · ★ {app.avgRating?.toFixed(1) ?? '0.0'}
                      </p>
                      {app.message && <p className="jobpost-applicant-message">"{app.message}"</p>}
                    </div>
                    <div className="jobpost-applicant-actions">
                      <Link
                        to={`/app/worker/${app.workerId}`}
                        state={{ from: applicantsReturnPath, returnLabel: t('jobpost.applicants.back') }}
                        className="btn-view-profile"
                      >
                        {t('jobpost.applicants.viewProfile')}
                      </Link>
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={acceptMutation.isPending || jobPost?.status !== 'OPEN'}
                        onClick={() => acceptMutation.mutate(app.id)}
                      >
                        {t('jobpost.applicants.accept')}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={rejectMutation.isPending}
                        onClick={() => rejectMutation.mutate(app.id)}
                      >
                        {t('jobpost.applicants.reject')}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {others.length > 0 && (
            <section className="jobpost-applicants-section">
              <h2>{t('jobpost.applicants.history')}</h2>
              <div className="jobpost-applicants-list">
                {others.map((app) => (
                  <article key={app.id} className="jobpost-applicant-card muted">
                    <div>
                      <h3>{app.workerName}</h3>
                      <span className={`application-status status-${app.status?.toLowerCase()}`}>
                        {statusLabel(app.status)}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

export default JobPostApplicants
