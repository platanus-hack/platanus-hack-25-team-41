"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Filter, MapPin, Calendar, Heart, Share2, X, ChevronDown } from "lucide-react"

// Sample data - Santiago de Chile
const perritosDisponibles = [
  {
    id: 1,
    nombre: "Max",
    imagen: "/perro19.png",
    tamano: "grande",
    color: "negro",
    edad: "adulto",
    estado: "disponible",
    ubicacion: "Santiago - Providencia",
    fecha: "2024-01-10",
    descripcion: "Perrito muy cariñoso, rescatado de la calle. Ya está vacunado y esterilizado.",
    refugio: "Refugio Esperanza",
  },
  {
    id: 2,
    nombre: "Luna",
    imagen: "/catto.png",
    tamano: "mediano",
    color: "blanco",
    edad: "cachorro",
    estado: "disponible",
    ubicacion: "Santiago - Ñuñoa",
    fecha: "2024-01-12",
    descripcion: "Cachorrita juguetona de aproximadamente 4 meses. Busca una familia amorosa.",
    refugio: "Patitas Felices",
  },
  {
    id: 3,
    nombre: "Rocky",
    imagen: "/perro19.png",
    tamano: "grande",
    color: "café",
    edad: "adulto",
    estado: "en_proceso",
    ubicacion: "Santiago - Las Condes",
    fecha: "2024-01-08",
    descripcion: "Perro guardián muy leal. Necesita un hogar con patio grande.",
    refugio: "Rescate Animal Chile",
  },
  {
    id: 4,
    nombre: "Canela",
    imagen: "/cat-slave.png",
    tamano: "pequeño",
    color: "café",
    edad: "adulto",
    estado: "disponible",
    ubicacion: "Santiago - Vitacura",
    fecha: "2024-01-14",
    descripcion: "Perrita tranquila, ideal para departamento. Muy obediente.",
    refugio: "Refugio Esperanza",
  },
  {
    id: 5,
    nombre: "Thor",
    imagen: "/michi-formal.jpg",
    tamano: "grande",
    color: "dorado",
    edad: "joven",
    estado: "disponible",
    ubicacion: "Santiago - La Reina",
    fecha: "2024-01-11",
    descripcion: "Husky mix muy activo. Necesita ejercicio diario y mucho amor.",
    refugio: "Veterinaria San Jorge",
  },
  {
    id: 6,
    nombre: "Pelusa",
    imagen: "/no_apuren.jpg",
    tamano: "pequeño",
    color: "blanco",
    edad: "senior",
    estado: "disponible",
    ubicacion: "Santiago - Santiago Centro",
    fecha: "2024-01-09",
    descripcion: "Perrita senior muy dulce. Busca un hogar tranquilo para sus últimos años.",
    refugio: "Patitas Felices",
  },
]

const getEstadoLabel = (estado) => {
  switch (estado) {
    case "disponible":
      return { label: "Disponible", color: "bg-green-100 text-green-700" }
    case "en_proceso":
      return { label: "En proceso", color: "bg-yellow-100 text-yellow-700" }
    case "adoptado":
      return { label: "Adoptado", color: "bg-blue-100 text-blue-700" }
    default:
      return { label: estado, color: "bg-gray-100 text-gray-700" }
  }
}

