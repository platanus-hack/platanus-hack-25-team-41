"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, MapPin, Calendar, Heart, X, Camera, Loader2, Navigation, PawPrint, Clock, Maximize2, Minimize2, Phone, AlertCircle } from "lucide-react"
import { sightingsService } from "@/services/sightings"
import dynamic from "next/dynamic"

// Import mini mapa dinámicamente para evitar SSR issues con Leaflet
const MiniMapaDetalle = dynamic(
  () => import("@/components/MiniMapaDetalle").then((mod) => mod.MiniMapaDetalle),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[150px] rounded-xl bg-gray-100 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#156d95] border-t-transparent rounded-full animate-spin"></div>
      </div>
    ),
  }
)

const getEstadoLabel = (estado) => {
  switch (estado) {
    case "disponible":
      return { label: "Avistado", color: "bg-green-100 text-green-700" }
    case "en_proceso":
      return { label: "En búsqueda", color: "bg-yellow-100 text-yellow-700" }
    case "encontrado":
      return { label: "Encontrado", color: "bg-blue-100 text-blue-700" }
    default:
      return { label: estado, color: "bg-gray-100 text-gray-700" }
  }
}

export const BuscarPerrito = () => {
  const [descripcion, setDescripcion] = useState("")
  const [imagenBusqueda, setImagenBusqueda] = useState(null)
  const [imagenPreview, setImagenPreview] = useState(null)
  const [buscando, setBuscando] = useState(false)
  const [resultados, setResultados] = useState(null)
  const [error, setError] = useState(null)
  const [ubicacionUsuario, setUbicacionUsuario] = useState(null)
  const [cargandoUbicacion, setCargandoUbicacion] = useState(true)
  const [perritoSeleccionado, setPerritoSeleccionado] = useState(null)
  const [favoritos, setFavoritos] = useState([])
  const [mapaExpandido, setMapaExpandido] = useState(false)
  const [mostrarContacto, setMostrarContacto] = useState(false)
  const [toast, setToast] = useState({ show: false, message: "", type: "error" })
  const fileInputRef = useRef(null)

  // Auto-hide toast after 5 seconds
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }))
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [toast.show])

  // Obtener ubicación del usuario al montar el componente
  useEffect(() => {
    obtenerUbicacion()
  }, [])

  const obtenerUbicacion = () => {
    setCargandoUbicacion(true)
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUbicacionUsuario({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          setCargandoUbicacion(false)
          console.log("[BuscarPerrito] Ubicación obtenida:", position.coords.latitude, position.coords.longitude)
        },
        (error) => {
          console.error("[BuscarPerrito] Error al obtener ubicación:", error)
          setCargandoUbicacion(false)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      )
    } else {
      setCargandoUbicacion(false)
    }
  }

  const toggleFavorito = (id) => {
    setFavoritos((prev) =>
      prev.includes(id) ? prev.filter((fav) => fav !== id) : [...prev, id]
    )
  }

  const handleImagenChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setImagenBusqueda(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagenPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const limpiarImagen = () => {
    setImagenBusqueda(null)
    setImagenPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const limpiarBusqueda = () => {
    setResultados(null)
    setError(null)
    setDescripcion("")
    limpiarImagen()
  }

  // Convertir imagen a base64
  const imageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // Realizar búsqueda
  const buscar = async (e) => {
    e.preventDefault()

    if (!imagenBusqueda && !descripcion.trim()) {
      setError("Por favor, sube una foto de tu mascota o describe cómo es.")
      return
    }

    setBuscando(true)
    setError(null)

    try {
      let imageBase64 = null
      if (imagenBusqueda) {
        imageBase64 = await imageToBase64(imagenBusqueda)
      }

      console.log("[BuscarPerrito] Iniciando búsqueda...")
      console.log("[BuscarPerrito] Ubicación del usuario:", ubicacionUsuario)

      const response = await sightingsService.searchSightings({
        images: imageBase64 ? [imageBase64] : undefined,
        description: descripcion.trim() || undefined,
        latitude: ubicacionUsuario?.lat,
        longitude: ubicacionUsuario?.lng,
        limit: 20,
      })

      console.log("[BuscarPerrito] Resultados:", response)

      // Transformar resultados al formato del componente
      const resultadosTransformados = (response.results || response.sightings || []).map((s, index) => {
        // Extraer fecha y hora del created_at
        const createdAt = s.created_at ? new Date(s.created_at) : new Date()
        const fecha = createdAt.toISOString().split("T")[0]
        const hora = createdAt.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })

        // TODO: Cuando la API lo soporte, usar s.contact_phone directamente
        // Por ahora, usar datos dummy para demostración (algunos con teléfono, otros sin)
        const telefonoDummy = index % 2 === 0 ? "+56912345678" : null

        return {
          id: s.id,
          nombre: s.user_description?.split(",")[0] || s.attributes?.[0] || "Perrito avistado",
          imagen: s.image_urls?.[0] || "/perro19.png",
          tamano: s.attributes?.find((a) => ["pequeño", "mediano", "grande"].includes(a.toLowerCase()))?.toLowerCase() || "mediano",
          color: s.attributes?.find((a) => !["pequeño", "mediano", "grande", "cachorro", "joven", "adulto", "senior"].includes(a.toLowerCase())) || "",
          edad: s.attributes?.find((a) => ["cachorro", "joven", "adulto", "senior"].includes(a.toLowerCase()))?.toLowerCase() || "adulto",
          estado: s.status || "disponible",
          ubicacion: s.location?.neighborhood || s.location?.address || "Santiago",
          fecha,
          hora,
          createdAt: s.created_at, // Timestamp completo para cálculo de radio de probabilidad
          descripcion: s.user_description || s.attributes?.join(", ") || "Sin descripción",
          reportadoPor: s.contact_info?.name || "Usuario",
          similarity: s.similarity,
          lat: s.location?.lat,
          lng: s.location?.lng,
          contacto: s.contact_info,
          telefonoContacto: s.contact_phone || telefonoDummy, // Teléfono de contacto (de API o dummy)
        }
      })

      setResultados(resultadosTransformados)
    } catch (err) {
      console.error("[BuscarPerrito] Error en búsqueda:", err)

      // Error 400 = No se detectó un perro en la imagen
      if (err.response?.status === 400) {
        setToast({
          show: true,
          message: "No se detectó ningún perro en la imagen. Por favor, intenta con otra foto donde el perro sea más visible.",
          type: "error"
        })
      } else {
        setError("Error al buscar. Por favor, intenta de nuevo.")
      }
    } finally {
      setBuscando(false)
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 bg-[#156d95]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <PawPrint className="w-8 h-8 text-[#156d95]" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Buscar mi mascota</h1>
          <p className="text-gray-600">
            Sube una foto de tu mascota perdida y buscaremos coincidencias en los avistamientos reportados cerca de ti.
          </p>
        </motion.div>

        {/* Formulario de búsqueda */}
        {!resultados && (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={buscar}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6"
          >
            {/* Subir imagen */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Foto de tu mascota
              </label>
              {!imagenPreview ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-[#156d95] hover:bg-[#156d95]/5 transition-colors cursor-pointer"
                >
                  <Camera className="w-10 h-10 text-gray-400" />
                  <span className="text-gray-500">Haz clic para subir una foto</span>
                  <span className="text-xs text-gray-400">JPG, PNG hasta 10MB</span>
                </button>
              ) : (
                <div className="relative">
                  <img
                    src={imagenPreview}
                    alt="Foto de tu mascota"
                    className="w-full h-48 object-cover rounded-xl border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={limpiarImagen}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImagenChange}
                className="hidden"
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe a tu mascota
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej: Perro mediano color café con manchas blancas, collar rojo, muy amigable..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#156d95] focus:border-transparent outline-none resize-none"
              />
            </div>

            {/* Ubicación */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${ubicacionUsuario ? 'bg-green-100' : 'bg-gray-200'}`}>
                {cargandoUbicacion ? (
                  <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
                ) : (
                  <Navigation className={`w-5 h-5 ${ubicacionUsuario ? 'text-green-600' : 'text-gray-400'}`} />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">
                  {cargandoUbicacion ? 'Obteniendo ubicación...' : ubicacionUsuario ? 'Ubicación detectada' : 'Ubicación no disponible'}
                </p>
                <p className="text-xs text-gray-500">
                  {ubicacionUsuario
                    ? 'Buscaremos avistamientos cerca de ti'
                    : 'Activa la ubicación para mejores resultados'}
                </p>
              </div>
              {!ubicacionUsuario && !cargandoUbicacion && (
                <button
                  type="button"
                  onClick={obtenerUbicacion}
                  className="text-sm text-[#156d95] hover:underline"
                >
                  Reintentar
                </button>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Botón de búsqueda */}
            <button
              type="submit"
              disabled={buscando}
              className="w-full bg-[#156d95] text-white py-4 px-6 rounded-full font-semibold flex items-center justify-center gap-2 hover:bg-[#125a7d] transition-colors shadow-lg shadow-[#156d95]/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {buscando ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Buscando coincidencias...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Buscar mi mascota
                </>
              )}
            </button>
          </motion.form>
        )}

        {/* Resultados */}
        {resultados && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Header de resultados */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {resultados.length > 0
                    ? `${resultados.length} posibles coincidencias`
                    : 'No encontramos coincidencias'}
                </h2>
                <p className="text-sm text-gray-500">
                  {resultados.length > 0
                    ? 'Revisa los avistamientos que podrían ser tu mascota'
                    : 'Intenta con otra foto o descripción'}
                </p>
              </div>
              <button
                onClick={limpiarBusqueda}
                className="text-sm text-[#156d95] hover:underline"
              >
                Nueva búsqueda
              </button>
            </div>

            {/* Lista de resultados */}
            {resultados.length > 0 ? (
              <div className="space-y-4">
                {resultados.map((perrito, index) => (
                  <motion.div
                    key={perrito.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setPerritoSeleccionado(perrito)}
                  >
                    <div className="flex">
                      <img
                        src={perrito.imagen}
                        alt={perrito.nombre}
                        className="w-32 h-32 object-cover"
                      />
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-bold text-gray-800">{perrito.nombre}</h3>
                          {perrito.similarity && (
                            <span className="text-xs bg-[#156d95]/10 text-[#156d95] px-2 py-1 rounded-full font-medium">
                              {Math.round(perrito.similarity * 100)}% similar
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm line-clamp-2 mb-2">{perrito.descripcion}</p>
                        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {perrito.ubicacion}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {perrito.fecha}
                          </span>
                          {perrito.hora && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {perrito.hora}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PawPrint className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 mb-4">
                  No hemos encontrado avistamientos que coincidan con tu búsqueda.
                </p>
                <p className="text-sm text-gray-500">
                  Te recomendamos reportar a tu mascota como perdida para que otros usuarios puedan ayudarte.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Modal de detalle */}
        <AnimatePresence>
          {perritoSeleccionado && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => {
                setPerritoSeleccionado(null)
                setMostrarContacto(false)
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative">
                  <img
                    src={perritoSeleccionado.imagen}
                    alt={perritoSeleccionado.nombre}
                    className="w-full h-64 object-cover"
                  />
                  <button
                    onClick={() => {
                      setPerritoSeleccionado(null)
                      setMostrarContacto(false)
                    }}
                    className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-100"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                  {perritoSeleccionado.similarity && (
                    <div className="absolute bottom-4 left-4">
                      <span className="bg-[#156d95] text-white px-3 py-1 rounded-full text-sm font-medium">
                        {Math.round(perritoSeleccionado.similarity * 100)}% de similitud
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">{perritoSeleccionado.nombre}</h2>
                      <p className="text-gray-500">Reportado por: {perritoSeleccionado.reportadoPor || "Usuario"}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        getEstadoLabel(perritoSeleccionado.estado).color
                      }`}
                    >
                      {getEstadoLabel(perritoSeleccionado.estado).label}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500">Tamaño</p>
                      <p className="font-medium text-gray-800 capitalize">{perritoSeleccionado.tamano}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500">Edad</p>
                      <p className="font-medium text-gray-800 capitalize">{perritoSeleccionado.edad}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500">Color</p>
                      <p className="font-medium text-gray-800 capitalize">{perritoSeleccionado.color}</p>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-4">{perritoSeleccionado.descripcion}</p>

                  <div className="flex items-center flex-wrap gap-2 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {perritoSeleccionado.ubicacion}
                    </span>
                    <span className="mx-1">•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {perritoSeleccionado.fecha}
                    </span>
                    {perritoSeleccionado.hora && (
                      <>
                        <span className="mx-1">•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {perritoSeleccionado.hora}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Mini mapa de ubicación con área de búsqueda */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-500">Área probable de ubicación</p>
                      <button
                        onClick={() => setMapaExpandido(true)}
                        className="flex items-center gap-1 text-xs text-[#156d95] hover:text-[#125a7d] transition-colors"
                      >
                        <Maximize2 className="w-3 h-3" />
                        Expandir
                      </button>
                    </div>
                    <MiniMapaDetalle
                      lat={perritoSeleccionado.lat}
                      lng={perritoSeleccionado.lng}
                      fecha={perritoSeleccionado.createdAt || perritoSeleccionado.fecha}
                    />
                  </div>

                  <button
                    onClick={() => setMostrarContacto(true)}
                    className="w-full bg-[#156d95] text-white py-3 px-6 rounded-full font-medium hover:bg-[#125a7d] transition-colors"
                  >
                    Es mi mascota
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal de contacto - fuera del modal de detalle para evitar problemas de z-index */}
        <AnimatePresence>
          {mostrarContacto && perritoSeleccionado && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4"
              onClick={() => setMostrarContacto(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl max-w-sm w-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-5">
                  <div className="w-16 h-16 bg-[#156d95]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Phone className="w-8 h-8 text-[#156d95]" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-1">
                    Contactar a quien vio tu perro
                  </h3>
                  <p className="text-sm text-gray-500">
                    Envía tus datos para que se comuniquen contigo
                  </p>
                </div>

                <div className="space-y-4 mb-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tu nombre
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: María González"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#156d95] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tu teléfono
                    </label>
                    <input
                      type="tel"
                      placeholder="+56 9 1234 5678"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#156d95] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mensaje (opcional)
                    </label>
                    <textarea
                      placeholder="Hola, creo que es mi perro..."
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#156d95] focus:border-transparent resize-none"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-5">
                  <p className="text-xs text-blue-800">
                    <strong>Tu privacidad es importante:</strong> Tus datos solo serán enviados a la persona que reportó este avistamiento
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      alert('Contacto enviado')
                      setMostrarContacto(false)
                    }}
                    className="w-full bg-[#156d95] text-white py-3 rounded-xl font-semibold hover:bg-[#125a7d] transition-colors flex items-center justify-center gap-2"
                  >
                    <Phone className="w-5 h-5" />
                    Enviar mi contacto
                  </button>
                  <button
                    onClick={() => setMostrarContacto(false)}
                    className="w-full py-3 rounded-xl font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal de mapa expandido */}
        <AnimatePresence>
          {mapaExpandido && perritoSeleccionado && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
              onClick={() => setMapaExpandido(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl w-full max-w-4xl h-[80vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header del mapa expandido */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <div>
                    <h3 className="font-semibold text-gray-800">Área de búsqueda</h3>
                    <p className="text-sm text-gray-500">{perritoSeleccionado.nombre} - {perritoSeleccionado.ubicacion}</p>
                  </div>
                  <button
                    onClick={() => setMapaExpandido(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Minimize2 className="w-4 h-4" />
                    Cerrar
                  </button>
                </div>

                {/* Mapa expandido */}
                <div className="flex-1 p-4">
                  <MiniMapaDetalle
                    lat={perritoSeleccionado.lat}
                    lng={perritoSeleccionado.lng}
                    fecha={perritoSeleccionado.createdAt || perritoSeleccionado.fecha}
                    expandido={true}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast notification */}
        <AnimatePresence>
          {toast.show && (
            <motion.div
              initial={{ opacity: 0, y: -50, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: -50, x: "-50%" }}
              className="fixed top-24 left-1/2 z-50 max-w-md w-[90%] bg-red-50 border border-red-200 rounded-xl p-4 shadow-lg flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-700 text-sm">{toast.message}</p>
              </div>
              <button
                onClick={() => setToast(prev => ({ ...prev, show: false }))}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
