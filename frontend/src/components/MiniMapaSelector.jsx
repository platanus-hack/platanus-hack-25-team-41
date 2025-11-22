"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Custom marker icon
const createMarkerIcon = () => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: #156d95;
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        <svg style="transform: rotate(45deg); width: 14px; height: 14px; color: white;" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  })
}

// Component to handle map clicks and update position
function LocationSelector({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      })
    },
  })

  return position ? (
    <Marker position={[position.lat, position.lng]} icon={createMarkerIcon()} />
  ) : null
}

// Component to center map on position
function CenterMap({ position }) {
  const map = useMap()

  useEffect(() => {
    if (position) {
      map.flyTo([position.lat, position.lng], 16, { duration: 0.5 })
    }
  }, [position, map])

  return null
}

export const MiniMapaSelector = ({ ubicacion, onUbicacionChange }) => {
  const [position, setPosition] = useState(ubicacion)

  // Update parent when position changes
  useEffect(() => {
    if (position && onUbicacionChange) {
      onUbicacionChange(position)
    }
  }, [position, onUbicacionChange])

  // Update local position when ubicacion prop changes
  useEffect(() => {
    if (ubicacion && (!position || ubicacion.lat !== position.lat || ubicacion.lng !== position.lng)) {
      setPosition(ubicacion)
    }
  }, [ubicacion])

  // Default to Santiago, Chile center
  const defaultCenter = [-33.4489, -70.6693]
  const center = position ? [position.lat, position.lng] : defaultCenter

  return (
    <div className="w-full h-[250px] rounded-xl overflow-hidden border border-gray-200">
      <MapContainer
        center={center}
        zoom={position ? 16 : 13}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationSelector position={position} setPosition={setPosition} />
        {position && <CenterMap position={position} />}
      </MapContainer>
      <style jsx global>{`
        .leaflet-container {
          cursor: crosshair !important;
        }
      `}</style>
    </div>
  )
}
