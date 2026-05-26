import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { getAllOpenJobPosts, getOpenJobPostsByJobType } from '../../services/jobPostService'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../i18n/LanguageContext'
import '../../styles/modules/jobpost.css'

function JobPostDiscovery() {
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const [selectedJobType, setSelectedJobType] = useState('')
  const locale = language === 'ko' ? 'ko-KR' : language === 'en' ? 'en-US' : 'vi-VN'

  const { data: jobPosts = [], isLoading, error } = useQuery({
    queryKey: ['openJobPosts', selectedJobType],
    queryFn: () => (selectedJobType ? getOpenJobPostsByJobType(selectedJobType) : getAllOpenJobPosts()),
  })

  const jobTypes = ['DIEN', 'NUOC', 'HARM', 'CLEAN']

  if (error) return <div className="jobpost-error">{t('jobpost.loadError', { message: error.message })}</div>

  return (
    <div className="jobpost-discovery">
      <div className="discovery-header">
        <h1>{t('jobpost.discovery.title')}</h1>
        <p>{t('jobpost.discovery.subtitle')}</p>
      </div>

      <div className="filter-section">
        <h3>{t('jobpost.discovery.filterTitle')}</h3>
        <div className="filter-buttons">
          <button className={`filter-btn ${selectedJobType === '' ? 'active' : ''}`} onClick={() => setSelectedJobType('')}>
            {t('jobpost.discovery.allJobs')}
          </button>
          {jobTypes.map((type) => (
            <button
              key={type}
              className={`filter-btn ${selectedJobType === type ? 'active' : ''}`}
              onClick={() => setSelectedJobType(type)}
            >
              {t(`jobpost.type.${type}`)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="loading-container">
          <p>{t('jobpost.discovery.loading')}</p>
        </div>
      ) : jobPosts.length === 0 ? (
        <div className="empty-state">
          <p>{t('jobpost.discovery.empty')}</p>
        </div>
      ) : (
        <div className="discovery-grid">
          {jobPosts.map((jobPost) => (
            <div key={jobPost.id} className="discovery-card" onClick={() => navigate(`/job-posts/${jobPost.id}`)}>
              <div className="card-header">
                <h3>{jobPost.title}</h3>
                <span className="job-type-badge">{t(`jobpost.type.${jobPost.jobType}`)}</span>
              </div>

              <p className="card-address">{jobPost.address}</p>
              <p className="card-description">{jobPost.description}</p>

              <div className="card-footer">
                <span className="created-date">{new Date(jobPost.createdAt).toLocaleDateString(locale)}</span>
                <button className="btn-view">{t('jobpost.action.viewDetail')}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default JobPostDiscovery
