import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { getJobPostById } from '../../services/jobPostService'
import '../../styles/modules/jobpost.css'

function JobPostDetail() {
  const { jobPostId } = useParams()
  const navigate = useNavigate()
  const { data: jobPost, isLoading, error } = useQuery({
    queryKey: ['jobPost', jobPostId],
    queryFn: () => getJobPostById(jobPostId),
    enabled: !!jobPostId,
  })

  const handleContactCustomer = () => {
    const customerId = jobPost?.customer?.id
    const customerName = jobPost?.customer?.fullName || jobPost?.customer?.username || 'Khach hang'

    if (!customerId) {
      navigate('/app/chat')
      return
    }

    navigate(
      `/app/chat?contactId=${customerId}&name=${encodeURIComponent(customerName)}&role=CUSTOMER`
    )
  }

  if (isLoading) return <div className="jobpost-loading">Đang tải công việc...</div>
  if (error) return <div className="jobpost-error">Lỗi tải công việc: {error.message}</div>
  if (!jobPost) return <div className="jobpost-error">Không tìm thấy công việc</div>

  return (
    <div className="jobpost-detail">
      <div className="detail-container">
        <div className="detail-header">
          <h1>{jobPost.title}</h1>
          <span className={`status-badge status-${jobPost.status?.toLowerCase()}`}>
            {jobPost.status === 'OPEN' ? 'Mở' : 'Đóng'}
          </span>
        </div>

        <div className="detail-info">
          <div className="info-row">
            <label>Loại công việc:</label>
            <span>{jobPost.jobType}</span>
          </div>

          <div className="info-row">
            <label>Địa chỉ:</label>
            <span>{jobPost.address}</span>
          </div>

          <div className="info-row">
            <label>Vị trí:</label>
            <span>
              {jobPost.latitude.toFixed(6)}, {jobPost.longitude.toFixed(6)}
            </span>
          </div>

          <div className="info-row">
            <label>Tạo lúc:</label>
            <span>{new Date(jobPost.createdAt).toLocaleString('vi-VN')}</span>
          </div>
        </div>

        <div className="detail-description">
          <h2>Mô tả</h2>
          <p>{jobPost.description}</p>
        </div>

        <div className="detail-actions">
          <button className="btn-primary">Đăng ký công việc này</button>
          <button className="btn-secondary" onClick={handleContactCustomer}>Liên hệ khách hàng</button>
        </div>
      </div>
    </div>
  )
}

export default JobPostDetail

