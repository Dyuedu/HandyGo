import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { updateLocation, getUserLocations, updateWorkerAvailability } from '../services/userService'
import ChatContainer from '../modules/chat/components/ChatContainer'
import WalletScreen from '../modules/payment/components/WalletScreen'
import SubscriptionScreen from '../modules/payment/components/SubscriptionScreen'
import { AppIcon } from '../components/AppIcon'
import { useLanguage } from '../i18n/LanguageContext'
import '../styles/pages/DashboardHome.css'
import '../styles/pages/MapDashboard.css'

const content = {
  Activity: {
    customerTitleKey: 'section.activity',
    technicianTitleKey: 'section.activity',
    descriptionKey: 'booking.description',
  },
  Chat: {
    customerTitleKey: 'section.chat',
    technicianTitleKey: 'section.chat',
    descriptionKey: 'section.chat',
  },
  Wallet: {
    customerTitleKey: 'section.wallet',
    technicianTitleKey: 'section.wallet',
    descriptionKey: 'wallet.description',
  },
  Subscription: {
    customerTitleKey: 'section.subscription',
    technicianTitleKey: 'subscription.title',
    descriptionKey: 'subscription.description',
  },
  Profile: {
    customerTitleKey: 'section.profile',
    technicianTitleKey: 'section.profile',
    descriptionKey: 'profile.description',
  },
}

