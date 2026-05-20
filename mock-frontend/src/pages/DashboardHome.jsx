import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { updateLocation, getUserLocations } from '../services/userService'
import './DashboardHome.css'
import './MapDashboard.css'

const content = {
  Activity: {
    customerTitle: 'Activity',
    technicianTitle: 'Activity',
    description: 'Theo dõi lịch sử đặt lịch, trạng thái công việc và các cập nhật mới nhất.',
  },
  Chat: {
    customerTitle: 'Chat',
    technicianTitle: 'Chat',
    description: 'Không gian nhắn tin giữa khách hàng và thợ.',
  },
  Wallet: {
    customerTitle: 'Wallet',
    technicianTitle: 'Wallet · Voucher/Thu nhập',
    description: 'Theo dõi thu nhập, ví tiền và voucher dành cho worker.',
  },
  Profile: {
    customerTitle: 'Profile',
    technicianTitle: 'Profile',
    description: 'Quản lý thông tin cá nhân và trạng thái xác minh.',
  },
}

export function DashboardHome({ section = 'Home' }) {
  const { mode, session } = useAuth()
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
  const [statusText, setStatusText] = useState('Đang kết nối GPS...')
  
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
      case 'DIEN': return 'Điện'
      case 'NUOC': return 'Nước'
      case 'DIEU_HOA': return 'Điều hòa'
      case 'SUA_XE': return 'Sửa xe'
      case 'XAY_DUNG': return 'Xây dựng'
      case 'DON_DEP': return 'Dọn dẹp'
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
          html: `<div class="worker-marker-dot"><span>🔧</span></div>`,
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
      
      const isMeTag = isMe ? ' (Bạn)' : ''
      const roleLabel = isTechnician 
        ? `Thợ sửa chữa` 
        : 'Khách hàng'
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
          <span style="display:block;font-size:11px;color:#64748b;margin-top:2px;">${user.phone || 'Không có SĐT'}</span>
      `

      if (!isMe && myLat && myLng) {
        const dist = calculateDistance(myLat, myLng, user.latitude, user.longitude)
        popupContent += `<span style="display:block;font-size:11px;color:#2563eb;font-weight:600;margin-top:3px;">📍 Cách bạn: ${dist.toFixed(2)} km</span>`
      }

      popupContent += `
          <div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:8px;">
            <span style="display:inline-block;font-size:10px;font-weight:700;background:${roleBg};color:${roleColor};padding:2px 8px;border-radius:4px;text-transform:uppercase;">${roleLabel}</span>
            ${jobLabel ? `<span style="display:inline-block;font-size:10px;font-weight:700;background:${jobBg};color:${jobColor};padding:2px 8px;border-radius:4px;">${jobLabel}</span>` : ''}
          </div>
          ${(!isMe && isTechnician) ? `<button class="popup-view-profile-btn" data-userid="${user.id}" style="margin-top:10px;width:100%;padding:6px 0;border:none;border-radius:8px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#fff;font-size:12px;font-weight:600;cursor:pointer;transition:opacity 0.2s;">Xem hồ sơ thợ</button>` : ''}
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

      const filteredData = normalizedData.filter(user => user.role === 'TECHNICIAN' || user.id === currentUserId)
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
      setStatusText('Trình duyệt không hỗ trợ GPS')
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
          setStatus('active')
          setStatusText('Vị trí của bạn đã đồng bộ')
          fetchLocations(latitude, longitude)
        } catch (err) {
          setStatus('error')
          setStatusText('Lỗi lưu tọa độ lên máy chủ')
          fetchLocations()
        }
      },
      (err) => {
        setStatus('error')
        setStatusText('Quyền truy cập vị trí bị từ chối')
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

  // Get coordinates of the currently logged-in user
  const currentUser = users.find(u => u.id === currentUserId)
  const myLat = currentUser?.latitude
  const myLng = currentUser?.longitude

  // Filter list
  const filteredUsers = users.filter(user => {
    // Always keep current user
    if (user.id === currentUserId) return true

    // Only show workers
    if (user.role !== 'TECHNICIAN') return false

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
        <aside className="map-sidebar" aria-label="Location Control Panel">
          <div className="map-sidebar-header">
            <h2>Định vị trực tuyến</h2>
            <p>Tìm kiếm thợ sửa chữa và người dùng xung quanh bạn theo thời gian thực.</p>
            
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
            <input 
              type="text" 
              placeholder="Tìm thợ theo tên, SĐT, nghề..." 
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
                <option value="">Tất cả nghề</option>
                <option value="DIEN">Điện</option>
                <option value="NUOC">Nước</option>
                <option value="DIEU_HOA">Điều hòa</option>
                <option value="SUA_XE">Sửa xe</option>
                <option value="XAY_DUNG">Xây dựng</option>
                <option value="DON_DEP">Dọn dẹp</option>
              </select>

              <label className="nearby-toggle-label">
                <input 
                  type="checkbox" 
                  checked={onlyNearby} 
                  onChange={(e) => setOnlyNearby(e.target.checked)} 
                />
                <span>Gần đây (≤ 10km)</span>
              </label>
            </div>
          </div>

          <div className="users-list-container">
            <h3 className="users-list-title">Đang hoạt động ({sortedFilteredUsers.filter(u => u.latitude && u.longitude).length})</h3>
            {sortedFilteredUsers.length === 0 ? (
              <p className="no-users-notice">Không tìm thấy thợ phù hợp.</p>
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
                    <div className="user-avatar-circle">
                      {isTechnician ? '🔧' : (user.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'US')}
                    </div>
                    <div className="user-info-text">
                      <strong>{user.fullName} {isMe ? '(Bạn)' : ''}</strong>
                      <span>{user.phone || 'Không có SĐT'}</span>
                      <div className="role-job-tags">
                        <span className={`role-tag ${user.role?.toLowerCase()}`}>
                          {isTechnician ? 'Thợ sửa chữa' : user.role}
                        </span>
                        {user.jobType && (
                          <span className="job-tag">{translateJobType(user.jobType)}</span>
                        )}
                        {distance !== null && (
                          <span className="distance-tag">{distance.toFixed(1)} km</span>
                        )}
                        {!user.latitude && !user.longitude && (
                          <span className="no-location-tag">Chưa có vị trí</span>
                        )}
                      </div>
                      {!isMe && isTechnician && (
                        <button 
                          className="sidebar-view-profile-btn"
                          onClick={(e) => { e.stopPropagation(); navigate(`/app/worker/${user.id}`) }}
                        >
                          Xem hồ sơ
                        </button>
                      )}
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
            <h3>OpenStreetMap Live</h3>
            <p>Sử dụng các cử chỉ kéo, cuộn để khám phá khu vực xung quanh. Bản đồ tự động cập nhật markers khi có tài khoản mới hoạt động.</p>
          </div>
        </div>
      </div>
    )
  }

  // Render normal tabs if not Home page
  const title = mode === 'TECHNICIAN' ? page.technicianTitle : page.customerTitle
  return (
    <section className="dashboard-surface">
      <div className="dashboard-hero">
        <p>{mode === 'TECHNICIAN' ? 'Worker mode' : 'User mode'}</p>
        <h1>{title}</h1>
        <span>{page.description}</span>
      </div>

      <div className="dashboard-grid">
        <article>
          <strong>Trạng thái</strong>
          <span>Sẵn sàng tích hợp module business.</span>
        </article>
        <article>
          <strong>Role hiện tại</strong>
          <span>{mode}</span>
        </article>
        <article>
          <strong>Module</strong>
          <span>{section}</span>
        </article>
      </div>
    </section>
  )
}
