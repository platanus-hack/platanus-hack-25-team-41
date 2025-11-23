"use client"

import { MapContainer, TileLayer, Marker } from "react-leaflet"
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

export const MiniMapaDetalle = ({ lat, lng }) => {
  // Si no hay coordenadas, mostrar mensaje
  if (!lat || !lng) {
    return (
      <div className="w-full h-[150px] rounded-xl bg-gray-100 flex items-center justify-center">
        <p className="text-sm text-gray-500">Ubicación no disponible</p>
      </div>
    )
  }

  return (
    <div className="w-full h-[200px] rounded-xl overflow-hidden border border-gray-200">
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
        dragging={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[lat, lng]} icon={createMarkerIcon()} />
      </MapContainer>
    </div>
  )
}
