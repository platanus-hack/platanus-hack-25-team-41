import { Navbar } from "@/components/Navbar"
import { HeroCatastro } from "@/components/HeroCatastro"
import { EstadisticasChile } from "@/components/EstadisticasChile"
import { Footer } from "@/components/Footer"

export default function Page() {
  return (
    <>
      <Navbar />
      <HeroCatastro />
      <EstadisticasChile />
      <Footer />
    </>
  )
}
