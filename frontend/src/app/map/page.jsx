"use client"

import dynamic from "next/dynamic"
import { Navbar } from "@/components/Navbar"

// Import MapaPerritos dynamically to avoid SSR issues with Leaflet
const MapaPerritos = dynamic(() => import("@/components/MapaPerritos").then((mod) => mod.MapaPerritos), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#156d95] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando mapa...</p>
      </div>
    </div>
  ),
})

export default function MapPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <MapaPerritos />
    </div>
  )
}
