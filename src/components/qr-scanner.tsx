/**
 * ============================================
 * COMPONENTE: QRScanner
 * ============================================
 *
 * Componente para escanear códigos QR usando la cámara del dispositivo.
 *
 * Este componente proporciona una interfaz visual para escanear códigos QR,
 * mostrando la cámara y el estado del escaneo.
 *
 * @example
 * <QRScanner
 *   onScanSuccess={(data) => console.log('Escaneado:', data)}
 *   onScanError={(error) => console.error('Error:', error)}
 * />
 */

'use client'

import { useEffect } from 'react'
import { useQRScanner } from '@/hooks/useQRScanner'
import { Button } from '@/components/ui/button'
import { Loader2, Camera, X, CheckCircle2, AlertCircle } from 'lucide-react'
import type { NFCData } from '@/lib/nfc-utils'

/**
 * ============================================
 * TIPOS
 * ============================================
 */

/**
 * Props del componente QRScanner
 */
interface QRScannerProps {
  /**
   * Callback cuando el escaneo es exitoso
   */
  onScanSuccess: (data: NFCData) => void

  /**
   * Callback cuando hay un error
   */
  onScanError?: (error: string) => void

  /**
   * Callback cuando el usuario cancela el escaneo
   */
  onCancel?: () => void

  /**
   * Si se debe iniciar el escaneo automáticamente al montar
   * Por defecto: false
   */
  autoStart?: boolean

  /**
   * ID del elemento HTML donde se mostrará la cámara
   * Por defecto: 'qr-reader'
   */
  elementId?: string

  /**
   * Clase CSS adicional para el contenedor
   */
  className?: string
}

/**
 * ============================================
 * COMPONENTE PRINCIPAL
 * ============================================
 */

export function QRScanner({
  onScanSuccess,
  onScanError,
  onCancel,
  autoStart = false,
  elementId = 'qr-reader',
  className = '',
}: QRScannerProps) {
  // ========================================
  // HOOK DE ESCANEO
  // ========================================

  const { status, isScanning, data, error, startScanning, stopScanning, reset } = useQRScanner({
    onSuccess: onScanSuccess,
    onError: onScanError,
    fps: 10,
    qrboxWidth: 250,
    qrboxHeight: 250,
  })

  // ========================================
  // EFECTOS
  // ========================================

  /**
   * Iniciar escaneo automáticamente si autoStart es true
   */
  useEffect(() => {
    if (autoStart) {
      startScanning(elementId)
    }
  }, [autoStart, elementId, startScanning])

  // ========================================
  // HANDLERS
  // ========================================

  /**
   * Maneja el clic en el botón de cancelar
   */
  const handleCancel = async () => {
    await stopScanning()
    reset()
    onCancel?.()
  }

  /**
   * Maneja el clic en el botón de reintentar
   */
  const handleRetry = async () => {
    reset()
    await startScanning(elementId)
  }

  /**
   * Maneja el clic en el botón de iniciar escaneo
   */
  const handleStart = () => {
    startScanning(elementId)
  }

  // ========================================
  // RENDERIZADO
  // ========================================

  return (
    <div className={`space-y-4 ${className}`}>
      {/* ========================================
          CONTENEDOR DE LA CÁMARA
          ======================================== */}

      <div className="relative overflow-hidden rounded-lg border border-cyan-500/30 bg-black/40">
        {/* Elemento donde se mostrará la cámara */}
        <div id={elementId} className="min-h-[300px]" />

        {/* ========================================
            OVERLAYS SEGÚN EL ESTADO
            ======================================== */}

        {/* Estado: Idle - Esperando iniciar */}
        {status === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
            <Camera className="mb-4 h-16 w-16 text-cyan-400" />
            <p className="mb-4 text-center text-sm text-cyan-200">
              Presiona el botón para iniciar el escaneo
            </p>
            <Button
              onClick={handleStart}
              className="border border-cyan-500/60 bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/30"
            >
              <Camera className="mr-2 h-4 w-4" />
              Iniciar Escaneo
            </Button>
          </div>
        )}

        {/* Estado: Inicializando - Cargando cámara */}
        {status === 'initializing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
            <Loader2 className="mb-4 h-16 w-16 animate-spin text-cyan-400" />
            <p className="text-center text-sm text-cyan-200">Iniciando cámara...</p>
          </div>
        )}

        {/* Estado: Escaneando - Instrucciones */}
        {status === 'scanning' && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <p className="text-center text-sm text-cyan-200">
              Apunta la cámara al código QR
            </p>
          </div>
        )}

        {/* Estado: Éxito */}
        {status === 'success' && data && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
            <CheckCircle2 className="mb-4 h-16 w-16 text-green-400" />
            <p className="text-center text-lg font-semibold text-green-200">
              ¡Código escaneado!
            </p>
            <p className="mt-2 text-center text-xs text-green-200/70">
              Tipo: {data.type === 'passport' ? 'Pasaporte' : 'Actividad'}
            </p>
          </div>
        )}

        {/* Estado: Error */}
        {status === 'error' && error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <AlertCircle className="mb-4 h-16 w-16 text-red-400" />
            <p className="mb-2 text-center text-lg font-semibold text-red-200">Error</p>
            <p className="mb-4 text-center text-sm text-red-200/70">{error}</p>
            <Button
              onClick={handleRetry}
              className="border border-cyan-500/60 bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/30"
            >
              Reintentar
            </Button>
          </div>
        )}
      </div>

      {/* ========================================
          BOTONES DE CONTROL
          ======================================== */}

      <div className="flex gap-2">
        {/* Botón de cancelar - Visible cuando está escaneando */}
        {isScanning && (
          <Button
            onClick={handleCancel}
            variant="outline"
            className="flex-1 border-red-500/30 text-red-200 hover:bg-red-500/10"
          >
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
        )}

        {/* Botón de reintentar - Visible cuando hay error */}
        {status === 'error' && (
          <Button
            onClick={handleRetry}
            className="flex-1 border border-cyan-500/60 bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/30"
          >
            <Camera className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        )}
      </div>

      {/* ========================================
          INFORMACIÓN ADICIONAL
          ======================================== */}

      <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
        <p className="text-xs text-cyan-200/70">
          💡 <strong>Consejo:</strong> Asegúrate de tener buena iluminación y mantén la cámara
          estable. El código QR debe estar dentro del cuadro de escaneo.
        </p>
      </div>
    </div>
  )
}
