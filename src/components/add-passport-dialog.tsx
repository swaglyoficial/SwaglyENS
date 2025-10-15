/**
 * Componente AddPassportDialog
 *
 * Este componente permite a los usuarios escanear pasaportes físicos con NFC/QR
 * para agregar un nuevo pasaporte digital a su cuenta.
 *
 * Flujo NUEVO (con escaneo real):
 * 1. Usuario abre el diálogo
 * 2. El sistema detecta si el dispositivo soporta NFC o QR
 * 3. Usuario escanea el pasaporte físico (tag NFC o código QR)
 * 4. Se obtiene el UUID del evento del pasaporte
 * 5. Se busca el evento en la BD por UUID
 * 6. Se crea el pasaporte digital automáticamente
 * 7. Se muestra confirmación al usuario
 */

'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Plus, CheckCircle2, AlertCircle } from 'lucide-react'
import { UnifiedScanner } from '@/components/unified-scanner'
import type { NFCData } from '@/lib/nfc-utils'

/**
 * Props del componente
 */
interface AddPassportDialogProps {
  userId: string
  existingEventIds: string[] // IDs de eventos que el usuario ya tiene
  onPassportAdded: () => void // Callback para actualizar el dashboard
}

/**
 * Componente AddPassportDialog
 * Permite al usuario agregar un nuevo pasaporte escaneando el tag NFC o QR del pasaporte físico
 */
