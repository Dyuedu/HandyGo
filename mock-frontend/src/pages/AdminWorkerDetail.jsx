import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getWorkerById, toggleWorkerVerification, toggleWorkerStatus } from '../services/adminService'
import { loadSession } from '../state/authStore'
import '../styles/pages/AdminWorkerDetail.css'

// Helper function to detect file type
function getFileType(url) {
  if (!url) return null
  const lower = url.toLowerCase()
  if (/\.(jpg|jpeg|png|gif|webp)$/i.test(lower)) return 'image'
  if (/\.pdf$/i.test(lower)) return 'pdf'
  if (/\.(doc|docx)$/i.test(lower)) return 'word'
  return 'unknown'
}

function getFileExtension(url) {
  if (!url) return ''
  return url.split('.').pop().toUpperCase()
}

// Component to display PDF/Word with auth headers
function DocumentViewer({ url, fileType, fileExt }) {
  const [blobUrl, setBlobUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadDocument = async () => {
      try {
        setLoading(true)
        
        // Check if URL is external (Cloudinary, S3, etc) or internal API
        const isExternal = !url.includes('localhost') && !url.includes('127.0.0.1') && url.includes('cloudinary')
        
        console.log('Loading document:', { url, isExternal })
        
        const fetchOptions = {}
        
        // Only add auth headers for internal API URLs
        if (!isExternal) {
          const session = loadSession()
          if (session?.accessToken) {
            fetchOptions.headers = {
              'Authorization': `Bearer ${session.accessToken}`
            }
            console.log('Added auth headers for internal URL')
          }
        } else {
          console.log('External URL detected - loading without auth headers')
        }
        
        const response = await fetch(url, fetchOptions)
        
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status} ${response.statusText}`)
        }
        
        const blob = await response.blob()
        const objectUrl = URL.createObjectURL(blob)
        setBlobUrl(objectUrl)
        setError(null)
      } catch (err) {
        console.error('Document loading error:', err)
        setError(`Không thể tải tài liệu: ${err.message}`)
        setBlobUrl(null)
      } finally {
        setLoading(false)
      }
    }

    if (url) {
      loadDocument()
    }

    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl)
      }
    }
  }, [url, blobUrl])

  if (loading) {
    return <div className="certificate-loading">Đang tải tài liệu...</div>
  }

  if (error) {
    return (
      <div className="certificate-error">
        <p>{error}</p>
        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px', wordBreak: 'break-all' }}>
          URL: {url}
        </div>
        <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '12px' }}>
          Check browser console for detailed debugging information
        </p>
        <a 
          href={url}
          download
          className="btn-download-certificate"
          target="_blank"
          rel="noopener noreferrer"
        >
          ⬇ Tải xuống {fileExt} (Fallback)
        </a>
      </div>
    )
  }

  if (fileType === 'pdf') {
    return (
      <div className="certificate-viewer">
        <iframe 
          src={blobUrl} 
          title="Chứng chỉ chuyên môn"
          className="certificate-pdf"
        />
        <a 
          href={url}
          download
          className="btn-download-certificate"
          target="_blank"
          rel="noopener noreferrer"
        >
          ⬇ Tải xuống PDF
        </a>
      </div>
    )
  }

  return (
    <div className="certificate-document">
      <div className="document-icon">
        📄
      </div>
      <div className="document-info">
        <p className="document-name">Tài liệu Word ({fileExt})</p>
        <p className="document-note">Tải xuống để xem tài liệu Word</p>
      </div>
      <a 
        href={url}
        download
        className="btn-download-certificate"
        target="_blank"
        rel="noopener noreferrer"
      >
        ⬇ Tải xuống {fileExt}
      </a>
    </div>
  )
}

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
            {!worker.verified && (
              <button 
                className="btn-action btn-verify approve"
                onClick={() => verifyMutation.mutate()}
                disabled={verifyMutation.isPending}
              >
                Duyệt GPKD
              </button>
            )}
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
          <h2>Thông tin chung</h2>
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
          <h2>Thông tin công việc</h2>
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
              (() => {
                const fileType = getFileType(worker.professionalCertificateUrl)
                const fileExt = getFileExtension(worker.professionalCertificateUrl)

                if (fileType === 'image') {
                  return (
                    <img 
                      src={worker.professionalCertificateUrl} 
                      alt="Chứng chỉ chuyên môn" 
                      className="certificate-image" 
                    />
                  )
                } else if (fileType === 'pdf' || fileType === 'word') {
                  return (
                    <DocumentViewer 
                      url={worker.professionalCertificateUrl}
                      fileType={fileType}
                      fileExt={fileExt}
                    />
                  )
                } else {
                  return (
                    <div className="certificate-unknown">
                      <p>Định dạng tập tin không được hỗ trợ ({fileExt})</p>
                      <a 
                        href={worker.professionalCertificateUrl}
                        download
                        className="btn-download-certificate"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        ⬇ Tải xuống tệp
                      </a>
                    </div>
                  )
                }
              })()
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
