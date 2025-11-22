"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Camera, MapPin, Upload, Send, X, CheckCircle, AlertCircle, Navigation, Loader2 } from "lucide-react"
import dynamic from "next/dynamic"
import { sightingsService } from "@/services/sightings"

// Import MiniMapaSelector dynamically to avoid SSR issues with Leaflet
const MiniMapaSelector = dynamic(
  () => import("@/components/MiniMapaSelector").then((mod) => mod.MiniMapaSelector),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[250px] rounded-xl bg-gray-100 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#156d95] border-t-transparent rounded-full animate-spin"></div>
      </div>
    ),
  }
)

export const ReportarPerrito = () => {
  const [formData, setFormData] = useState({
    descripcion: "",
    tamano: "",
    color: "",
    estado: "saludable",
    notas: "",
  })
  const [imagen, setImagen] = useState(null)
  const [imagenPreview, setImagenPreview] = useState(null)
  const [ubicacion, setUbicacion] = useState(null)
  const [cargandoUbicacion, setCargandoUbicacion] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState(null)
  const [mostrarMapa, setMostrarMapa] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    obtenerUbicacion()
  }, [])

  const obtenerUbicacion = () => {
    setCargandoUbicacion(true)
    setError(null)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUbicacion({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          setCargandoUbicacion(false)
          setMostrarMapa(true)
        },
        (err) => {
          console.error("Error obteniendo ubicación:", err)
          setCargandoUbicacion(false)
          // Set default location to Santiago, Chile center
          setUbicacion({
            lat: -33.4489,
            lng: -70.6693,
          })
          setMostrarMapa(true)
        }
      )
    } else {
      setCargandoUbicacion(false)
      // Set default location to Santiago, Chile center
      setUbicacion({
        lat: -33.4489,
        lng: -70.6693,
      })
      setMostrarMapa(true)
    }
  }

  const handleUbicacionChange = (nuevaUbicacion) => {
    setUbicacion(nuevaUbicacion)
  }

  const handleImagenChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setImagen(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagenPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!imagen) {
      setError("Por favor, sube una foto del perrito.")
      return
    }

    if (!ubicacion) {
      setError("Necesitamos la ubicación para registrar el avistamiento.")
      return
    }

    setEnviando(true)
    setError(null)

    try {
      // Convertir imagen a base64
      const imageBase64 = await imageToBase64(imagen)

      // Construir descripción combinando los campos del formulario
      const descripcionParts = []
      if (formData.tamano) descripcionParts.push(`Tamaño: ${formData.tamano}`)
      if (formData.color) descripcionParts.push(`Color: ${formData.color}`)
      if (formData.estado) descripcionParts.push(`Estado: ${formData.estado}`)
      if (formData.notas) descripcionParts.push(formData.notas)

      const description = descripcionParts.join(". ") || null

      // Preparar datos para el API
      const sightingData = {
        images: [imageBase64],
        description,
        latitude: ubicacion.lat,
        longitude: ubicacion.lng,
      }

      console.log("[ReportarPerrito] Enviando reporte:", sightingData)

      const response = await sightingsService.createSighting(sightingData)

      console.log("[ReportarPerrito] Respuesta del servidor:", response)
      setEnviado(true)
    } catch (err) {
      console.error("[ReportarPerrito] Error al enviar reporte:", err)
      console.error("[ReportarPerrito] Error response:", err.response?.data)
      setError(err.response?.data?.message || "Error al enviar el reporte. Por favor, intenta de nuevo.")
    } finally {
      setEnviando(false)
    }
  }

  const resetForm = () => {
    setFormData({
      descripcion: "",
      tamano: "",
      color: "",
      estado: "saludable",
      notas: "",
    })
    setImagen(null)
    setImagenPreview(null)
    setEnviado(false)
    setError(null)
    setMostrarMapa(false)
    obtenerUbicacion()
  }

  if (enviado) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 bg-gradient-to-b from-white to-gray-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto text-center"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">¡Reporte enviado!</h2>
          <p className="text-gray-600 mb-8">
            Gracias por reportar este perrito. Los rescatistas cercanos serán notificados
            y podrán ayudar lo más pronto posible.
          </p>
          <div className="space-y-3">
            <button
              onClick={resetForm}
              className="w-full bg-[#156d95] text-white py-3 px-6 rounded-full font-medium hover:bg-[#125a7d] transition-colors"
            >
              Reportar otro perrito
            </button>
            <a
              href="/map"
              className="block w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-full font-medium hover:bg-gray-200 transition-colors"
            >
              Ver en el mapa
            </a>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Reportar un perrito</h1>
          <p className="text-gray-600">
            Ayúdanos a ubicar perritos callejeros para que puedan ser rescatados
          </p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-700 text-sm">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-600 text-sm font-medium mt-1 hover:underline"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Subir foto */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-[#156d95]" />
              Foto del perrito *
            </h3>

            {imagenPreview ? (
              <div className="relative">
                <img
                  src={imagenPreview}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagen(null)
                    setImagenPreview(null)
                  }}
                  className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-[#156d95] hover:bg-blue-50/50 transition-colors"
              >
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="text-gray-500 text-sm">Toca para subir una foto</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImagenChange}
              className="hidden"
            />
          </motion.div>

          {/* Ubicación con mini mapa */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#156d95]" />
              Ubicación del avistamiento *
            </h3>

            {cargandoUbicacion ? (
              <div className="flex items-center gap-3 text-gray-500 py-4">
                <div className="w-5 h-5 border-2 border-[#156d95] border-t-transparent rounded-full animate-spin"></div>
                <span>Obteniendo tu ubicación...</span>
              </div>
            ) : (
              <>
                {/* Botón para re-centrar en ubicación actual */}
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-600">
                    Toca en el mapa para ajustar la ubicación exacta
                  </p>
                  <button
                    type="button"
                    onClick={obtenerUbicacion}
                    className="flex items-center gap-1 text-sm text-[#156d95] hover:underline"
                  >
                    <Navigation className="w-4 h-4" />
                    Mi ubicación
                  </button>
                </div>

                {/* Mini mapa */}
                {mostrarMapa && (
                  <MiniMapaSelector
                    ubicacion={ubicacion}
                    onUbicacionChange={handleUbicacionChange}
                  />
                )}

                {/* Coordenadas */}
                {ubicacion && (
                  <div className="mt-3 bg-gray-50 rounded-lg p-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <div className="text-sm">
                      <span className="text-gray-600">Ubicación seleccionada: </span>
                      <span className="font-medium text-gray-800">
                        {ubicacion.lat.toFixed(5)}, {ubicacion.lng.toFixed(5)}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>

          {/* Descripción */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <h3 className="font-semibold text-gray-800 mb-4">Descripción del perrito</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tamaño
                </label>
                <div className="flex gap-2">
                  {["pequeño", "mediano", "grande"].map((tamano) => (
                    <button
                      key={tamano}
                      type="button"
                      onClick={() => setFormData({ ...formData, tamano })}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                        formData.tamano === tamano
                          ? "bg-[#156d95] text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {tamano.charAt(0).toUpperCase() + tamano.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color principal
                </label>
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="Ej: café, negro, blanco con manchas"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#156d95] focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado aparente
                </label>
                <div className="flex gap-2">
                  {[
                    { value: "saludable", label: "Saludable" },
                    { value: "herido", label: "Herido" },
                    { value: "desnutrido", label: "Desnutrido" },
                  ].map((estado) => (
                    <button
                      key={estado.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, estado: estado.value })}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                        formData.estado === estado.value
                          ? "bg-[#156d95] text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {estado.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas adicionales
                </label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  placeholder="¿Tiene collar? ¿Es agresivo o amigable? ¿Alguna característica especial?"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#156d95] focus:border-transparent outline-none transition-all resize-none"
                />
              </div>
            </div>
          </motion.div>

          {/* Submit button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            type="submit"
            disabled={enviando}
            className="w-full bg-[#156d95] text-white py-4 px-6 rounded-full font-semibold flex items-center justify-center gap-2 hover:bg-[#125a7d] transition-colors shadow-lg shadow-[#156d95]/20 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {enviando ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Enviando reporte...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Enviar reporte
              </>
            )}
          </motion.button>
        </form>
      </div>
    </div>
  )
}
