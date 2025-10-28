'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWalletConnection } from '@/hooks/useWalletConnection'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import Image from 'next/image'
import { Loader2, Plus } from 'lucide-react'

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
 * Página de onboarding rediseñada
 * Muestra cómo usar Swagly con pasos visuales
 */
export default function OnboardingPage() {
  const router = useRouter()
  const { isConnected, address } = useWalletConnection()

  // Estados del formulario
  const [nickname, setNickname] = useState('')
  const [selectedEventId, setSelectedEventId] = useState('')
  const [events, setEvents] = useState<Event[]>([])
  const [showDialog, setShowDialog] = useState(false)

  // Estados de carga y error
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingEvents, setIsLoadingEvents] = useState(true)
  const [error, setError] = useState('')
  const [hasExistingNickname, setHasExistingNickname] = useState(false)

  /**
   * Redirigir a home si no está conectado
   */
  useEffect(() => {
    if (!isConnected) {
      router.push('/')
    }
  }, [isConnected, router])

  /**
   * Cargar datos del usuario existente (si existe) y eventos disponibles
   */
  useEffect(() => {
    async function fetchInitialData() {
      try {
        // 1. Cargar eventos
        const eventsResponse = await fetch('/api/events')
        const eventsData = await eventsResponse.json()

        if (eventsResponse.ok) {
          setEvents(eventsData.events || [])
        } else {
          setError('Error al cargar eventos')
        }

        // 2. Verificar si el usuario ya existe y pre-cargar su nickname
        if (address) {
          const userResponse = await fetch(`/api/users/${address}`)

          if (userResponse.ok) {
            const userData = await userResponse.json()
            // Si el usuario existe, pre-cargar su nickname y marcarlo como existente
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

  /**
   * Maneja el envío del formulario
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validar campos
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
        <Loader2 className="h-8 w-8 animate-spin text-[#5061EC]" />
      </main>
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Background decorativo */}
      <div className="pointer-events-none absolute inset-0">
        <div className="neon-grid absolute inset-0 opacity-5" aria-hidden />
        <div
          className="absolute right-0 top-0 h-[600px] w-1 bg-gradient-to-b from-[#5061EC] via-transparent to-transparent opacity-30"
          aria-hidden
        />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-12 lg:px-20">
        <div className="flex items-center gap-2">
          <Image
            src="/images/LogoSwagly.png"
            alt="Swagly Logo"
            width={40}
            height={40}
            className="h-10 w-10"
          />
          <Image
            src="/images/TextoLogoSwagly.png"
            alt="Swagly"
            width={100}
            height={30}
            className="h-auto w-20 sm:w-24"
          />
        </div>
        <nav className="flex items-center gap-4 sm:gap-8">
          <a href="/shop" className="text-sm font-medium hover:text-[#FEE887] transition-colors">
            Tienda
          </a>
          <a href="/dashboard" className="text-sm font-medium hover:text-[#FEE887] transition-colors">
            Tus eventos
          </a>
        </nav>
      </header>

      {/* Content */}
      <section className="relative z-10 px-6 py-12 sm:px-12 lg:px-20">
        <div className="mx-auto max-w-6xl">
          {/* Title */}
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-3xl font-bold sm:text-4xl">¿Cómo usar Swagly?</h1>
          </div>

          {/* Steps Flow - Visual con círculos conectados */}
          <div className="relative mb-16">
            {/* Línea conectora - oculta en móvil */}
            <div className="absolute left-0 right-0 top-1/3 hidden h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent lg:block" />

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
              {/* Step 1 */}
              <div className="relative flex flex-col items-center text-center">
                <div className="relative mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-[#5061EC]/20 to-[#5061EC]/5 border-4 border-[#5061EC]/30">
                  <div className="h-24 w-24 overflow-hidden rounded-full">
                    <Image
                      src="/images/step-1.jpg"
                      alt="Paso 1"
                      width={96}
                      height={96}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      sizes="96px"
                    />
                  </div>
                  <div className="absolute -bottom-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#5061EC] text-sm font-bold">
                    1
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-bold">Recibe tu pasaporte físico y escanealo</h3>
              </div>

              {/* Step 2 */}
              <div className="relative flex flex-col items-center text-center">
                <div className="relative mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-[#FEE887]/20 to-[#FEE887]/5 border-4 border-[#FEE887]/30">
                  <div className="h-24 w-24 overflow-hidden rounded-full">
                    <Image
                      src="/images/step-2.jpg"
                      alt="Paso 2"
                      width={96}
                      height={96}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      sizes="96px"
                    />
                  </div>
                  <div className="absolute -bottom-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#FEE887] text-sm font-bold text-black">
                    2
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-bold">Realiza las actividades del pasaporte y gana tokens</h3>
              </div>

              {/* Step 3 */}
              <div className="relative flex flex-col items-center text-center">
                <div className="relative mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-[#5061EC]/20 to-[#5061EC]/5 border-4 border-[#5061EC]/30">
                  <div className="h-24 w-24 overflow-hidden rounded-full">
                    <Image
                      src="/images/step-3.jpg"
                      alt="Paso 3"
                      width={96}
                      height={96}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      sizes="96px"
                    />
                  </div>
                  <div className="absolute -bottom-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#5061EC] text-sm font-bold">
                    3
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-bold">Cambia tus tokens por merch única en nuestra tienda</h3>
              </div>

              {/* Step 4 */}
              <div className="relative flex flex-col items-center text-center">
                <div className="relative mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-[#FEE887]/20 to-[#FEE887]/5 border-4 border-[#FEE887]/30">
                  <div className="h-24 w-24 overflow-hidden rounded-full">
                    <Image
                      src="/images/step-4.jpg"
                      alt="Paso 4"
                      width={96}
                      height={96}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      sizes="96px"
                    />
                  </div>
                  <div className="absolute -bottom-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#FEE887] text-sm font-bold text-black">
                    4
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-bold">Recibe tu merch en nuestro stand</h3>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="flex justify-center">
            <Button
              onClick={() => setShowDialog(true)}
              className="rounded-full bg-[#FEE887] px-8 py-6 text-base font-bold text-black hover:bg-[#FFFACD] shadow-lg"
            >
              <Plus className="mr-2 h-5 w-5" />
              Agregar pasaporte
            </Button>
          </div>
        </div>
      </section>

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
