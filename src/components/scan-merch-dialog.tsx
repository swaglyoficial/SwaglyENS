/**
 * Componente ScanMerchDialog
 *
 * Este componente permite a los usuarios escanear merch (mediante NFC o QR)
 * y recibir tokens automáticamente.
 *
 * Flujo NUEVO (con escaneo real):
 * 1. Usuario abre el diálogo
 * 2. El sistema detecta si el dispositivo soporta NFC o QR
 * 3. Usuario escanea el tag NFC físico o el código QR
 * 4. Se obtiene el UUID del tag
 * 5. Se busca el NFC en la BD por UUID
 * 6. Se llama a la API /api/scans para validar y registrar
 * 7. La API envía tokens automáticamente (gasless)
 * 8. Se muestra el resultado del scan
 */

'use client'

import { useState } from 'react'
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
import { Scan, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { UnifiedScanner } from '@/components/unified-scanner'
import type { NFCData } from '@/lib/nfc-utils'

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
  const [isProcessing, setIsProcessing] = useState(false)    // Indicador de procesamiento del scan
  const [error, setError] = useState('')                     // Mensaje de error si algo falla
  const [success, setSuccess] = useState(false)              // Indicador de éxito
  const [transactionHash, setTransactionHash] = useState('') // Hash de la transacción de tokens
  const [activityInfo, setActivityInfo] = useState<{name: string, tokens: number} | null>(null) // Info de la actividad escaneada

  /**
   * Maneja el escaneo exitoso del NFC/QR
   *
   * Esta función se ejecuta cuando el UnifiedScanner detecta un tag NFC o código QR.
   * Recibe los datos parseados (tipo y UUID) y procesa el escaneo.
   *
   * @param {NFCData} data - Datos del escaneo (tipo: 'activity' o 'passport', uuid: string)
   */
  const handleScanSuccess = async (data: NFCData) => {
    console.log('📱 Datos escaneados:', data)

    // ========================================
    // VALIDAR TIPO DE ESCANEO
    // ========================================

    // Este diálogo solo maneja escaneo de actividades (merch)
    // Los pasaportes se manejan en add-passport-dialog
    if (data.type !== 'activity') {
      setError('Este código no es válido para escanear merch. Por favor, escanea un tag de actividad.')
      return
    }

    // Iniciar procesamiento
    setIsProcessing(true)
    setError('')
    setSuccess(false)
    setTransactionHash('')
    setActivityInfo(null)

    try {
      // ========================================
      // PASO 1: BUSCAR NFC POR UUID
      // ========================================

      console.log(`🔍 Buscando NFC con UUID: ${data.uuid}`)

      const nfcResponse = await fetch(`/api/nfcs/by-uuid?uuid=${encodeURIComponent(data.uuid)}`)
      const nfcData = await nfcResponse.json()

      if (!nfcResponse.ok || !nfcData.success) {
        throw new Error(nfcData.error || 'No se encontró el NFC escaneado')
      }

      const nfc = nfcData.nfc

      console.log(`✅ NFC encontrado: ${nfc.activity.name}`)

      // Guardar información de la actividad para mostrar
      setActivityInfo({
        name: nfc.activity.name,
        tokens: nfc.activity.numOfTokens,
      })

      // ========================================
      // PASO 2: REGISTRAR ESCANEO Y OTORGAR TOKENS
      // ========================================

      console.log('💾 Registrando escaneo...')

      const scanResponse = await fetch('/api/scans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          nfcId: nfc.id, // Usamos el ID del NFC encontrado
          walletAddress,
        }),
      })

      const scanData = await scanResponse.json()

      if (!scanResponse.ok || !scanData.success) {
        throw new Error(scanData.error || scanData.details || 'Error al registrar el escaneo')
      }

      // ========================================
      // ESCANEO EXITOSO
      // ========================================

      console.log('🎉 ¡Escaneo exitoso! Tokens enviados.')

      setSuccess(true)
      setTransactionHash(scanData.scanData?.transactionHash || '')

      // Esperar 2.5 segundos para que el usuario vea el mensaje de éxito
      setTimeout(() => {
        setOpen(false)        // Cerrar diálogo
        onScanSuccess()       // Llamar callback (actualiza datos en la página)
      }, 2500)
    } catch (err: any) {
      // ========================================
      // MANEJO DE ERRORES
      // ========================================

      console.error('❌ Error al procesar escaneo:', err)
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
    setTransactionHash('')
    setActivityInfo(null)
    setIsProcessing(false)
  }

  // ========================================
  // RENDERIZADO DEL COMPONENTE
  // ========================================
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Botón que abre el diálogo - responsivo */}
      <DialogTrigger asChild>
        <Button
          className="w-full border border-cyan-500/60 bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/30 text-sm sm:text-base"
          size="lg"
        >
          <Scan className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
          Escanear Merch
        </Button>
      </DialogTrigger>

      {/* Contenido del diálogo - optimizado para móviles */}
      <DialogContent className="border-cyan-500/20 bg-black/95 text-white backdrop-blur-xl w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl text-cyan-100 sm:text-2xl">
            Escanear Merch
          </DialogTitle>
          <DialogDescription className="text-sm text-cyan-200/70 sm:text-base">
            Escanea el tag NFC o código QR de la merch para recibir tokens
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
              INFORMACIÓN DE LA ACTIVIDAD ESCANEADA
              ======================================== */}
          {/* Mostrar detalles de la actividad una vez escaneada */}
          {activityInfo && (
            <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 sm:p-4">
              <h4 className="mb-2 text-sm font-semibold text-cyan-100 sm:text-base">
                Actividad Escaneada:
              </h4>
              <p className="text-xs text-cyan-200/80 sm:text-sm">
                {activityInfo.name}
              </p>
              <div className="mt-2 flex items-center gap-2 sm:mt-3">
                <span className="rounded-full border border-yellow-500/40 bg-yellow-500/10 px-2.5 py-0.5 text-xs text-yellow-200 sm:px-3 sm:py-1 sm:text-sm">
                  {activityInfo.tokens} tokens
                </span>
              </div>
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

          {/* Mensaje mientras se procesa el scan (backend trabajando) */}
          {isProcessing && !success && (
            <div className="flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-2.5 sm:p-3">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-yellow-400 sm:h-5 sm:w-5" />
              <p className="text-xs text-yellow-200 sm:text-sm">
                Procesando escaneo y enviando tokens...
              </p>
            </div>
          )}

          {/* Hash de la transacción (si está disponible) */}
          {transactionHash && (
            <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-2.5 sm:p-3">
              <p className="text-[11px] text-cyan-200/60 sm:text-xs">Hash de transacción:</p>
              <p className="mt-1 break-all font-mono text-[10px] text-cyan-200 sm:text-xs">
                {transactionHash}
              </p>
              <a
                href={`https://sepolia.scrollscan.com/tx/${transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-[11px] text-cyan-400 underline hover:text-cyan-300 sm:text-xs"
              >
                Ver en el explorador de bloques →
              </a>
            </div>
          )}

          {/* Mensaje de éxito */}
          {success && (
            <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 p-2.5 sm:p-3">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400 sm:h-5 sm:w-5" />
              <p className="text-xs text-green-200 sm:text-sm">
                ¡Tokens enviados exitosamente a tu wallet!
              </p>
            </div>
          )}
        </div>

        {/* ========================================
            FOOTER CON BOTÓN CERRAR - RESPONSIVO
            ======================================== */}
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {/* Botón para cerrar el diálogo */}
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing}
            className="w-full border-cyan-500/30 text-cyan-200 hover:bg-cyan-500/10 text-xs sm:w-auto sm:text-sm"
          >
            {success ? 'Cerrar' : 'Cancelar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