export function DashboardHome({ section = 'Home' }) {
  const { mode, session } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const currentUserId = session?.id || localStorage.getItem('my_user_id')
  const page = content[section]
  
  // Geolocation & OpenStreetMap (Leaflet) State
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const [mapInstance, setMapInstance] = useState(null)
  const [users, setUsers] = useState([])
  const [activeUserId, setActiveUserId] = useState(null)
  const [status, setStatus] = useState('pending') // pending, active, error
  const [statusTextKey, setStatusTextKey] = useState('dashboard.map.status.connecting')
  const [availabilityUpdating, setAvailabilityUpdating] = useState(false)
  
  const markersRef = useRef({})
  const circleRef = useRef(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [jobTypeFilter, setJobTypeFilter] = useState('')
  const [onlyNearby, setOnlyNearby] = useState(false)

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null
    const R = 6371 // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const translateJobType = (job) => {
    if (!job) return ''
    const j = job.trim().toUpperCase()
    switch (j) {
      case 'DIEN': return t('job.DIEN')
      case 'NUOC': return t('job.NUOC')
      case 'DIEU_HOA': return t('job.DIEU_HOA')
      case 'SUA_XE': return t('job.SUA_XE')
      case 'XAY_DUNG': return t('job.XAY_DUNG')
      case 'DON_DEP': return t('job.DON_DEP')
      default: return job
    }
  }

  // Listen for popup profile click events from Leaflet popups
  useEffect(() => {
    const handler = (e) => {
      const userId = e.detail?.userId
      if (userId) {
        navigate(`/app/worker/${userId}`)
      }
    }
    window.addEventListener('open-worker-profile', handler)
    return () => window.removeEventListener('open-worker-profile', handler)
  }, [navigate])

  const renderMarkers = (map, userList, currentUserId, myLat, myLng) => {
    if (!window.L) return
    
    // Clear old markers
    Object.keys(markersRef.current).forEach((key) => {
      map.removeLayer(markersRef.current[key])
    })
    markersRef.current = {}

    // Clear old circle if exists
    if (circleRef.current) {
      map.removeLayer(circleRef.current)
      circleRef.current = null
    }

    userList.forEach((user) => {
      if (!user.latitude || !user.longitude) return

      const isMe = user.id === currentUserId
      const isTechnician = user.role === 'TECHNICIAN'
      if (mode === 'CUSTOMER' && isTechnician && user.verified === false) return
      const position = [user.latitude, user.longitude]
      
      let markerOptions = {}
      if (isMe) {
        markerOptions.icon = window.L.divIcon({
          className: 'leaflet-custom-me-marker',
          html: '<div class="me-marker-pulse"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })

        // Draw 10km radius circle around the logged-in user
        const circle = window.L.circle(position, {
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.08,
          weight: 1.5,
          dashArray: '5, 5',
          radius: 10000 // 10km in meters
        }).addTo(map)
        circleRef.current = circle
      } else if (isTechnician) {
        // Worker-specific marker with wrench icon
        markerOptions.icon = window.L.divIcon({
          className: 'leaflet-custom-worker-marker',
          html: '<div class="worker-marker-dot"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.7 6.3a4 4 0 0 0-5 5L3 18v3h3l6.7-6.7a4 4 0 0 0 5-5l-2.4 2.4-3-3 2.4-2.4z"/></svg></div>',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        })
      } else {
        // Regular user marker
        markerOptions.icon = window.L.divIcon({
          className: 'leaflet-custom-user-marker',
          html: '<div class="user-marker-dot"></div>',
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        })
      }

      const marker = window.L.marker(position, markerOptions).addTo(map)
      
      const isMeTag = isMe ? ` (${t('dashboard.map.you')})` : ''
      const roleLabel = isTechnician ? t('dashboard.map.workerRole') : t('common.customer')
      const jobLabel = isTechnician && user.jobType ? translateJobType(user.jobType) : ''
      const roleBg = isTechnician ? '#fef3c7' : '#e0f2fe'
      const roleColor = isTechnician ? '#d97706' : '#0369a1'
      const jobBg = '#f1f5f9'
      const jobColor = '#475569'

      // Build popup with clickable name for workers
      const nameHtml = (!isMe && isTechnician)
        ? `<a href="#" class="popup-worker-link" data-userid="${user.id}" style="display:block;font-size:14px;font-weight:700;color:#1e40af;text-decoration:none;cursor:pointer;">${user.fullName}${isMeTag}</a>`
        : `<strong style="display:block;font-size:14px;color:#1e293b;">${user.fullName}${isMeTag}</strong>`
      
      let popupContent = `
        <div class="marker-popup-content">
          ${nameHtml}
          <span style="display:block;font-size:11px;color:#64748b;margin-top:2px;">${user.phone || t('dashboard.map.noPhone')}</span>
      `

      if (!isMe && myLat && myLng) {
        const dist = calculateDistance(myLat, myLng, user.latitude, user.longitude)
        popupContent += `<span style="display:block;font-size:11px;color:#2563eb;font-weight:600;margin-top:3px;">${t('dashboard.map.distance', { distance: dist.toFixed(2) })}</span>`
      }

      popupContent += `
          <div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:8px;">
            <span style="display:inline-block;font-size:10px;font-weight:700;background:${roleBg};color:${roleColor};padding:2px 8px;border-radius:4px;text-transform:uppercase;">${roleLabel}</span>
            ${jobLabel ? `<span style="display:inline-block;font-size:10px;font-weight:700;background:${jobBg};color:${jobColor};padding:2px 8px;border-radius:4px;">${jobLabel}</span>` : ''}
          </div>
          ${(!isMe && isTechnician) ? `<button class="popup-view-profile-btn" data-userid="${user.id}" style="margin-top:10px;width:100%;padding:6px 0;border:none;border-radius:8px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#fff;font-size:12px;font-weight:600;cursor:pointer;transition:opacity 0.2s;">${t('dashboard.map.workerProfile')}</button>` : ''}
        </div>
      `

      marker.bindPopup(popupContent, { maxWidth: 240, className: 'custom-leaflet-popup' })

      // Attach click handlers after popup opens
      marker.on('popupopen', () => {
        setTimeout(() => {
          const links = document.querySelectorAll(`.popup-worker-link[data-userid="${user.id}"], .popup-view-profile-btn[data-userid="${user.id}"]`)
          links.forEach(link => {
            link.addEventListener('click', (e) => {
              e.preventDefault()
              e.stopPropagation()
              window.dispatchEvent(new CustomEvent('open-worker-profile', { detail: { userId: user.id } }))
            })
          })
        }, 50)
      })

      marker.on('click', () => {
        setActiveUserId(user.id)
      })

      markersRef.current[user.id] = marker
    })
  }

  const fetchLocations = async (myLat, myLng) => {
    try {
      const data = await getUserLocations()
      
      // Chuẩn hóa và lọc danh sách: Chỉ hiển thị các tài khoản thợ (ROLE_WORKER / TECHNICIAN) và tài khoản đang đăng nhập
      const normalizedData = data.map(user => {
        let normalizedRole = user.role;
        if (user.role === 'ROLE_WORKER' || user.role === 'WORKER') {
          normalizedRole = 'TECHNICIAN';
        }
        return {
          ...user,
          role: normalizedRole
        };
      });

      const filteredData = normalizedData.filter((user) => {
        if (user.id === currentUserId) return true
        if (user.role !== 'TECHNICIAN') return false
        if (mode === 'CUSTOMER' && user.verified === false) return false
        return true
      })
      setUsers(filteredData)
      
      const map = mapInstanceRef.current
      if (map) {
        if (myLat && myLng) {
          map.setView([myLat, myLng], map.getZoom())
        }
        map.invalidateSize()
      }
    } catch (err) {
      console.error('Không thể lấy danh sách tọa độ', err)
    }
  }

  const triggerGeolocation = () => {
    if (!navigator.geolocation) {
      setStatus('error')
      setStatusTextKey('dashboard.map.status.unsupported')
      return
    }

    setStatus('pending')
    setStatusTextKey('dashboard.map.status.connecting')

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const myProfile = await updateLocation(latitude, longitude)
          if (myProfile && myProfile.id) {
            localStorage.setItem('my_user_id', myProfile.id.toString())
          }
          setStatus('active')
          setStatusTextKey('dashboard.map.status.synced')
          fetchLocations(latitude, longitude)
        } catch (err) {
          setStatus('error')
          setStatusTextKey('dashboard.map.status.saveError')
          fetchLocations()
        }
      },
      (err) => {
        setStatus('error')
        setStatusTextKey('dashboard.map.status.denied')
        fetchLocations()
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleSelectUser = (user) => {
    setActiveUserId(user.id)
    if (mapInstance && window.L && user.latitude && user.longitude) {
      const position = [user.latitude, user.longitude]
      mapInstance.setView(position, 16)
      
      const marker = markersRef.current[user.id]
      if (marker) {
        marker.openPopup()
      }
    } else if (user.role === 'TECHNICIAN') {
      // Worker without location: navigate to profile page
      navigate(`/app/worker/${user.id}`)
    }
  }

  const currentUser = users.find(u => u.id === currentUserId)
  const myLat = currentUser?.latitude
  const myLng = currentUser?.longitude

  const handleWorkerAvailabilityChange = async (available) => {
    try {
      setAvailabilityUpdating(true)
      const updated = await updateWorkerAvailability(available)
      setUsers((current) => current.map((user) => user.id === updated.id ? { ...user, ...updated } : user))
      await fetchLocations(myLat, myLng)
    } catch (err) {
      setStatus('error')
      setStatusTextKey('dashboard.map.status.saveError')
    } finally {
      setAvailabilityUpdating(false)
    }
  }

  // Effect 1: Handle Map container mounting and initialization lifecycle
  useEffect(() => {
    if (section !== 'Home') return

    // Allow DOM to fully paint before map binding
    const initTimeout = setTimeout(() => {
      if (!mapRef.current || !window.L) return

      // Clean up previous map if exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }

      const defaultCenter = [10.7769, 106.7009]
      const map = window.L.map(mapRef.current, {
        dragging: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        touchZoom: true,
        tap: false
      }).setView(defaultCenter, 14)
      
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(map)

      mapInstanceRef.current = map
      setMapInstance(map)

      setTimeout(() => {
        map.invalidateSize()
      }, 100)
    }, 150)

    return () => {
      clearTimeout(initTimeout)
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        setMapInstance(null)
      }
    }
  }, [section])

  // Filter list
  const filteredUsers = users.filter(user => {
    // Always keep current user
    if (user.id === currentUserId) return true

    // Only show workers
    if (user.role !== 'TECHNICIAN') return false

    if (mode === 'CUSTOMER' && user.verified === false) return false

    // Filter by text search
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase()
      const nameMatch = user.fullName?.toLowerCase().includes(q)
      const phoneMatch = user.phone?.toLowerCase().includes(q)
      const jobMatch = user.jobType ? translateJobType(user.jobType).toLowerCase().includes(q) || user.jobType.toLowerCase().includes(q) : false
      if (!nameMatch && !phoneMatch && !jobMatch) return false
    }

    // Filter by jobType select dropdown
    if (jobTypeFilter !== '') {
      if (user.jobType !== jobTypeFilter) return false
    }

    // Filter by nearby checkbox (within 10km)
    if (onlyNearby) {
      if (!user.latitude || !user.longitude || !myLat || !myLng) return false
      const dist = calculateDistance(myLat, myLng, user.latitude, user.longitude)
      if (dist === null || dist > 10) return false
    }

    return true
  })

  // Sort list: keep current user at top, then sort others by proximity to current user
  const sortedFilteredUsers = [...filteredUsers].sort((a, b) => {
    if (a.id === currentUserId) return -1
    if (b.id === currentUserId) return 1

    if (myLat && myLng && a.latitude && a.longitude && b.latitude && b.longitude) {
      const distA = calculateDistance(myLat, myLng, a.latitude, a.longitude)
      const distB = calculateDistance(myLat, myLng, b.latitude, b.longitude)
      return (distA || 99999) - (distB || 99999)
    }
    return 0
  })

  // Effect 2: Handle marker rendering Reactively when mapInstance or filters change
  useEffect(() => {
    if (mapInstance) {
      renderMarkers(mapInstance, sortedFilteredUsers, currentUserId, myLat, myLng)
    }
  }, [mapInstance, users, searchQuery, jobTypeFilter, onlyNearby, currentUserId, myLat, myLng])

  // Effect 3: Handle Geolocation fetch
  useEffect(() => {
    if (section === 'Home') {
      triggerGeolocation()
    }
  }, [section])

  // Render Maps view if we are on Home page
  if (section === 'Home') {
    return (
      <div className="map-dashboard-container">
        <aside className="map-sidebar" aria-label={t('dashboard.map.sidebarLabel')}>
          <div className="map-sidebar-header">
            <h2>{t('dashboard.map.title')}</h2>
            <p>{t('dashboard.map.description')}</p>
            
            <div className={`location-status-badge ${status}`}>
              <span className={`status-dot ${status === 'pending' ? 'pulsing' : ''}`} />
              <span>{t(statusTextKey)}</span>
            </div>

            <button
              type="button" 
              className="update-location-btn" 
              onClick={triggerGeolocation}
              disabled={status === 'pending'}
            >
              {t('dashboard.map.updateLocation')}
            </button>

            {mode === 'TECHNICIAN' && currentUser && (
              <div className="worker-availability-panel">
                <label className="availability-toggle">
                  <input
                    type="checkbox"
                    checked={Boolean(currentUser.available)}
                    disabled={availabilityUpdating}
                    onChange={(event) => handleWorkerAvailabilityChange(event.target.checked)}
                  />
                  <span>{currentUser.available ? t('dashboard.map.acceptingJobs') : t('dashboard.map.notAcceptingJobs')}</span>
                </label>
                <div className="availability-flags">
                  <span className={currentUser.eligible ? 'availability-flag visible' : 'availability-flag hidden'}>
                    {currentUser.eligible ? t('dashboard.map.visible') : t('dashboard.map.hidden')}
                  </span>
                  {currentUser.busy && <span className="availability-flag busy">{t('dashboard.map.busy')}</span>}
                  {!currentUser.online && <span className="availability-flag offline">{t('dashboard.map.offline')}</span>}
                  {!currentUser.available && <span className="availability-flag unavailable">{t('dashboard.map.unavailable')}</span>}
                  {!currentUser.verified && <span className="availability-flag unverified">{t('dashboard.map.unverified')}</span>}
                </div>
                <p className="availability-hint">{t('dashboard.map.availabilityHint')}</p>
              </div>
            )}
          </div>

          <div className="map-search-filters">
            <input 
              type="text" 
              placeholder={t('dashboard.map.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            
            <div className="filter-row">
              <select 
                value={jobTypeFilter} 
                onChange={(e) => setJobTypeFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">{t('dashboard.map.allJobs')}</option>
                <option value="DIEN">{t('job.DIEN')}</option>
                <option value="NUOC">{t('job.NUOC')}</option>
                <option value="DIEU_HOA">{t('job.DIEU_HOA')}</option>
                <option value="SUA_XE">{t('job.SUA_XE')}</option>
                <option value="XAY_DUNG">{t('job.XAY_DUNG')}</option>
                <option value="DON_DEP">{t('job.DON_DEP')}</option>
              </select>

              <label className="nearby-toggle-label">
                <input 
                  type="checkbox" 
                  checked={onlyNearby} 
                  onChange={(e) => setOnlyNearby(e.target.checked)} 
                />
                <span>{t('dashboard.map.nearby')}</span>
              </label>
            </div>
          </div>

          <div className="users-list-container">
            <h3 className="users-list-title">{t('dashboard.map.active', { count: sortedFilteredUsers.filter(u => u.eligible && u.latitude && u.longitude).length })}</h3>
            {sortedFilteredUsers.length === 0 ? (
              <p className="no-users-notice">{t('dashboard.map.noWorkers')}</p>
            ) : (
              sortedFilteredUsers.map((user) => {
                const isMe = user.id === currentUserId
                const isTechnician = user.role === 'TECHNICIAN'
                const distance = (!isMe && myLat && myLng && user.latitude && user.longitude)
                  ? calculateDistance(myLat, myLng, user.latitude, user.longitude)
                  : null

                return (
                  <div 
                    key={user.id} 
                    className={`user-location-item ${user.id === activeUserId ? 'active' : ''} ${user.role?.toLowerCase()}`}
                    onClick={() => handleSelectUser(user)}
                  >
                    {/* 1. Phần Avatar */}
                    <div className="user-avatar-circle">
                      {isTechnician ? <AppIcon name="wrench" size={18} strokeWidth={2.4} /> : (user.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'US')}
                    </div>

                    {/* 2. Phần thông tin chữ */}
                    <div className="user-info-text" style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong>{user.fullName} {isMe ? `(${t('dashboard.map.you')})` : ''}</strong>
                      <span>{user.phone || t('dashboard.map.noPhone')}</span>
                      
                      {/* Cụm tag thông tin */}
                      <div className="role-job-tags">
                        <span className={`role-tag ${user.role?.toLowerCase()}`}>
                          {isTechnician ? t('dashboard.map.workerRole') : user.role}
                        </span>
                        {user.jobType && (
                          <span className="job-tag">{translateJobType(user.jobType)}</span>
                        )}
                        {distance !== null && (
                          <span className="distance-tag">{distance.toFixed(1)} km</span>
                        )}
                        {!user.latitude && !user.longitude && (
                          <span className="no-location-tag">{t('dashboard.map.noLocation')}</span>
                        )}
                        {isTechnician && user.busy && (
                          <span className="busy-tag">{t('dashboard.map.busy')}</span>
                        )}
                        {isTechnician && user.id === currentUserId && !user.verified && (
                          <span className="hidden-tag">{t('dashboard.map.unverified')}</span>
                        )}
                        {isTechnician && user.id === currentUserId && !user.eligible && (
                          <span className="hidden-tag">{t('dashboard.map.hidden')}</span>
                        )}
                      </div>

                      {/* 3. Phần Nút bấm hành động */}
                      <div className="action-buttons-group" style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        {!isMe && isTechnician && (
                          <button 
                            type="button"
                            className="sidebar-view-profile-btn"
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              navigate(`/app/worker/${user.id}`); 
                            }}
                          >
                            {t('dashboard.map.viewProfile')}
                          </button>
                        )}

                        {user.id === activeUserId && !isMe && (
                          <button
                            type="button"
                            className="chat-now-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/app/chat?contactId=${user.id}&name=${encodeURIComponent(user.fullName)}&role=${user.role}`);
                            }}
                            style={{
                              padding: '6px 12px',
                              background: '#3b82f6',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)',
                              width: 'fit-content'
                            }}
                          >
                            {t('dashboard.map.chat')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </aside>

        <div className="map-view-wrapper">
          <div ref={mapRef} className="google-map-element" id="google-map-element" />
          <div className="map-overlay-card">
            <h3>{t('dashboard.map.overlayTitle')}</h3>
            <p>{t('dashboard.map.overlayDescription')}</p>
          </div>
        </div>
      </div>
    )
  }

  if (section === 'Chat') {
    return (
      <div className="chat-section-wrapper" style={{ padding: '24px' }}>
        <ChatContainer />
      </div>
    )
  }

  if (section === 'Wallet') {
    return <WalletScreen />
  }

  if (section === 'Subscription') {
    return <SubscriptionScreen />
  }

  if (section === 'Profile') {
    return null
  }

  // Render normal tabs if not Home page
  const title = mode === 'TECHNICIAN' ? t(page.technicianTitleKey) : t(page.customerTitleKey)
  const sectionLabel = page?.customerTitleKey ? t(page.customerTitleKey) : section
  return (
    <section className="dashboard-surface">
      <div className="dashboard-hero">
        <p>{mode === 'TECHNICIAN' ? t('dashboard.mode.worker') : t('dashboard.mode.customer')}</p>
        <h1>{title}</h1>
        <span>{t(page.descriptionKey)}</span>
      </div>

      <div className="dashboard-grid">
        <article>
          <strong>{t('dashboard.status')}</strong>
          <span>{t('dashboard.ready')}</span>
        </article>
        <article>
          <strong>{t('dashboard.currentRole')}</strong>
          <span>{mode === 'TECHNICIAN' ? t('common.worker') : mode === 'ADMIN' ? t('common.admin') : t('common.customer')}</span>
        </article>
        <article>
          <strong>{t('dashboard.module')}</strong>
          <span>{sectionLabel}</span>
        </article>
      </div>
    </section>
  )
}
