import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { useLanguage } from '../../i18n/LanguageContext'
import { getJobPostById } from '../../services/jobPostService'
import '../../styles/modules/jobpost.css'

function JobPostDetail() {
  const { jobPostId } = useParams()
  const navigate = useNavigate()
  const { t, language } = useLanguage()

  const { data: jobPost, isLoading, error } = useQuery({
    queryKey: ['jobPost', jobPostId],
    queryFn: () => getJobPostById(jobPostId),
    enabled: !!jobPostId,
  })

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

  if (isLoading) return <div className="jobpost-loading">{t('jobpost.loading')}</div>
  if (error) return <div className="jobpost-error">{t('jobpost.loadError', { message: error.message })}</div>
  if (!jobPost) return <div className="jobpost-error">{t('jobpost.notFound')}</div>

  return (
    <div className="jobpost-detail">
      <div className="detail-container">
        <div className="detail-header">
          <h1>{jobPost.title}</h1>
          <span className={`status-badge status-${jobPost.status?.toLowerCase()}`}>
            {jobPost.status === 'OPEN' ? t('jobpost.status.open') : t('jobpost.status.closed')}
          </span>
        </div>

        <div className="detail-info">
          <div className="info-row">
            <label>{t('jobpost.field.jobType')}:</label>
            <span>{jobPost.jobType}</span>
          </div>

          <div className="info-row">
            <label>{t('jobpost.field.address')}:</label>
            <span>{jobPost.address}</span>
          </div>

          <div className="info-row">
            <label>{t('jobpost.field.location')}:</label>
            <span>
              {jobPost.latitude.toFixed(6)}, {jobPost.longitude.toFixed(6)}
            </span>
          </div>

          <div className="info-row">
            <label>{t('jobpost.field.createdAt')}:</label>
            <span>{new Date(jobPost.createdAt).toLocaleString(locale)}</span>
          </div>
        </div>

        <div className="detail-description">
          <h2>{t('jobpost.field.description')}</h2>
          <p>{jobPost.description}</p>
        </div>

        <div className="detail-actions">
          <button className="btn-primary">{t('jobpost.action.apply')}</button>
          <button className="btn-secondary" onClick={handleContactCustomer}>{t('jobpost.action.contactCustomer')}</button>
        </div>
      </div>
    </div>
  )
}

export default JobPostDetail