export function AddPassportDialog({ userId, existingEventIds, onPassportAdded }: AddPassportDialogProps) {
  // ========================================
  // ESTADOS
  // ========================================
  const [open, setOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [eventInfo, setEventInfo] = useState<{name: string, description: string} | null>(null)

  /**
   * Maneja el escaneo exitoso del pasaporte
   *
   * Esta función se ejecuta cuando el UnifiedScanner detecta un tag NFC o código QR.
   * Recibe los datos parseados (tipo y UUID) y procesa el escaneo del pasaporte.
   *
   * @param {NFCData} data - Datos del escaneo (tipo: 'passport' o 'activity', uuid: string)
   */
  const handleScanSuccess = async (data: NFCData) => {
    console.log('📱 Datos escaneados:', data)

    // ========================================
    // VALIDAR TIPO DE ESCANEO
    // ========================================

    // Este diálogo solo maneja escaneo de pasaportes
    // Las actividades se manejan en scan-merch-dialog
    if (data.type !== 'passport') {
      setError('Este código no es válido para crear un pasaporte. Por favor, escanea un tag de pasaporte.')
      return
    }

    // Iniciar procesamiento
    setIsProcessing(true)
    setError('')
    setSuccess(false)
    setEventInfo(null)

    try {
      // ========================================
      // PASO 1: BUSCAR EVENTO POR UUID
      // ========================================

      console.log(`🔍 Buscando evento con UUID: ${data.uuid}`)

      const eventResponse = await fetch(`/api/events/by-uuid?uuid=${encodeURIComponent(data.uuid)}`)
      const eventData = await eventResponse.json()

      if (!eventResponse.ok || !eventData.success) {
        throw new Error(eventData.error || 'No se encontró el evento del pasaporte escaneado')
      }

      const event = eventData.event

      console.log(`✅ Evento encontrado: ${event.name}`)

      // ========================================
      // VERIFICAR SI EL USUARIO YA TIENE ESTE PASAPORTE
      // ========================================

      if (existingEventIds.includes(event.id)) {
        throw new Error('Ya tienes un pasaporte para este evento')
      }

      // Guardar información del evento para mostrar
      setEventInfo({
        name: event.name,
        description: event.description,
      })

      // ========================================
      // PASO 2: CREAR PASAPORTE DIGITAL
      // ========================================

      console.log('💾 Creando pasaporte digital...')

      const passportResponse = await fetch('/api/passports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          eventId: event.id,
        }),
      })

      const passportData = await passportResponse.json()

      if (!passportResponse.ok || !passportData.success) {
        throw new Error(passportData.error || 'Error al crear el pasaporte digital')
      }

      // ========================================
      // CREACIÓN EXITOSA
      // ========================================

      console.log('🎉 ¡Pasaporte digital creado exitosamente!')

      setSuccess(true)

      // Esperar 2 segundos para que el usuario vea el mensaje de éxito
      setTimeout(() => {
        setOpen(false)      // Cerrar diálogo
        onPassportAdded()   // Llamar callback (actualiza datos en la página)
      }, 2000)
    } catch (err: any) {
      // ========================================
      // MANEJO DE ERRORES
      // ========================================

      console.error('❌ Error al procesar escaneo de pasaporte:', err)
      setError(err.message || 'Error al procesar el escaneo')
    } finally {
      setIsProcessing(false)
    }
  }

  /**
   * Maneja errores del escáner
   */
  const handleScanError = (error: string) => {
    console.error('❌ Error del escáner:', error)
    setError(error)
  }

  /**
   * Resetea estados al cerrar el diálogo
   */
  const handleClose = () => {
    setOpen(false)
    setError('')
    setSuccess(false)
    setEventInfo(null)
    setIsProcessing(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="border border-cyan-500/60 bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/30 text-xs sm:text-sm">
          <Plus className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
          Agregar Pasaporte
        </Button>
      </DialogTrigger>

      <DialogContent className="border-cyan-500/20 bg-black/95 text-white backdrop-blur-xl w-[95vw] max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-lg text-white sm:text-xl">Agregar Nuevo Pasaporte</DialogTitle>
          <DialogDescription className="text-sm text-cyan-200/70 sm:text-base">
            Escanea el tag NFC o código QR del pasaporte físico del evento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-3 sm:space-y-4 sm:py-4">
          {/* ========================================
              COMPONENTE DE ESCANEO UNIFICADO (NFC/QR)
              ======================================== */}
          {/* El UnifiedScanner detecta automáticamente si el dispositivo soporta NFC
              y muestra la opción adecuada (NFC o QR) */}
          {!success && !isProcessing && (
            <UnifiedScanner
              onScanSuccess={handleScanSuccess}
              onScanError={handleScanError}
              mode="auto" // Detecta automáticamente NFC o QR
            />
          )}

          {/* ========================================
              INFORMACIÓN DEL EVENTO ESCANEADO
              ======================================== */}
          {/* Mostrar detalles del evento una vez escaneado */}
          {eventInfo && (
            <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 sm:p-4">
              <h4 className="mb-2 text-sm font-semibold text-cyan-100 sm:text-base">
                Evento Escaneado:
              </h4>
              <p className="text-xs text-cyan-200/80 sm:text-sm font-medium">
                {eventInfo.name}
              </p>
              <p className="mt-1 text-[11px] text-cyan-200/60 sm:text-xs">
                {eventInfo.description}
              </p>
            </div>
          )}

          {/* ========================================
              MENSAJES DE ESTADO - RESPONSIVOS
              ======================================== */}

          {/* Mensaje de error si algo falla */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-2.5 sm:p-3">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400 sm:h-5 sm:w-5" />
              <p className="text-xs text-red-200 sm:text-sm">{error}</p>
            </div>
          )}

          {/* Mensaje mientras se procesa el escaneo */}
          {isProcessing && !success && (
            <div className="flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-2.5 sm:p-3">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-yellow-400 sm:h-5 sm:w-5" />
              <p className="text-xs text-yellow-200 sm:text-sm">
                Creando pasaporte digital...
              </p>
            </div>
          )}

          {/* Mensaje de éxito */}
          {success && (
            <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 p-2.5 sm:p-3">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400 sm:h-5 sm:w-5" />
              <p className="text-xs text-green-200 sm:text-sm">
                ¡Pasaporte digital creado exitosamente!
              </p>
            </div>
          )}
        </div>

        {/* ========================================
            FOOTER CON BOTÓN CERRAR - RESPONSIVO
            ======================================== */}
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing}
            className="w-full border-cyan-500/30 text-cyan-100 hover:bg-cyan-500/10 text-xs sm:w-auto sm:text-sm"
          >
            {success ? 'Cerrar' : 'Cancelar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
