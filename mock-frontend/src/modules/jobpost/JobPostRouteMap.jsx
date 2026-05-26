import { useCallback, useEffect, useRef, useState } from 'react'
import { useLanguage } from '../../i18n/LanguageContext'
import { getUserLocations } from '../../services/userService'
import '../../styles/modules/jobpost-route.css'

function JobPostRouteMap({ open, onClose, destLat, destLng, destLabel }) {
  const { t } = useLanguage()
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const routeLayerRef = useRef(null)
  const routeMarkersRef = useRef([])
  const [routeInfo, setRouteInfo] = useState(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [locationError, setLocationError] = useState('')

  const clearRoute = useCallback(() => {
    const map = mapInstanceRef.current
    if (routeLayerRef.current && map) {
      map.removeLayer(routeLayerRef.current)
      routeLayerRef.current = null
    }
    routeMarkersRef.current.forEach((m) => map?.removeLayer(m))
    routeMarkersRef.current = []
    setRouteInfo(null)
  }, [])

  const resolveMyPosition = useCallback(async () => {
    const currentUserId = localStorage.getItem('my_user_id')
    if (currentUserId) {
      try {
        const locations = await getUserLocations()
        const me = locations?.find((u) => String(u.id) === String(currentUserId))
        if (me?.latitude != null && me?.longitude != null) {
          return { lat: me.latitude, lng: me.longitude }
        }
      } catch {
        /* fallback to geolocation */
      }
    }

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('no-geolocation'))
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => reject(new Error('geo-denied')),
        { enableHighAccuracy: true, timeout: 12000 }
      )
    })
  }, [])

  const drawRoute = useCallback(async (fromLat, fromLng, toLat, toLng) => {
    const map = mapInstanceRef.current
    if (!map || !window.L) return

    clearRoute()
    setRouteLoading(true)
    setLocationError('')

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`
      const res = await fetch(url)
      const json = await res.json()

      if (json.code === 'Ok' && json.routes?.length) {
        const route = json.routes[0]
        const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng])
        const distKm = (route.distance / 1000).toFixed(1)
        const durMin = Math.ceil(route.duration / 60)
        setRouteInfo({ distance: distKm, duration: durMin })

        const polyline = window.L.polyline(coords, {
          color: '#3b82f6',
          weight: 5,
          opacity: 0.85,
        }).addTo(map)
        routeLayerRef.current = polyline
        map.fitBounds(polyline.getBounds(), { padding: [48, 48] })
      } else {
        throw new Error('no-route')
      }

      const startMarker = window.L.marker([fromLat, fromLng]).addTo(map)
      const endMarker = window.L.marker([toLat, toLng]).addTo(map)
      routeMarkersRef.current = [startMarker, endMarker]
    } catch {
      const polyline = window.L.polyline(
        [
          [fromLat, fromLng],
          [toLat, toLng],
        ],
        { color: '#f59e0b', weight: 4, dashArray: '8, 8' }
      ).addTo(map)
      routeLayerRef.current = polyline
      map.fitBounds(polyline.getBounds(), { padding: [48, 48] })
      setRouteInfo(null)
    } finally {
      setRouteLoading(false)
    }
  }, [clearRoute])

  useEffect(() => {
    if (!open || !mapRef.current || !window.L || destLat == null || destLng == null) return

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }

    const map = window.L.map(mapRef.current, { zoomControl: true }).setView([destLat, destLng], 14)
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map)
    mapInstanceRef.current = map

    window.L.marker([destLat, destLng]).addTo(map).bindPopup(destLabel || t('jobpost.route.destination'))

    let cancelled = false
    ;(async () => {
      try {
        const from = await resolveMyPosition()
        if (cancelled) return
        await drawRoute(from.lat, from.lng, destLat, destLng)
      } catch {
        if (!cancelled) {
          setLocationError(t('jobpost.route.noLocation'))
        }
      }
    })()

    return () => {
      cancelled = true
      clearRoute()
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [open, destLat, destLng, destLabel, drawRoute, clearRoute, resolveMyPosition, t])

  if (!open) return null

  return (
    <div className="jobpost-route-overlay" role="dialog" aria-modal="true">
      <div className="jobpost-route-panel">
        <div className="jobpost-route-header">
          <h2>{t('jobpost.route.title')}</h2>
          <button type="button" className="jobpost-route-close" onClick={onClose} aria-label={t('profile.cancel')}>
            ✕
          </button>
        </div>
        {destLabel && <p className="jobpost-route-address">{destLabel}</p>}
        <div ref={mapRef} className="jobpost-route-map" />
        {routeLoading && <p className="jobpost-route-status">{t('jobpost.route.loading')}</p>}
        {locationError && <p className="jobpost-route-error">{locationError}</p>}
        {routeInfo && (
          <p className="jobpost-route-info">
            {t('jobpost.route.summary', { km: routeInfo.distance, min: routeInfo.duration })}
          </p>
        )}
      </div>
    </div>
  )
}

export default JobPostRouteMap