export const BuscarPerrito = () => {
  const [busqueda, setBusqueda] = useState("")
  const [filtros, setFiltros] = useState({
    tamano: "",
    edad: "",
    ubicacion: "",
  })
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [perritoSeleccionado, setPerritoSeleccionado] = useState(null)
  const [favoritos, setFavoritos] = useState([])

  const toggleFavorito = (id) => {
    setFavoritos((prev) =>
      prev.includes(id) ? prev.filter((fav) => fav !== id) : [...prev, id]
    )
  }

  const perritosFiltrados = perritosDisponibles.filter((perrito) => {
    const matchBusqueda =
      perrito.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      perrito.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
      perrito.ubicacion.toLowerCase().includes(busqueda.toLowerCase())

    const matchTamano = !filtros.tamano || perrito.tamano === filtros.tamano
    const matchEdad = !filtros.edad || perrito.edad === filtros.edad
    const matchUbicacion =
      !filtros.ubicacion || perrito.ubicacion.toLowerCase().includes(filtros.ubicacion.toLowerCase())

    return matchBusqueda && matchTamano && matchEdad && matchUbicacion
  })

  const limpiarFiltros = () => {
    setFiltros({ tamano: "", edad: "", ubicacion: "" })
    setBusqueda("")
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Buscar un perrito</h1>
          <p className="text-gray-600">
            Encuentra a tu nuevo mejor amigo entre los perritos que buscan hogar
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6"
        >
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, descripción o ubicación..."
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#156d95] focus:border-transparent outline-none transition-all"
              />
            </div>
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors ${
                mostrarFiltros
                  ? "bg-[#156d95] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Filter className="w-5 h-5" />
              Filtros
              <ChevronDown
                className={`w-4 h-4 transition-transform ${mostrarFiltros ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          <AnimatePresence>
            {mostrarFiltros && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tamaño</label>
                    <select
                      value={filtros.tamano}
                      onChange={(e) => setFiltros({ ...filtros, tamano: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#156d95] focus:border-transparent outline-none"
                    >
                      <option value="">Todos</option>
                      <option value="pequeño">Pequeño</option>
                      <option value="mediano">Mediano</option>
                      <option value="grande">Grande</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Edad</label>
                    <select
                      value={filtros.edad}
                      onChange={(e) => setFiltros({ ...filtros, edad: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#156d95] focus:border-transparent outline-none"
                    >
                      <option value="">Todas</option>
                      <option value="cachorro">Cachorro</option>
                      <option value="joven">Joven</option>
                      <option value="adulto">Adulto</option>
                      <option value="senior">Senior</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ciudad</label>
                    <input
                      type="text"
                      value={filtros.ubicacion}
                      onChange={(e) => setFiltros({ ...filtros, ubicacion: e.target.value })}
                      placeholder="Ej: CDMX, Guadalajara..."
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#156d95] focus:border-transparent outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <button
                    onClick={limpiarFiltros}
                    className="text-sm text-[#156d95] hover:underline"
                  >
                    Limpiar filtros
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results count */}
        <div className="mb-4 text-gray-600">
          {perritosFiltrados.length} perritos encontrados
        </div>

        {/* Grid of dogs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {perritosFiltrados.map((perrito, index) => (
            <motion.div
              key={perrito.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setPerritoSeleccionado(perrito)}
            >
              <div className="relative">
                <img
                  src={perrito.imagen}
                  alt={perrito.nombre}
                  className="w-full h-48 object-cover"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleFavorito(perrito.id)
                  }}
                  className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                >
                  <Heart
                    className={`w-5 h-5 ${
                      favoritos.includes(perrito.id)
                        ? "fill-red-500 text-red-500"
                        : "text-gray-400"
                    }`}
                  />
                </button>
                <div className="absolute bottom-3 left-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      getEstadoLabel(perrito.estado).color
                    }`}
                  >
                    {getEstadoLabel(perrito.estado).label}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-800">{perrito.nombre}</h3>
                  <span className="text-sm text-gray-500 capitalize">{perrito.tamano}</span>
                </div>
                <p className="text-gray-600 text-sm line-clamp-2 mb-3">{perrito.descripcion}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {perrito.ubicacion}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {perritosFiltrados.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No se encontraron perritos con esos criterios.</p>
            <button
              onClick={limpiarFiltros}
              className="mt-4 text-[#156d95] hover:underline"
            >
              Limpiar filtros
            </button>
          </div>
        )}

        {/* Detail Modal */}
        <AnimatePresence>
          {perritoSeleccionado && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setPerritoSeleccionado(null)}
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
                    onClick={() => setPerritoSeleccionado(null)}
                    className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-100"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">{perritoSeleccionado.nombre}</h2>
                      <p className="text-gray-500">{perritoSeleccionado.refugio}</p>
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

                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                    <MapPin className="w-4 h-4" />
                    {perritoSeleccionado.ubicacion}
                    <span className="mx-2">•</span>
                    <Calendar className="w-4 h-4" />
                    {perritoSeleccionado.fecha}
                  </div>

                  <div className="flex gap-3">
                    <button className="flex-1 bg-[#156d95] text-white py-3 px-6 rounded-full font-medium hover:bg-[#125a7d] transition-colors">
                      Quiero adoptarlo
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorito(perritoSeleccionado.id)
                      }}
                      className="w-12 h-12 border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          favoritos.includes(perritoSeleccionado.id)
                            ? "fill-red-500 text-red-500"
                            : "text-gray-400"
                        }`}
                      />
                    </button>
                    <button className="w-12 h-12 border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors">
                      <Share2 className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
