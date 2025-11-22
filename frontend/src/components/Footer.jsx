"use client"

import { motion } from "framer-motion"
import Link from "next/link"

export const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full bg-[#fafafa] border-t border-[#e5e5e5]">
      <div className="max-w-[1200px] mx-auto px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col md:flex-row justify-between items-center gap-6"
        >
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <h3
              className="text-xl font-semibold text-[#202020]"
              style={{ fontFamily: "Figtree", fontWeight: "600" }}
            >
              DogFinder
            </h3>
            <nav className="flex items-center gap-6">
              <Link
                href="/map"
                className="text-sm text-[#666666] hover:text-[#202020] transition-colors duration-150"
                style={{ fontFamily: "Figtree" }}
              >
                Mapa
              </Link>
              <Link
                href="/reportar"
                className="text-sm text-[#666666] hover:text-[#202020] transition-colors duration-150"
                style={{ fontFamily: "Figtree" }}
              >
                Reportar
              </Link>
              <Link
                href="/buscar"
                className="text-sm text-[#666666] hover:text-[#202020] transition-colors duration-150"
                style={{ fontFamily: "Figtree" }}
              >
                Buscar
              </Link>
            </nav>
          </div>

          <p className="text-sm text-[#666666]" style={{ fontFamily: "Figtree" }}>
            © {currentYear} DogFinder
          </p>
        </motion.div>
      </div>
    </footer>
  )
}
