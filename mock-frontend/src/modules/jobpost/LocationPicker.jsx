import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { getUserLocations } from '../../services/userService'
import '../../styles/modules/location-picker.css'

function LocationPicker({ onLocationSelect, initialLat, initialLng }) {
  const { session } = useAuth()
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)

  const [latitude, setLatitude] = useState(initialLat || null)
  const [longitude, setLongitude] = useState(initialLng || null)
  const [selectedMethod, setSelectedMethod] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [userLocation, setUserLocation] = useState(null)

  // Fetch user profile location
  useEffect(() => {
    const fetchUserLocation = async () => {
      try {
        const data = await getUserLocations()
        const currentUser = data.find((u) => u.id === session?.id)
        if (currentUser?.latitude && currentUser?.longitude) {
          setUserLocation({
            latitude: currentUser.latitude,
            longitude: currentUser.longitude,
            fullName: currentUser.fullName,
          })
        }
      } catch (err) {
        console.error('Không thể tải vị trí hồ sơ:', err)
      }
    }
    fetchUserLocation()
  }, [session?.id])

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !window.L) return

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

    // Handle map clicks
    map.on('click', (e) => {
      const { lat, lng } = e.latlng
      setLatitude(lat)
      setLongitude(lng)
      setSelectedMethod('map')
      updateMarker(lat, lng, map)
      onLocationSelect(lat, lng)
    })

    // Set initial marker if location provided
    if (initialLat && initialLng) {
      updateMarker(initialLat, initialLng, map)
      map.setView([initialLat, initialLng], 16)
    }

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

  const updateMarker = (lat, lng, map) => {
    if (markerRef.current) {
      map.removeLayer(markerRef.current)
    }

    const marker = window.L.marker([lat, lng], {
      icon: window.L.divIcon({
        className: 'leaflet-custom-job-marker',
        html: `<div class="job-marker-dot"><svg viewBox="0 0 24 24" fill="#ef4444" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="8"/></svg></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      }),
    }).addTo(map)

    markerRef.current = marker
    map.setView([lat, lng], 16)
  }

  const handleUseCurrentLocation = () => {
    setLoading(true)
    setError(null)

    if (!navigator.geolocation) {
      setError('Trình duyệt không hỗ trợ GPS')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setLatitude(lat)
        setLongitude(lng)
        setSelectedMethod('current')
        onLocationSelect(lat, lng)

        if (mapInstanceRef.current) {
          updateMarker(lat, lng, mapInstanceRef.current)
        }
        setLoading(false)
      },
      (err) => {
        setError('Không thể lấy vị trí hiện tại: ' + err.message)
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleUseProfileLocation = () => {
    if (!userLocation) {
      setError('Không tìm thấy vị trí hồ sơ')
      return
    }

    setLatitude(userLocation.latitude)
    setLongitude(userLocation.longitude)
    setSelectedMethod('profile')
    onLocationSelect(userLocation.latitude, userLocation.longitude)

    if (mapInstanceRef.current) {
      updateMarker(userLocation.latitude, userLocation.longitude, mapInstanceRef.current)
    }
  }

  const handleClearLocation = () => {
    setLatitude(null)
    setLongitude(null)
    setSelectedMethod(null)
    setError(null)

    if (markerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(markerRef.current)
      markerRef.current = null
    }

    onLocationSelect(null, null)
  }

  return (
    <div className="location-picker">
      <div className="location-picker-header">
        <h3>Chọn vị trí công việc</h3>
        <p>Nhấp trên bản đồ hoặc sử dụng các tùy chọn dưới đây</p>
      </div>

      <div className="location-map-container" ref={mapRef} />

      <div className="location-options">
        <button
          className={`location-option-btn ${selectedMethod === 'current' ? 'active' : ''}`}
          onClick={handleUseCurrentLocation}
          disabled={loading}
        >
          <span className="option-icon">📍</span>
          <span className="option-text">
            {loading ? 'Đang lấy vị trí...' : 'Dùng vị trí hiện tại'}
          </span>
        </button>

        {userLocation && (
          <button
            className={`location-option-btn ${selectedMethod === 'profile' ? 'active' : ''}`}
            onClick={handleUseProfileLocation}
          >
            <span className="option-icon">👤</span>
            <span className="option-text">Dùng vị trí hồ sơ</span>
          </button>
        )}

        <button
          className={`location-option-btn ${selectedMethod === 'map' ? 'active' : ''}`}
          disabled
        >
          <span className="option-icon">🗺️</span>
          <span className="option-text">Nhấp trên bản đồ để chọn</span>
        </button>
      </div>

      {error && <div className="location-error">{error}</div>}

      {latitude && longitude && (
        <div className="location-display">
          <div className="location-coords">
            <span className="coord-label">Vị trí đã chọn:</span>
            <span className="coord-value">
              {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </span>
          </div>
          <button className="btn-clear-location" onClick={handleClearLocation}>
            Xóa vị trí
          </button>
        </div>
      )}
    </div>
  )
}

export default LocationPicker
