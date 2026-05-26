import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useLanguage } from '../../i18n/LanguageContext'
import { getUserLocations } from '../../services/userService'
import '../../styles/modules/location-picker.css'

function LocationPicker({ onLocationSelect, initialLat, initialLng }) {
  const { session } = useAuth()
  const { t } = useLanguage()
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)

  const [latitude, setLatitude] = useState(initialLat || null)
  const [longitude, setLongitude] = useState(initialLng || null)
  const [selectedMethod, setSelectedMethod] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [userLocation, setUserLocation] = useState(null)

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
        console.error(t('jobpost.location.profileLoadError'), err)
      }
    }
    fetchUserLocation()
  }, [session?.id, t])

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

    map.on('click', (e) => {
      const { lat, lng } = e.latlng
      setLatitude(lat)
      setLongitude(lng)
      setSelectedMethod('map')
      updateMarker(lat, lng, map)
      onLocationSelect(lat, lng)
    })

    if (initialLat && initialLng) {
      updateMarker(initialLat, initialLng, map)
      map.setView([initialLat, initialLng], 16)
    }

    setTimeout(() => map.invalidateSize(), 100)
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  const updateMarker = (lat, lng, map) => {
    if (markerRef.current) map.removeLayer(markerRef.current)
    markerRef.current = window.L
      .marker([lat, lng], {
        icon: window.L.divIcon({
          className: 'leaflet-custom-job-marker',
          html: '<div class="job-marker-dot"><svg viewBox="0 0 24 24" fill="#ef4444" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="8"/></svg></div>',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        }),
      })
      .addTo(map)
    map.setView([lat, lng], 16)
  }

  const handleUseCurrentLocation = () => {
    setLoading(true)
    setError(null)
    if (!navigator.geolocation) {
      setError(t('jobpost.map.status.unsupported'))
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
        if (mapInstanceRef.current) updateMarker(lat, lng, mapInstanceRef.current)
        setLoading(false)
      },
      (err) => {
        setError(t('jobpost.location.currentError', { message: err.message }))
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div className="location-picker">
      <div className="location-picker-header">
        <h3>{t('jobpost.location.title')}</h3>
        <p>{t('jobpost.location.subtitle')}</p>
      </div>
      <div className="location-map-container" ref={mapRef} />
      <div className="location-options">
        <button className={`location-option-btn ${selectedMethod === 'current' ? 'active' : ''}`} onClick={handleUseCurrentLocation} disabled={loading}>
          <span className="option-icon">📍</span>
          <span className="option-text">{loading ? t('jobpost.location.loadingCurrent') : t('jobpost.location.useCurrent')}</span>
        </button>
        {userLocation && (
          <button className={`location-option-btn ${selectedMethod === 'profile' ? 'active' : ''}`} onClick={() => {
            setLatitude(userLocation.latitude); setLongitude(userLocation.longitude); setSelectedMethod('profile'); onLocationSelect(userLocation.latitude, userLocation.longitude); if (mapInstanceRef.current) updateMarker(userLocation.latitude, userLocation.longitude, mapInstanceRef.current)
          }}>
            <span className="option-icon">👤</span>
            <span className="option-text">{t('jobpost.location.useProfile')}</span>
          </button>
        )}
        <button className={`location-option-btn ${selectedMethod === 'map' ? 'active' : ''}`} disabled>
          <span className="option-icon">🗺️</span>
          <span className="option-text">{t('jobpost.location.clickMap')}</span>
        </button>
      </div>
      {error && <div className="location-error">{error}</div>}
      {latitude && longitude && (
        <div className="location-display">
          <div className="location-coords">
            <span className="coord-label">{t('jobpost.location.selected')}:</span>
            <span className="coord-value">{latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
          </div>
          <button className="btn-clear-location" onClick={() => { setLatitude(null); setLongitude(null); setSelectedMethod(null); setError(null); if (markerRef.current && mapInstanceRef.current) { mapInstanceRef.current.removeLayer(markerRef.current); markerRef.current = null } onLocationSelect(null, null) }}>
            {t('jobpost.location.clear')}
          </button>
        </div>
      )}
    </div>
  )
}

export default LocationPicker
