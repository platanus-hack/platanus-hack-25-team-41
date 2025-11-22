import api from "@/lib/axios"

export const sightingsService = {
  // Obtener todos los avistamientos para el mapa
  getMapSightings: async () => {
    const response = await api.get("/api/map/sightings")
    // Retorna { sightings: [...], total: number }
    return response.data
  },

  // Obtener un avistamiento por ID
  getSightingById: async (id) => {
    const response = await api.get(`/api/sightings/${id}`)
    return response.data
  },

  // Crear un nuevo avistamiento
  createSighting: async (data) => {
    const response = await api.post("/api/sightings", data)
    return response.data
  },
}
