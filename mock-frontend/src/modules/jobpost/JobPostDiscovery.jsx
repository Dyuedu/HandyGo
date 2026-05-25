import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { getAllOpenJobPosts, getOpenJobPostsByJobType } from '../../services/jobPostService'
import { useNavigate } from 'react-router-dom'
import '../../styles/modules/jobpost.css'

function JobPostDiscovery() {
  const navigate = useNavigate()
  const [selectedJobType, setSelectedJobType] = useState('')

  const { data: jobPosts = [], isLoading, error } = useQuery({
    queryKey: ['openJobPosts', selectedJobType],
    queryFn: () => {
      if (selectedJobType) {
        return getOpenJobPostsByJobType(selectedJobType)
      }
      return getAllOpenJobPosts()
    },
  })

  const jobTypes = ['DIEN', 'NUOC', 'HARM', 'CLEAN']

  if (error) return <div className="jobpost-error">Lỗi tải công việc: {error.message}</div>

  return (
    <div className="jobpost-discovery">
      <div className="discovery-header">
        <h1>Công việc khả dụng</h1>
        <p>Tìm và đăng ký công việc có sẵn trong khu vực của bạn</p>
      </div>

      <div className="filter-section">
        <h3>Lọc theo loại công việc</h3>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${selectedJobType === '' ? 'active' : ''}`}
            onClick={() => setSelectedJobType('')}
          >
            Tất cả công việc
          </button>
          {jobTypes.map((type) => {
            const jobTypeLabels = {
              'DIEN': 'Điện',
              'NUOC': 'Nước',
              'HARM': 'Sửa chữa',
              'CLEAN': 'Vệ sinh'
            }
            return (
              <button
                key={type}
                className={`filter-btn ${selectedJobType === type ? 'active' : ''}`}
                onClick={() => setSelectedJobType(type)}
              >
                {jobTypeLabels[type] || type}
              </button>
            )
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="loading-container">
          <p>Đang tải công việc khả dụng...</p>
        </div>
      ) : jobPosts.length === 0 ? (
        <div className="empty-state">
          <p>Hiện tại không có công việc nào. Hãy quay lại sau!</p>
        </div>
      ) : (
        <div className="discovery-grid">
          {jobPosts.map((jobPost) => (
            <div
              key={jobPost.id}
              className="discovery-card"
              onClick={() => navigate(`/job-posts/${jobPost.id}`)}
            >
              <div className="card-header">
                <h3>{jobPost.title}</h3>
                <span className="job-type-badge">{jobPost.jobType}</span>
              </div>

              <p className="card-address">{jobPost.address}</p>
              <p className="card-description">{jobPost.description}</p>

              <div className="card-footer">
                <span className="created-date">
                  {new Date(jobPost.createdAt).toLocaleDateString('vi-VN')}
                </span>
                <button className="btn-view">Xem chi tiết</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default JobPostDiscovery
