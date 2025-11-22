"use client"

import { Navbar } from "@/components/Navbar"
import { BuscarPerrito } from "@/components/BuscarPerrito"

export default function BuscarPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <BuscarPerrito />
    </div>
  )
}
