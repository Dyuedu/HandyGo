import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getMyProfile, updateMyProfile, updateMyWorkerProfile } from '../services/profileService'
import { AppIcon } from '../components/AppIcon'
import '../styles/pages/ProfilePage.css'

const JOB_OPTIONS = [
  { value: 'DIEN', label: 'Thợ Điện' },
  { value: 'NUOC', label: 'Thợ Nước' },
  { value: 'DIEU_HOA', label: 'Thợ Điều hòa' },
  { value: 'SUA_XE', label: 'Thợ Sửa xe' },
  { value: 'XAY_DUNG', label: 'Thợ Xây dựng' },
  { value: 'DON_DEP', label: 'Dọn dẹp' },
]

function translateJobType(job) {
  if (!job) return '—'
  const found = JOB_OPTIONS.find((o) => o.value === job.trim().toUpperCase())
  return found ? found.label : job
}

function translateTier(tier) {
  switch (tier) {
    case 'BASIC': return 'Cơ bản'
    case 'PRO': return 'Chuyên nghiệp'
    case 'FREE':
    default: return 'Miễn phí'
  }
}

function verificationLabel(status, verified) {
  if (verified || status === 'VERIFIED') {
    return { text: 'Đã xác minh', className: 'verified' }
  }
  return { text: 'Chờ duyệt chứng chỉ', className: 'pending' }
}

function resolveProfileError(err) {
  const error = err?.payload?.error
  const details = error?.details
  if (details && typeof details === 'object') {
    const first = Object.values(details).find(Boolean)
    if (first) return first
  }
  const byCode = {
    PHONE_EXISTS: 'Số điện thoại đã được sử dụng.',
    VALIDATION_FAILED: 'Vui lòng kiểm tra lại thông tin.',
    FORBIDDEN: 'Bạn không có quyền thực hiện thao tác này.',
  }
  if (error?.code && byCode[error.code]) return byCode[error.code]
  return err?.message || 'Không thể lưu hồ sơ. Vui lòng thử lại.'
}

