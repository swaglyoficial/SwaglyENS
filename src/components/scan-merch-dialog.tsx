/**
 * Componente ScanMerchDialog
 *
 * Este componente permite a los usuarios escanear merch (mediante NFCs)
 * y recibir tokens automáticamente.
 *
 * Flujo:
 * 1. Usuario abre el diálogo y selecciona un NFC disponible
 * 2. Al hacer click en "Escanear", se llama a la API /api/scans
 * 3. La API valida el scan, lo registra en la BD, y envía tokens automáticamente
 * 4. El usuario recibe los tokens SIN firmar ninguna transacción (gasless)
 * 5. Se muestra el resultado del scan
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Scan, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

/**
 * Interface para un NFC del sistema
 * Cada NFC representa un tag físico asociado a una actividad del evento
 */
interface NFC {
  id: string          // ID único del NFC en la BD
  uuid: string        // UUID del tag NFC físico
  eventId: string     // ID del evento al que pertenece
  activityId: string  // ID de la actividad asociada
  status: string      // Estado: 'active' | 'scanned' | 'inactive'
  activity: {
    name: string           // Nombre de la actividad
    description: string    // Descripción de la actividad
    numOfTokens: number   // Cantidad de tokens que se dan por completar
  }
}

/**
 * Props del componente ScanMerchDialog
 */
interface ScanMerchDialogProps {
  userId: string          // ID del usuario que está escaneando
  walletAddress: string   // Wallet address del usuario (donde se envían los tokens)
  eventId: string         // ID del evento actual
  onScanSuccess: () => void  // Callback cuando el scan es exitoso
}

