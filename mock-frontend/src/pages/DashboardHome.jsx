import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { updateLocation, getUserLocations } from '../services/userService'
import ChatContainer from '../modules/chat/components/ChatContainer'
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
  const page = content[section]
  
  // Geolocation & OpenStreetMap (Leaflet) State
  const mapRef = useRef(null)
  const [mapInstance, setMapInstance] = useState(null)
  const [users, setUsers] = useState([])
  const [activeUserId, setActiveUserId] = useState(null)
  const [status, setStatus] = useState('pending') // pending, active, error
  const [statusText, setStatusText] = useState('Đang kết nối GPS...')
  
  const markersRef = useRef({})

  const loadLeafletScript = (callback) => {
    if (window.L) {
      callback()
      return
    }

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    const existingScript = document.getElementById('leaflet-script')
    if (existingScript) {
      existingScript.addEventListener('load', callback)
      return
    }

    const script = document.createElement('script')
    script.id = 'leaflet-script'
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.async = true
    script.onload = () => callback()
    document.head.appendChild(script)
  }

  const renderMarkers = (map, userList, currentUserId) => {
    // Clear old markers
    Object.keys(markersRef.current).forEach((key) => {
      map.removeLayer(markersRef.current[key])
    })
    markersRef.current = {}

    userList.forEach((user) => {
      if (!user.latitude || !user.longitude) return
      
      const isMe = user.id === currentUserId
      const position = [user.latitude, user.longitude]
      
      let markerOptions = {}
      if (isMe && window.L) {
        markerOptions.icon = window.L.divIcon({
          className: 'leaflet-custom-me-marker',
          html: '<div class="me-marker-pulse"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
      }

      const marker = window.L.marker(position, markerOptions).addTo(map)
      
      const isMeTag = isMe ? ' (Bạn)' : ''
      const roleText = user.role === 'TECHNICIAN' ? 'Thợ sửa chữa' : 'Khách hàng'
      
      const chatButtonHtml = !isMe ? `
        <div style="margin-top: 8px;">
          <a href="/app/chat?contactId=${user.id}&name=${encodeURIComponent(user.fullName)}&role=${user.role}" 
             style="display: inline-block; font-size: 11px; font-weight: bold; color: #ffffff; background: #3b82f6; padding: 5px 10px; border-radius: 4px; text-decoration: none; text-align: center; width: 100%; box-sizing: border-box; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);">
            Nhắn tin
          </a>
        </div>
      ` : ''

      marker.bindPopup(`
        <div style="padding: 5px; font-family: sans-serif; color: #1e293b; min-width: 150px;">
          <strong style="display: block; font-size: 14px;">${user.fullName}${isMeTag}</strong>
          <span style="display: block; font-size: 11px; color: #64748b; margin-top: 2px;">Vĩ độ: ${user.latitude.toFixed(5)}, Kinh độ: ${user.longitude.toFixed(5)}</span>
          <span style="display: inline-block; font-size: 10px; font-weight: bold; background: #eff6ff; color: #1e40af; padding: 2px 6px; border-radius: 4px; margin-top: 6px; text-transform: uppercase;">
            ${roleText}
          </span>
          ${chatButtonHtml}
        </div>
      `)

      marker.on('click', () => {
        setActiveUserId(user.id)
      })

      markersRef.current[user.id] = marker
    })
  }

  const fetchLocations = async (myLat, myLng) => {
    try {
      const data = await getUserLocations()
      setUsers(data)
      
      loadLeafletScript(() => {
        if (!mapRef.current) return
        
        const myCenter = myLat && myLng ? [myLat, myLng] : [10.7769, 106.7009]
        
        let map = mapInstance
        if (!map) {
          map = window.L.map(mapRef.current).setView(myCenter, 14)
          
          window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
          }).addTo(map)
          
          setMapInstance(map)
        } else if (myLat && myLng) {
          map.setView(myCenter, map.getZoom())
        }
        
        renderMarkers(map, data, session?.id)
      })
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
          await updateLocation(latitude, longitude)
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
    if (mapInstance && window.L) {
      const position = [user.latitude, user.longitude]
      mapInstance.setView(position, 16)
      
      const marker = markersRef.current[user.id]
      if (marker) {
        marker.openPopup()
      }
    }
  }

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

          <div className="users-list-container">
            <h3 className="users-list-title">Đang hoạt động ({users.filter(u => u.latitude && u.longitude).length})</h3>
            {users.length === 0 ? (
              <p className="no-users-notice">Không tìm thấy người dùng trực tuyến nào.</p>
            ) : (
              users.map((user) => (
                <div 
                  key={user.id} 
                  className={`user-location-item ${user.id === activeUserId ? 'active' : ''} ${user.role?.toLowerCase()}`}
                  onClick={() => handleSelectUser(user)}
                >
                  <div className="user-avatar-circle">
                    {user.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'US'}
                  </div>
                  <div className="user-info-text" style={{ display: 'flex', flexDirection: 'column' }}>
                    <strong>{user.fullName} {user.id === session?.id ? '(Bạn)' : ''}</strong>
                    <span>{user.phone || 'Không có SĐT'}</span>
                    <span className={`role-tag ${user.role?.toLowerCase()}`}>{user.role}</span>
                    {user.id === activeUserId && user.id !== session?.id && (
                      <button
                        type="button"
                        className="chat-now-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/app/chat?contactId=${user.id}&name=${encodeURIComponent(user.fullName)}&role=${user.role}`)
                        }}
                        style={{
                          marginTop: '8px',
                          padding: '6px 12px',
                          background: '#3b82f6',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'inline-block',
                          boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)',
                          width: 'fit-content'
                        }}
                      >
                        Nhắn tin
                      </button>
                    )}
                  </div>
                </div>
              ))
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

  if (section === 'Chat') {
    return (
      <div className="chat-section-wrapper" style={{ padding: '24px' }}>
        <ChatContainer />
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
