import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useLanguage } from '../../i18n/LanguageContext'
import { getMyJobPosts, createJobPost, updateJobPost, deleteJobPost } from '../../services/jobPostService'
import LocationPicker from './LocationPicker'
import '../../styles/modules/jobpost.css'

function JobPostManagement() {
  const queryClient = useQueryClient()
  const { t, language } = useLanguage()
  const locale = language === 'ko' ? 'ko-KR' : language === 'en' ? 'en-US' : 'vi-VN'
  const [isCreateMode, setIsCreateMode] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    jobType: '',
    address: '',
    latitude: 0,
    longitude: 0,
  })

  const { data: jobPosts = [], isLoading, error } = useQuery({
    queryKey: ['myJobPosts'],
    queryFn: getMyJobPosts,
  })

  const createMutation = useMutation({
    mutationFn: (data) => createJobPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['myJobPosts'])
      resetForm()
      setIsCreateMode(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateJobPost(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['myJobPosts'])
      resetForm()
      setEditingId(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteJobPost(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['myJobPosts'])
    },
  })

  const resetForm = () => {
    setFormData({ title: '', description: '', jobType: '', address: '', latitude: 0, longitude: 0 })
    setShowLocationPicker(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingId) updateMutation.mutate({ id: editingId, data: formData })
    else createMutation.mutate(formData)
  }

  const handleEdit = (jobPost) => {
    setFormData({
      title: jobPost.title,
      description: jobPost.description,
      jobType: jobPost.jobType,
      address: jobPost.address,
      latitude: jobPost.latitude,
      longitude: jobPost.longitude,
    })
    setEditingId(jobPost.id)
    setIsCreateMode(false)
  }

  const handleDelete = (id) => {
    if (window.confirm(t('jobpost.manage.confirmDelete'))) deleteMutation.mutate(id)
  }

  if (isLoading) return <div className="jobpost-loading">{t('jobpost.loading')}</div>
  if (error) return <div className="jobpost-error">{t('jobpost.loadError', { message: error.message })}</div>

  return (
    <div className="jobpost-management">
      <div className="jobpost-header">
        <h1>{t('jobpost.manage.title')}</h1>
        <button
          className="btn-primary"
          onClick={() => {
            setIsCreateMode(true)
            setEditingId(null)
            resetForm()
          }}
        >
          + {t('jobpost.manage.createNew')}
        </button>
      </div>

      {(isCreateMode || editingId) && (
        <div className="jobpost-form-container">
          <h2>{editingId ? t('jobpost.manage.editTitle') : t('jobpost.manage.createTitle')}</h2>
          <form onSubmit={handleSubmit} className="jobpost-form">
            <div className="form-group">
              <label htmlFor="title">{t('jobpost.field.title')}</label>
              <input id="title" type="text" name="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder={t('jobpost.manage.placeholderTitle')} required />
            </div>

            <div className="form-group">
              <label htmlFor="description">{t('jobpost.field.description')}</label>
              <textarea id="description" name="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder={t('jobpost.manage.placeholderDescription')} rows="4" required />
            </div>

            <div className="form-group">
              <label htmlFor="jobType">{t('jobpost.field.jobType')}</label>
              <select id="jobType" name="jobType" value={formData.jobType} onChange={(e) => setFormData({ ...formData, jobType: e.target.value })} required>
                <option value="">{t('jobpost.manage.selectJobType')}</option>
                <option value="DIEN">{t('jobpost.type.DIEN')}</option>
                <option value="NUOC">{t('jobpost.type.NUOC')}</option>
                <option value="HARM">{t('jobpost.type.HARM')}</option>
                <option value="CLEAN">{t('jobpost.type.CLEAN')}</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="address">{t('jobpost.field.address')}</label>
              <input id="address" type="text" name="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder={t('jobpost.manage.placeholderAddress')} required />
            </div>

            {showLocationPicker && <LocationPicker onLocationSelect={(lat, lng) => setFormData({ ...formData, latitude: lat || 0, longitude: lng || 0 })} initialLat={formData.latitude} initialLng={formData.longitude} />}

            {!showLocationPicker && (
              <button type="button" className="btn-location-picker" onClick={() => setShowLocationPicker(true)}>
                {formData.latitude && formData.longitude
                  ? `${t('jobpost.manage.selectedLocation')}: ${formData.latitude.toFixed(4)}, ${formData.longitude.toFixed(4)}`
                  : t('jobpost.manage.pickLocation')}
              </button>
            )}

            {showLocationPicker && (
              <button type="button" className="btn-hide-map" onClick={() => setShowLocationPicker(false)}>
                {t('jobpost.manage.hideMap')}
              </button>
            )}

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId ? t('jobpost.action.update') : t('jobpost.action.create')} {t('jobpost.common.job')}
              </button>
              <button type="button" className="btn-secondary" onClick={() => { setIsCreateMode(false); setEditingId(null); resetForm() }}>
                {t('profile.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="jobpost-list">
        {jobPosts.length === 0 ? (
          <div className="empty-state">
            <p>{t('jobpost.manage.empty')}</p>
          </div>
        ) : (
          <div className="jobpost-grid">
            {jobPosts.map((jobPost) => (
              <div key={jobPost.id} className="jobpost-card">
                <div className="jobpost-header-card">
                  <h3>{jobPost.title}</h3>
                  <span className={`status-badge status-${jobPost.status?.toLowerCase()}`}>
                    {jobPost.status === 'OPEN' ? t('jobpost.status.open') : t('jobpost.status.closed')}
                  </span>
                </div>

                <p className="jobpost-type">{t(`jobpost.type.${jobPost.jobType}`)}</p>
                <p className="jobpost-address">{jobPost.address}</p>
                <p className="jobpost-description">{jobPost.description}</p>

                <div className="jobpost-meta">
                  <span className="created-date">
                    {t('jobpost.field.createdAt')}: {new Date(jobPost.createdAt).toLocaleDateString(locale)}
                  </span>
                </div>

                <div className="jobpost-actions">
                  <button className="btn-edit" onClick={() => handleEdit(jobPost)} disabled={editingId === jobPost.id}>
                    {t('jobpost.action.edit')}
                  </button>
                  <button className="btn-delete" onClick={() => handleDelete(jobPost.id)} disabled={deleteMutation.isPending}>
                    {t('jobpost.action.delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default JobPostManagement
