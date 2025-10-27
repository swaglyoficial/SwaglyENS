'use client'

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Scan, Trophy, Gift } from "lucide-react"

import { ConnectButton } from "@/components/connect-button"
import { useWalletConnection } from "@/hooks/useWalletConnection"

/**
 * Página principal de Swagly
 * Landing page con diseño basado en la propuesta visual
 */
export default function Home() {
  const router = useRouter()
  const { isConnected, address } = useWalletConnection()
  const hasRedirected = useRef(false)

  /**
   * Redirigir a /inicio SOLO cuando se conecta por primera vez
   * Usar un ref para evitar redirecciones múltiples
   */
  useEffect(() => {
    if (isConnected && address && !hasRedirected.current) {
      hasRedirected.current = true
      router.push('/inicio')
    }
  }, [isConnected, address, router])

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Background effects con colores Swagly */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="neon-grid absolute inset-0 opacity-5" aria-hidden />

        {/* Línea vertical azul derecha */}
        <div
          className="absolute right-0 top-0 h-[400px] w-1 bg-gradient-to-b from-[#5061EC] via-[#5061EC]/60 to-transparent opacity-60 sm:h-[600px]"
          aria-hidden
        />

        {/* Curva azul superior derecha */}
        <div
          className="absolute -right-32 -top-32 h-[300px] w-[300px] rounded-full border-[3px] border-[#5061EC] opacity-30 sm:-right-20 sm:-top-20 sm:h-[400px] sm:w-[400px]"
          aria-hidden
        />

        {/* Curva azul decorativa centro */}
        <svg
          className="absolute right-0 top-1/4 h-[400px] w-[600px] opacity-40 sm:h-[500px] sm:w-[800px]"
          viewBox="0 0 800 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            d="M800 0C800 100 700 200 500 250C300 300 200 350 100 500"
            stroke="url(#blueGradient)"
            strokeWidth="2"
            fill="none"
          />
          <defs>
            <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5061EC" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#5061EC" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Curva amarilla inferior izquierda */}
        <svg
          className="absolute -left-32 bottom-0 h-[300px] w-[500px] opacity-50 sm:-left-20 sm:h-[400px] sm:w-[700px]"
          viewBox="0 0 700 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            d="M0 400C100 350 200 300 400 280C600 260 700 200 700 100"
            stroke="url(#yellowGradient)"
            strokeWidth="3"
            fill="none"
          />
          <defs>
            <linearGradient id="yellowGradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FEE887" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#FEE887" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Curva amarilla inferior derecha */}
        <svg
          className="absolute -right-20 bottom-0 h-[250px] w-[400px] opacity-50 sm:h-[350px] sm:w-[600px]"
          viewBox="0 0 600 350"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            d="M600 350C500 300 400 250 250 230C100 210 0 150 0 0"
            stroke="url(#yellowGradient2)"
            strokeWidth="2.5"
            fill="none"
          />
          <defs>
            <linearGradient id="yellowGradient2" x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#FEE887" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#FEE887" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Círculo decorativo amarillo inferior */}
        <div
          className="absolute -bottom-20 left-1/4 h-[150px] w-[150px] rounded-full border-[2px] border-[#FEE887] opacity-25 sm:h-[200px] sm:w-[200px]"
          aria-hidden
        />

        {/* Líneas horizontales decorativas */}
        <div
          className="absolute bottom-0 left-0 h-[2px] w-[200px] bg-gradient-to-r from-[#FEE887] to-transparent opacity-40 sm:w-[400px]"
          aria-hidden
        />
        <div
          className="absolute bottom-10 right-0 h-[2px] w-[250px] bg-gradient-to-l from-[#FEE887] to-transparent opacity-40 sm:bottom-20 sm:w-[500px]"
          aria-hidden
        />

        {/* Línea curva amarilla decorativa superior */}
        <svg
          className="absolute left-0 top-20 h-[200px] w-[300px] opacity-30 sm:h-[300px] sm:w-[500px]"
          viewBox="0 0 500 300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            d="M0 150C100 100 200 50 350 100C450 130 500 180 500 250"
            stroke="url(#yellowGradient3)"
            strokeWidth="2"
            fill="none"
          />
          <defs>
            <linearGradient id="yellowGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FEE887" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#FEE887" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-4 py-4 sm:px-6 sm:py-6 lg:px-20">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Image
            src="/images/LogoSwagly.png"
            alt="Swagly Logo"
            width={40}
            height={40}
            className="h-8 w-8 sm:h-10 sm:w-10"
          />
          <Image
            src="/images/TextoLogoSwagly.png"
            alt="Swagly"
            width={100}
            height={30}
            className="h-auto w-16 sm:w-20 lg:w-24"
          />
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 px-4 py-8 sm:px-6 sm:py-12 lg:px-20 lg:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-6 text-center lg:text-left lg:space-y-8">
            <div className="space-y-3 sm:space-y-4">
              <h1 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl lg:text-6xl">
                <span className="text-[#5061EC]">Explora</span>, juega y gana
                <br />
                <span className="text-white">merch épica.</span>
              </h1>
              <p className="mx-auto max-w-xl text-sm text-white/80 sm:text-base lg:text-lg lg:mx-0 lg:max-w-md">
                Crea tu cuenta y distribuciones tu pasaporte digital para recolectar experiencias, NFTs y merch única dentro del evento.
              </p>
            </div>

            {/* CTA Button - Ahora es el principal botón de conexión */}
            <div className="flex justify-center lg:justify-start">
              <div className="w-full max-w-xs sm:max-w-sm lg:w-auto">
                <ConnectButton />
              </div>
            </div>
          </div>

          {/* Right Content - Hero Image */}
          <div className="relative flex justify-center lg:justify-end order-first lg:order-last">
            <div className="relative h-[250px] w-[250px] sm:h-[350px] sm:w-[350px] lg:h-[400px] lg:w-[400px]">
              {/* Yellow circle background */}
              <div className="absolute inset-0 rounded-full bg-[#FEE887] opacity-90" />
              {/* Person image */}
              <div className="absolute inset-0 overflow-hidden rounded-full">
                <Image
                  src="/images/imagen-inicio.jpg"
                  alt="Excited person"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 px-4 py-8 sm:px-6 sm:py-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Card 1 - Escanea */}
            <div className="group relative overflow-hidden rounded-2xl bg-[#5061EC] p-6 transition-transform hover:scale-105 sm:rounded-3xl sm:p-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                <div className="flex justify-center sm:justify-start">
                  <div className="rounded-full bg-white/20 p-3 backdrop-blur">
                    <Scan className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                  </div>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="mb-2 text-lg font-bold text-white sm:text-xl">Escanea</h3>
                  <p className="text-xs text-white/90 sm:text-sm">
                    Al registrarse genera tu código QR personal que facilita la validación de actividades.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2 - Participa */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 p-6 backdrop-blur transition-transform hover:scale-105 sm:rounded-3xl sm:p-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                <div className="flex justify-center sm:justify-start">
                  <div className="rounded-full bg-white/10 p-3">
                    <Trophy className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                  </div>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="mb-2 text-lg font-bold text-white sm:text-xl">Participa</h3>
                  <p className="text-xs text-white/80 sm:text-sm">
                    Lleva un registro completo de las actividades, conferencias y stands que visites y en las que participes.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3 - Gana */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#FEE887] to-[#FFFACD] p-6 transition-transform hover:scale-105 sm:rounded-3xl sm:p-8 sm:col-span-2 lg:col-span-1">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                <div className="flex justify-center sm:justify-start">
                  <div className="rounded-full bg-black/10 p-3">
                    <Gift className="h-5 w-5 text-black sm:h-6 sm:w-6" />
                  </div>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="mb-2 text-lg font-bold text-black sm:text-xl">Gana</h3>
                  <p className="text-xs text-black/80 sm:text-sm">
                    Con cada actividad acumula tokens que puedes intercambiar por artículos coleccionables y NFTs exclusivos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Spacing bottom for mobile */}
      <div className="h-8 sm:h-12" />
    </main>
  )
}
