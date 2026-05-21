import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { getWorkerById, toggleWorkerVerification, toggleWorkerStatus } from '../services/adminService'
import '../styles/pages/AdminWorkerDetail.css'

export function AdminWorkerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: worker, isLoading, error } = useQuery({
    queryKey: ['admin-worker', id],
    queryFn: () => getWorkerById(id)
  })

  const verifyMutation = useMutation({
    mutationFn: () => toggleWorkerVerification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-worker', id] })
      queryClient.invalidateQueries({ queryKey: ['admin-workers'] })
    }
  })

  const statusMutation = useMutation({
    mutationFn: () => toggleWorkerStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-worker', id] })
      queryClient.invalidateQueries({ queryKey: ['admin-workers'] })
    }
  })

  if (isLoading) {
    return <div className="admin-loading">Đang tải thông tin thợ...</div>
  }

  if (error || !worker) {
    return <div className="admin-error">Lỗi khi tải thông tin: {error?.message || 'Không tìm thấy thợ'}</div>
  }

  return (
    <div className="admin-detail-container">
      <div className="admin-detail-header">
        <button className="btn-back" onClick={() => navigate('/app/admin/workers')}>
          ← Quay lại danh sách
        </button>
        <div className="header-title-actions">
          <h1>Hồ sơ thợ: {worker.fullName || worker.username}</h1>
          <div className="detail-actions">
            <button 
              className={`btn-action btn-verify ${worker.verified ? 'revoke' : 'approve'}`}
              onClick={() => verifyMutation.mutate()}
              disabled={verifyMutation.isPending}
            >
              {worker.verified ? 'Hủy duyệt GPKD' : 'Duyệt GPKD'}
            </button>
            <button 
              className={`btn-action btn-status ${worker.status === 'ACTIVE' ? 'block' : 'unblock'}`}
              onClick={() => statusMutation.mutate()}
              disabled={statusMutation.isPending}
            >
              {worker.status === 'ACTIVE' ? 'Khóa Tài Khoản' : 'Mở Khóa Tài Khoản'}
            </button>
          </div>
        </div>
      </div>

      <div className="admin-detail-content">
        <div className="detail-card">
          <h2>Thông tin chung (Account & Profile)</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">ID Thợ</span>
              <span className="info-value">{worker.id}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Tên đăng nhập</span>
              <span className="info-value">{worker.username}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Họ tên đầy đủ</span>
              <span className="info-value">{worker.fullName || '-'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Số điện thoại</span>
              <span className="info-value">{worker.phone || '-'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Ngày tạo tài khoản</span>
              <span className="info-value">
                {worker.createdAt ? new Date(worker.createdAt).toLocaleString('vi-VN') : '-'}
              </span>
            </div>
          </div>
        </div>

        <div className="detail-card">
          <h2>Thông tin công việc (Worker Profile)</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Loại công việc</span>
              <span className="info-value badge job-badge">{worker.jobType}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Hạng thành viên</span>
              <span className="info-value badge tier-badge">{worker.tierType}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Đánh giá trung bình</span>
              <span className="info-value">{worker.avgRating ? `${worker.avgRating.toFixed(1)} ⭐` : 'Chưa có'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Trạng thái GPKD</span>
              <span className={`info-value badge verify-badge ${worker.verified ? 'verified' : 'unverified'}`}>
                {worker.verified ? 'Đã duyệt' : 'Chưa duyệt'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Trạng thái tài khoản</span>
              <span className={`info-value badge status-badge ${worker.status?.toLowerCase()}`}>
                {worker.status === 'ACTIVE' ? 'Hoạt động' : worker.status === 'BLOCKED' ? 'Bị khóa' : worker.status}
              </span>
            </div>
          </div>
        </div>

        <div className="detail-card full-width">
          <h2>Giấy phép kinh doanh (Chứng chỉ)</h2>
          <div className="certificate-container">
            {worker.professionalCertificateUrl ? (
              <img 
                src={worker.professionalCertificateUrl} 
                alt="Chứng chỉ chuyên môn" 
                className="certificate-image" 
              />
            ) : (
              <div className="certificate-empty">
                Chưa cập nhật hình ảnh GPKD/Chứng chỉ.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
