import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getWorkers, toggleWorkerVerification, toggleWorkerStatus } from '../services/adminService'
import './AdminDashboard.css'

export function AdminDashboard() {
  const queryClient = useQueryClient()

  const { data: workers, isLoading, error } = useQuery({
    queryKey: ['admin-workers'],
    queryFn: getWorkers
  })

  const verifyMutation = useMutation({
    mutationFn: toggleWorkerVerification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-workers'] })
    }
  })

  const statusMutation = useMutation({
    mutationFn: toggleWorkerStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-workers'] })
    }
  })

  if (isLoading) {
    return <div className="admin-loading">Đang tải dữ liệu...</div>
  }

  if (error) {
    return <div className="admin-error">Lỗi khi tải dữ liệu: {error.message}</div>
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Quản lý Thợ (Workers)</h1>
        <p>Danh sách và trạng thái của tất cả thợ trên hệ thống.</p>
      </header>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên Đăng Nhập</th>
              <th>Họ Tên</th>
              <th>Số Điện Thoại</th>
              <th>Nghề Nghiệp</th>
              <th>Hạng</th>
              <th>Đánh Giá</th>
              <th>Xác Thực GPKD</th>
              <th>Trạng Thái Tài Khoản</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {workers?.map(worker => (
              <tr key={worker.id}>
                <td className="col-id" title={worker.id}>
                  <Link to={`/app/admin/workers/${worker.id}`} className="worker-detail-link">
                    {worker.id.substring(0, 8)}...
                  </Link>
                </td>
                <td>{worker.username}</td>
                <td>{worker.fullName || '-'}</td>
                <td>{worker.phone || '-'}</td>
                <td><span className="badge job-badge">{worker.jobType}</span></td>
                <td><span className="badge tier-badge">{worker.tierType}</span></td>
                <td>{worker.avgRating ? worker.avgRating.toFixed(1) + ' ⭐' : '-'}</td>
                <td>
                  <span className={`badge verify-badge ${worker.verified ? 'verified' : 'unverified'}`}>
                    {worker.verified ? 'Đã duyệt' : 'Chưa duyệt'}
                  </span>
                </td>
                <td>
                  <span className={`badge status-badge ${worker.status?.toLowerCase()}`}>
                    {worker.status === 'ACTIVE' ? 'Hoạt động' : worker.status === 'BLOCKED' ? 'Bị khóa' : worker.status}
                  </span>
                </td>
                <td className="actions-cell">
                  <Link to={`/app/admin/workers/${worker.id}`} className="btn-action btn-view">Xem chi tiết</Link>
                  <button 
                    className={`btn-action btn-verify ${worker.verified ? 'revoke' : 'approve'}`}
                    onClick={() => verifyMutation.mutate(worker.id)}
                    disabled={verifyMutation.isPending}
                  >
                    {worker.verified ? 'Hủy duyệt' : 'Duyệt GPKD'}
                  </button>
                  <button 
                    className={`btn-action btn-status ${worker.status === 'ACTIVE' ? 'block' : 'unblock'}`}
                    onClick={() => statusMutation.mutate(worker.id)}
                    disabled={statusMutation.isPending}
                  >
                    {worker.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}
                  </button>
                </td>
              </tr>
            ))}
            {(!workers || workers.length === 0) && (
              <tr>
                <td colSpan="10" className="empty-state">Không có dữ liệu thợ.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
