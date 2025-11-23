"use client"

import { MapContainer, TileLayer, Marker, Circle } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Custom marker icon
const createMarkerIcon = () => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: #156d95;
        width: 24px;
        height: 24px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      ">
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
  })
}

/**
 * Calcula los radios de probabilidad basados en el tiempo transcurrido desde el avistamiento.
 *
 * Basado en estudios de recuperación de mascotas perdidas:
 * - Primeras 24 horas: La mayoría permanece dentro de 0.5-1.6 km
 * - 1-3 días: Se expanden a 2-5 km de radio
 * - Después de 3 días: Pueden estar a 5-10 km, pero la mayoría sigue dentro de 5 km
 *
 * Fuentes:
 * - Lost Pet Research (NCBI PMC6070379)
 * - Lost Dogs of America
 *
 * Fórmula: baseRadius = min(1 + (hoursElapsed / 12), 10) km
 *
 * @param {string} fechaReporte - Fecha del avistamiento en formato ISO o YYYY-MM-DD
 * @returns {object} Radios en metros para cada zona de probabilidad
 */
const calcularRadiosProbabilidad = (fechaReporte) => {
  if (!fechaReporte) {
    // Default: asumimos pocas horas
    return {
      high: 500,    // 50% probabilidad
      medium: 800,  // 80% probabilidad
      low: 1000     // 95% probabilidad
    }
  }

  const fechaAvistamiento = new Date(fechaReporte)
  const ahora = new Date()

  // Calcular horas transcurridas
  const diffTime = Math.abs(ahora - fechaAvistamiento)
  const hoursElapsed = diffTime / (1000 * 60 * 60)

  // Fórmula base: 1km + (horas/12), máximo 10km
  const baseRadiusKm = Math.min(1 + (hoursElapsed / 12), 10)

  // Convertir a metros y calcular zonas de probabilidad
  return {
    high: baseRadiusKm * 0.5 * 1000,    // 50% probabilidad - zona más probable
    medium: baseRadiusKm * 0.8 * 1000,  // 80% probabilidad
    low: baseRadiusKm * 1.0 * 1000      // 95% probabilidad - zona máxima
  }
}

/**
 * Calcula el nivel de zoom apropiado para el radio más grande
 */
const calcularZoom = (radioMaximo) => {
  if (radioMaximo <= 500) return 16
  if (radioMaximo <= 1000) return 15
  if (radioMaximo <= 2000) return 14
  if (radioMaximo <= 4000) return 13
  if (radioMaximo <= 7000) return 12
  return 11
}

/**
 * Formatea el tiempo transcurrido de forma legible
 */
const formatearTiempoTranscurrido = (fechaReporte) => {
  if (!fechaReporte) return null

  const fechaAvistamiento = new Date(fechaReporte)
  const ahora = new Date()
  const diffTime = Math.abs(ahora - fechaAvistamiento)
  const hoursElapsed = diffTime / (1000 * 60 * 60)

  if (hoursElapsed < 1) {
    const minutes = Math.round(hoursElapsed * 60)
    return `Hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`
  } else if (hoursElapsed < 24) {
    const hours = Math.round(hoursElapsed)
    return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`
  } else {
    const days = Math.round(hoursElapsed / 24)
    return `Hace ${days} ${days === 1 ? 'día' : 'días'}`
  }
}

export const MiniMapaDetalle = ({ lat, lng, fecha, expandido = false }) => {
  // Si no hay coordenadas, mostrar mensaje
  if (!lat || !lng) {
    return (
      <div className={`w-full ${expandido ? 'h-full' : 'h-[150px]'} rounded-xl bg-gray-100 flex items-center justify-center`}>
        <p className="text-sm text-gray-500">Ubicación no disponible</p>
      </div>
    )
  }

  const radios = calcularRadiosProbabilidad(fecha)
  const zoom = calcularZoom(radios.low)
  const tiempoTranscurrido = formatearTiempoTranscurrido(fecha)

  return (
    <div className={`${expandido ? 'h-full flex flex-col' : 'space-y-2'}`}>
      <div className={`w-full ${expandido ? 'flex-1' : 'h-[200px]'} rounded-xl overflow-hidden border border-gray-200`}>
        <MapContainer
          center={[lat, lng]}
          zoom={zoom}
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
          dragging={true}
          scrollWheelZoom={true}
          doubleClickZoom={true}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {/* Círculo exterior - 95% probabilidad (azul claro) */}
          <Circle
            center={[lat, lng]}
            radius={radios.low}
            pathOptions={{
              color: "#3b82f6",
              fillColor: "#3b82f6",
              fillOpacity: 0.08,
              weight: 2,
              dashArray: "8, 4",
            }}
          />

          {/* Círculo medio - 80% probabilidad (amarillo/dorado) */}
          <Circle
            center={[lat, lng]}
            radius={radios.medium}
            pathOptions={{
              color: "#eab308",
              fillColor: "#eab308",
              fillOpacity: 0.15,
              weight: 2,
            }}
          />

          {/* Círculo interior - 50% probabilidad (verde) */}
          <Circle
            center={[lat, lng]}
            radius={radios.high}
            pathOptions={{
              color: "#22c55e",
              fillColor: "#22c55e",
              fillOpacity: 0.25,
              weight: 3,
            }}
          />

          {/* Marcador del punto de avistamiento */}
          <Marker position={[lat, lng]} icon={createMarkerIcon()} />
        </MapContainer>
      </div>

      {/* Leyenda de probabilidades */}
      <div className={`bg-gray-50 rounded-lg ${expandido ? 'p-3 mt-3' : 'p-2'}`}>
        <div className={`flex items-center justify-between ${expandido ? 'text-sm' : 'text-xs'} text-gray-600 mb-2`}>
          <span className="font-medium">Área de búsqueda estimada</span>
          {tiempoTranscurrido && (
            <span className="text-gray-500">{tiempoTranscurrido}</span>
          )}
        </div>
        <div className={`flex flex-wrap gap-x-4 gap-y-1 ${expandido ? 'text-sm' : 'text-xs'}`}>
          <div className="flex items-center gap-1.5">
            <div className={`${expandido ? 'w-4 h-4' : 'w-3 h-3'} rounded-full bg-[#22c55e]`} />
            <span>Alta probabilidad (~{radios.high >= 1000 ? `${(radios.high/1000).toFixed(1)}km` : `${Math.round(radios.high)}m`})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`${expandido ? 'w-4 h-4' : 'w-3 h-3'} rounded-full bg-[#eab308]`} />
            <span>Media (~{radios.medium >= 1000 ? `${(radios.medium/1000).toFixed(1)}km` : `${Math.round(radios.medium)}m`})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`${expandido ? 'w-4 h-4' : 'w-3 h-3'} rounded-full border-2 border-[#3b82f6] border-dashed bg-[#3b82f6]/20`} />
            <span>Baja (~{radios.low >= 1000 ? `${(radios.low/1000).toFixed(1)}km` : `${Math.round(radios.low)}m`})</span>
          </div>
        </div>
      </div>
    </div>
  )
}
