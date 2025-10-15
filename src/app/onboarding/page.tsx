'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Sparkles } from 'lucide-react'

/**
 * Tipos de datos
 */
interface Event {
  id: string
  name: string
  description: string
  startDate: string
  endDate: string
}

/**
 * Página de onboarding
 * Pide al usuario su nickname y que seleccione el evento al que asiste
 * Valida que el evento existe en la BD y crea el pasaporte digital
 */
export default function OnboardingPage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()

  // Estados del formulario
  const [nickname, setNickname] = useState('')
  const [selectedEventId, setSelectedEventId] = useState('')
  const [events, setEvents] = useState<Event[]>([])

  // Estados de carga y error
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingEvents, setIsLoadingEvents] = useState(true)
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
   * Cargar eventos disponibles al montar el componente
   */
  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch('/api/events')
        const data = await response.json()

        if (response.ok) {
          setEvents(data.events || [])
        } else {
          setError('Error al cargar eventos')
        }
      } catch (err) {
        setError('Error al conectar con el servidor')
      } finally {
        setIsLoadingEvents(false)
      }
    }

    if (isConnected) {
      fetchEvents()
    }
  }, [isConnected])

  /**
   * Maneja el envío del formulario
   * Crea el usuario con nickname y el pasaporte para el evento seleccionado
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validar campos
    if (!nickname.trim()) {
      setError('Por favor ingresa tu apodo')
      return
    }

    if (!selectedEventId) {
      setError('Por favor selecciona un evento')
      return
    }

    setIsLoading(true)

    try {
      // 1. Crear/actualizar usuario con nickname
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

      // 2. Verificar que el evento existe y crear pasaporte
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
        // Si el error es que ya tiene pasaporte, redirigir al dashboard
        if (passportData.error?.includes('Ya existe')) {
          router.push('/dashboard')
          return
        }
        throw new Error(passportData.error || 'Error al crear pasaporte')
      }

      // 3. Redirigir al dashboard
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setIsLoading(false)
    }
  }

  // Mostrar loader mientras carga
  if (!isConnected || isLoadingEvents) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </main>
    )
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black text-foreground p-4 sm:p-6">
      {/* Background effects - optimizados para móviles */}
      <div className="pointer-events-none absolute inset-0">
        <div className="neon-grid absolute inset-0 opacity-10 sm:opacity-20" aria-hidden />
        <div className="absolute -left-10 top-20 h-48 w-48 rounded-full bg-cyan-400/20 blur-[100px] sm:-left-20 sm:top-32 sm:h-64 sm:w-64 sm:blur-[120px]" aria-hidden />
        <div className="absolute -right-10 top-10 h-56 w-56 rounded-full bg-cyan-500/15 blur-[100px] sm:right-[-12%] sm:top-6 sm:h-72 sm:w-72 sm:blur-[120px]" aria-hidden />
      </div>

      {/* Form Card - responsive */}
      <Card className="relative z-10 w-full max-w-md border-cyan-500/20 bg-black/40 backdrop-blur-xl">
        <CardHeader className="p-4 text-center sm:p-6">
          <div className="mb-3 flex justify-center sm:mb-4">
            <Badge className="inline-flex items-center gap-1.5 border border-cyan-500/40 bg-cyan-500/10 text-cyan-100 text-xs sm:gap-2 sm:text-sm">
              <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              Bienvenido a Swagly
            </Badge>
          </div>
          <CardTitle className="text-xl text-white sm:text-2xl">Completa tu perfil</CardTitle>
          <CardDescription className="text-sm text-cyan-200/70 sm:text-base">
            Ingresa tu apodo y selecciona el evento al que asistes
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Nickname Input */}
            <div className="space-y-2">
              <Label htmlFor="nickname" className="text-sm text-cyan-100 sm:text-base">
                Apodo
              </Label>
              <Input
                id="nickname"
                type="text"
                placeholder="Tu apodo único"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="border-cyan-500/30 bg-black/50 text-white placeholder:text-cyan-200/40 focus:border-cyan-500/60 text-sm sm:text-base"
                disabled={isLoading}
              />
            </div>

            {/* Event Select */}
            <div className="space-y-2">
              <Label htmlFor="event" className="text-sm text-cyan-100 sm:text-base">
                Evento
              </Label>
              <Select
                value={selectedEventId}
                onValueChange={setSelectedEventId}
                disabled={isLoading}
              >
                <SelectTrigger className="border-cyan-500/30 bg-black/50 text-white focus:border-cyan-500/60 text-sm sm:text-base">
                  <SelectValue placeholder="Selecciona un evento" />
                </SelectTrigger>
                <SelectContent className="border-cyan-500/20 bg-black/95 text-white backdrop-blur-xl">
                  {events.map((event) => (
                    <SelectItem
                      key={event.id}
                      value={event.id}
                      className="focus:bg-cyan-500/20 focus:text-cyan-100 text-sm sm:text-base"
                    >
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-xs text-red-200 sm:text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              className="w-full border border-cyan-500/60 bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/30 text-sm sm:text-base"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando pasaporte...
                </>
              ) : (
                'Continuar al Dashboard'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
