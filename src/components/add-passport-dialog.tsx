'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
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

interface AddPassportDialogProps {
  userId: string
  existingEventIds: string[] // IDs de eventos que el usuario ya tiene
  onPassportAdded: () => void // Callback para actualizar el dashboard
}

/**
 * Componente AddPassportDialog
 * Permite al usuario agregar un nuevo pasaporte seleccionando un evento disponible
 * Filtra los eventos que el usuario ya tiene para evitar duplicados
 */
export function AddPassportDialog({ userId, existingEventIds, onPassportAdded }: AddPassportDialogProps) {
  const [open, setOpen] = useState(false)
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingEvents, setIsLoadingEvents] = useState(true)
  const [error, setError] = useState('')

  /**
   * Cargar eventos disponibles al abrir el diálogo
   * Filtra los eventos que el usuario ya tiene
   */
  useEffect(() => {
    async function fetchEvents() {
      if (!open) return

      try {
        const response = await fetch('/api/events')
        const data = await response.json()

        if (response.ok) {
          // Filtrar eventos que el usuario NO tiene aún
          const availableEvents = data.events.filter(
            (event: Event) => !existingEventIds.includes(event.id)
          )
          setEvents(availableEvents)
        } else {
          setError('Error al cargar eventos')
        }
      } catch (err) {
        setError('Error al conectar con el servidor')
      } finally {
        setIsLoadingEvents(false)
      }
    }

    if (open) {
      setIsLoadingEvents(true)
      setError('')
      setSelectedEventId('')
      fetchEvents()
    }
  }, [open, existingEventIds])

  /**
   * Maneja la creación del nuevo pasaporte
   */
  const handleCreatePassport = async () => {
    if (!selectedEventId) {
      setError('Por favor selecciona un evento')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/passports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          eventId: selectedEventId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear pasaporte')
      }

      // Éxito: cerrar modal y notificar al padre
      setOpen(false)
      onPassportAdded()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="border border-cyan-500/60 bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/30">
          <Plus className="mr-2 h-4 w-4" />
          Agregar Pasaporte
        </Button>
      </DialogTrigger>

      <DialogContent className="border-cyan-500/20 bg-black/95 text-white backdrop-blur-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Agregar Nuevo Pasaporte</DialogTitle>
          <DialogDescription className="text-cyan-200/70">
            Selecciona un evento para crear un nuevo pasaporte digital
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Selector de Evento */}
          <div className="space-y-2">
            <Label htmlFor="event" className="text-cyan-100">
              Evento Disponible
            </Label>

            {isLoadingEvents ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
              </div>
            ) : events.length === 0 ? (
              <p className="text-sm text-cyan-200/60">
                No hay eventos disponibles. Ya tienes pasaportes para todos los eventos.
              </p>
            ) : (
              <Select
                value={selectedEventId}
                onValueChange={setSelectedEventId}
                disabled={isLoading}
              >
                <SelectTrigger className="border-cyan-500/30 bg-black/50 text-white focus:border-cyan-500/60">
                  <SelectValue placeholder="Selecciona un evento" />
                </SelectTrigger>
                <SelectContent className="border-cyan-500/20 bg-black/95 text-white backdrop-blur-xl">
                  {events.map((event) => (
                    <SelectItem
                      key={event.id}
                      value={event.id}
                      className="focus:bg-cyan-500/20 focus:text-cyan-100"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{event.name}</span>
                        <span className="text-xs text-cyan-200/60">{event.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
            className="border-cyan-500/30 text-cyan-100 hover:bg-cyan-500/10"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreatePassport}
            disabled={isLoading || !selectedEventId || events.length === 0}
            className="border border-cyan-500/60 bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/30"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              'Crear Pasaporte'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
