import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getMyProfile, updateMyProfile, updateMyWorkerProfile } from '../services/profileService'
import { AppIcon } from '../components/AppIcon'
import { useLanguage } from '../i18n/LanguageContext'
import '../styles/pages/ProfilePage.css'

const JOB_OPTIONS = [
  { value: 'DIEN', labelKey: 'job.DIEN' },
  { value: 'NUOC', labelKey: 'job.NUOC' },
  { value: 'DIEU_HOA', labelKey: 'job.DIEU_HOA' },
  { value: 'SUA_XE', labelKey: 'job.SUA_XE' },
  { value: 'XAY_DUNG', labelKey: 'job.XAY_DUNG' },
  { value: 'DON_DEP', labelKey: 'job.DON_DEP' },
]

function translateJobType(job, t) {
  if (!job) return '—'
  const found = JOB_OPTIONS.find((o) => o.value === job.trim().toUpperCase())
  return found ? t(found.labelKey) : job
}

function translateTier(tier, t) {
  return t(`tier.${tier || 'FREE'}`)
}

function verificationLabel(status, verified, t) {
  if (verified || status === 'VERIFIED') {
    return { text: t('profile.verified'), className: 'verified' }
  }
  return { text: t('profile.pendingVerification'), className: 'pending' }
}

function resolveProfileError(err, t) {
  const error = err?.payload?.error
  const details = error?.details
  if (details && typeof details === 'object') {
    const first = Object.values(details).find(Boolean)
    if (first) return first
  }
  const byCode = {
    PHONE_EXISTS: t('error.PHONE_EXISTS'),
    VALIDATION_FAILED: t('error.VALIDATION_FAILED'),
    FORBIDDEN: t('error.FORBIDDEN'),
  }
  if (error?.code && byCode[error.code]) return byCode[error.code]
  return err?.message || t('profile.saveError')
}

