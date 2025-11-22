"use client"

import { motion } from "framer-motion"
import { Dog, MapPin, Heart, AlertTriangle } from "lucide-react"

const estadisticas = [
  {
    icon: Dog,
    valor: "3.4M",
    label: "Perros sin hogar",
    descripcion: "Más de 3.4 millones de perros viven en las calles de Chile sin supervisión",
    color: "#156d95",
  },
  {
    icon: MapPin,
    valor: "27%",
    label: "Con microchip",
    descripcion: "Solo el 27% de las mascotas en Chile están registradas con microchip",
    color: "#16b364",
  },
  {
    icon: AlertTriangle,
    valor: "50K",
    label: "Mordeduras al año",
    descripcion: "Aproximadamente 50.000 mordeduras de perros ocurren anualmente",
    color: "#f59e0b",
  },
  {
    icon: Heart,
    valor: "65%",
    label: "Apoyan esterilización",
    descripcion: "De los chilenos considera la esterilización como la mejor solución",
    color: "#ec4899",
  },
]

export const EstadisticasChile = () => {
  return (
    <section className="w-full py-24 px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2
            className="text-[40px] leading-tight text-[#202020] mb-4 tracking-tight"
            style={{ fontFamily: "var(--font-figtree), Figtree", fontWeight: "500" }}
          >
            La realidad en Chile
          </h2>
          <p
            className="text-lg text-[#666666] max-w-2xl mx-auto"
            style={{ fontFamily: "var(--font-figtree), Figtree" }}
          >
            Según el primer censo nacional de mascotas, Chile enfrenta un desafío importante
            con la población de perros callejeros. Con tu ayuda podemos cambiar estas cifras.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {estadisticas.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="bg-[#fafafa] rounded-3xl p-8 border border-[#e5e5e5]"
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                style={{ backgroundColor: `${stat.color}15` }}
              >
                <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
              </div>
              <div
                className="text-4xl font-bold text-[#202020] mb-2"
                style={{ fontFamily: "var(--font-figtree), Figtree" }}
              >
                {stat.valor}
              </div>
              <div
                className="text-base font-medium text-[#202020] mb-2"
                style={{ fontFamily: "var(--font-figtree), Figtree" }}
              >
                {stat.label}
              </div>
              <p
                className="text-sm text-[#666666]"
                style={{ fontFamily: "var(--font-figtree), Figtree" }}
              >
                {stat.descripcion}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p
            className="text-sm text-[#999999]"
            style={{ fontFamily: "var(--font-figtree), Figtree" }}
          >
            Fuente: Censo Nacional de Mascotas 2022 - Veterinaria UC y Subdere
          </p>
        </motion.div>
      </div>
    </section>
  )
}
