import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { getWorkers, toggleWorkerVerification, toggleWorkerStatus } from '../services/adminService'
import { useLanguage } from '../i18n/LanguageContext'
import '../styles/pages/AdminDashboard.css'

export function AdminDashboard() {
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [jobFilter, setJobFilter] = useState('')
  const [verifiedFilter, setVerifiedFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

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

  // Filter and search workers
  const filteredWorkers = useMemo(() => {
    if (!workers) return []

    return workers.filter(worker => {
      // Search by username, full name, or phone
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch = !searchQuery || 
        (worker.username && worker.username.toLowerCase().includes(searchLower)) ||
        (worker.fullName && worker.fullName.toLowerCase().includes(searchLower)) ||
        (worker.phone && worker.phone.includes(searchQuery))

      // Filter by job type
      const matchesJob = !jobFilter || worker.jobType === jobFilter

      // Filter by verified status
      const matchesVerified = verifiedFilter === '' || 
        (verifiedFilter === 'verified' ? worker.verified : !worker.verified)

      // Filter by account status
      const matchesStatus = !statusFilter || worker.status === statusFilter

      return matchesSearch && matchesJob && matchesVerified && matchesStatus
    }).sort((a, b) => {
      // Maintain consistent order: sort by ID
      return a.id.localeCompare(b.id)
    })
  }, [workers, searchQuery, jobFilter, verifiedFilter, statusFilter])

  // Get unique job types and statuses for filter options
  const jobTypes = useMemo(() => {
    if (!workers) return []
    return [...new Set(workers.map(w => w.jobType))].sort()
  }, [workers])

  const statuses = useMemo(() => {
    if (!workers) return []
    return [...new Set(workers.map(w => w.status))].sort()
  }, [workers])

  if (isLoading) {
    return <div className="admin-loading">{t('admin.loading')}</div>
  }

  if (error) {
    return <div className="admin-error">{t('admin.loadError')}: {error.message}</div>
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>{t('admin.workersTitle')}</h1>
        <p>{t('admin.workersDesc')}</p>
      </header>

      <div className="admin-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder={t('admin.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filters-container">
          <select 
            value={jobFilter} 
            onChange={(e) => setJobFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">{t('admin.allJobs')}</option>
            {jobTypes.map(job => (
              <option key={job} value={job}>{job}</option>
            ))}
          </select>

          <select 
            value={verifiedFilter} 
            onChange={(e) => setVerifiedFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">{t('admin.allCertStatus')}</option>
            <option value="verified">{t('admin.verified')}</option>
            <option value="unverified">{t('admin.unverified')}</option>
          </select>

          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">{t('admin.allAccountStatus')}</option>
            {statuses.map(status => (
              <option key={status} value={status}>
                {t(`status.${status}`)}
              </option>
            ))}
          </select>

          {(searchQuery || jobFilter || verifiedFilter || statusFilter) && (
            <button 
              onClick={() => {
                setSearchQuery('')
                setJobFilter('')
                setVerifiedFilter('')
                setStatusFilter('')
              }}
              className="btn-reset-filters"
            >
              {t('admin.resetFilters')}
            </button>
          )}
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>{t('admin.username')}</th>
              <th>{t('admin.fullName')}</th>
              <th>{t('admin.phone')}</th>
              <th>{t('admin.job')}</th>
              <th>{t('admin.tier')}</th>
              <th>{t('admin.rating')}</th>
              <th>{t('admin.certVerification')}</th>
              <th>{t('admin.accountStatus')}</th>
              <th>{t('admin.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredWorkers?.map(worker => (
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
                    {worker.verified ? t('admin.verified') : t('admin.unverified')}
                  </span>
                </td>
                <td>
                  <span className={`badge status-badge ${worker.status?.toLowerCase()}`}>
                    {t(`status.${worker.status}`)}
                  </span>
                </td>
                <td className="actions-cell">
                  <Link to={`/app/admin/workers/${worker.id}`} className="btn-action btn-view">{t('admin.viewDetail')}</Link>
                  {!worker.verified && (
                    <button 
                      className="btn-action btn-verify approve"
                      onClick={() => verifyMutation.mutate(worker.id)}
                      disabled={verifyMutation.isPending}
                    >
                      {t('admin.approveCert')}
                    </button>
                  )}
                  <button 
                    className={`btn-action btn-status ${worker.status === 'ACTIVE' ? 'block' : 'unblock'}`}
                    onClick={() => statusMutation.mutate(worker.id)}
                    disabled={statusMutation.isPending}
                  >
                    {worker.status === 'ACTIVE' ? t('admin.block') : t('admin.unblock')}
                  </button>
                </td>
              </tr>
            ))}
            {(!filteredWorkers || filteredWorkers.length === 0) && (
              <tr>
                <td colSpan="10" className="empty-state">{t('admin.emptyWorkers')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