export function ScanMerchDialog({
  userId,
  walletAddress,
  eventId,
  onScanSuccess,
}: ScanMerchDialogProps) {
  // ========================================
  // ESTADOS DEL COMPONENTE
  // ========================================
  const [open, setOpen] = useState(false)                    // Estado del diálogo (abierto/cerrado)
  const [nfcs, setNfcs] = useState<NFC[]>([])               // Lista de NFCs disponibles del evento
  const [selectedNfcId, setSelectedNfcId] = useState<string>('')  // NFC seleccionado
  const [isLoading, setIsLoading] = useState(false)         // Indicador de carga del scan
  const [isFetching, setIsFetching] = useState(false)       // Indicador de carga al cargar NFCs
  const [error, setError] = useState('')                    // Mensaje de error si algo falla
  const [success, setSuccess] = useState(false)             // Indicador de éxito
  const [transactionHash, setTransactionHash] = useState('') // Hash de la transacción de tokens

  // ========================================
  // EFECTO: Cargar NFCs cuando se abre el diálogo
  // ========================================
  // Cada vez que se abre el diálogo, cargamos los NFCs disponibles del evento
  // Cuando se cierra, reseteamos todos los estados
  useEffect(() => {
    if (open) {
      fetchNfcs()
    } else {
      // Reset de estados al cerrar el diálogo
      setSelectedNfcId('')
      setError('')
      setSuccess(false)
      setTransactionHash('')
    }
  }, [open, eventId])

  /**
   * Función para cargar los NFCs disponibles del evento
   * Se llama automáticamente cuando se abre el diálogo
   */
  const fetchNfcs = async () => {
    setIsFetching(true)
    setError('')
    try {
      // Llamar a la API para obtener los NFCs del evento
      const response = await fetch(`/api/nfcs?eventId=${eventId}`)
      const data = await response.json()

      // Si hay error en la respuesta, lanzar excepción
      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar NFCs')
      }

      // Actualizar el estado con los NFCs obtenidos
      setNfcs(data.nfcs || [])
    } catch (err) {
      // Capturar y mostrar error
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setIsFetching(false)
    }
  }

  /**
   * Función principal para escanear el merch
   *
   * Esta función:
   * 1. Valida que se haya seleccionado un NFC
   * 2. Llama a la API /api/scans
   * 3. La API automáticamente:
   *    - Valida el scan
   *    - Registra en la BD
   *    - Envía tokens al usuario (sin necesidad de firmar transacción)
   * 4. Muestra el resultado al usuario
   */
  const handleScan = async () => {
    // Validar que se haya seleccionado un NFC
    if (!selectedNfcId) {
      setError('Por favor selecciona un NFC')
      return
    }

    // Iniciar proceso de scan
    setIsLoading(true)
    setError('')
    setSuccess(false)
    setTransactionHash('')

    try {
      // ========================================
      // Llamar a la API de scans
      // ========================================
      // Esta API hace TODO el trabajo:
      // 1. Valida que el NFC no haya sido usado
      // 2. Registra el scan en la base de datos
      // 3. Actualiza el progreso del pasaporte
      // 4. Llama a la API de Thirdweb para enviar tokens automáticamente
      const response = await fetch('/api/scans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          nfcId: selectedNfcId,
          walletAddress,
        }),
      })

      const data = await response.json()

      // ========================================
      // Verificar resultado
      // ========================================
      if (!response.ok || !data.success) {
        // Si hubo un error, mostrarlo al usuario
        throw new Error(data.error || data.details || 'Error al escanear merch')
      }

      // ========================================
      // Scan y claim exitosos
      // ========================================
      // Los tokens ya fueron enviados automáticamente por el backend
      setSuccess(true)
      setTransactionHash(data.scanData?.transactionHash || '')

      // Esperar 2 segundos para que el usuario vea el mensaje de éxito
      setTimeout(() => {
        setOpen(false)        // Cerrar diálogo
        onScanSuccess()       // Llamar callback (actualiza datos en la página)
      }, 2500)
    } catch (err) {
      // Capturar y mostrar error
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setIsLoading(false)
    }
  }

  // ========================================
  // RENDERIZADO DEL COMPONENTE
  // ========================================
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Botón que abre el diálogo */}
      <DialogTrigger asChild>
        <Button
          className="w-full border border-cyan-500/60 bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/30"
          size="lg"
        >
          <Scan className="mr-2 h-5 w-5" />
          Escanear Merch
        </Button>
      </DialogTrigger>

      {/* Contenido del diálogo */}
      <DialogContent className="border-cyan-500/20 bg-black/95 text-white backdrop-blur-xl sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl text-cyan-100">
            Escanear Merch
          </DialogTitle>
          <DialogDescription className="text-cyan-200/70">
            Selecciona el NFC de la merch que deseas escanear
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* ========================================
              SELECTOR DE NFC
              ======================================== */}
          {/* El usuario selecciona qué NFC quiere escanear de una lista */}
          <div className="space-y-2">
            <Label htmlFor="nfc" className="text-cyan-100">
              NFC ID
            </Label>
            {/* Estado: Cargando NFCs */}
            {isFetching ? (
              <div className="flex items-center justify-center rounded-lg border border-cyan-500/20 bg-black/40 p-4">
                <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
                <span className="ml-2 text-sm text-cyan-200/70">
                  Cargando NFCs...
                </span>
              </div>
            ) : nfcs.length === 0 ? (
              /* Estado: No hay NFCs disponibles */
              <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
                <p className="text-sm text-yellow-200">
                  No hay NFCs disponibles para este evento
                </p>
              </div>
            ) : (
              /* Estado: Mostrar lista de NFCs */
              <Select value={selectedNfcId} onValueChange={setSelectedNfcId}>
                <SelectTrigger
                  id="nfc"
                  className="border-cyan-500/30 bg-black/40 text-white hover:bg-cyan-500/10"
                >
                  <SelectValue placeholder="Selecciona un NFC" />
                </SelectTrigger>
                <SelectContent className="border-cyan-500/30 bg-black/95 text-white">
                  {/* Mapear cada NFC a un item del selector */}
                  {nfcs.map((nfc) => (
                    <SelectItem
                      key={nfc.id}
                      value={nfc.id}
                      className="hover:bg-cyan-500/20 focus:bg-cyan-500/20"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{nfc.uuid}</span>
                        <span className="text-xs text-cyan-200/60">
                          {nfc.activity.name} - {nfc.activity.numOfTokens} tokens
                        </span>
                        <span className="text-xs text-cyan-200/40">
                          Status: {nfc.status}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* ========================================
              INFORMACIÓN DEL NFC SELECCIONADO
              ======================================== */}
          {/* Mostrar detalles de la actividad cuando el usuario selecciona un NFC */}
          {selectedNfcId && nfcs.find(n => n.id === selectedNfcId) && (
            <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4">
              <h4 className="mb-2 font-semibold text-cyan-100">
                Actividad:
              </h4>
              <p className="text-sm text-cyan-200/80">
                {nfcs.find(n => n.id === selectedNfcId)?.activity.name}
              </p>
              <p className="mt-1 text-xs text-cyan-200/60">
                {nfcs.find(n => n.id === selectedNfcId)?.activity.description}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="rounded-full border border-yellow-500/40 bg-yellow-500/10 px-3 py-1 text-sm text-yellow-200">
                  {nfcs.find(n => n.id === selectedNfcId)?.activity.numOfTokens} tokens
                </span>
              </div>
            </div>
          )}

          {/* ========================================
              MENSAJES DE ESTADO
              ======================================== */}

          {/* Mensaje de error si algo falla */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          {/* Mensaje mientras se procesa el scan (backend trabajando) */}
          {isLoading && !success && (
            <div className="flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3">
              <Loader2 className="h-5 w-5 animate-spin text-yellow-400" />
              <p className="text-sm text-yellow-200">
                Procesando scan y enviando tokens...
              </p>
            </div>
          )}

          {/* Hash de la transacción (si está disponible) */}
          {transactionHash && (
            <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
              <p className="text-xs text-cyan-200/60">Hash de transacción:</p>
              <p className="mt-1 break-all text-xs font-mono text-cyan-200">
                {transactionHash}
              </p>
              <a
                href={`https://sepolia.scrollscan.com/tx/${transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs text-cyan-400 hover:text-cyan-300 underline"
              >
                Ver en el explorador de bloques →
              </a>
            </div>
          )}

          {/* Mensaje de éxito */}
          {success && (
            <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 p-3">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <p className="text-sm text-green-200">
                ¡Tokens enviados exitosamente a tu wallet!
              </p>
            </div>
          )}
        </div>

        {/* ========================================
            FOOTER CON BOTONES DE ACCIÓN
            ======================================== */}
        <DialogFooter>
          {/* Botón para cancelar y cerrar el diálogo */}
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
            className="border-cyan-500/30 text-cyan-200 hover:bg-cyan-500/10"
          >
            Cancelar
          </Button>

          {/* Botón para ejecutar el scan */}
          <Button
            type="button"
            onClick={handleScan}
            disabled={
              isLoading ||      // Deshabilitado mientras se procesa
              !selectedNfcId || // Deshabilitado si no hay NFC seleccionado
              isFetching ||     // Deshabilitado mientras se cargan NFCs
              success           // Deshabilitado si ya se completó exitosamente
            }
            className="border border-cyan-500/60 bg-cyan-500/30 text-cyan-100 hover:bg-cyan-500/40"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Scan className="mr-2 h-4 w-4" />
                Escanear
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