export function ProfilePage() {
  const { mode, session } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editing, setEditing] = useState(false)

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [jobType, setJobType] = useState('DIEN')
  const [certificateFile, setCertificateFile] = useState(null)

  const isTechnician = mode === 'TECHNICIAN'
  const isAdmin = mode === 'ADMIN'

  useEffect(() => {
    if (isAdmin) {
      setLoading(false)
      return
    }
    loadProfile()
  }, [isAdmin])

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getMyProfile()
      setProfile(data)
      setFullName(data.fullName || '')
      setPhone(data.phone || '')
      setJobType(data.worker?.jobType || 'DIEN')
    } catch (err) {
      setError(resolveProfileError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setFullName(profile?.fullName || '')
    setPhone(profile?.phone || '')
    setJobType(profile?.worker?.jobType || 'DIEN')
    setCertificateFile(null)
    setEditing(false)
    setError('')
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      await updateMyProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || '',
      })

      if (isTechnician && profile?.worker) {
        const formData = new FormData()
        formData.append('jobType', jobType)
        if (certificateFile) {
          formData.append('professionalCertificate', certificateFile)
        }
        const updated = await updateMyWorkerProfile(formData)
        setProfile(updated)
        setCertificateFile(null)
      } else {
        const updated = await getMyProfile()
        setProfile(updated)
      }

      setSuccess('Đã cập nhật hồ sơ thành công.')
      setEditing(false)
    } catch (err) {
      setError(resolveProfileError(err))
    } finally {
      setSaving(false)
    }
  }

  if (isAdmin) {
    return (
      <section className="profile-page">
        <div className="profile-hero">
          <h1>Hồ sơ quản trị</h1>
          <p>Tài khoản: {session?.username || '—'}</p>
        </div>
        <p className="profile-muted">Quản trị viên quản lý thợ tại mục Quản lý thợ.</p>
        <Link to="/app/admin/workers" className="profile-link-btn">Mở quản lý thợ</Link>
      </section>
    )
  }

  if (loading) {
    return (
      <section className="profile-page">
        <p className="profile-muted">Đang tải hồ sơ…</p>
      </section>
    )
  }

  const worker = profile?.worker
  const verification = verificationLabel(worker?.verificationStatus, worker?.verified)

  return (
    <section className="profile-page">
      <div className="profile-hero">
        <h1>{isTechnician ? 'Hồ sơ thợ' : 'Hồ sơ cá nhân'}</h1>
        <p>Quản lý thông tin hiển thị với khách hàng và trên bản đồ.</p>
      </div>

      {error && <div className="profile-alert error" role="alert">{error}</div>}
      {success && <div className="profile-alert success" role="status">{success}</div>}

      {editing ? (
        <form id="profile-edit-form" className="profile-grid" onSubmit={handleSave}>
          <article className="profile-card">
            <h2>Thông tin chung</h2>
            <div className="profile-form">
              <label>
                <span>Tên đăng nhập</span>
                <input type="text" value={profile?.username || ''} disabled />
              </label>
              <label>
                <span>Họ tên</span>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </label>
              <label>
                <span>Số điện thoại</span>
                <input
                  type="tel"
                  placeholder="0xxxxxxxxx hoặc +84..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </label>
            </div>
          </article>

          {isTechnician && worker && (
            <article className="profile-card">
              <h2>Thông tin thợ</h2>
              <dl className="profile-dl">
                <div>
                  <dt>Xác minh</dt>
                  <dd>
                    <span className={`profile-badge ${verification.className}`}>{verification.text}</span>
                  </dd>
                </div>
                <div><dt>Gói cước</dt><dd>{translateTier(worker.tierType)}</dd></div>
                <div>
                  <dt>Đánh giá TB</dt>
                  <dd>{worker.avgRating != null ? Number(worker.avgRating).toFixed(1) : '—'} ★</dd>
                </div>
              </dl>
              <div className="profile-worker-edit">
                <label>
                  <span>Loại công việc</span>
                  <select value={jobType} onChange={(e) => setJobType(e.target.value)}>
                    {JOB_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Cập nhật chứng chỉ (tùy chọn)</span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                  />
                  <small className="profile-hint">
                    Tải chứng chỉ mới sẽ đưa trạng thái về chờ duyệt lại.
                  </small>
                </label>
              </div>
            </article>
          )}
        </form>
      ) : (
        <div className="profile-grid">
          <article className="profile-card">
            <div className="profile-card-head">
              <h2>Thông tin chung</h2>
              <button type="button" className="profile-edit-btn" onClick={() => setEditing(true)}>
                Chỉnh sửa
              </button>
            </div>
            <dl className="profile-dl">
              <div><dt>Tên đăng nhập</dt><dd>{profile?.username || '—'}</dd></div>
              <div><dt>Họ tên</dt><dd>{profile?.fullName || '—'}</dd></div>
              <div><dt>Số điện thoại</dt><dd>{profile?.phone || '—'}</dd></div>
              <div><dt>Vai trò</dt><dd>{profile?.role === 'WORKER' ? 'Thợ' : 'Khách hàng'}</dd></div>
              {isTechnician && (
                <div className="profile-actions-inline">
                  <Link
                    to={`/app/worker/${profile?.id}`}
                    state={{ from: '/app/profile' }}
                    className="profile-link-btn subtle"
                  >
                    Xem hồ sơ công khai
                  </Link>
                </div>
              )}
            </dl>
          </article>

          {isTechnician && worker && (
            <article className="profile-card">
              <h2>Thông tin thợ</h2>
              <dl className="profile-dl">
                <div>
                  <dt>Xác minh</dt>
                  <dd>
                    <span className={`profile-badge ${verification.className}`}>{verification.text}</span>
                  </dd>
                </div>
                <div><dt>Loại nghề</dt><dd>{translateJobType(worker.jobType)}</dd></div>
                <div><dt>Gói cước</dt><dd>{translateTier(worker.tierType)}</dd></div>
                <div>
                  <dt>Đánh giá TB</dt>
                  <dd>{worker.avgRating != null ? Number(worker.avgRating).toFixed(1) : '—'} ★</dd>
                </div>
                {worker.professionalCertificateUrl && (
                  <div>
                    <dt>Chứng chỉ</dt>
                    <dd>
                      <a
                        href={worker.professionalCertificateUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="profile-cert-link"
                      >
                        Xem chứng chỉ hành nghề
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
              <p className="profile-hint">
                Bấm Chỉnh sửa để đổi họ tên, số điện thoại, loại nghề hoặc chứng chỉ.
              </p>
            </article>
          )}

          {isTechnician && (
            <article className="profile-card highlight">
              <h2>Gói &amp; dịch vụ</h2>
              <p className="profile-muted">Nâng cấp gói để hiển thị ưu tiên trên bản đồ và danh sách tìm kiếm.</p>
              <Link to="/app/subscription" className="profile-link-btn">
                <AppIcon name="crown" size={18} />
                Quản lý gói cước
              </Link>
            </article>
          )}
        </div>
      )}

      {editing ? (
        <div className="profile-page-footer">
          <button type="button" className="secondary" onClick={handleCancelEdit} disabled={saving}>
            Hủy
          </button>
          <button type="submit" form="profile-edit-form" className="primary" disabled={saving}>
            {saving ? 'Đang lưu…' : 'Lưu hồ sơ'}
          </button>
        </div>
      ) : (
        <button type="button" className="profile-refresh" onClick={loadProfile} disabled={loading}>
          <AppIcon name="refresh" size={18} />
          Làm mới
        </button>
      )}
    </section>
  )
}
