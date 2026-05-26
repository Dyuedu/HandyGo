import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useLanguage } from '../../i18n/LanguageContext'
import {
  applyToJobPost,
  getJobPostById,
  getMyApplicationForJobPost,
} from '../../services/jobPostService'
import JobPostRouteMap from './JobPostRouteMap'
import { formatBookingDateTime, resolveJobPostApplyError } from './utils/jobPostSchedule'
import '../../styles/modules/jobpost.css'

function JobPostDetail() {
  const { jobPostId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { mode } = useAuth()
  const { t, language } = useLanguage()
  const isTechnician = mode === 'TECHNICIAN'
  const [showRouteMap, setShowRouteMap] = useState(false)

  const { data: jobPost, isLoading, error } = useQuery({
    queryKey: ['jobPost', jobPostId],
    queryFn: () => getJobPostById(jobPostId),
    enabled: !!jobPostId,
  })

  const { data: myApplication } = useQuery({
    queryKey: ['myJobApplication', jobPostId],
    queryFn: async () => {
      try {
        return await getMyApplicationForJobPost(jobPostId)
      } catch (err) {
        if (err?.status === 204) return null
        throw err
      }
    },
    enabled: !!jobPostId && isTechnician,
    retry: false,
  })

  const applyMutation = useMutation({
    mutationFn: () => applyToJobPost(jobPostId, {}),
    onSuccess: () => {
      queryClient.invalidateQueries(['myJobApplication', jobPostId])
    },
  })

  const applyErrorMessage = applyMutation.isError
    ? resolveJobPostApplyError(applyMutation.error, t)
    : ''

  const handleContactCustomer = () => {
    const customerId = jobPost?.customer?.id
    const customerName = jobPost?.customer?.fullName || jobPost?.customer?.username || t('chat.newUser')

    if (!customerId) {
      navigate('/app/chat')
      return
    }

    navigate(
      `/app/chat?contactId=${customerId}&name=${encodeURIComponent(customerName)}&role=CUSTOMER`
    )
  }

  const locale = language === 'ko' ? 'ko-KR' : language === 'en' ? 'en-US' : 'vi-VN'
  const isOpen = jobPost?.status === 'OPEN'
  const hasApplied = !!myApplication
  const applicationStatus = myApplication?.status

  if (isLoading) return <div className="jobpost-loading">{t('jobpost.loading')}</div>
  if (error) return <div className="jobpost-error">{t('jobpost.loadError', { message: error.message })}</div>
  if (!jobPost) return <div className="jobpost-error">{t('jobpost.notFound')}</div>

  return (
    <div className="jobpost-detail">
      <div className="detail-container">
        <div className="detail-header">
          <h1>{jobPost.title}</h1>
          <span className={`status-badge status-${jobPost.status?.toLowerCase()}`}>
            {jobPost.status === 'OPEN'
              ? t('jobpost.status.open')
              : jobPost.status === 'ASSIGNED'
                ? t('jobpost.status.assigned')
                : jobPost.status === 'CANCELLED'
                  ? t('jobpost.status.cancelled')
                  : t('jobpost.status.closed')}
          </span>
        </div>

        <div className="detail-info">
          <div className="info-row">
            <label>{t('jobpost.field.jobType')}:</label>
            <span>{t(`jobpost.type.${jobPost.jobType}`) || jobPost.jobType}</span>
          </div>

          <div className="info-row">
            <label>{t('jobpost.field.scheduledAt')}:</label>
            <span>{formatBookingDateTime(jobPost.scheduledAt, locale)}</span>
          </div>

          <div className="info-row">
            <label>{t('jobpost.field.address')}:</label>
            {isTechnician && jobPost.latitude && jobPost.longitude ? (
              <button
                type="button"
                className="btn-location-link"
                onClick={() => setShowRouteMap(true)}
              >
                {jobPost.address}
              </button>
            ) : (
              <span>{jobPost.address}</span>
            )}
          </div>

          {isTechnician && jobPost.latitude && jobPost.longitude && (
            <div className="info-row">
              <label>{t('jobpost.field.location')}:</label>
              <button type="button" className="btn-location-link" onClick={() => setShowRouteMap(true)}>
                {t('jobpost.route.viewOnMap')}
              </button>
            </div>
          )}

          <div className="info-row">
            <label>{t('jobpost.field.createdAt')}:</label>
            <span>{new Date(jobPost.createdAt).toLocaleString(locale)}</span>
          </div>
        </div>

        <div className="detail-description">
          <h2>{t('jobpost.field.description')}</h2>
          <p>{jobPost.description}</p>
        </div>

        {isTechnician && (
          <div className="detail-actions">
            {hasApplied ? (
              <p className="jobpost-application-status">
                {t('jobpost.application.registered')}:{' '}
                <strong>
                  {applicationStatus === 'PENDING' && t('jobpost.application.status.pending')}
                  {applicationStatus === 'ACCEPTED' && t('jobpost.application.status.accepted')}
                  {applicationStatus === 'REJECTED' && t('jobpost.application.status.rejected')}
                </strong>
              </p>
            ) : (
              <button
                type="button"
                className="btn-primary"
                disabled={!isOpen || applyMutation.isPending}
                onClick={() => applyMutation.mutate()}
              >
                {applyMutation.isPending
                  ? t('jobpost.application.applying')
                  : t('jobpost.action.apply')}
              </button>
            )}
            {applyErrorMessage && (
              <p className="jobpost-error-inline">{applyErrorMessage}</p>
            )}
            <button type="button" className="btn-secondary" onClick={handleContactCustomer}>
              {t('jobpost.action.contactCustomer')}
            </button>
          </div>
        )}
      </div>

      {isTechnician && (
        <JobPostRouteMap
          open={showRouteMap}
          onClose={() => setShowRouteMap(false)}
          destLat={jobPost.latitude}
          destLng={jobPost.longitude}
          destLabel={jobPost.address}
        />
      )}
    </div>
  )
}

export default JobPostDetail
