import axios from "axios"

// En producción con CORS habilitado, usa la URL directa del backend
// En desarrollo, usa el proxy de Next.js (baseURL vacío)
const baseURL = process.env.NEXT_PUBLIC_API_URL || ""

const api = axios.create({
  baseURL,
  timeout: 60000, // 60 segundos para permitir uploads de imágenes
  headers: {
    "Content-Type": "application/json",
  },
})

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export default api
