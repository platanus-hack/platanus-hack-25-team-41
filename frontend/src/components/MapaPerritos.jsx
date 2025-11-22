"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import { MapPin, Dog, Calendar, User } from "lucide-react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix for default marker icons in Leaflet with Next.js
const createCustomIcon = (color = "#156d95") => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: ${color};
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
        <svg style="transform: rotate(45deg); width: 16px; height: 16px; color: white;" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  })
}

// Sample data for demonstration - Santiago de Chile
const sampleDogs = [
  {
    id: 1,
    lat: -33.4489,
    lng: -70.6693,
    nombre: "Perrito café",
    descripcion: "Perrito mediano color café, parece amigable. Se ve sano.",
    fecha: "2024-01-15",
    reportadoPor: "María G.",
    estado: "pendiente",
    imagen: "/perro19.png",
  },
  {
    id: 2,
    lat: -33.4372,
    lng: -70.6506,
    nombre: "Perrita blanca",
    descripcion: "Perrita pequeña blanca con manchas negras. Muy asustada.",
    fecha: "2024-01-14",
    reportadoPor: "Carlos R.",
    estado: "en_proceso",
    imagen: "/catto.png",
  },
  {
    id: 3,
    lat: -33.4569,
    lng: -70.6483,
    nombre: "Perro grande negro",
    descripcion: "Perro grande de color negro, posiblemente labrador. Muy tranquilo.",
    fecha: "2024-01-13",
    reportadoPor: "Ana M.",
    estado: "rescatado",
    imagen: "/perro19.png",
  },
  {
    id: 4,
    lat: -33.4253,
    lng: -70.6146,
    nombre: "Cachorro abandonado",
    descripcion: "Cachorro pequeño encontrado en una caja. Necesita atención urgente.",
    fecha: "2024-01-12",
    reportadoPor: "Pedro L.",
    estado: "urgente",
    imagen: "/cat-slave.png",
  },
  {
    id: 5,
    lat: -33.4103,
    lng: -70.5668,
    nombre: "Perrita mestiza",
    descripcion: "Perrita mediana color miel, muy dócil. Encontrada en Las Condes.",
    fecha: "2024-01-16",
    reportadoPor: "Sofía T.",
    estado: "pendiente",
    imagen: "/catto.png",
  },
  {
    id: 6,
    lat: -33.4977,
    lng: -70.6157,
    nombre: "Perro callejero viejo",
    descripcion: "Perro senior, parece abandonado hace tiempo. Necesita ayuda.",
    fecha: "2024-01-11",
    reportadoPor: "Juan P.",
    estado: "urgente",
    imagen: "/perro19.png",
  },
]

const getStatusColor = (estado) => {
  switch (estado) {
    case "pendiente":
      return "#f59e0b"
    case "en_proceso":
      return "#3b82f6"
    case "rescatado":
      return "#10b981"
    case "urgente":
      return "#ef4444"
    default:
      return "#156d95"
  }
}

const getStatusLabel = (estado) => {
  switch (estado) {
    case "pendiente":
      return "Pendiente"
    case "en_proceso":
      return "En proceso"
    case "rescatado":
      return "Rescatado"
    case "urgente":
      return "Urgente"
    default:
      return estado
  }
}

function LocationMarker() {
  const [position, setPosition] = useState(null)
  const map = useMap()

  useEffect(() => {
    map.locate().on("locationfound", (e) => {
      setPosition(e.latlng)
      map.flyTo(e.latlng, 14)
    })
  }, [map])

  return position === null ? null : (
    <Marker
      position={position}
      icon={L.divIcon({
        className: "current-location",
        html: `
          <div style="
            background-color: #156d95;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 0 0 3px rgba(21, 109, 149, 0.3);
          "></div>
        `,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      })}
    >
      <Popup>
        <span className="font-medium">Tu ubicación actual</span>
      </Popup>
    </Marker>
  )
}

export const MapaPerritos = () => {
  const [selectedDog, setSelectedDog] = useState(null)
  const [filterStatus, setFilterStatus] = useState("todos")

  const filteredDogs =
    filterStatus === "todos" ? sampleDogs : sampleDogs.filter((dog) => dog.estado === filterStatus)

  return (
    <div className="w-full h-screen pt-20">
      {/* Filters */}
      <div className="absolute top-24 left-4 z-[1000] bg-white rounded-xl shadow-lg p-4 max-w-xs">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Dog className="w-5 h-5 text-[#156d95]" />
          Filtrar por estado
        </h3>
        <div className="flex flex-wrap gap-2">
          {["todos", "urgente", "pendiente", "en_proceso", "rescatado"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                filterStatus === status
                  ? "bg-[#156d95] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {status === "todos" ? "Todos" : getStatusLabel(status)}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">{filteredDogs.length} perritos encontrados</p>
      </div>

      {/* Map */}
      <MapContainer
        center={[-33.4489, -70.6693]}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker />
        {filteredDogs.map((dog) => (
          <Marker
            key={dog.id}
            position={[dog.lat, dog.lng]}
            icon={createCustomIcon(getStatusColor(dog.estado))}
            eventHandlers={{
              click: () => setSelectedDog(dog),
            }}
          >
            <Popup>
              <div className="min-w-[200px]">
                <div className="flex items-start gap-3">
                  <img
                    src={dog.imagen}
                    alt={dog.nombre}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{dog.nombre}</h4>
                    <span
                      className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white mt-1"
                      style={{ backgroundColor: getStatusColor(dog.estado) }}
                    >
                      {getStatusLabel(dog.estado)}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">{dog.descripcion}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {dog.fecha}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {dog.reportadoPor}
                  </span>
                </div>
                <button className="w-full mt-3 bg-[#156d95] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#125a7d] transition-colors">
                  Ver detalles
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-8 right-4 z-[1000] bg-white rounded-xl shadow-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-2 text-sm">Leyenda</h4>
        <div className="space-y-2">
          {[
            { estado: "urgente", label: "Urgente" },
            { estado: "pendiente", label: "Pendiente" },
            { estado: "en_proceso", label: "En proceso" },
            { estado: "rescatado", label: "Rescatado" },
          ].map((item) => (
            <div key={item.estado} className="flex items-center gap-2 text-xs">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getStatusColor(item.estado) }}
              />
              <span className="text-gray-600">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
