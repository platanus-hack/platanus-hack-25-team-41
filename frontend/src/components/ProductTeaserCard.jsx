"use client"

import { motion } from "framer-motion"
import { ArrowUpRight } from "lucide-react"

export const ProductTeaserCard = ({
  dailyVolume = "12,847",
  dailyVolumeLabel = "PERRITOS ENCONTRADOS",
  headline = "Ayuda a los perritos callejeros a encontrar un hogar",
  subheadline = "Sube fotos geolocalizadas de perros callejeros y ayuda a conectarlos con refugios, rescatistas y familias con ánimos de ayudar. Juntos podemos darles una segunda oportunidad.",
  description = "Una comunidad comprometida con el bienestar animal. Reporta avistamientos, sigue el estado de los perritos y colabora con refugios locales para salvar más vidas.",
  videoSrc = "https://cdn.sanity.io/files/1t8iva7t/production/a2cbbed7c998cf93e7ecb6dae75bab42b13139c2.mp4",
  posterSrc = "/images/design-mode/9ad78a5534a46e77bafe116ce1c38172c60dc21a-1069x1068.png",
  primaryButtonText = "Reportar avistamiento",
  primaryButtonHref = "",
  secondaryButtonText = "Ver mapa",
  secondaryButtonHref = "",
} = {}) => {
  return (
    <section className="w-full px-8 pt-32 pb-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-12 gap-2">
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              duration: 0.8,
              ease: [0.645, 0.045, 0.355, 1],
            }}
            className="col-span-12 lg:col-span-6 bg-[#e9e9e9] rounded-[40px] p-12 lg:p-16 flex flex-col justify-end aspect-square overflow-hidden"
          >
            <a
              href={primaryButtonHref}
              onClick={(e) => e.preventDefault()}
              className="flex flex-col gap-1 text-[#9a9a9a]"
            >
              <motion.span
                initial={{
                  transform: "translateY(20px)",
                  opacity: 0,
                }}
                animate={{
                  transform: "translateY(0px)",
                  opacity: 1,
                }}
                transition={{
                  duration: 0.4,
                  ease: [0.645, 0.045, 0.355, 1],
                  delay: 0.6,
                }}
                className="text-sm uppercase tracking-tight font-mono flex items-center gap-1"
                style={{
                  fontFamily: "var(--font-geist-mono), 'Geist Mono', ui-monospace, monospace",
                }}
              >
                {dailyVolumeLabel}
                <ArrowUpRight className="w-[0.71em] h-[0.71em]" />
              </motion.span>
            </a>

            <h1
              className="text-[56px] leading-[60px] tracking-tight text-[#202020] max-w-[520px] mb-6"
              style={{
                fontWeight: "500",
                fontFamily: "var(--font-figtree), Figtree",
              }}
            >
              {headline}
            </h1>

            <p
              className="text-lg leading-7 text-[#404040] max-w-[520px] mb-6"
              style={{
                fontFamily: "var(--font-figtree), Figtree",
              }}
            >
              {subheadline}
            </p>

            <ul className="flex gap-1.5 flex-wrap mt-10">
              <li>
                <a
                  href={primaryButtonHref}
                  onClick={(e) => e.preventDefault()}
                  className="block cursor-pointer text-white bg-[#0988f0] rounded-full px-[18px] py-[15px] text-base leading-4 whitespace-nowrap transition-all duration-150 ease-[cubic-bezier(0.455,0.03,0.515,0.955)] hover:rounded-2xl"
                  style={{
                    background: "#156d95",
                  }}
                >
                  {primaryButtonText}
                </a>
              </li>
              <li>
                <a
                  href={secondaryButtonHref}
                  onClick={(e) => e.preventDefault()}
                  className="block cursor-pointer text-[#202020] border border-[#202020] rounded-full px-[18px] py-[15px] text-base leading-4 whitespace-nowrap transition-all duration-150 ease-[cubic-bezier(0.455,0.03,0.515,0.955)] hover:rounded-2xl"
                >
                  {secondaryButtonText}
                </a>
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              duration: 0.8,
              ease: [0.645, 0.045, 0.355, 1],
              delay: 0.2,
            }}
            className="col-span-12 lg:col-span-6 bg-white rounded-[40px] flex justify-center items-center aspect-square overflow-hidden"
            style={{
              backgroundImage:
                "url(https://storage.googleapis.com/storage.magicpath.ai/user/282171029206482944/assets/882ef3dd-3459-4fd8-a939-52ceada51d5c.png)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              opacity: "1",
            }}
          >
            <video
              src={videoSrc}
              autoPlay
              muted
              loop
              playsInline
              poster={posterSrc}
              className="block w-full h-full object-cover"
            />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
