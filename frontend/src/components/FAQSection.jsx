"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus } from "lucide-react"

const defaultFAQs = [
  {
    question: "¿Qué es DogFinder y cómo funciona?",
    answer:
      "DogFinder es una plataforma que conecta a personas que encuentran perros callejeros con refugios, rescatistas y familias adoptivas. Simplemente toma una foto del perrito, la app obtiene tu ubicación automáticamente, y el reporte se publica en nuestro mapa para que rescatistas cercanos puedan ayudar.",
  },
  {
    question: "¿Cómo puedo reportar un perrito callejero?",
    answer:
      "Es muy fácil: abre la app, toma una foto del perrito y agrega una breve descripción de su estado (si parece perdido, herido, o simplemente necesita ayuda). La ubicación se detecta automáticamente. Tu reporte aparecerá en el mapa y notificará a refugios y rescatistas cercanos para que puedan actuar rápidamente.",
  },
  {
    question: "¿Cómo puedo adoptar un perrito o ser voluntario?",
    answer:
      "Para adoptar, explora el mapa o la galería de perritos disponibles y contacta directamente al refugio o rescatista encargado. Si quieres ser voluntario, puedes registrarte como rescatista independiente o unirte a uno de los refugios colaboradores. También puedes ayudar compartiendo los reportes en redes sociales para aumentar las posibilidades de adopción.",
  },
]

export const FAQSection = ({ title = "Preguntas frecuentes", faqs = defaultFAQs } = {}) => {
  const [openIndex, setOpenIndex] = useState(null)

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="w-full py-24 px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-16">
          {/* Left Column - Title */}
          <div className="lg:col-span-4">
            <h2
              className="text-[40px] leading-tight font-normal text-[#202020] tracking-tight sticky top-24"
              style={{
                fontFamily: "var(--font-figtree), Figtree",
                fontWeight: "400",
                fontSize: "40px",
              }}
            >
              {title}
            </h2>
          </div>

          {/* Right Column - FAQ Items */}
          <div className="lg:col-span-8">
            <div className="space-y-0">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b border-[#e5e5e5] last:border-b-0">
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full flex items-center justify-between py-6 text-left group hover:opacity-70 transition-opacity duration-150"
                    aria-expanded={openIndex === index}
                  >
                    <span
                      className="text-lg leading-7 text-[#202020] pr-8"
                      style={{
                        fontFamily: "var(--font-figtree), Figtree",
                        fontWeight: "400",
                      }}
                    >
                      {faq.question}
                    </span>
                    <motion.div
                      animate={{
                        rotate: openIndex === index ? 45 : 0,
                      }}
                      transition={{
                        duration: 0.2,
                        ease: [0.4, 0, 0.2, 1],
                      }}
                      className="flex-shrink-0"
                    >
                      <Plus className="w-6 h-6 text-[#202020]" strokeWidth={1.5} />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {openIndex === index && (
                      <motion.div
                        initial={{
                          height: 0,
                          opacity: 0,
                        }}
                        animate={{
                          height: "auto",
                          opacity: 1,
                        }}
                        exit={{
                          height: 0,
                          opacity: 0,
                        }}
                        transition={{
                          duration: 0.3,
                          ease: [0.4, 0, 0.2, 1],
                        }}
                        className="overflow-hidden"
                      >
                        <div className="pb-6 pr-12">
                          <p
                            className="text-lg leading-6 text-[#666666]"
                            style={{
                              fontFamily: "var(--font-figtree), Figtree",
                            }}
                          >
                            {faq.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
