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
import { TokenBalance } from '@/components/token-balance'
import { BottomNavigation } from '@/components/bottom-navigation'
import { Loader2, Ticket, CheckCircle2, Clock, Scan, Calendar, User, Plus } from 'lucide-react'

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
    <main className="relative min-h-screen overflow-hidden bg-black text-foreground pb-20">
      {/* Background effects - optimizados para móviles */}
      <div className="pointer-events-none absolute inset-0">
        <div className="neon-grid absolute inset-0 opacity-10 sm:opacity-20" aria-hidden />
        <div className="absolute -left-10 top-20 h-48 w-48 rounded-full bg-cyan-400/20 blur-[100px] sm:-left-20 sm:top-32 sm:h-64 sm:w-64 sm:blur-[120px]" aria-hidden />
        <div className="absolute -right-10 top-10 h-56 w-56 rounded-full bg-cyan-500/15 blur-[100px] sm:right-[-12%] sm:top-20 sm:h-72 sm:w-72 sm:blur-[120px]" aria-hidden />
      </div>

      {/* Content - con padding responsive y espacio para bottom nav */}
      <div className="relative z-10 mx-auto max-w-5xl px-4 py-4 sm:py-6">
        {/* Header compacto con usuario y balance */}
        <div className="mb-4 flex items-center justify-between gap-3 sm:mb-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-500/40 bg-cyan-500/10 sm:h-10 sm:w-10">
              <User className="h-4 w-4 text-cyan-400 sm:h-5 sm:w-5" />
            </div>
            <span className="text-sm font-semibold text-white sm:text-base">
              {user?.nickname}
            </span>
          </div>
          <ConnectButton />
        </div>

        {/* Botón agregar pasaporte y selector de pasaportes */}
        {user && (
          <div className="mb-4 space-y-3 sm:mb-6">
            {/* Agregar pasaporte */}
            <div className="flex justify-center sm:justify-start">
              <AddPassportDialog
                userId={user.id}
                existingEventIds={user.passports.map(p => p.event.id)}
                onPassportAdded={() => {
                  fetchUserData()
                }}
              />
            </div>

            {/* Selector de pasaportes si hay más de uno */}
            {user.passports.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {user.passports.map((passport, index) => (
                  <Button
                    key={passport.id}
                    variant={index === currentPassportIndex ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPassportIndex(index)}
                    className={
                      index === currentPassportIndex
                        ? "shrink-0 border border-cyan-500/60 bg-cyan-500/30 text-cyan-100 hover:bg-cyan-500/40"
                        : "shrink-0 border-cyan-500/30 text-cyan-200 hover:bg-cyan-500/10"
                    }
                  >
                    {passport.event.name}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

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

            {/* Activities Section - diseño simplificado */}
            <div className="space-y-3">
              {/* Todas las actividades en una lista */}
              <div className="space-y-2">
                {currentPassport.activities.map((pa) => {
                  const isCompleted = pa.status === 'completed'
                  return (
                    <div
                      key={pa.activityId}
                      className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                        isCompleted
                          ? 'border-green-500/20 bg-green-500/5 opacity-75'
                          : 'border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10'
                      }`}
                    >
                      {/* Icono o imagen del sponsor */}
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${
                          isCompleted ? 'bg-green-500/20' : 'bg-cyan-500/20'
                        }`}
                      >
                        {pa.activity.sponsor ? (
                          <span className="text-xs font-bold text-white">
                            {pa.activity.sponsor.name.substring(0, 2).toUpperCase()}
                          </span>
                        ) : (
                          <Ticket className="h-6 w-6 text-cyan-400" />
                        )}
                      </div>

                      {/* Info de la actividad */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {pa.activity.name}
                        </p>
                        <p className="text-xs text-cyan-200/60 line-clamp-1">
                          {pa.activity.description}
                        </p>
                      </div>

                      {/* Tokens */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <Badge
                          className={`text-xs ${
                            isCompleted
                              ? 'border-green-500/40 bg-green-500/10 text-green-200'
                              : 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200'
                          }`}
                        >
                          {pa.activity.numOfTokens} SWAG
                        </Badge>
                        {isCompleted && (
                          <CheckCircle2 className="h-4 w-4 text-green-400" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </main>
  )
}
