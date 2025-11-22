import { Figtree, Inter, Geist_Mono } from "next/font/google"
import "./globals.css"

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  weight: ["400", "500", "600"],
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  weight: ["400", "500", "600"],
})

export const metadata = {
  title: "BusCachorros - Catastro de perros callejeros y búsqueda de mascotas",
  description: "Plataforma colaborativa para generar un catastro geolocalizado de perros callejeros y ayudar a encontrar mascotas perdidas. Reporta avistamientos y conecta con refugios.",
  metadataBase: new URL("https://frontend-849537710972.us-central1.run.app"),
  openGraph: {
    title: "BusCachorros - Catastro de perros callejeros y búsqueda de mascotas",
    description: "Plataforma colaborativa para generar un catastro geolocalizado de perros callejeros y ayudar a encontrar mascotas perdidas. Reporta avistamientos y conecta con refugios.",
    url: "https://frontend-849537710972.us-central1.run.app",
    siteName: "BusCachorros",
    images: [
      {
        url: "/placeholder.png",
        width: 1200,
        height: 630,
        alt: "BusCachorros - Encuentra y reporta perros callejeros",
      },
    ],
    locale: "es_CL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BusCachorros - Catastro de perros callejeros y búsqueda de mascotas",
    description: "Plataforma colaborativa para generar un catastro geolocalizado de perros callejeros y ayudar a encontrar mascotas perdidas.",
    images: ["/placeholder.png"],
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${figtree.variable} ${geistMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