export function ProfilePage() {
  const { mode, session } = useAuth()
  const { t } = useLanguage()
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
      setError(resolveProfileError(err, t))
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

      setSuccess(t('profile.saveSuccess'))
      setEditing(false)
    } catch (err) {
      setError(resolveProfileError(err, t))
    } finally {
      setSaving(false)
    }
  }

  if (isAdmin) {
    return (
      <section className="profile-page">
        <div className="profile-hero">
          <h1>{t('profile.adminTitle')}</h1>
          <p>{t('profile.account')}: {session?.username || '—'}</p>
        </div>
        <p className="profile-muted">{t('profile.adminHint')}</p>
        <Link to="/app/admin/workers" className="profile-link-btn">{t('profile.openWorkerManagement')}</Link>
      </section>
    )
  }

  if (loading) {
    return (
      <section className="profile-page">
        <p className="profile-muted">{t('profile.loading')}</p>
      </section>
    )
  }

  const worker = profile?.worker
  const verification = verificationLabel(worker?.verificationStatus, worker?.verified, t)

  return (
    <section className="profile-page">
      <div className="profile-hero">
        <h1>{isTechnician ? t('profile.workerTitle') : t('profile.customerTitle')}</h1>
        <p>{t('profile.description')}</p>
      </div>

      {error && <div className="profile-alert error" role="alert">{error}</div>}
      {success && <div className="profile-alert success" role="status">{success}</div>}

      {editing ? (
        <form id="profile-edit-form" className="profile-grid" onSubmit={handleSave}>
          <article className="profile-card">
            <h2>{t('profile.commonInfo')}</h2>
            <div className="profile-form">
              <label>
                <span>{t('profile.username')}</span>
                <input type="text" value={profile?.username || ''} disabled />
              </label>
              <label>
                <span>{t('profile.fullName')}</span>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </label>
              <label>
                <span>{t('profile.phone')}</span>
                <input
                  type="tel"
                  placeholder={t('profile.phonePlaceholder')}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </label>
            </div>
          </article>

          {isTechnician && worker && (
            <article className="profile-card">
              <h2>{t('profile.workerInfo')}</h2>
              <dl className="profile-dl">
                <div>
                  <dt>{t('profile.verification')}</dt>
                  <dd>
                    <span className={`profile-badge ${verification.className}`}>{verification.text}</span>
                  </dd>
                </div>
                <div><dt>{t('profile.subscription')}</dt><dd>{translateTier(worker.tierType, t)}</dd></div>
                <div>
                  <dt>{t('profile.avgRating')}</dt>
                  <dd>{worker.avgRating != null ? Number(worker.avgRating).toFixed(1) : '—'} ★</dd>
                </div>
              </dl>
              <div className="profile-worker-edit">
                <label>
                  <span>{t('profile.jobType')}</span>
                  <select value={jobType} onChange={(e) => setJobType(e.target.value)}>
                    {JOB_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>{t('profile.updateCertificate')}</span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                  />
                  <small className="profile-hint">
                    {t('profile.certificateHint')}
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
              <h2>{t('profile.commonInfo')}</h2>
              <button type="button" className="profile-edit-btn" onClick={() => setEditing(true)}>
                {t('profile.edit')}
              </button>
            </div>
            <dl className="profile-dl">
              <div><dt>{t('profile.username')}</dt><dd>{profile?.username || '—'}</dd></div>
              <div><dt>{t('profile.fullName')}</dt><dd>{profile?.fullName || '—'}</dd></div>
              <div><dt>{t('profile.phone')}</dt><dd>{profile?.phone || '—'}</dd></div>
              <div><dt>{t('profile.role')}</dt><dd>{profile?.role === 'WORKER' ? t('common.worker') : t('common.customer')}</dd></div>
              {isTechnician && (
                <div className="profile-actions-inline">
                  <Link
                    to={`/app/worker/${profile?.id}`}
                    state={{ from: '/app/profile' }}
                    className="profile-link-btn subtle"
                  >
                    {t('profile.publicProfile')}
                  </Link>
                </div>
              )}
            </dl>
          </article>

          {isTechnician && worker && (
            <article className="profile-card">
              <h2>{t('profile.workerInfo')}</h2>
              <dl className="profile-dl">
                <div>
                  <dt>{t('profile.verification')}</dt>
                  <dd>
                    <span className={`profile-badge ${verification.className}`}>{verification.text}</span>
                  </dd>
                </div>
                <div><dt>{t('profile.job')}</dt><dd>{translateJobType(worker.jobType, t)}</dd></div>
                <div><dt>{t('profile.subscription')}</dt><dd>{translateTier(worker.tierType, t)}</dd></div>
                <div>
                  <dt>{t('profile.avgRating')}</dt>
                  <dd>{worker.avgRating != null ? Number(worker.avgRating).toFixed(1) : '—'} ★</dd>
                </div>
                {worker.professionalCertificateUrl && (
                  <div>
                    <dt>{t('profile.certificate')}</dt>
                    <dd>
                      <a
                        href={worker.professionalCertificateUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="profile-cert-link"
                      >
                        {t('profile.viewCertificate')}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
              <p className="profile-hint">
                {t('profile.editHint')}
              </p>
            </article>
          )}

          {isTechnician && (
            <article className="profile-card highlight">
              <h2>{t('profile.planTitle')}</h2>
              <p className="profile-muted">{t('profile.planHint')}</p>
              <Link to="/app/subscription" className="profile-link-btn">
                <AppIcon name="crown" size={18} />
                {t('profile.managePlan')}
              </Link>
            </article>
          )}
        </div>
      )}

      {editing ? (
        <div className="profile-page-footer">
          <button type="button" className="secondary" onClick={handleCancelEdit} disabled={saving}>
            {t('profile.cancel')}
          </button>
          <button type="submit" form="profile-edit-form" className="primary" disabled={saving}>
            {saving ? t('profile.saving') : t('profile.save')}
          </button>
        </div>
      ) : (
        <button type="button" className="profile-refresh" onClick={loadProfile} disabled={loading}>
          <AppIcon name="refresh" size={18} />
          {t('profile.refresh')}
        </button>
      )}
    </section>
  )
}
