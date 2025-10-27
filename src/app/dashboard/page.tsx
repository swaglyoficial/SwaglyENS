'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import Image from 'next/image'
import { Loader2, CheckCircle2, Circle, Menu, X } from 'lucide-react'
import { ConnectButton } from '@/components/connect-button'
import { TokenBalance } from '@/components/token-balance'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScanMerchDialog } from '@/components/scan-merch-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Activity {
  id: string
  name: string
  description: string
  numOfTokens: number
  sponsor?: {
    name: string
  }
}

interface PassportActivity {
  activityId: string
  status: 'pending' | 'completed'
  timestamp: string
  activity: Activity
}

interface Passport {
  id: string
  progress: number
  createdAt: string
  event: {
    id: string
    name: string
    description: string
  }
  activities: PassportActivity[]
}

interface User {
  id: string
  nickname: string
  walletAddress: string
  passports: Passport[]
}

export default function DashboardPage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()

  const [user, setUser] = useState<User | null>(null)
  const [currentPassport, setCurrentPassport] = useState<Passport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<PassportActivity | null>(null)
  const [showActivityDialog, setShowActivityDialog] = useState(false)

  // Capturar passportId de URL query params
  const getPassportIdFromUrl = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      return params.get('passportId')
    }
    return null
  }

  useEffect(() => {
    if (!isConnected) {
      router.push('/')
      return
    }
  }, [isConnected, router])

  const fetchUserData = async () => {
    if (!address) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/users/${address}`)
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 404) {
          router.push('/onboarding')
          return
        }
        throw new Error(data.error || 'Error al cargar datos')
      }

      if (!data.user.passports || data.user.passports.length === 0) {
        router.push('/onboarding')
        return
      }

      setUser(data.user)

      // Buscar el pasaporte correcto por ID de la URL
      const urlPassportId = getPassportIdFromUrl()

      console.log('🔍 URL Passport ID:', urlPassportId)
      console.log('📦 Available Passports:', data.user.passports.map((p: Passport) => ({ id: p.id, name: p.event.name })))

      if (urlPassportId && data.user.passports) {
        const foundPassport = data.user.passports.find((p: Passport) => p.id === urlPassportId)
        if (foundPassport) {
          console.log('✅ Found passport:', foundPassport.event.name)
          setCurrentPassport(foundPassport)
        } else {
          console.log('⚠️ Passport not found, using first one')
          // Si no se encuentra, usar el primero
          setCurrentPassport(data.user.passports[0])
        }
      } else {
        console.log('ℹ️ No passport ID in URL, using first one')
        // Si no hay ID en la URL, usar el primero
        setCurrentPassport(data.user.passports[0])
      }
    } catch (err) {
      console.error('Error fetching user data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isConnected && address) {
      fetchUserData()
    }
  }, [isConnected, address, router])

  const calculateProgress = (passport: Passport): number => {
    if (!passport.activities || passport.activities.length === 0) return 0
    const completed = passport.activities.filter(a => a.status === 'completed').length
    return Math.round((completed / passport.activities.length) * 100)
  }

  if (!isConnected || isLoading || !currentPassport) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-[#5061EC]" />
      </main>
    )
  }

  const progress = calculateProgress(currentPassport)
  const completed = currentPassport.activities.filter(a => a.status === 'completed')
  const pending = currentPassport.activities.filter(a => a.status === 'pending')

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white pb-20">
      {/* Background decorativo */}
      <div className="pointer-events-none absolute inset-0">
        <div className="neon-grid absolute inset-0 opacity-5" aria-hidden />
        <div
          className="absolute right-0 top-0 h-[600px] w-1 bg-gradient-to-b from-[#5061EC] via-transparent to-transparent opacity-30"
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
      <section className="relative z-10 px-6 py-8 sm:px-12 lg:px-20">
        <div className="mx-auto max-w-5xl">
          {/* Botón de escanear al inicio - Como en la imagen de referencia */}
          <div className="mb-8">
            <div className="rounded-3xl bg-gradient-to-br from-[#5061EC]/20 to-[#5061EC]/5 p-6 sm:p-8">
              <h3 className="mb-4 text-center text-lg font-bold text-white sm:text-xl">
                Escanea los stickers para poder completar tus actividades.
              </h3>
              <ScanMerchDialog
                userId={user!.id}
                walletAddress={address!}
                eventId={currentPassport.event.id}
                onScanSuccess={fetchUserData}
                refetchBalance={() => {}}
              />
            </div>
          </div>

          {/* Event Passport Card - Con actividades dentro */}
          <div className="group relative mb-12 overflow-hidden rounded-3xl bg-gradient-to-br from-[#5061EC] to-[#4051CC] p-8 shadow-2xl shadow-[#5061EC]/30 transition-all duration-300 hover:shadow-[#5061EC]/50 sm:p-12">
            {/* Efecto hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="relative z-10">
              {/* Event Image Circle a la izquierda */}
              <div className="mb-8 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                <div className="relative shrink-0">
                  <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-white/30 shadow-xl transition-transform duration-300 group-hover:scale-105 sm:h-40 sm:w-40">
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/20 to-white/5">
                      <span className="text-5xl font-bold text-white sm:text-6xl">
                        {currentPassport.event.name.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  {/* Decoración adicional */}
                  <div className="absolute -right-2 -top-2 h-6 w-6 rounded-full border-2 border-white/40 bg-[#FEE887]" />
                </div>

                {/* Event Name y descripción */}
                <div className="flex-1 text-center sm:text-left">
                  <h1 className="mb-3 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
                    {currentPassport.event.name}
                  </h1>
                  <p className="mb-4 text-base text-white/80 sm:text-lg">
                    Progreso de tus actividades
                  </p>
                </div>
              </div>

              {/* Activities Section dentro del pasaporte - Arriba del progreso */}
              <div className="mb-8">
                <div className="mb-6">
                  <h2 className="mb-2 text-2xl font-bold text-white sm:text-3xl">Actividades</h2>
                  <p className="text-sm text-white/70 sm:text-base">
                    Completa actividades escaneando los códigos en los stands del evento
                  </p>
                </div>

                {/* Lista de actividades */}
                <div className="space-y-4">
                  {currentPassport.activities.map((pa) => {
                    const isCompleted = pa.status === 'completed'
                    return (
                      <div
                        key={pa.activityId}
                        onClick={() => {
                          setSelectedActivity(pa)
                          setShowActivityDialog(true)
                        }}
                        className={`group/activity relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 cursor-pointer sm:p-5 ${
                          isCompleted
                            ? 'border-green-500/40 bg-gradient-to-br from-green-500/10 to-green-500/5 shadow-lg shadow-green-500/10'
                            : 'border-white/20 bg-gradient-to-br from-white/5 to-transparent hover:border-white/30 hover:bg-white/10 hover:shadow-xl'
                        }`}
                      >
                        {/* Efecto decorativo */}
                        <div className={`absolute inset-0 transition-opacity duration-300 ${
                          isCompleted
                            ? 'bg-gradient-to-r from-green-500/5 to-transparent opacity-100'
                            : 'bg-gradient-to-r from-[#FEE887]/5 to-transparent opacity-0 group-hover/activity:opacity-100'
                        }`} />

                        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                          {/* Checkbox Icon mejorado */}
                          <div className="shrink-0 self-start sm:self-auto">
                            {isCompleted ? (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-green-500/30 to-green-500/10 shadow-lg sm:h-12 sm:w-12">
                                <CheckCircle2 className="h-6 w-6 text-green-400 sm:h-7 sm:w-7" />
                              </div>
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-white/10 to-white/5 shadow-lg transition-all duration-300 group-hover/activity:scale-110 group-hover/activity:from-[#FEE887]/20 group-hover/activity:to-[#FEE887]/5 sm:h-12 sm:w-12">
                                <Circle className="h-6 w-6 text-white/40 transition-colors group-hover/activity:text-white/60 sm:h-7 sm:w-7" />
                              </div>
                            )}
                          </div>

                          {/* Activity Info mejorada */}
                          <div className="flex-1 min-w-0">
                            <h3 className={`text-base font-bold sm:text-lg ${isCompleted ? 'text-white/80' : 'text-white'}`}>
                              {pa.activity.name}
                            </h3>
                            {pa.activity.sponsor && (
                              <p className="mt-1 text-xs text-white/60 sm:text-sm">
                                Patrocinado por {pa.activity.sponsor.name}
                              </p>
                            )}
                            {pa.activity.description && (
                              <p className="mt-1 text-xs text-white/50 line-clamp-1 sm:line-clamp-none">
                                {pa.activity.description}
                              </p>
                            )}
                          </div>

                          {/* Tokens Badge mejorado - Ahora en su propia línea en móvil */}
                          <div className="shrink-0 self-start sm:self-auto">
                            <div
                              className={`rounded-full px-3 py-1.5 text-sm font-bold shadow-lg transition-all duration-300 sm:px-4 sm:py-2 ${
                                isCompleted
                                  ? 'bg-gradient-to-r from-green-500/30 to-green-500/20 text-green-200 shadow-green-500/20'
                                  : 'bg-gradient-to-r from-[#FEE887]/30 to-[#FFFACD]/20 text-[#FEE887] shadow-[#FEE887]/20 group-hover/activity:scale-110'
                              }`}
                            >
                              {pa.activity.numOfTokens} SWAG
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

              </div>

              {/* Separador */}
              <div className="my-8 h-px bg-white/20" />

              {/* Progress Bar con descripción */}
              <div className="mb-8">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-white/90 sm:text-base">
                    Progreso general
                  </span>
                  <span className="text-xl font-bold text-[#FEE887] sm:text-2xl">{progress}%</span>
                </div>
                <div className="h-4 overflow-hidden rounded-full bg-white/20 shadow-inner">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#FEE887] to-[#FFFACD] shadow-lg transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-white/70 sm:text-sm">
                  Completa todas las actividades para obtener recompensas exclusivas
                </p>
              </div>

              {/* Stats con descripciones */}
              <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
                <div className="rounded-2xl bg-white/10 px-6 py-4 text-center backdrop-blur-sm transition-all duration-300 hover:bg-white/20">
                  <p className="text-3xl font-bold text-white sm:text-4xl">{completed.length}</p>
                  <p className="mt-1 text-sm text-white/80 sm:text-base">Completadas</p>
                  <p className="mt-1 text-xs text-white/60">Actividades finalizadas</p>
                </div>
                <div className="h-auto w-px bg-white/20" />
                <div className="rounded-2xl bg-white/10 px-6 py-4 text-center backdrop-blur-sm transition-all duration-300 hover:bg-white/20">
                  <p className="text-3xl font-bold text-white sm:text-4xl">{pending.length}</p>
                  <p className="mt-1 text-sm text-white/80 sm:text-base">Pendientes</p>
                  <p className="mt-1 text-xs text-white/60">Por completar</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Diálogo de detalles de actividad */}
      <Dialog open={showActivityDialog} onOpenChange={setShowActivityDialog}>
        <DialogContent className="left-4 right-4 max-h-[90vh] w-[calc(100%-2rem)] translate-x-0 overflow-y-auto border-[#5061EC]/30 bg-gradient-to-br from-black via-[#5061EC]/5 to-black p-0 text-white backdrop-blur-xl sm:left-[50%] sm:right-auto sm:w-full sm:max-w-lg sm:translate-x-[-50%]">
          {selectedActivity && (
            <>
              {/* DialogTitle oculto para accesibilidad */}
              <DialogTitle className="sr-only">
                Detalles de la actividad: {selectedActivity.activity.name}
              </DialogTitle>

              {/* Header con gradiente */}
              <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-[#5061EC] to-[#4051CC] px-6 pb-8 pt-12">
                {/* Efecto de fondo */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />

                <div className="relative z-10">
                  {/* Status Badge */}
                  <div className="mb-4 flex justify-center">
                    {selectedActivity.status === 'completed' ? (
                      <div className="flex items-center gap-2 rounded-full border-2 border-green-400/40 bg-green-500/20 px-4 py-2 shadow-lg shadow-green-500/20 backdrop-blur-sm">
                        <CheckCircle2 className="h-5 w-5 text-green-300" />
                        <span className="font-bold text-green-100">✓ Completada</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 rounded-full border-2 border-[#FEE887]/40 bg-[#FEE887]/20 px-4 py-2 shadow-lg shadow-[#FEE887]/20 backdrop-blur-sm">
                        <Circle className="h-5 w-5 text-[#FEE887]" />
                        <span className="font-bold text-[#FEE887]">Pendiente</span>
                      </div>
                    )}
                  </div>

                  {/* Activity Name */}
                  <h3 className="text-center text-xl font-bold leading-tight text-white sm:text-2xl">
                    {selectedActivity.activity.name}
                  </h3>

                  {/* Tokens Badge - Destacado */}
                  <div className="mt-5 flex justify-center">
                    <div className="relative">
                      <div className="absolute -inset-2 animate-pulse rounded-full bg-[#FEE887]/20 blur-xl" />
                      <div className="relative rounded-full bg-gradient-to-r from-[#FEE887] to-[#FFFACD] px-5 py-2.5 shadow-xl shadow-[#FEE887]/30">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-black/70 sm:text-sm">Recompensa:</span>
                          <span className="text-lg font-bold text-black sm:text-xl">
                            {selectedActivity.activity.numOfTokens} SWAG
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-3 p-6">
                {/* Description */}
                {selectedActivity.activity.description && (
                  <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4 transition-all duration-300 hover:border-white/20 hover:bg-white/10">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#5061EC]/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="relative z-10">
                      <div className="mb-2 flex items-center gap-2">
                        <div className="h-1 w-6 rounded-full bg-gradient-to-r from-[#5061EC] to-[#5061EC]/40" />
                        <p className="text-xs font-bold uppercase tracking-wider text-[#5061EC]">
                          Descripción
                        </p>
                      </div>
                      <p className="text-sm leading-relaxed text-white/90">
                        {selectedActivity.activity.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Sponsor */}
                {selectedActivity.activity.sponsor && (
                  <div className="group relative overflow-hidden rounded-xl border border-[#FEE887]/20 bg-gradient-to-br from-[#FEE887]/10 to-transparent p-4 transition-all duration-300 hover:border-[#FEE887]/30 hover:shadow-lg hover:shadow-[#FEE887]/10">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#FEE887]/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="relative z-10">
                      <div className="mb-2 flex items-center gap-2">
                        <div className="h-1 w-6 rounded-full bg-gradient-to-r from-[#FEE887] to-[#FEE887]/40" />
                        <p className="text-xs font-bold uppercase tracking-wider text-[#FEE887]">
                          Patrocinador
                        </p>
                      </div>
                      <p className="text-base font-bold text-white sm:text-lg">
                        {selectedActivity.activity.sponsor.name}
                      </p>
                    </div>
                  </div>
                )}

                {/* Completed Timestamp */}
                {selectedActivity.status === 'completed' && selectedActivity.timestamp && (
                  <div className="group relative overflow-hidden rounded-xl border border-green-500/20 bg-gradient-to-br from-green-500/10 to-transparent p-4 transition-all duration-300 hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/10">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="relative z-10">
                      <div className="mb-2 flex items-center gap-2">
                        <div className="h-1 w-6 rounded-full bg-gradient-to-r from-green-400 to-green-400/40" />
                        <p className="text-xs font-bold uppercase tracking-wider text-green-300">
                          Completada el
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-green-200">
                        {new Date(selectedActivity.timestamp).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {/* Info adicional */}
                <div className="rounded-xl border border-white/5 bg-white/5 p-3 backdrop-blur-sm">
                  <p className="text-center text-xs leading-relaxed text-white/60">
                    {selectedActivity.status === 'completed'
                      ? '¡Felicitaciones! Has completado esta actividad y ganado tus tokens SWAG.'
                      : 'Escanea el código QR en el stand correspondiente para completar esta actividad y ganar tokens SWAG.'}
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}
