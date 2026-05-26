import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useLanguage } from '../../i18n/LanguageContext'
import { updateLocation, getUserLocations } from '../../services/userService'
import { getAllOpenJobPosts, getOpenJobPostsByJobType } from '../../services/jobPostService'
import '../../styles/modules/jobpost-map.css'

function JobPostDiscoveryMap() {
  const { session } = useAuth()
  const { t } = useLanguage()
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
  const [statusText, setStatusText] = useState(t('jobpost.map.status.connecting'))
  const [selectedJobType, setSelectedJobType] = useState('')
  const [myLocation, setMyLocation] = useState(null)

  const jobTypes = ['DIEN', 'NUOC', 'HARM', 'CLEAN']

  const fetchData = useCallback(async (myLat, myLng, jobType = selectedJobType) => {
    try {
      const posts = jobType ? await getOpenJobPostsByJobType(jobType) : await getAllOpenJobPosts()
      setJobPosts(posts)

      const locations = await getUserLocations()
      const normalizedLocations = locations.map((user) => ({
        ...user,
        role: user.role === 'ROLE_WORKER' || user.role === 'WORKER' ? 'TECHNICIAN' : user.role,
      }))
      setWorkers(normalizedLocations.filter((u) => u.role === 'TECHNICIAN' && String(u.id) !== String(currentUserId)))

      if (mapInstanceRef.current && myLat && myLng) {
        mapInstanceRef.current.setView([myLat, myLng], 14)
        mapInstanceRef.current.invalidateSize()
      }
    } catch (err) {
      console.error(t('jobpost.map.status.loadDataError'), err)
    }
  }, [currentUserId, selectedJobType, t])

  useEffect(() => {
    if (!mapRef.current || !window.L) return
    if (mapInstanceRef.current) mapInstanceRef.current.remove()

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
    setTimeout(() => map.invalidateSize(), 100)

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return
    const map = mapInstanceRef.current

    Object.keys(markersRef.current).forEach((key) => map.removeLayer(markersRef.current[key]))
    markersRef.current = {}
    if (circleRef.current) {
      map.removeLayer(circleRef.current)
      circleRef.current = null
    }

    if (myLocation?.latitude && myLocation?.longitude) {
      const position = [myLocation.latitude, myLocation.longitude]
      markersRef.current.me = window.L.marker(position, {
        icon: window.L.divIcon({ className: 'leaflet-custom-me-marker', html: '<div class="me-marker-pulse"></div>', iconSize: [20, 20], iconAnchor: [10, 10] }),
      }).addTo(map)
      circleRef.current = window.L.circle(position, {
        color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.08, weight: 1.5, dashArray: '5, 5', radius: 10000,
      }).addTo(map)
    }

    jobPosts.forEach((post) => {
      if (!post.latitude || !post.longitude) return
      const marker = window.L.marker([post.latitude, post.longitude], {
        icon: window.L.divIcon({
          className: 'leaflet-custom-jobpost-marker',
          html: '<div class="jobpost-marker-dot"><svg viewBox="0 0 24 24" fill="#ef4444" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="8"/></svg></div>',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        }),
      }).addTo(map)

      const distance = myLocation ? calculateDistance(myLocation.latitude, myLocation.longitude, post.latitude, post.longitude) : null
      const popupContent = `
        <div class="jobpost-popup">
          <h4>${post.title}</h4>
          <p class="job-type">${t(`jobpost.type.${post.jobType}`)}</p>
          <p class="address">${post.address}</p>
          <p class="description">${(post.description || '').substring(0, 100)}...</p>
          ${distance ? `<p class="distance">${t('jobpost.map.distance', { distance: distance.toFixed(2) })}</p>` : ''}
          <button onclick="window.dispatchEvent(new CustomEvent('view-jobpost', { detail: { jobPostId: '${post.id}' } }))" class="popup-btn">
            ${t('jobpost.action.viewDetail')}
          </button>
        </div>
      `
      marker.bindPopup(popupContent)
      markersRef.current[post.id] = marker
    })

    workers.forEach((worker) => {
      if (!worker.latitude || !worker.longitude || String(worker.id) === String(currentUserId)) return
      const marker = window.L.marker([worker.latitude, worker.longitude], {
        icon: window.L.divIcon({
          className: 'leaflet-custom-worker-marker',
          html: '<div class="worker-marker-dot"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.7 6.3a4 4 0 0 0-5 5L3 18v3h3l6.7-6.7a4 4 0 0 0 5-5l-2.4 2.4-3-3 2.4-2.4z"/></svg></div>',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        }),
      }).addTo(map)

      const distance = myLocation ? calculateDistance(myLocation.latitude, myLocation.longitude, worker.latitude, worker.longitude) : null
      const popupContent = `
        <div class="worker-popup">
          <h4>${worker.fullName}</h4>
          <p class="job-type">${t(`jobpost.type.${worker.jobType}`)}</p>
          ${distance ? `<p class="distance">${t('jobpost.map.distance', { distance: distance.toFixed(2) })}</p>` : ''}
          <button onclick="window.dispatchEvent(new CustomEvent('view-worker', { detail: { workerId: '${worker.id}' } }))" class="popup-btn">
            ${t('dashboard.map.viewProfile')}
          </button>
        </div>
      `
      marker.bindPopup(popupContent)
      markersRef.current[`worker-${worker.id}`] = marker
    })
  }, [jobPosts, workers, myLocation, currentUserId, t])

  const triggerGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('error')
      setStatusText(t('jobpost.map.status.unsupported'))
      fetchData()
      return
    }
    setStatus('pending')
    setStatusText(t('jobpost.map.status.connecting'))
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const myProfile = await updateLocation(latitude, longitude)
          if (myProfile?.id) localStorage.setItem('my_user_id', myProfile.id.toString())
          setMyLocation({ latitude, longitude })
          setStatus('active')
          setStatusText(t('jobpost.map.status.synced'))
          fetchData(latitude, longitude)
        } catch (err) {
          setStatus('error')
          setStatusText(t('jobpost.map.status.saveError'))
          console.error(t('jobpost.map.status.saveError'), err)
          fetchData()
        }
      },
      (err) => {
        setStatus('error')
        setStatusText(t('jobpost.map.status.denied'))
        console.error(t('jobpost.map.status.denied'), err)
        fetchData()
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [fetchData, t])

  useEffect(() => {
    if (requestedInitialLocationRef.current) return
    requestedInitialLocationRef.current = true
    triggerGeolocation()
  }, [triggerGeolocation])

  useEffect(() => {
    const handleViewJobPost = (e) => e.detail?.jobPostId && navigate(`/app/job-posts/${e.detail.jobPostId}`)
    const handleViewWorker = (e) => e.detail?.workerId && navigate(`/app/worker/${e.detail.workerId}`)
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
          <h2>{t('jobpost.map.title')}</h2>
          <p>{t('jobpost.map.subtitle')}</p>

          <div className={`location-status-badge ${status}`}>
            <span className={`status-dot ${status === 'pending' ? 'pulsing' : ''}`} />
            <span>{statusText}</span>
          </div>

          <button type="button" className="update-location-btn" onClick={triggerGeolocation} disabled={status === 'pending'}>
            {t('jobpost.map.updateLocation')}
          </button>
        </div>

        <div className="map-search-filters">
          <h3>{t('jobpost.discovery.filterTitle')}</h3>
          <div className="filter-buttons">
            <button className={`filter-btn ${selectedJobType === '' ? 'active' : ''}`} onClick={() => { setSelectedJobType(''); fetchData(myLocation?.latitude, myLocation?.longitude, '') }}>
              {t('jobpost.discovery.allJobs')}
            </button>
            {jobTypes.map((type) => (
              <button key={type} className={`filter-btn ${selectedJobType === type ? 'active' : ''}`} onClick={() => { setSelectedJobType(type); fetchData(myLocation?.latitude, myLocation?.longitude, type) }}>
                {t(`jobpost.type.${type}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="map-stats">
          <div className="stat-item">
            <span className="stat-label">{t('jobpost.map.jobs')}:</span>
            <span className="stat-value">{jobPosts.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">{t('jobpost.map.otherWorkers')}:</span>
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
