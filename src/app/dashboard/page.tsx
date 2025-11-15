'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRequireProfile } from '@/hooks/useRequireProfile'
import Image from 'next/image'
import { Loader2, CheckCircle2, Circle, Menu, X, Clock, XCircle, FileText, Scan } from 'lucide-react'
import { ConnectButton } from '@/components/connect-button'
import { TokenBalance } from '@/components/token-balance'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScanMerchDialog } from '@/components/scan-merch-dialog'
import { ActivityDetailsDialog } from '@/components/activity-details-dialog'
import { Button } from '@/components/ui/button'

interface Activity {
  id: string
  name: string
  description: string
  numOfTokens: number
  validationType: string
  requiresProof: boolean
  proofType?: string | null
  proofPrompt?: string | null
  transactionPrompt?: string | null
  referralPrompt?: string | null
  onChainValidationType?: string | null
  validationConfig?: any
  successMessage?: string | null
  sponsor?: {
    name: string
  }
}

interface ActivityProof {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  rejectionReason?: string
  createdAt: string
}

interface PassportActivity {
  activityId: string
  status: 'pending' | 'completed'
  timestamp: string
  proofId?: string
  requiresProof: boolean
  activity: Activity
  proof?: ActivityProof
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
  const { hasProfile, isChecking, address, isConnected } = useRequireProfile()

  const [user, setUser] = useState<User | null>(null)
  const [currentPassport, setCurrentPassport] = useState<Passport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<PassportActivity | null>(null)
  const [showActivityDialog, setShowActivityDialog] = useState(false)
  const [showScanDialog, setShowScanDialog] = useState(false)

  // Capturar passportId de URL query params
  const getPassportIdFromUrl = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      return params.get('passportId')
    }
    return null
  }

  // NO redirigir automáticamente - solo mostrar loader

  const fetchUserData = async () => {
    if (!address) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/users/${address}`)
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 404) {
          router.push('/inicio')
          return
        }
        throw new Error(data.error || 'Error al cargar datos')
      }

      if (!data.user.passports || data.user.passports.length === 0) {
        router.push('/inicio')
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
                    {currentPassport.event.description}
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

                {/* Lista de actividades - Simplificada */}
                <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                  {currentPassport.activities.map((pa) => {
                    const isCompleted = pa.status === 'completed'
                    const proof = pa.proof
                    const isPending = proof?.status === 'pending'
                    const isRejected = proof?.status === 'rejected'
                    const isApproved = proof?.status === 'approved'

                    // Determinar estado visual
                    let borderColor = 'border-white/20'
                    let statusColor = 'text-white/60'
                    let statusIcon = <Circle className="h-4 w-4" />

                    if (isCompleted || isApproved) {
                      borderColor = 'border-green-500/40'
                      statusColor = 'text-green-400'
                      statusIcon = <CheckCircle2 className="h-4 w-4" />
                    } else if (isPending) {
                      borderColor = 'border-yellow-500/40'
                      statusColor = 'text-yellow-400'
                      statusIcon = <Clock className="h-4 w-4" />
                    } else if (isRejected) {
                      borderColor = 'border-red-500/40'
                      statusColor = 'text-red-400'
                      statusIcon = <XCircle className="h-4 w-4" />
                    }

                    return (
                      <div
                        key={pa.activityId}
                        onClick={() => {
                          setSelectedActivity(pa)
                          setShowActivityDialog(true)
                        }}
                        className={`group relative overflow-hidden rounded-xl border ${borderColor} bg-gradient-to-br from-white/5 to-transparent p-4 transition-all duration-300 cursor-pointer hover:border-white/40 hover:bg-white/10 hover:shadow-lg hover:shadow-white/5`}
                      >
                        <div className="space-y-3">
                          {/* Header con status y tokens */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              <div className={`shrink-0 mt-0.5 ${statusColor}`}>
                                {statusIcon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-white text-sm sm:text-base line-clamp-2">
                                  {pa.activity.name}
                                </h3>
                                {pa.activity.sponsor && (
                                  <p className="text-xs text-white/50 mt-0.5">
                                    {pa.activity.sponsor.name}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="shrink-0">
                              <div className="rounded-full bg-gradient-to-r from-[#FEE887]/30 to-[#FFFACD]/20 px-2.5 py-1 text-xs font-bold text-[#FEE887] sm:px-3">
                                {pa.activity.numOfTokens}
                              </div>
                            </div>
                          </div>

                          {/* Descripción */}
                          {pa.activity.description && (
                            <p className="text-xs text-white/60 line-clamp-2">
                              {pa.activity.description}
                            </p>
                          )}

                          {/* Call to action */}
                          <div className="pt-2">
                            <div className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#FEE887]/20 to-[#FEE887]/10 px-3 py-2 border border-[#FEE887]/30 group-hover:from-[#FEE887]/30 group-hover:to-[#FEE887]/20 group-hover:border-[#FEE887]/50 transition-all">
                              <span className="text-xs font-bold text-[#FEE887] sm:text-sm">
                                Ver detalles
                              </span>
                              <svg
                                className="h-3 w-3 text-[#FEE887] group-hover:translate-x-1 transition-transform sm:h-4 sm:w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
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

      {/* Activity Details Dialog - Unificado */}
      {user && currentPassport && (
        <ActivityDetailsDialog
          passportActivity={selectedActivity}
          userId={user.id}
          passportId={currentPassport.id}
          walletAddress={address!}
          eventId={currentPassport.event.id}
          open={showActivityDialog}
          onOpenChange={setShowActivityDialog}
          onSuccess={fetchUserData}
        />
      )}

      {/* Scan Merch Dialog */}
      {user && currentPassport && (
        <ScanMerchDialog
          userId={user.id}
          walletAddress={address!}
          eventId={currentPassport.event.id}
          open={showScanDialog}
          onOpenChange={setShowScanDialog}
          onScanSuccess={fetchUserData}
          refetchBalance={() => {}}
        />
      )}
    </main>
  )
}
