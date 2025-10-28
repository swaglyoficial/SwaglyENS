'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useRequireProfile } from '@/hooks/useRequireProfile'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import Image from 'next/image'
import { Loader2, Plus, Menu, X } from 'lucide-react'
import { TokenBalance } from '@/components/token-balance'
import { ConnectButton } from '@/components/connect-button'

interface Event {
  id: string
  name: string
  description: string
  startDate: string
  endDate: string
}

export default function InicioPage() {
  const router = useRouter()
  const { hasProfile, isChecking, address, isConnected } = useRequireProfile()

  const [nickname, setNickname] = useState('')
  const [selectedEventId, setSelectedEventId] = useState('')
  const [events, setEvents] = useState<Event[]>([])
  const [showDialog, setShowDialog] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingEvents, setIsLoadingEvents] = useState(true)
  const [error, setError] = useState('')
  const [hasExistingNickname, setHasExistingNickname] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // NO redirigir automáticamente - dejar que el usuario vea la página

  useEffect(() => {
    async function fetchInitialData() {
      try {
        const eventsResponse = await fetch('/api/events')
        const eventsData = await eventsResponse.json()

        if (eventsResponse.ok) {
          setEvents(eventsData.events || [])
        } else {
          setError('Error al cargar eventos')
        }

        if (address) {
          const userResponse = await fetch(`/api/users/${address}`)

          if (userResponse.ok) {
            const userData = await userResponse.json()
            if (userData.user && userData.user.nickname) {
              setNickname(userData.user.nickname)
              setHasExistingNickname(true)
            }
          }
        }
      } catch (err) {
        setError('Error al conectar con el servidor')
      } finally {
        setIsLoadingEvents(false)
      }
    }

    if (isConnected) {
      fetchInitialData()
    }
  }, [isConnected, address])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!nickname.trim() && !hasExistingNickname) {
      setError('Por favor ingresa tu apodo')
      return
    }

    if (!selectedEventId) {
      setError('Por favor selecciona un evento')
      return
    }

    setIsLoading(true)

    try {
      const userResponse = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          nickname: nickname.trim(),
        }),
      })

      const userData = await userResponse.json()

      if (!userResponse.ok) {
        throw new Error(userData.error || 'Error al crear usuario')
      }

      const passportResponse = await fetch('/api/passports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.user.id,
          eventId: selectedEventId,
        }),
      })

      const passportData = await passportResponse.json()

      if (!passportResponse.ok) {
        if (passportData.error?.includes('Ya existe')) {
          router.push('/events')
          return
        }
        throw new Error(passportData.error || 'Error al crear pasaporte')
      }

      router.push('/events')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isConnected || isLoadingEvents) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-[#5061EC]" />
      </main>
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Background decorativo mejorado */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="neon-grid absolute inset-0 opacity-5" aria-hidden />

        {/* Línea vertical azul derecha */}
        <div
          className="absolute right-0 top-0 h-[400px] w-1 animate-pulse bg-gradient-to-b from-[#5061EC] via-[#5061EC]/60 to-transparent opacity-60 sm:h-[600px]"
          aria-hidden
        />

        {/* Curva azul decorativa superior */}
        <svg
          className="absolute right-0 top-1/4 h-[400px] w-[600px] opacity-40 sm:h-[500px] sm:w-[800px]"
          viewBox="0 0 800 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            d="M800 0C800 100 700 200 500 250C300 300 200 350 100 500"
            stroke="url(#blueGradientInicio)"
            strokeWidth="2"
            fill="none"
          />
          <defs>
            <linearGradient id="blueGradientInicio" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5061EC" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#5061EC" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Curva amarilla inferior izquierda */}
        <svg
          className="absolute -left-20 bottom-0 h-[300px] w-[500px] opacity-50 sm:h-[400px] sm:w-[700px]"
          viewBox="0 0 700 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            d="M0 400C100 350 200 300 400 280C600 260 700 200 700 100"
            stroke="url(#yellowGradientInicio)"
            strokeWidth="3"
            fill="none"
          />
          <defs>
            <linearGradient id="yellowGradientInicio" x1="0%" y1="100%" x2="100%" y2="0%">
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
            stroke="url(#yellowGradient2Inicio)"
            strokeWidth="2.5"
            fill="none"
          />
          <defs>
            <linearGradient id="yellowGradient2Inicio" x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#FEE887" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#FEE887" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Círculos decorativos */}
        <div
          className="absolute -right-32 -top-32 h-[300px] w-[300px] animate-pulse rounded-full border-[3px] border-[#5061EC] opacity-30 sm:-right-20 sm:-top-20 sm:h-[400px] sm:w-[400px]"
          aria-hidden
        />
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

      {/* Header mejorado con UI/UX y menú móvil */}
      <header className="relative z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          {/* Logo - Solo mundito en móvil */}
          <a href="/inicio" className="flex items-center gap-2 transition-transform duration-300 hover:scale-105">
            <div className="rounded-full bg-gradient-to-br from-[#5061EC]/20 to-[#5061EC]/5 p-1">
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

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-4 md:flex lg:gap-6">
            <a
              href="/inicio"
              className="group relative px-3 py-2 text-sm font-medium transition-colors"
            >
              <span className="relative z-10 text-[#FEE887]">Inicio</span>
              <div className="absolute inset-0 rounded-lg bg-[#FEE887]/10 scale-100 opacity-100"></div>
            </a>
            <a
              href="/shop"
              className="group relative px-3 py-2 text-sm font-medium text-white/70 transition-all hover:text-white"
            >
              <span className="relative z-10">Tienda</span>
              <div className="absolute inset-0 rounded-lg bg-white/5 scale-95 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100"></div>
            </a>
            <a
              href="/events"
              className="group relative px-3 py-2 text-sm font-medium text-white/70 transition-all hover:text-white"
            >
              <span className="relative z-10">Tus eventos</span>
              <div className="absolute inset-0 rounded-lg bg-white/5 scale-95 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100"></div>
            </a>

            <TokenBalance />

            <a
              href="/profile"
              className="group relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-[#5061EC]/40 bg-gradient-to-br from-[#5061EC]/20 to-[#5061EC]/5 shadow-lg shadow-[#5061EC]/20 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:border-[#5061EC]/60 hover:shadow-[#5061EC]/40"
            >
              <svg
                className="h-5 w-5 text-[#5061EC]"
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

          {/* Mobile Navigation */}
          <div className="flex items-center gap-3 md:hidden">
            <TokenBalance />

            <a
              href="/profile"
              className="group relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-[#5061EC]/40 bg-gradient-to-br from-[#5061EC]/20 to-[#5061EC]/5 shadow-lg shadow-[#5061EC]/20 backdrop-blur-sm transition-all duration-300 hover:scale-110"
            >
              <svg
                className="h-5 w-5 text-[#5061EC]"
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
              className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition-all hover:bg-white/20"
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
            <nav className="mx-auto max-w-7xl space-y-1 px-4 py-4">
              <a
                href="/inicio"
                className="block rounded-lg bg-[#FEE887]/10 px-4 py-3 text-sm font-medium text-[#FEE887] transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Inicio
              </a>
              <a
                href="/shop"
                className="block rounded-lg px-4 py-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Tienda
              </a>
              <a
                href="/events"
                className="block rounded-lg px-4 py-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Tus eventos
              </a>
            </nav>
          </div>
        )}
      </header>

      {/* Content */}
      <section className="relative z-10 px-4 py-8 sm:px-6 sm:py-12 lg:px-20">
        <div className="mx-auto max-w-6xl">
          {/* Title con animación */}
          <div className="mb-12 text-center animate-fade-in">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#5061EC]/40 bg-[#5061EC]/10 px-4 py-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-[#FEE887]"></div>
              <span className="text-sm font-semibold uppercase tracking-wider text-[#5061EC]">Tutorial</span>
            </div>
            <h1 className="mb-4 bg-gradient-to-r from-white via-[#FEE887] to-white bg-clip-text text-3xl font-bold text-transparent sm:text-4xl lg:text-5xl">
              ¿Cómo usar Swagly?
            </h1>
            <p className="mx-auto max-w-2xl text-sm text-white/70 sm:text-base">
              Sigue estos 4 sencillos pasos para aprovechar al máximo tu experiencia Web3
            </p>
          </div>

          {/* Steps Flow - Visual con círculos conectados mejorado */}
          <div className="relative mb-16">
            {/* Línea conectora animada - oculta en móvil */}
            <div className="absolute left-0 right-0 top-1/3 hidden h-0.5 lg:block">
              <div className="h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              {/* Step 1 - Con imagen y CTA */}
              <div className="group relative flex flex-col items-center text-center">
                <div className="relative mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-[#5061EC]/20 to-[#5061EC]/5 border-4 border-[#5061EC]/30 shadow-lg shadow-[#5061EC]/20 transition-all duration-300 group-hover:border-[#5061EC]/50 group-hover:shadow-[#5061EC]/40 sm:h-36 sm:w-36">
                  <div className="h-24 w-24 overflow-hidden rounded-full sm:h-28 sm:w-28">
                    <Image
                      src="/images/step-1.jpg"
                      alt="Paso 1"
                      width={112}
                      height={112}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  <div className="absolute -bottom-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#5061EC] text-sm font-bold shadow-lg transition-transform duration-300 group-hover:scale-110">
                    1
                  </div>
                </div>
                <div className="mb-4 space-y-2">
                  <h3 className="mb-2 text-base font-bold transition-colors duration-300 group-hover:text-[#5061EC] sm:text-lg">
                    Recibe tu pasaporte
                  </h3>
                  <p className="text-xs text-white/60 sm:text-sm">Obtén tu pasaporte físico al llegar y escanéalo para activar tu experiencia. Puedes hacerlo fácilmente con NFC o código QR.</p>
                </div>
                <div className="relative">
                  <div className="absolute -inset-2 animate-pulse rounded-full bg-[#FEE887]/20 blur-xl"></div>
                  <Button
                    onClick={() => setShowDialog(true)}
                    className="group/btn relative rounded-full bg-gradient-to-r from-[#FEE887] to-[#FFFACD] px-6 py-3 text-sm font-bold text-black shadow-lg shadow-[#FEE887]/30 transition-all duration-300 hover:scale-105 hover:shadow-[#FEE887]/50 sm:px-8 sm:py-4 sm:text-base"
                  >
                    <Plus className="mr-1 inline h-4 w-4 transition-transform duration-300 group-hover/btn:rotate-90" />
                    Agregar pasaporte
                    <div className="absolute inset-0 rounded-full bg-white opacity-0 transition-opacity duration-300 group-hover/btn:opacity-20"></div>
                  </Button>
                </div>
              </div>

              {/* Step 2 */}
              <div className="group relative flex flex-col items-center text-center transition-all duration-300 hover:scale-105">
                <div className="relative mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-[#FEE887]/20 to-[#FEE887]/5 border-4 border-[#FEE887]/30 shadow-lg shadow-[#FEE887]/20 transition-all duration-300 group-hover:border-[#FEE887]/50 group-hover:shadow-[#FEE887]/40 sm:h-36 sm:w-36">
                  <div className="h-24 w-24 overflow-hidden rounded-full sm:h-28 sm:w-28">
                    <Image
                      src="/images/naranja.jpg"
                      alt="Paso 2"
                      width={112}
                      height={112}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  <div className="absolute -bottom-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#FEE887] text-sm font-bold text-black shadow-lg transition-transform duration-300 group-hover:scale-110">
                    2
                  </div>
                </div>
                <h3 className="mb-2 text-base font-bold transition-colors duration-300 group-hover:text-[#FEE887] sm:text-lg">
                  Completa actividades y gana tokens
                </h3>
                <p className="text-xs text-white/60 sm:text-sm">Acepta los challenges del pasaporte, participa y escanea los puntos NFC o QR al terminar. Cada reto superado te hace ganar tokens SWAG y subir de nivel.</p>
              </div>

              {/* Step 3 */}
              <div className="group relative flex flex-col items-center text-center transition-all duration-300 hover:scale-105">
                <div className="relative mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-[#5061EC]/20 to-[#5061EC]/5 border-4 border-[#5061EC]/30 shadow-lg shadow-[#5061EC]/20 transition-all duration-300 group-hover:border-[#5061EC]/50 group-hover:shadow-[#5061EC]/40 sm:h-36 sm:w-36">
                  <div className="h-24 w-24 overflow-hidden rounded-full sm:h-28 sm:w-28">
                    <Image
                      src="/images/step-3.jpg"
                      alt="Paso 3"
                      width={112}
                      height={112}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  <div className="absolute -bottom-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#5061EC] text-sm font-bold shadow-lg transition-transform duration-300 group-hover:scale-110">
                    3
                  </div>
                </div>
                <h3 className="mb-2 text-base font-bold transition-colors duration-300 group-hover:text-[#5061EC] sm:text-lg">
                  Cambia tus tokens por merch única
                </h3>
                <p className="text-xs text-white/60 sm:text-sm">Canjea tus tokens SWAG por productos exclusivos en nuestra tienda. Descubre piezas limitadas, coleccionables y llena tu estilo de swag.</p>
              </div>

              {/* Step 4 */}
              <div className="group relative flex flex-col items-center text-center transition-all duration-300 hover:scale-105">
                <div className="relative mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-[#FEE887]/20 to-[#FEE887]/5 border-4 border-[#FEE887]/30 shadow-lg shadow-[#FEE887]/20 transition-all duration-300 group-hover:border-[#FEE887]/50 group-hover:shadow-[#FEE887]/40 sm:h-36 sm:w-36">
                  <div className="h-24 w-24 overflow-hidden rounded-full sm:h-28 sm:w-28">
                    <Image
                      src="/images/step-4.jpg"
                      alt="Paso 4"
                      width={112}
                      height={112}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  <div className="absolute -bottom-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#FEE887] text-sm font-bold text-black shadow-lg transition-transform duration-300 group-hover:scale-110">
                    4
                  </div>
                </div>
                <h3 className="mb-2 text-base font-bold transition-colors duration-300 group-hover:text-[#FEE887] sm:text-lg">
                  Canjea tu merch
                </h3>
                <p className="text-xs text-white/60 sm:text-sm">Pasa por nuestro stand o con el sponsor de la actividad para reclamar tu recompensa. Disfruta de tu merch exclusiva y muestra tu swag al mundo.</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Spacing for mobile */}
      <div className="h-12 sm:h-16"></div>

      {/* Dialog para agregar pasaporte */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="border-[#5061EC]/30 bg-black/95 text-white backdrop-blur-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {hasExistingNickname ? 'Selecciona un evento' : 'Completa tu perfil'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nickname Input */}
            {!hasExistingNickname && (
              <div className="space-y-2">
                <Label htmlFor="nickname" className="text-sm text-white">
                  Apodo
                </Label>
                <Input
                  id="nickname"
                  type="text"
                  placeholder="Tu apodo único"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="border-[#5061EC]/30 bg-black/50 text-white placeholder:text-white/40"
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Event Select */}
            <div className="space-y-2">
              <Label htmlFor="event" className="text-sm text-white">
                Evento
              </Label>
              <Select
                value={selectedEventId}
                onValueChange={setSelectedEventId}
                disabled={isLoading}
              >
                <SelectTrigger className="border-[#5061EC]/30 bg-black/50 text-white">
                  <SelectValue placeholder="Selecciona un evento" />
                </SelectTrigger>
                <SelectContent className="border-[#5061EC]/20 bg-black/95 text-white backdrop-blur-xl">
                  {events.map((event) => (
                    <SelectItem
                      key={event.id}
                      value={event.id}
                      className="focus:bg-[#5061EC]/20 focus:text-white"
                    >
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-200">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full rounded-full bg-[#FEE887] py-6 text-base font-bold text-black hover:bg-[#FFFACD]"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando pasaporte...
                </>
              ) : (
                'Agregar pasaporte'
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  )
}
