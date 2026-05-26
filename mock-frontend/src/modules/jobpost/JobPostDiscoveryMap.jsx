import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { updateLocation, getUserLocations } from '../../services/userService'
import { getAllOpenJobPosts, getOpenJobPostsByJobType } from '../../services/jobPostService'
import '../../styles/modules/jobpost-map.css'

function JobPostDiscoveryMap() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const currentUserId = session?.id || localStorage.getItem('my_user_id')

  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef({})
  const circleRef = useRef(null)
  const requestedInitialLocationRef = useRef(false)

  const [jobPosts, setJobPosts] = useState([])
  const [workers, setWorkers] = useState([])
  const [status, setStatus] = useState('pending')
  const [statusText, setStatusText] = useState('Đang kết nối GPS...')
  const [selectedJobType, setSelectedJobType] = useState('')
  const [myLocation, setMyLocation] = useState(null)

  const jobTypes = ['DIEN', 'NUOC', 'HARM', 'CLEAN']

  // Fetch data function (similar to fetchLocations in DashboardHome)
  const fetchData = useCallback(async (myLat, myLng, jobType = selectedJobType) => {
    try {
      // Fetch job posts
      const posts =
        jobType && jobType !== ''
          ? await getOpenJobPostsByJobType(jobType)
          : await getAllOpenJobPosts()
      setJobPosts(posts)

      // Fetch worker locations (other workers)
      const locations = await getUserLocations()
      const normalizedLocations = locations.map((user) => {
        const normalizedRole =
          user.role === 'ROLE_WORKER' || user.role === 'WORKER'
            ? 'TECHNICIAN'
            : user.role

        return {
          ...user,
          role: normalizedRole,
        }
      })
      const filtered = normalizedLocations.filter((u) => u.role === 'TECHNICIAN' && String(u.id) !== String(currentUserId))
      setWorkers(filtered)

      // Update map view if we have coordinates
      if (mapInstanceRef.current && myLat && myLng) {
        mapInstanceRef.current.setView([myLat, myLng], 14)
        mapInstanceRef.current.invalidateSize()
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu:', err)
    }
  }, [currentUserId, selectedJobType])

  // Initialize map on mount
  useEffect(() => {
    if (!mapRef.current || !window.L) return

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
    }

    const map = window.L.map(mapRef.current, {
      dragging: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      touchZoom: true,
    }).setView([10.7769, 106.7009], 14)

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map)

    mapInstanceRef.current = map

    setTimeout(() => {
      map.invalidateSize()
    }, 100)

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  const handleJobTypeChange = (jobType) => {
    setSelectedJobType(jobType)
    fetchData(myLocation?.latitude, myLocation?.longitude, jobType)
  }

  function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371 // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Update markers when data changes
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return

    const map = mapInstanceRef.current

    // Clear old markers
    Object.keys(markersRef.current).forEach((key) => {
      map.removeLayer(markersRef.current[key])
    })
    markersRef.current = {}

    if (circleRef.current) {
      map.removeLayer(circleRef.current)
      circleRef.current = null
    }

    if (myLocation?.latitude && myLocation?.longitude) {
      const position = [myLocation.latitude, myLocation.longitude]

      const myMarker = window.L.marker(position, {
        icon: window.L.divIcon({
          className: 'leaflet-custom-me-marker',
          html: '<div class="me-marker-pulse"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        }),
      }).addTo(map)

      markersRef.current.me = myMarker

      circleRef.current = window.L.circle(position, {
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.08,
        weight: 1.5,
        dashArray: '5, 5',
        radius: 10000,
      }).addTo(map)
    }

    // Add job post markers
    jobPosts.forEach((post) => {
      if (!post.latitude || !post.longitude) return

      const marker = window.L.marker([post.latitude, post.longitude], {
        icon: window.L.divIcon({
          className: 'leaflet-custom-jobpost-marker',
          html: `<div class="jobpost-marker-dot"><svg viewBox="0 0 24 24" fill="#ef4444" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="8"/></svg></div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        }),
      }).addTo(map)

      // Create popup
      const distance = myLocation
        ? calculateDistance(
            myLocation.latitude,
            myLocation.longitude,
            post.latitude,
            post.longitude
          )
        : null

      const jobTypeLabel = {
        DIEN: 'Điện',
        NUOC: 'Nước',
        HARM: 'Sửa chữa',
        CLEAN: 'Vệ sinh',
      }[post.jobType] || post.jobType

      const popupContent = `
        <div class="jobpost-popup">
          <h4>${post.title}</h4>
          <p class="job-type">${jobTypeLabel}</p>
          <p class="address">${post.address}</p>
          <p class="description">${post.description.substring(0, 100)}...</p>
          ${distance ? `<p class="distance">Cách bạn: ${distance.toFixed(2)} km</p>` : ''}
          <button onclick="window.dispatchEvent(new CustomEvent('view-jobpost', { detail: { jobPostId: '${post.id}' } }))" class="popup-btn">
            Xem chi tiết
          </button>
        </div>
      `

      marker.bindPopup(popupContent)
      markersRef.current[post.id] = marker
    })

    // Add worker markers (other technicians)
    workers.forEach((worker) => {
      if (!worker.latitude || !worker.longitude || String(worker.id) === String(currentUserId)) return

      const marker = window.L.marker([worker.latitude, worker.longitude], {
        icon: window.L.divIcon({
          className: 'leaflet-custom-worker-marker',
          html: `<div class="worker-marker-dot"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.7 6.3a4 4 0 0 0-5 5L3 18v3h3l6.7-6.7a4 4 0 0 0 5-5l-2.4 2.4-3-3 2.4-2.4z"/></svg></div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        }),
      }).addTo(map)

      const distance = myLocation
        ? calculateDistance(myLocation.latitude, myLocation.longitude, worker.latitude, worker.longitude)
        : null

      const jobTypeLabel = {
        DIEN: 'Điện',
        NUOC: 'Nước',
        HARM: 'Sửa chữa',
        CLEAN: 'Vệ sinh',
      }[worker.jobType] || worker.jobType

      const popupContent = `
        <div class="worker-popup">
          <h4>${worker.fullName}</h4>
          <p class="job-type">${jobTypeLabel}</p>
          ${distance ? `<p class="distance">Cách bạn: ${distance.toFixed(2)} km</p>` : ''}
          <button onclick="window.dispatchEvent(new CustomEvent('view-worker', { detail: { workerId: '${worker.id}' } }))" class="popup-btn">
            Xem hồ sơ
          </button>
        </div>
      `

      marker.bindPopup(popupContent)
      markersRef.current['worker-' + worker.id] = marker
    })
  }, [jobPosts, workers, myLocation, currentUserId])

  // Get current location (same pattern as DashboardHome.triggerGeolocation)
  const triggerGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('error')
      setStatusText('Trình duyệt không hỗ trợ GPS')
      fetchData()
      return
    }

    setStatus('pending')
    setStatusText('Đang kết nối GPS...')

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const myProfile = await updateLocation(latitude, longitude)
          if (myProfile && myProfile.id) {
            localStorage.setItem('my_user_id', myProfile.id.toString())
          }
          setMyLocation({ latitude, longitude })
          setStatus('active')
          setStatusText('Đã kết nối GPS')
          fetchData(latitude, longitude)
        } catch (err) {
          setStatus('error')
          setStatusText('Lỗi cập nhật vị trí')
          console.error('Lỗi cập nhật vị trí:', err)
          // Still fetch data even on error
          fetchData()
        }
      },
      (err) => {
        setStatus('error')
        setStatusText('Không thể truy cập GPS')
        console.error('Lỗi GPS:', err)
        // Still fetch data even on error
        fetchData()
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [fetchData])

  useEffect(() => {
    if (requestedInitialLocationRef.current) return

    requestedInitialLocationRef.current = true
    triggerGeolocation()
  }, [triggerGeolocation])

  // Handle popup interactions
  useEffect(() => {
    const handleViewJobPost = (e) => {
      const jobPostId = e.detail?.jobPostId
      if (jobPostId) {
        navigate(`/app/job-posts/${jobPostId}`)
      }
    }

    const handleViewWorker = (e) => {
      const workerId = e.detail?.workerId
      if (workerId) {
        navigate(`/app/worker/${workerId}`)
      }
    }

    window.addEventListener('view-jobpost', handleViewJobPost)
    window.addEventListener('view-worker', handleViewWorker)

    return () => {
      window.removeEventListener('view-jobpost', handleViewJobPost)
      window.removeEventListener('view-worker', handleViewWorker)
    }
  }, [navigate])

  return (
    <div className="jobpost-discovery-map">
      <aside className="map-sidebar">
        <div className="map-sidebar-header">
          <h2>Khám phá công việc</h2>
          <p>Tìm công việc gần bạn trên bản đồ</p>

          <div className={`location-status-badge ${status}`}>
            <span className={`status-dot ${status === 'pending' ? 'pulsing' : ''}`} />
            <span>{statusText}</span>
          </div>

          <button
            type="button"
            className="update-location-btn"
            onClick={triggerGeolocation}
            disabled={status === 'pending'}
          >
            Cập nhật vị trí hiện tại
          </button>
        </div>

        <div className="map-search-filters">
          <h3>Lọc theo loại công việc</h3>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${selectedJobType === '' ? 'active' : ''}`}
              onClick={() => handleJobTypeChange('')}
            >
              Tất cả
            </button>
            {jobTypes.map((type) => {
              const labels = {
                DIEN: 'Điện',
                NUOC: 'Nước',
                HARM: 'Sửa chữa',
                CLEAN: 'Vệ sinh',
              }
              return (
                <button
                  key={type}
                  className={`filter-btn ${selectedJobType === type ? 'active' : ''}`}
                  onClick={() => handleJobTypeChange(type)}
                >
                  {labels[type]}
                </button>
              )
            })}
          </div>
        </div>

        <div className="map-stats">
          <div className="stat-item">
            <span className="stat-label">Công việc:</span>
            <span className="stat-value">{jobPosts.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Thợ khác:</span>
            <span className="stat-value">{workers.length}</span>
          </div>
        </div>
      </aside>

      <section className="map-content">
        <div className="map-container" ref={mapRef} />
      </section>
    </div>
  )
}

export default JobPostDiscoveryMap
