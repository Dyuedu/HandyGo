import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  getMyJobPosts,
  createJobPost,
  updateJobPost,
  deleteJobPost,
  getMyJobPostById,
} from '../../services/jobPostService'
import '../../styles/modules/jobpost.css'

function JobPostManagement() {
  const queryClient = useQueryClient()
  const [isCreateMode, setIsCreateMode] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    jobType: '',
    address: '',
    latitude: 0,
    longitude: 0,
  })

  // Fetch user's job posts
  const { data: jobPosts = [], isLoading, error } = useQuery({
    queryKey: ['myJobPosts'],
    queryFn: getMyJobPosts,
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data) => createJobPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['myJobPosts'])
      resetForm()
      setIsCreateMode(false)
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateJobPost(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['myJobPosts'])
      resetForm()
      setEditingId(null)
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteJobPost(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['myJobPosts'])
    },
  })

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      jobType: '',
      address: '',
      latitude: 0,
      longitude: 0,
    })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'latitude' || name === 'longitude' ? parseFloat(value) : value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData })
    } else {
      createMutation.mutate(formData)
    }
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
    if (window.confirm('Bạn có chắc chắn muốn xóa công việc này?')) {
      deleteMutation.mutate(id)
    }
  }

  if (isLoading) return <div className="jobpost-loading">Đang tải công việc...</div>
  if (error) return <div className="jobpost-error">Lỗi tải công việc: {error.message}</div>

  return (
    <div className="jobpost-management">
      <div className="jobpost-header">
        <h1>Công việc của tôi</h1>
        <button
          className="btn-primary"
          onClick={() => {
            setIsCreateMode(true)
            setEditingId(null)
            resetForm()
          }}
        >
          + Tạo công việc mới
        </button>
      </div>

      {(isCreateMode || editingId) && (
        <div className="jobpost-form-container">
          <h2>{editingId ? 'Chỉnh sửa công việc' : 'Tạo công việc mới'}</h2>
          <form onSubmit={handleSubmit} className="jobpost-form">
            <div className="form-group">
              <label htmlFor="title">Tiêu đề</label>
              <input
                id="title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Nhập tiêu đề công việc"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Mô tả</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Nhập mô tả công việc"
                rows="4"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="jobType">Loại công việc</label>
              <select
                id="jobType"
                name="jobType"
                value={formData.jobType}
                onChange={handleInputChange}
                required
              >
                <option value="">Chọn loại công việc</option>
                <option value="DIEN">Điện</option>
                <option value="NUOC">Nước</option>
                <option value="HARM">Sửa chữa</option>
                <option value="CLEAN">Vệ sinh</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="address">Địa chỉ</label>
              <input
                id="address"
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Nhập địa chỉ công việc"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="latitude">Vĩ độ</label>
                <input
                  id="latitude"
                  type="number"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  step="0.000001"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="longitude">Kinh độ</label>
                <input
                  id="longitude"
                  type="number"
                  name="longitude"
                  onChange={handleInputChange}
                  value={formData.longitude}
                  step="0.000001"
                  required
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId ? 'Cập nhật' : 'Tạo'} công việc
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setIsCreateMode(false)
                  setEditingId(null)
                  resetForm()
                }}
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="jobpost-list">
        {jobPosts.length === 0 ? (
          <div className="empty-state">
            <p>Chưa có công việc nào. Tạo một công việc để bắt đầu!</p>
          </div>
        ) : (
          <div className="jobpost-grid">
            {jobPosts.map((jobPost) => (
              <div key={jobPost.id} className="jobpost-card">
                <div className="jobpost-header-card">
                  <h3>{jobPost.title}</h3>
                  <span className={`status-badge status-${jobPost.status?.toLowerCase()}`}>
                    {jobPost.status === 'OPEN' ? 'Mở' : 'Đóng'}
                  </span>
                </div>

                <p className="jobpost-type">{jobPost.jobType}</p>
                <p className="jobpost-address">{jobPost.address}</p>
                <p className="jobpost-description">{jobPost.description}</p>

                <div className="jobpost-meta">
                  <span className="created-date">
                    Tạo: {new Date(jobPost.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>

                <div className="jobpost-actions">
                  <button
                    className="btn-edit"
                    onClick={() => handleEdit(jobPost)}
                    disabled={editingId === jobPost.id}
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(jobPost.id)}
                    disabled={deleteMutation.isPending}
                  >
                    Xóa
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
