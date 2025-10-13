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
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="neon-grid absolute inset-0 opacity-20" aria-hidden />
        <div className="absolute -left-20 top-32 h-64 w-64 rounded-full bg-cyan-400/25 blur-[120px]" aria-hidden />
        <div className="absolute right-[-12%] top-20 h-72 w-72 rounded-full bg-cyan-500/20 blur-[120px]" aria-hidden />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-4xl p-4 py-8 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <Badge className="mb-4 border border-cyan-500/40 bg-cyan-500/10 text-cyan-100">
            <Ticket className="mr-1.5 h-3.5 w-3.5" />
            Tu Pasaporte Digital
          </Badge>
          <h1 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
            ¡Hola, {user?.nickname}!
          </h1>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </div>

        {/* Pasaportes y botón agregar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-cyan-200/70">
              <Calendar className="mr-1 inline h-4 w-4" />
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
                    ? "border border-cyan-500/60 bg-cyan-500/30 text-cyan-100 hover:bg-cyan-500/40"
                    : "border-cyan-500/30 text-cyan-200 hover:bg-cyan-500/10"
                }
              >
                {passport.event.name}
              </Button>
            ))}
          </div>
          {user && (
            <AddPassportDialog
              userId={user.id}
              existingEventIds={user.passports.map(p => p.event.id)}
              onPassportAdded={() => {
                fetchUserData()
              }}
            />
          )}
        </div>

        {/* Passport Card */}
        <Card className="mb-6 border-cyan-500/20 bg-black/40 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl text-white">
                  {currentPassport.event.name}
                </CardTitle>
                <CardDescription className="mt-2 text-cyan-200/70">
                  {currentPassport.event.description}
                </CardDescription>
              </div>
              <Badge
                variant={progress === 100 ? "default" : "secondary"}
                className={progress === 100 ? "bg-green-500/20 text-green-200 border-green-500/40" : "border-cyan-500/40 bg-cyan-500/10 text-cyan-100"}
              >
                {progress}% Completado
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-cyan-100">Progreso del evento</span>
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

            {/* Activities Section */}
            <div className="space-y-4">
              {/* Pending Activities */}
              {pending.length > 0 && (
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                    <Clock className="h-5 w-5 text-cyan-400" />
                    Actividades Pendientes
                  </h3>
                  <ScrollArea className="h-[200px] rounded-lg border border-cyan-500/20 bg-black/30 p-3">
                    <div className="space-y-2">
                      {pending.map((pa) => (
                        <div
                          key={pa.activityId}
                          className="rounded-lg border border-cyan-500/20 bg-black/40 p-3 transition-colors hover:bg-cyan-500/10"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-medium text-white">{pa.activity.name}</p>
                              <p className="mt-1 text-sm text-cyan-200/60">
                                {pa.activity.description}
                              </p>
                              {pa.activity.sponsor && (
                                <Badge
                                  variant="outline"
                                  className="mt-2 border-cyan-500/30 text-cyan-300"
                                >
                                  {pa.activity.sponsor.name}
                                </Badge>
                              )}
                            </div>
                            <Badge className="border-yellow-500/40 bg-yellow-500/10 text-yellow-200">
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
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                    Actividades Completadas
                  </h3>
                  <ScrollArea className="h-[200px] rounded-lg border border-green-500/20 bg-black/30 p-3">
                    <div className="space-y-2">
                      {completed.map((pa) => (
                        <div
                          key={pa.activityId}
                          className="rounded-lg border border-green-500/20 bg-black/40 p-3 opacity-75"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-medium text-white">{pa.activity.name}</p>
                              <p className="mt-1 text-sm text-green-200/60">
                                {pa.activity.description}
                              </p>
                              {pa.activity.sponsor && (
                                <Badge
                                  variant="outline"
                                  className="mt-2 border-green-500/30 text-green-300"
                                >
                                  {pa.activity.sponsor.name}
                                </Badge>
                              )}
                            </div>
                            <Badge className="border-green-500/40 bg-green-500/10 text-green-200">
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
