/**
 * ============================================
 * HOOK: useQRScanner
 * ============================================
 *
 * Hook personalizado para escanear códigos QR en componentes React.
 *
 * Este hook encapsula la lógica de escaneo QR usando la librería html5-qrcode,
 * proporcionando una interfaz simple y consistente con useNFCScanner.
 *
 * @example
 * function MyComponent() {
 *   const { isScanning, error, startScanning, stopScanning, data } = useQRScanner()
 *
 *   return (
 *     <div>
 *       <div id="qr-reader"></div>
 *       <button onClick={() => startScanning('qr-reader')}>Escanear QR</button>
 *     </div>
 *   )
 * }
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { parseNFCData, type NFCData } from '@/lib/nfc-utils'

/**
 * ============================================
 * TIPOS
 * ============================================
 */

/**
 * Estados posibles del escáner QR
 */
export type QRScanStatus = 'idle' | 'initializing' | 'scanning' | 'success' | 'error'

/**
 * Opciones para el hook useQRScanner
 */
export interface UseQRScannerOptions {
  /**
   * Callback que se ejecuta cuando el escaneo es exitoso
   */
  onSuccess?: (data: NFCData) => void

  /**
   * Callback que se ejecuta cuando hay un error
   */
  onError?: (error: string) => void

  /**
   * FPS para el escaneo (cuadros por segundo)
   * Por defecto: 10
   */
  fps?: number

  /**
   * Ancho del cuadro de escaneo en píxeles
   * Por defecto: 250
   */
  qrboxWidth?: number

  /**
   * Alto del cuadro de escaneo en píxeles
   * Por defecto: 250
   */
  qrboxHeight?: number
}

/**
 * Valor de retorno del hook useQRScanner
 */
export interface UseQRScannerReturn {
  /**
   * Estado actual del escaneo
   */
  status: QRScanStatus

  /**
   * Si está escaneando actualmente
   */
  isScanning: boolean

  /**
   * Datos del último escaneo exitoso
   */
  data: NFCData | null

  /**
   * Mensaje de error si algo falló
   */
  error: string | null

  /**
   * Función para iniciar el escaneo
   * @param elementId - ID del elemento HTML donde se mostrará la cámara
   */
  startScanning: (elementId: string) => Promise<void>

  /**
   * Función para detener el escaneo
   */
  stopScanning: () => Promise<void>

  /**
   * Función para resetear el estado
   */
  reset: () => void
}

/**
 * ============================================
 * HOOK PRINCIPAL
 * ============================================
 */

/**
 * Hook para escanear códigos QR
 *
 * @param {UseQRScannerOptions} options - Opciones de configuración
 * @returns {UseQRScannerReturn} Objeto con estados y funciones del escáner
 */
