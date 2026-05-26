import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getWorkerById, toggleWorkerVerification, toggleWorkerStatus } from '../services/adminService'
import { loadSession } from '../state/authStore'
import { useLanguage } from '../i18n/LanguageContext'
import { formatDateTime } from '../i18n/formatters'
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

function isCloudinaryUrl(value) {
  try {
    return new URL(value).hostname.endsWith('cloudinary.com')
  } catch {
    return false
  }
}

// Component to display PDF/Word with auth headers
function DocumentViewer({ url, fileType, fileExt, t }) {
  const [blobUrl, setBlobUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let objectUrl = null
    let isCancelled = false

    const loadDocument = async () => {
      try {
        setLoading(true)
        setError(null)

        const isExternal = isCloudinaryUrl(url)

        const fetchOptions = {}

        if (!isExternal) {
          const session = loadSession()
          if (session?.accessToken) {
            fetchOptions.headers = {
              'Authorization': `Bearer ${session.accessToken}`
            }
          }
        }

        const response = await fetch(url, fetchOptions)

        if (!response.ok) {
          const cloudinaryError = response.headers.get('x-cld-error')
          if (isExternal && response.status === 401 && cloudinaryError) {
            throw new Error(t('admin.cloudinaryPdfBlocked'))
          }
          throw new Error(`Server responded with ${response.status} ${response.statusText}`)
        }

        const blob = await response.blob()
        objectUrl = URL.createObjectURL(blob)
        if (isCancelled) {
          URL.revokeObjectURL(objectUrl)
          return
        }
        setBlobUrl(objectUrl)
      } catch (err) {
        console.error('Document loading error:', err)
        if (!isCancelled) {
          setError(t('admin.documentLoadError', { message: err.message }))
          setBlobUrl(null)
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    if (url) {
      loadDocument()
    }

    return () => {
      isCancelled = true
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [url])

  if (loading) {
    return <div className="certificate-loading">{t('common.loading')}</div>
  }

  if (error) {
    return (
      <div className="certificate-error">
        <p>{error}</p>
        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px', wordBreak: 'break-all' }}>
          URL: {url}
        </div>
        <a 
          href={url}
          download
          className="btn-download-certificate"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('admin.downloadFile')} {fileExt} (Fallback)
        </a>
      </div>
    )
  }

  if (fileType === 'pdf') {
    return (
      <div className="certificate-viewer">
        <iframe 
          src={blobUrl} 
          title={t('profile.certificate')}
          className="certificate-pdf"
        />
        <a 
          href={url}
          download
          className="btn-download-certificate"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('admin.downloadFile')} PDF
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
        <p className="document-name">Word ({fileExt})</p>
        <p className="document-note">{t('admin.downloadFile')}</p>
      </div>
      <a 
        href={url}
        download
        className="btn-download-certificate"
        target="_blank"
        rel="noopener noreferrer"
      >
        {t('admin.downloadFile')} {fileExt}
      </a>
    </div>
  )
}

export function AdminWorkerDetail() {
  const { language, t } = useLanguage()
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
    return <div className="admin-loading">{t('worker.loading')}</div>
  }

  if (error || !worker) {
    return <div className="admin-error">{t('admin.loadWorkerError')}: {error?.message || t('admin.workerNotFound')}</div>
  }

  return (
    <div className="admin-detail-container">
      <div className="admin-detail-header">
        <button className="btn-back" onClick={() => navigate('/app/admin/workers')}>
          ← {t('admin.backList')}
        </button>
        <div className="header-title-actions">
          <h1>{t('admin.workerProfile')}: {worker.fullName || worker.username}</h1>
          <div className="detail-actions">
            {!worker.verified && (
              <button 
                className="btn-action btn-verify approve"
                onClick={() => verifyMutation.mutate()}
                disabled={verifyMutation.isPending}
              >
                {t('admin.approveCert')}
              </button>
            )}
            <button 
              className={`btn-action btn-status ${worker.status === 'ACTIVE' ? 'block' : 'unblock'}`}
              onClick={() => statusMutation.mutate()}
              disabled={statusMutation.isPending}
            >
              {worker.status === 'ACTIVE' ? t('admin.blockAccount') : t('admin.unblockAccount')}
            </button>
          </div>
        </div>
      </div>

      <div className="admin-detail-content">
        <div className="detail-card">
          <h2>{t('admin.generalInfo')}</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">{t('admin.workerId')}</span>
              <span className="info-value">{worker.id}</span>
            </div>
            <div className="info-item">
              <span className="info-label">{t('admin.username')}</span>
              <span className="info-value">{worker.username}</span>
            </div>
            <div className="info-item">
              <span className="info-label">{t('admin.fullName')}</span>
              <span className="info-value">{worker.fullName || '-'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">{t('admin.phone')}</span>
              <span className="info-value">{worker.phone || '-'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">{t('admin.createdAt')}</span>
              <span className="info-value">
                {formatDateTime(worker.createdAt, language, '-')}
              </span>
            </div>
          </div>
        </div>

        <div className="detail-card">
          <h2>{t('admin.workInfo')}</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">{t('admin.jobType')}</span>
              <span className="info-value badge job-badge">{worker.jobType}</span>
            </div>
            <div className="info-item">
              <span className="info-label">{t('admin.tier')}</span>
              <span className="info-value badge tier-badge">{worker.tierType}</span>
            </div>
            <div className="info-item">
              <span className="info-label">{t('admin.avgRating')}</span>
              <span className="info-value">{worker.avgRating ? `${worker.avgRating.toFixed(1)} ⭐` : t('admin.noRating')}</span>
            </div>
            <div className="info-item">
              <span className="info-label">{t('admin.certVerification')}</span>
              <span className={`info-value badge verify-badge ${worker.verified ? 'verified' : 'unverified'}`}>
                {worker.verified ? t('admin.verified') : t('admin.unverified')}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">{t('admin.accountStatus')}</span>
              <span className={`info-value badge status-badge ${worker.status?.toLowerCase()}`}>
                {t(`status.${worker.status}`)}
              </span>
            </div>
          </div>
        </div>

        <div className="detail-card full-width">
          <h2>{t('admin.businessLicense')}</h2>
          <div className="certificate-container">
            {worker.professionalCertificateUrl ? (
              (() => {
                const fileType = getFileType(worker.professionalCertificateUrl)
                const fileExt = getFileExtension(worker.professionalCertificateUrl)

                if (fileType === 'image') {
                  return (
                    <img 
                      src={worker.professionalCertificateUrl} 
                      alt={t('profile.certificate')}
                      className="certificate-image" 
                    />
                  )
                } else if (fileType === 'pdf' || fileType === 'word') {
                  return (
                    <DocumentViewer 
                      url={worker.professionalCertificateUrl}
                      fileType={fileType}
                      fileExt={fileExt}
                      t={t}
                    />
                  )
                } else {
                  return (
                    <div className="certificate-unknown">
                      <p>{t('admin.unsupportedFile', { ext: fileExt })}</p>
                      <a 
                        href={worker.professionalCertificateUrl}
                        download
                        className="btn-download-certificate"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t('admin.downloadFile')}
                      </a>
                    </div>
                  )
                }
              })()
            ) : (
              <div className="certificate-empty">
                {t('admin.emptyCertificate')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
