"use client"

import { Navbar } from "@/components/Navbar"
import { ReportarPerrito } from "@/components/ReportarPerrito"

export default function ReportarPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <ReportarPerrito />
    </div>
  )
}