export function useQRScanner(options: UseQRScannerOptions = {}): UseQRScannerReturn {
  const { onSuccess, onError, fps = 10, qrboxWidth = 250, qrboxHeight = 250 } = options

  // ========================================
  // ESTADOS
  // ========================================

  const [status, setStatus] = useState<QRScanStatus>('idle')
  const [data, setData] = useState<NFCData | null>(null)
  const [error, setError] = useState<string | null>(null)

  // ========================================
  // REFS
  // ========================================

  // Ref para la instancia de Html5Qrcode
  const qrScannerRef = useRef<Html5Qrcode | null>(null)

  // Ref para saber si ya se escaneó exitosamente (evitar múltiples escaneos)
  const hasScannedRef = useRef(false)

  // ========================================
  // EFECTOS
  // ========================================

  /**
   * Limpiar recursos al desmontar el componente
   */
  useEffect(() => {
    return () => {
      // Detener el escaneo si está activo
      if (qrScannerRef.current) {
        qrScannerRef.current
          .stop()
          .then(() => {
            qrScannerRef.current?.clear()
          })
          .catch((err) => {
            console.error('Error al limpiar escáner QR:', err)
          })
      }
    }
  }, [])

  // ========================================
  // FUNCIONES
  // ========================================

  /**
   * Inicia el escaneo de códigos QR
   *
   * Esta función:
   * 1. Verifica que no haya un escaneo activo
   * 2. Solicita permisos de cámara
   * 3. Inicia la cámara en el elemento especificado
   * 4. Procesa los códigos QR detectados
   *
   * @param {string} elementId - ID del elemento HTML donde se mostrará la cámara
   */
  const startScanning = useCallback(
    async (elementId: string): Promise<void> => {
      // ========================================
      // VALIDACIONES
      // ========================================

      if (status === 'scanning' || status === 'initializing') {
        console.warn('Ya hay un escaneo en progreso')
        return
      }

      // Verificar que el elemento existe
      const element = document.getElementById(elementId)
      if (!element) {
        const errorMsg = `Elemento con ID "${elementId}" no encontrado`
        setStatus('error')
        setError(errorMsg)
        onError?.(errorMsg)
        return
      }

      // ========================================
      // PREPARAR ESCANEO
      // ========================================

      setStatus('initializing')
      setError(null)
      setData(null)
      hasScannedRef.current = false

      console.log('🔍 Iniciando escaneo QR...')

      try {
        // ========================================
        // CREAR INSTANCIA DEL ESCÁNER
        // ========================================

        // Si ya existe una instancia, detenerla y limpiarla
        if (qrScannerRef.current) {
          try {
            await qrScannerRef.current.stop()
            qrScannerRef.current.clear()
          } catch (err) {
            console.warn('Error al limpiar escáner anterior:', err)
          }
        }

        // Crear nueva instancia
        qrScannerRef.current = new Html5Qrcode(elementId)

        // ========================================
        // CONFIGURAR CALLBACKS
        // ========================================

        /**
         * Callback cuando se detecta un código QR
         */
        const onScanSuccess = (decodedText: string, decodedResult: any) => {
          // Evitar múltiples escaneos del mismo código
          if (hasScannedRef.current) {
            return
          }

          hasScannedRef.current = true

          console.log('✅ QR escaneado exitosamente:', decodedText)

          // Parsear los datos del QR (mismo formato que NFC)
          const parsedData = parseNFCData(decodedText)

          // Actualizar estados
          setStatus('success')
          setData(parsedData)

          // Llamar callback de éxito
          onSuccess?.(parsedData)

          // Detener el escaneo automáticamente después de leer un código
          stopScanning()
        }

        /**
         * Callback para errores de escaneo (opcional)
         * No todos los frames necesitan tener un QR, así que no mostramos estos errores
         */
        const onScanFailure = (error: string) => {
          // No hacer nada - es normal que muchos frames no tengan QR
          // Solo logueamos en desarrollo
          if (process.env.NODE_ENV === 'development') {
            // console.debug('Frame sin QR:', error)
          }
        }

        // ========================================
        // INICIAR CÁMARA
        // ========================================

        await qrScannerRef.current.start(
          { facingMode: 'environment' }, // Usar cámara trasera en móviles
          {
            fps, // Cuadros por segundo
            qrbox: { width: qrboxWidth, height: qrboxHeight }, // Tamaño del cuadro de escaneo
          },
          onScanSuccess,
          onScanFailure
        )

        console.log('📷 Cámara iniciada')
        setStatus('scanning')
      } catch (err: any) {
        // ========================================
        // MANEJO DE ERRORES
        // ========================================

        console.error('❌ Error al iniciar escaneo QR:', err)

        let errorMsg = 'Error al iniciar el escáner QR'

        // Mensajes de error específicos
        if (err.name === 'NotAllowedError') {
          errorMsg = 'Permisos de cámara denegados. Por favor, permite el acceso a la cámara.'
        } else if (err.name === 'NotFoundError') {
          errorMsg = 'No se encontró ninguna cámara en tu dispositivo.'
        } else if (err.name === 'NotReadableError') {
          errorMsg = 'La cámara está siendo usada por otra aplicación.'
        } else if (err.message) {
          errorMsg = err.message
        }

        setStatus('error')
        setError(errorMsg)
        onError?.(errorMsg)

        // Limpiar instancia
        if (qrScannerRef.current) {
          try {
            qrScannerRef.current.clear()
          } catch (clearErr) {
            console.error('Error al limpiar escáner:', clearErr)
          }
          qrScannerRef.current = null
        }
      }
    },
    [status, fps, qrboxWidth, qrboxHeight, onSuccess, onError]
  )

  /**
   * Detiene el escaneo actual
   *
   * Esta función detiene la cámara y limpia los recursos.
   */
  const stopScanning = useCallback(async (): Promise<void> => {
    if (!qrScannerRef.current) {
      return
    }

    try {
      console.log('🛑 Deteniendo escaneo QR...')

      // Detener el escáner
      await qrScannerRef.current.stop()

      // Limpiar recursos
      qrScannerRef.current.clear()
      qrScannerRef.current = null

      // Actualizar estado solo si no fue exitoso
      if (status !== 'success') {
        setStatus('idle')
      }
    } catch (err) {
      console.error('Error al detener escaneo QR:', err)

      // Intentar limpiar de todas formas
      try {
        qrScannerRef.current?.clear()
      } catch (clearErr) {
        console.error('Error al limpiar escáner:', clearErr)
      }

      qrScannerRef.current = null
      setStatus('idle')
    }
  }, [status])

  /**
   * Resetea todos los estados del escáner
   *
   * Útil para limpiar el estado después de un escaneo exitoso
   * o para preparar un nuevo escaneo.
   */
  const reset = useCallback(async () => {
    // Detener escaneo si está activo
    await stopScanning()

    // Resetear estados
    setStatus('idle')
    setData(null)
    setError(null)
    hasScannedRef.current = false
  }, [stopScanning])

  // ========================================
  // RETORNO
  // ========================================

  return {
    status,
    isScanning: status === 'scanning' || status === 'initializing',
    data,
    error,
    startScanning,
    stopScanning,
    reset,
  }
}
