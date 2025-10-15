'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ConnectButton } from '@/components/connect-button'
import { AddPassportDialog } from '@/components/add-passport-dialog'
import { ScanMerchDialog } from '@/components/scan-merch-dialog'
import { Loader2, Ticket, CheckCircle2, Clock, Scan, Calendar } from 'lucide-react'

/**
 * Tipos de datos
 */
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

/**
 * Página de Dashboard
 * Muestra el pasaporte digital del usuario con:
 * - Información del evento
 * - Actividades completadas y pendientes
 * - Barra de progreso
 * - Botón para escanear merch (frontend only)
 */
export default function DashboardPage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()

  // Estados
  const [user, setUser] = useState<User | null>(null)
  const [currentPassport, setCurrentPassport] = useState<Passport | null>(null)
  const [currentPassportIndex, setCurrentPassportIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  /**
   * Redirigir a home si no está conectado
   */
  useEffect(() => {
    if (!isConnected) {
      router.push('/')
    }
  }, [isConnected, router])

  /**
   * Función para cargar datos del usuario y sus pasaportes
   * Reutilizable para recargar después de agregar pasaportes
   */
  const fetchUserData = async () => {
    if (!address) return

    setIsLoading(true)
    try {
      // Obtener usuario por wallet address
      const response = await fetch(`/api/users/${address}`)
      const data = await response.json()

      if (!response.ok) {
        // Si no existe el usuario, redirigir a onboarding
        if (response.status === 404) {
          router.push('/onboarding')
          return
        }
        throw new Error(data.error || 'Error al cargar datos')
      }

      // Si no tiene pasaportes, redirigir a onboarding
      if (!data.user.passports || data.user.passports.length === 0) {
        router.push('/onboarding')
        return
      }

      setUser(data.user)
      // Usar el pasaporte seleccionado o el primero por defecto
      setCurrentPassport(data.user.passports[currentPassportIndex] || data.user.passports[0])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Cargar datos del usuario al montar el componente
   */
  useEffect(() => {
    if (isConnected && address) {
      fetchUserData()
    }
  }, [isConnected, address, router])

  /**
   * Actualizar pasaporte actual cuando cambia el índice
   */
  useEffect(() => {
    if (user?.passports && user.passports[currentPassportIndex]) {
      setCurrentPassport(user.passports[currentPassportIndex])
    }
  }, [currentPassportIndex, user])

  /**
   * Calcular progreso del pasaporte
   */
  const calculateProgress = (passport: Passport): number => {
    if (!passport.activities || passport.activities.length === 0) return 0
    const completed = passport.activities.filter(a => a.status === 'completed').length
    return Math.round((completed / passport.activities.length) * 100)
  }

  /**
   * Obtener actividades completadas y pendientes
   */
  const getActivitiesByStatus = (passport: Passport) => {
    const completed = passport.activities.filter(a => a.status === 'completed')
    const pending = passport.activities.filter(a => a.status === 'pending')
    return { completed, pending }
  }

  // Mostrar loader mientras carga
  if (isLoading) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </main>
    )
  }

  // Mostrar error si hay
  if (error) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black text-foreground p-4">
        <Card className="border-red-500/20 bg-black/40 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-red-400">Error</CardTitle>
            <CardDescription className="text-red-200/70">{error}</CardDescription>
          </CardHeader>
        </Card>
      </main>
    )
  }

  if (!currentPassport) return null

  const progress = calculateProgress(currentPassport)
  const { completed, pending } = getActivitiesByStatus(currentPassport)

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-foreground">
      {/* Background effects - optimizados para móviles */}
      <div className="pointer-events-none absolute inset-0">
        <div className="neon-grid absolute inset-0 opacity-10 sm:opacity-20" aria-hidden />
        <div className="absolute -left-10 top-20 h-48 w-48 rounded-full bg-cyan-400/20 blur-[100px] sm:-left-20 sm:top-32 sm:h-64 sm:w-64 sm:blur-[120px]" aria-hidden />
        <div className="absolute -right-10 top-10 h-56 w-56 rounded-full bg-cyan-500/15 blur-[100px] sm:right-[-12%] sm:top-20 sm:h-72 sm:w-72 sm:blur-[120px]" aria-hidden />
      </div>

      {/* Content - con padding responsive */}
      <div className="relative z-10 mx-auto max-w-5xl px-4 py-6 sm:p-6 lg:p-8">
        {/* Header - más compacto en móviles */}
        <div className="mb-6 text-center sm:mb-8">
          <Badge className="mb-3 border border-cyan-500/40 bg-cyan-500/10 text-cyan-100 text-xs sm:mb-4 sm:text-sm">
            <Ticket className="mr-1 h-3 w-3 sm:mr-1.5 sm:h-3.5 sm:w-3.5" />
            Tu Pasaporte Digital
          </Badge>
          <h1 className="mb-3 text-2xl font-bold text-white sm:mb-4 sm:text-3xl lg:text-4xl">
            ¡Hola, {user?.nickname}!
          </h1>
          <div className="flex items-center justify-center">
            <div className="w-full max-w-xs sm:w-auto">
              <ConnectButton />
            </div>
          </div>
        </div>

        {/* Pasaportes y botón agregar - mejorado para móviles */}
        <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:gap-4">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <span className="w-full text-center text-xs text-cyan-200/70 sm:w-auto sm:text-left sm:text-sm">
              <Calendar className="mr-1 inline h-3 w-3 sm:h-4 sm:w-4" />
              Tus Pasaportes:
            </span>
            {user?.passports.map((passport, index) => (
              <Button
                key={passport.id}
                variant={index === currentPassportIndex ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPassportIndex(index)}
                className={
                  index === currentPassportIndex
                    ? "border border-cyan-500/60 bg-cyan-500/30 text-cyan-100 hover:bg-cyan-500/40 text-xs sm:text-sm"
                    : "border-cyan-500/30 text-cyan-200 hover:bg-cyan-500/10 text-xs sm:text-sm"
                }
              >
                {passport.event.name}
              </Button>
            ))}
          </div>
          {user && (
            <div className="flex justify-center sm:justify-end">
              <AddPassportDialog
                userId={user.id}
                existingEventIds={user.passports.map(p => p.event.id)}
                onPassportAdded={() => {
                  fetchUserData()
                }}
              />
            </div>
          )}
        </div>

        {/* Passport Card - optimizado para móviles */}
        <Card className="mb-4 border-cyan-500/20 bg-black/40 backdrop-blur-xl sm:mb-6">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="flex-1">
                <CardTitle className="text-xl text-white sm:text-2xl">
                  {currentPassport.event.name}
                </CardTitle>
                <CardDescription className="mt-2 text-sm text-cyan-200/70 sm:text-base">
                  {currentPassport.event.description}
                </CardDescription>
              </div>
              <Badge
                variant={progress === 100 ? "default" : "secondary"}
                className={`${progress === 100 ? "bg-green-500/20 text-green-200 border-green-500/40" : "border-cyan-500/40 bg-cyan-500/10 text-cyan-100"} text-xs sm:text-sm shrink-0`}
              >
                {progress}% Completado
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 p-4 sm:space-y-6 sm:p-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex flex-col gap-1 text-xs sm:flex-row sm:items-center sm:justify-between sm:text-sm">
                <span className="font-medium text-cyan-100">Progreso del evento</span>
                <span className="text-cyan-200/70">
                  {completed.length} de {currentPassport.activities.length} actividades
                </span>
              </div>
              <Progress
                value={progress}
                className="h-2 bg-cyan-950/50"
              />
            </div>

            <Separator className="bg-cyan-500/20" />

            {/* Scan Merch Dialog */}
            {user && address && (
              <ScanMerchDialog
                userId={user.id}
                walletAddress={address}
                eventId={currentPassport.event.id}
                onScanSuccess={() => {
                  fetchUserData()
                }}
              />
            )}

            <Separator className="bg-cyan-500/20" />

            {/* Activities Section - responsive heights */}
            <div className="space-y-4">
              {/* Pending Activities */}
              {pending.length > 0 && (
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-white sm:text-lg">
                    <Clock className="h-4 w-4 text-cyan-400 sm:h-5 sm:w-5" />
                    Actividades Pendientes
                  </h3>
                  <ScrollArea className="h-[180px] rounded-lg border border-cyan-500/20 bg-black/30 p-2 sm:h-[200px] sm:p-3">
                    <div className="space-y-2">
                      {pending.map((pa) => (
                        <div
                          key={pa.activityId}
                          className="rounded-lg border border-cyan-500/20 bg-black/40 p-2.5 transition-colors hover:bg-cyan-500/10 sm:p-3"
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white sm:text-base">{pa.activity.name}</p>
                              <p className="mt-1 text-xs text-cyan-200/60 sm:text-sm">
                                {pa.activity.description}
                              </p>
                              {pa.activity.sponsor && (
                                <Badge
                                  variant="outline"
                                  className="mt-2 border-cyan-500/30 text-cyan-300 text-xs"
                                >
                                  {pa.activity.sponsor.name}
                                </Badge>
                              )}
                            </div>
                            <Badge className="border-yellow-500/40 bg-yellow-500/10 text-yellow-200 text-xs shrink-0 self-start sm:self-auto">
                              {pa.activity.numOfTokens} tokens
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Completed Activities */}
              {completed.length > 0 && (
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-white sm:text-lg">
                    <CheckCircle2 className="h-4 w-4 text-green-400 sm:h-5 sm:w-5" />
                    Actividades Completadas
                  </h3>
                  <ScrollArea className="h-[180px] rounded-lg border border-green-500/20 bg-black/30 p-2 sm:h-[200px] sm:p-3">
                    <div className="space-y-2">
                      {completed.map((pa) => (
                        <div
                          key={pa.activityId}
                          className="rounded-lg border border-green-500/20 bg-black/40 p-2.5 opacity-75 sm:p-3"
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white sm:text-base">{pa.activity.name}</p>
                              <p className="mt-1 text-xs text-green-200/60 sm:text-sm">
                                {pa.activity.description}
                              </p>
                              {pa.activity.sponsor && (
                                <Badge
                                  variant="outline"
                                  className="mt-2 border-green-500/30 text-green-300 text-xs"
                                >
                                  {pa.activity.sponsor.name}
                                </Badge>
                              )}
                            </div>
                            <Badge className="border-green-500/40 bg-green-500/10 text-green-200 text-xs shrink-0 self-start sm:self-auto">
                              ✓ {pa.activity.numOfTokens} tokens
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
