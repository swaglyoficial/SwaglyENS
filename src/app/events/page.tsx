'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import Image from 'next/image'
import { Loader2, ArrowRight, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TokenBalance } from '@/components/token-balance'
import { ConnectButton } from '@/components/connect-button'

interface Passport {
  id: string
  progress: number
  event: {
    id: string
    name: string
    description: string
    startDate: string
    endDate: string
  }
}

interface User {
  id: string
  nickname: string
  walletAddress: string
  passports: Passport[]
}

/**
 * Página de Eventos Web3
 * Muestra todos los eventos en los que el usuario tiene pasaportes
 */
export default function EventsPage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!isConnected) {
      router.push('/')
      return
    }

    async function fetchUserData() {
      if (!address) return

      try {
        const response = await fetch(`/api/users/${address}`)
        const data = await response.json()

        if (response.ok && data.user) {
          setUser(data.user)
        } else {
          router.push('/onboarding')
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [isConnected, address, router])

  if (isLoading || !isConnected) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-[#5061EC]" />
      </main>
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white pb-20">
      {/* Background decorativo con líneas mejoradas */}
      <div className="pointer-events-none absolute inset-0">
        <div className="neon-grid absolute inset-0 opacity-5" aria-hidden />

        {/* Línea vertical azul derecha */}
        <div
          className="absolute right-0 top-0 h-[600px] w-1 bg-gradient-to-b from-[#5061EC] via-transparent to-transparent opacity-30"
          aria-hidden
        />

        {/* Curva azul decorativa */}
        <svg
          className="absolute right-0 top-1/4 h-[400px] w-[600px] opacity-40 sm:h-[500px] sm:w-[800px]"
          viewBox="0 0 800 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            d="M800 0C800 100 700 200 500 250C300 300 200 350 100 500"
            stroke="url(#blueGradientEvents)"
            strokeWidth="2"
            fill="none"
          />
          <defs>
            <linearGradient id="blueGradientEvents" x1="0%" y1="0%" x2="100%" y2="100%">
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
            stroke="url(#yellowGradientEvents)"
            strokeWidth="3"
            fill="none"
          />
          <defs>
            <linearGradient id="yellowGradientEvents" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FEE887" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#FEE887" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Círculo decorativo amarillo */}
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
      </div>

      {/* Header mejorado con UI/UX */}
      <header className="relative z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-4 sm:px-12 lg:px-20">
          {/* Logo - Solo mundito en móvil, con texto en desktop */}
          <a href="/inicio" className="flex items-center gap-2">
            <div className="rounded-full bg-gradient-to-br from-[#5061EC]/20 to-[#5061EC]/5 p-1 transition-all duration-300 hover:scale-110 hover:from-[#5061EC]/30 hover:to-[#5061EC]/10">
              <Image
                src="/images/LogoSwagly.png"
                alt="Swagly Logo"
                width={40}
                height={40}
                className="h-8 w-8 sm:h-10 sm:w-10"
              />
            </div>
            {/* Texto del logo - Oculto en móvil */}
            <Image
              src="/images/TextoLogoSwagly.png"
              alt="Swagly"
              width={100}
              height={30}
              className="hidden h-auto w-20 sm:block lg:w-24"
            />
          </a>

          {/* Navegación Desktop - Oculta en móvil */}
          <nav className="hidden items-center gap-4 md:flex lg:gap-6">
            <a
              href="/inicio"
              className="group relative px-3 py-2 text-sm font-medium transition-all duration-300 hover:text-[#FEE887]"
            >
              <span className="relative z-10">Inicio</span>
              <div className="absolute inset-0 rounded-lg bg-[#FEE887]/0 transition-all duration-300 group-hover:bg-[#FEE887]/10" />
            </a>
            <a
              href="/shop"
              className="group relative px-3 py-2 text-sm font-medium transition-all duration-300 hover:text-[#FEE887]"
            >
              <span className="relative z-10">Tienda</span>
              <div className="absolute inset-0 rounded-lg bg-[#FEE887]/0 transition-all duration-300 group-hover:bg-[#FEE887]/10" />
            </a>
            <a
              href="/events"
              className="group relative px-3 py-2 text-sm font-medium text-[#FEE887]"
            >
              <span className="relative z-10">Tus eventos</span>
              <div className="absolute inset-0 rounded-lg bg-[#FEE887]/10" />
            </a>

            {/* Balance amarillo */}
            <TokenBalance />

            {/* Icono de perfil azul - Link a perfil */}
            <a
              href="/profile"
              className="group relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-[#5061EC]/40 bg-gradient-to-br from-[#5061EC]/20 to-[#5061EC]/5 shadow-lg shadow-[#5061EC]/20 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:border-[#5061EC]/60 hover:shadow-[#5061EC]/40"
            >
              <svg
                className="h-5 w-5 text-[#5061EC] transition-colors group-hover:text-[#5061EC]"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
          </nav>

          {/* Navegación Móvil - Visible solo en móvil */}
          <div className="flex items-center gap-3 md:hidden">
            {/* Balance amarillo */}
            <TokenBalance />

            {/* Icono de perfil azul */}
            <a
              href="/profile"
              className="group relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-[#5061EC]/40 bg-gradient-to-br from-[#5061EC]/20 to-[#5061EC]/5 shadow-lg shadow-[#5061EC]/20 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:border-[#5061EC]/60 hover:shadow-[#5061EC]/40"
            >
              <svg
                className="h-5 w-5 text-[#5061EC] transition-colors group-hover:text-[#5061EC]"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
            </a>

            {/* Hamburger Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-[#5061EC]/20 text-white transition-all duration-300 hover:bg-[#5061EC]/30"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="border-t border-white/5 bg-black/95 backdrop-blur-xl md:hidden">
            <nav className="space-y-1 px-4 py-4">
              <a
                href="/inicio"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block rounded-lg px-4 py-3 text-sm font-medium text-white transition-all duration-300 hover:bg-[#FEE887]/10 hover:text-[#FEE887]"
              >
                Inicio
              </a>
              <a
                href="/shop"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block rounded-lg px-4 py-3 text-sm font-medium text-white transition-all duration-300 hover:bg-[#FEE887]/10 hover:text-[#FEE887]"
              >
                Tienda
              </a>
              <a
                href="/events"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block rounded-lg px-4 py-3 text-sm font-medium text-[#FEE887] bg-[#FEE887]/10"
              >
                Tus eventos
              </a>
            </nav>
          </div>
        )}
      </header>

      {/* Content */}
      <section className="relative z-10 px-6 py-12 sm:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          {/* Title con UI/UX mejorado */}
          <div className="mb-16 text-center">
            <h1 className="mb-4 text-4xl font-bold sm:text-5xl lg:text-6xl">
              <span className="bg-gradient-to-r from-[#5061EC] via-white to-[#5061EC] bg-clip-text text-transparent">
                Tus Eventos Web3
              </span>
            </h1>
            <p className="text-lg text-white/80 sm:text-xl">
              Explora tus pasaportes y sigue tu progreso en cada evento
            </p>
          </div>

          {/* Events Grid */}
          {user && user.passports.length > 0 ? (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {user.passports.map((passport) => (
                <div
                  key={passport.id}
                  className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#5061EC] to-[#4051CC] p-8 shadow-xl shadow-[#5061EC]/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[#5061EC]/40 cursor-pointer"
                  onClick={() => router.push(`/dashboard?passportId=${passport.id}`)}
                >
                  {/* Efecto hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  <div className="relative z-10">
                    {/* Event Image Circle */}
                    <div className="mb-6 flex justify-center">
                      <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-white/30 shadow-lg transition-transform duration-300 group-hover:scale-110">
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/20 to-white/5">
                          <span className="text-4xl font-bold text-white">
                            {passport.event.name.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Event Name */}
                    <h3 className="mb-3 text-center text-xl font-bold text-white">
                      {passport.event.name}
                    </h3>

                    {/* Event Description */}
                    <p className="mb-4 text-center text-sm text-white/90 line-clamp-2">
                      {passport.event.description}
                    </p>

                    {/* Progress Badge */}
                    <div className="mb-6 flex justify-center">
                      <div className="rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm">
                        <p className="text-sm font-bold text-white">
                          {passport.progress}% Completado
                        </p>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <Button
                      className="w-full rounded-full bg-[#FEE887] text-black font-bold shadow-lg shadow-[#FEE887]/30 transition-all duration-300 hover:bg-[#FFFACD] hover:shadow-xl hover:shadow-[#FEE887]/50 group-hover:scale-105"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/dashboard?passportId=${passport.id}`)
                      }}
                    >
                      Ver pasaporte
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="group relative mb-8 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#5061EC]/30 to-[#5061EC]/10 shadow-2xl shadow-[#5061EC]/20 transition-all duration-300 hover:scale-110">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="relative z-10 text-7xl">📅</span>
              </div>
              <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
                <span className="bg-gradient-to-r from-[#5061EC] to-[#FEE887] bg-clip-text text-transparent">
                  No tienes eventos aún
                </span>
              </h2>
              <p className="mb-12 max-w-lg text-center text-lg text-white/80">
                Agrega tu primer pasaporte para comenzar a participar en eventos Web3 y coleccionar experiencias únicas
              </p>
              <Button
                onClick={() => router.push('/inicio')}
                className="rounded-full bg-[#FEE887] px-10 py-6 text-lg font-bold text-black shadow-2xl shadow-[#FEE887]/30 transition-all duration-300 hover:scale-105 hover:bg-[#FFFACD] hover:shadow-[#FEE887]/50"
              >
                Agregar pasaporte
              </Button>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
