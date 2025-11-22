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
  title: "DogFinder - Catastro de perros callejeros y búsqueda de mascotas",
  description: "Plataforma colaborativa para generar un catastro geolocalizado de perros callejeros y ayudar a encontrar mascotas perdidas. Reporta avistamientos y conecta con refugios.",
  icons: {
    icon: "/icon.svg",
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
