"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import { MapPin, Dog, Calendar, User, Locate, Eye, Filter, ChevronDown, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { sightingsService } from "@/services/sightings"

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

// Calcula distancia en km entre dos puntos
const calcularDistancia = (lat1, lng1, lat2, lng2) => {
  const R = 6371 // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function LocationMarker({ onLocationFound }) {
  const [position, setPosition] = useState(null)
  const map = useMap()
  const onLocationFoundRef = useRef(onLocationFound)
  const hasLocated = useRef(false)

  onLocationFoundRef.current = onLocationFound

  useEffect(() => {
    if (hasLocated.current) return

    const handleLocationFound = (e) => {
      if (hasLocated.current) return
      hasLocated.current = true
      setPosition(e.latlng)
      onLocationFoundRef.current(e.latlng)
      map.flyTo(e.latlng, 14)
    }

    map.locate().on("locationfound", handleLocationFound)

    return () => {
      map.off("locationfound", handleLocationFound)
    }
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

// Componente para capturar bounds manualmente
function MapBoundsCapture({ mapRef }) {
  const map = useMap()

  useEffect(() => {
    mapRef.current = map
  }, [map, mapRef])

  return null
}

export const MapaPerritos = () => {
  const [selectedDog, setSelectedDog] = useState(null)
  const [filterStatus, setFilterStatus] = useState("todos")
  const [filterLocation, setFilterLocation] = useState("todos") // "todos", "cercanos", "visible"
  const [userLocation, setUserLocation] = useState(null)
  const [capturedBounds, setCapturedBounds] = useState(null) // Bounds capturados manualmente
  const [radioKm, setRadioKm] = useState(5) // Radio en km para filtro "cercanos"
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const mapRef = useRef(null)

  // Estado para datos de la API
  const [sightings, setSightings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Cargar avistamientos desde la API
  useEffect(() => {
    const fetchSightings = async () => {
      console.log("[MapaPerritos] Iniciando carga de avistamientos...")
      try {
        setLoading(true)

        // TODO: Remover este delay - solo para desarrollo
        await new Promise((resolve) => setTimeout(resolve, 2000))

        console.log("[MapaPerritos] Llamando a sightingsService.getMapSightings()")

        const data = await sightingsService.getMapSightings()
        console.log("[MapaPerritos] Respuesta recibida:", data)

        if (!data || !data.sightings) {
          console.error("[MapaPerritos] Respuesta inválida - no tiene propiedad 'sightings':", data)
          throw new Error("Respuesta inválida de la API")
        }

        console.log("[MapaPerritos] Total de sightings:", data.sightings.length)

        // Transformar datos de la API al formato del componente
        const transformedSightings = data.sightings.map((s, index) => {
          console.log(`[MapaPerritos] Transformando sighting ${index}:`, s)
          return {
            id: s.id,
            lat: s.latitude,
            lng: s.longitude,
            nombre: s.description?.split(",")[0] || "Perrito avistado",
            descripcion: s.description || "",
            imagen: s.photo,
            estado: "pendiente", // Default, ajustar si la API lo incluye
            fecha: new Date().toISOString().split("T")[0],
            reportadoPor: "Usuario",
          }
        })

        console.log("[MapaPerritos] Datos transformados:", transformedSightings)
        setSightings(transformedSightings)
        setError(null)
        console.log("[MapaPerritos] Carga completada exitosamente")
      } catch (err) {
        console.error("[MapaPerritos] Error en fetchSightings:", err)
        console.error("[MapaPerritos] Error message:", err.message)
        console.error("[MapaPerritos] Error response:", err.response?.data)
        console.error("[MapaPerritos] Error status:", err.response?.status)
        setError("Error al cargar los avistamientos")
        // Usar datos de ejemplo como fallback
        console.log("[MapaPerritos] Usando datos de ejemplo como fallback")
        setSightings(sampleDogs)
      } finally {
        setLoading(false)
        console.log("[MapaPerritos] Loading terminado")
      }
    }

    fetchSightings()
  }, [])

  const handleLocationFound = useCallback((latlng) => {
    setUserLocation(latlng)
  }, [])

  // Capturar bounds del área visible actual
  const handleCaptureVisibleArea = useCallback(() => {
    if (mapRef.current) {
      const bounds = mapRef.current.getBounds()
      setCapturedBounds(bounds)
      setFilterLocation("visible")
    }
  }, [])

  // Filtrar perros (usa sightings de la API, sampleDogs solo como fallback en error)
  const dogsData = error ? sampleDogs : sightings
  const filteredDogs = dogsData.filter((dog) => {
    // Filtro por estado
    if (filterStatus !== "todos" && dog.estado !== filterStatus) {
      return false
    }

    // Filtro por ubicación
    if (filterLocation === "cercanos" && userLocation) {
      const distancia = calcularDistancia(userLocation.lat, userLocation.lng, dog.lat, dog.lng)
      if (distancia > radioKm) {
        return false
      }
    }

    if (filterLocation === "visible" && capturedBounds) {
      if (!capturedBounds.contains([dog.lat, dog.lng])) {
        return false
      }
    }

    return true
  })

  return (
    <div className="relative w-full h-screen pt-20">
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center gap-4">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <Dog className="w-10 h-10 text-[#156d95]" />
              <div className="absolute inset-0">
                <svg className="w-16 h-16 animate-spin" viewBox="0 0 64 64">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="#156d95"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="44 132"
                  />
                </svg>
              </div>
            </div>
            <div className="text-center">
              <p className="font-medium text-gray-800">Cargando avistamientos</p>
              <p className="text-sm text-gray-500">Buscando perritos en el mapa...</p>
            </div>
          </div>
        </div>
      )}

      {/* Error indicator */}
      {error && !loading && (
        <div className="fixed top-24 right-4 z-50 bg-red-50 border border-red-200 rounded-lg shadow-lg px-4 py-2">
          <span className="text-sm text-red-600">{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="fixed top-22 left-14 md:left-14 z-40">
        {/* Botón para abrir/cerrar filtros */}
        <motion.button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="bg-white rounded-xl shadow-lg p-3 flex items-center gap-2 hover:bg-gray-50 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Filter className="w-5 h-5 text-[#156d95]" />
          <span className="font-medium text-gray-800 text-sm">Filtros</span>
          <motion.div
            animate={{ rotate: isFilterOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </motion.div>
          {(filterStatus !== "todos" || filterLocation !== "todos") && (
            <span className="bg-[#156d95] text-white text-xs px-2 py-0.5 rounded-full">
              {(filterStatus !== "todos" ? 1 : 0) + (filterLocation !== "todos" ? 1 : 0)}
            </span>
          )}
        </motion.button>

        {/* Panel de filtros expandible */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-xl shadow-lg p-4 max-w-xs mt-2"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Dog className="w-5 h-5 text-[#156d95]" />
                  Filtros
                </h3>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Filtro por estado */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2 font-medium">Por estado:</p>
                <div className="flex flex-wrap gap-2">
                  {["todos", "urgente", "pendiente", "en_proceso", "rescatado"].map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        filterStatus === status
                          ? "bg-[#156d95] text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {status === "todos" ? "Todos" : getStatusLabel(status)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtro por ubicación */}
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-2 font-medium">Por ubicación:</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilterLocation("todos")}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                      filterLocation === "todos"
                        ? "bg-[#156d95] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <MapPin className="w-3 h-3" />
                    Todos
                  </button>
                  <button
                    onClick={() => setFilterLocation("cercanos")}
                    disabled={!userLocation}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                      filterLocation === "cercanos"
                        ? "bg-[#156d95] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    } ${!userLocation ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <Locate className="w-3 h-3" />
                    Cerca de mí
                  </button>
                  <button
                    onClick={handleCaptureVisibleArea}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                      filterLocation === "visible"
                        ? "bg-[#156d95] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    Área visible
                  </button>
                </div>
              </div>

              {/* Selector de radio cuando está activo "cercanos" */}
              {filterLocation === "cercanos" && userLocation && (
                <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                  <label className="text-xs text-gray-600 block mb-1">
                    Radio: <span className="font-semibold">{radioKm} km</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={radioKm}
                    onChange={(e) => setRadioKm(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#156d95]"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>1 km</span>
                    <span>20 km</span>
                  </div>
                </div>
              )}

              {/* Botón para actualizar área visible */}
              {filterLocation === "visible" && (
                <div className="mb-3">
                  <button
                    onClick={handleCaptureVisibleArea}
                    className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye className="w-3 h-3" />
                    Actualizar área visible
                  </button>
                  <p className="text-xs text-gray-400 mt-1 text-center">
                    Mueve el mapa y presiona para filtrar
                  </p>
                </div>
              )}

              <p className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                {filteredDogs.length} perrito{filteredDogs.length !== 1 ? "s" : ""} encontrado{filteredDogs.length !== 1 ? "s" : ""}
              </p>

              {!userLocation && filterLocation !== "todos" && filterLocation !== "visible" && (
                <p className="text-xs text-amber-600 mt-2">
                  Activa la ubicación para usar este filtro
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
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
        <LocationMarker onLocationFound={handleLocationFound} />
        <MapBoundsCapture mapRef={mapRef} />
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
                {userLocation && (
                  <p className="text-xs text-gray-400 mt-2">
                    A {calcularDistancia(userLocation.lat, userLocation.lng, dog.lat, dog.lng).toFixed(1)} km de ti
                  </p>
                )}
                <button className="w-full mt-3 bg-[#156d95] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#125a7d] transition-colors">
                  Ver detalles
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="fixed bottom-8 right-4 z-40 bg-white rounded-xl shadow-lg p-4">
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
