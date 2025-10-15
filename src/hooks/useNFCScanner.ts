/**
 * ============================================
 * HOOK: useNFCScanner
 * ============================================
 *
 * Hook personalizado para escanear tags NFC en componentes React.
 *
 * Este hook encapsula toda la lógica de escaneo NFC y manejo de estados,
 * proporcionando una interfaz simple para los componentes.
 *
 * @example
 * function MyComponent() {
 *   const { isScanning, error, scan, data } = useNFCScanner()
 *
 *   const handleScan = async () => {
 *     const result = await scan()
 *     if (result) {
 *       console.log('Escaneado:', result)
 *     }
 *   }
 *
 *   return <button onClick={handleScan}>Escanear NFC</button>
 * }
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  isNFCSupported,
  scanNFC,
  parseNFCData,
  getNFCErrorMessage,
  type NFCScanResult,
  type NFCData,
} from '@/lib/nfc-utils'

/**
 * ============================================
 * TIPOS
 * ============================================
 */

/**
 * Estados posibles del escáner NFC
 */
export type ScanStatus = 'idle' | 'scanning' | 'success' | 'error'

/**
 * Opciones para el hook useNFCScanner
 */
export interface UseNFCScannerOptions {
  /**
   * Callback que se ejecuta cuando el escaneo es exitoso
   */
  onSuccess?: (data: NFCData) => void

  /**
   * Callback que se ejecuta cuando hay un error
   */
  onError?: (error: string) => void

  /**
   * Timeout en milisegundos para cancelar el escaneo automáticamente
   * Por defecto: 30000 (30 segundos)
   */
  timeout?: number
}

/**
 * Valor de retorno del hook useNFCScanner
 */
export interface UseNFCScannerReturn {
  /**
   * Si el dispositivo soporta NFC
   */
  isSupported: boolean

  /**
   * Estado actual del escaneo
   */
  status: ScanStatus

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
   */
  scan: () => Promise<NFCData | null>

  /**
   * Función para cancelar el escaneo actual
   */
  cancel: () => void

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
 * Hook para escanear tags NFC
 *
 * @param {UseNFCScannerOptions} options - Opciones de configuración
 * @returns {UseNFCScannerReturn} Objeto con estados y funciones del escáner
 */
export function useNFCScanner(options: UseNFCScannerOptions = {}): UseNFCScannerReturn {
  const { onSuccess, onError, timeout = 30000 } = options

  // ========================================
  // ESTADOS
  // ========================================

  const [isSupported, setIsSupported] = useState(false)
  const [status, setStatus] = useState<ScanStatus>('idle')
  const [data, setData] = useState<NFCData | null>(null)
  const [error, setError] = useState<string | null>(null)

  // ========================================
  // REFS
  // ========================================

  // Ref para el AbortController (permite cancelar el escaneo)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Ref para el timeout
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // ========================================
  // EFECTOS
  // ========================================

  /**
   * Verificar soporte NFC al montar el componente
   */
  useEffect(() => {
    const supported = isNFCSupported()
    setIsSupported(supported)

    if (!supported) {
      console.warn('⚠️ NFC no está soportado en este dispositivo')
    }
  }, [])

  /**
   * Limpiar recursos al desmontar el componente
   */
  useEffect(() => {
    return () => {
      // Cancelar escaneo si está en progreso
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Limpiar timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // ========================================
  // FUNCIONES
  // ========================================

  /**
   * Inicia el escaneo de un tag NFC
   *
   * Esta función:
   * 1. Verifica que NFC esté soportado
   * 2. Crea un AbortController para poder cancelar
   * 3. Inicia el escaneo con timeout
   * 4. Procesa los datos escaneados
   * 5. Llama a los callbacks correspondientes
   *
   * @returns {Promise<NFCData | null>} Datos escaneados o null si falló
   */
  const scan = useCallback(async (): Promise<NFCData | null> => {
    // ========================================
    // VALIDACIONES
    // ========================================

    if (!isSupported) {
      const errorMsg = 'NFC no está soportado en este dispositivo'
      setStatus('error')
      setError(errorMsg)
      onError?.(errorMsg)
      return null
    }

    // Si ya está escaneando, no hacer nada
    if (status === 'scanning') {
      console.warn('Ya hay un escaneo en progreso')
      return null
    }

    // ========================================
    // PREPARAR ESCANEO
    // ========================================

    // Resetear estados
    setStatus('scanning')
    setError(null)
    setData(null)

    // Crear AbortController para poder cancelar
    abortControllerRef.current = new AbortController()

    // Configurar timeout para cancelar automáticamente
    timeoutRef.current = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        setStatus('error')
        const timeoutError = 'Tiempo de espera agotado. Por favor, intenta de nuevo.'
        setError(timeoutError)
        onError?.(timeoutError)
      }
    }, timeout)

    console.log('🔍 Iniciando escaneo NFC...')

    try {
      // ========================================
      // EJECUTAR ESCANEO
      // ========================================

      const result: NFCScanResult = await scanNFC(abortControllerRef.current.signal)

      // Limpiar timeout si el escaneo terminó
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      // ========================================
      // PROCESAR RESULTADO
      // ========================================

      if (!result.success) {
        // Escaneo falló
        setStatus('error')
        const errorMsg = result.error || 'Error al escanear NFC'
        setError(errorMsg)
        onError?.(errorMsg)
        return null
      }

      if (!result.data) {
        // No hay datos
        setStatus('error')
        const errorMsg = 'No se pudieron leer datos del tag NFC'
        setError(errorMsg)
        onError?.(errorMsg)
        return null
      }

      // ========================================
      // PARSEAR DATOS
      // ========================================

      const parsedData = parseNFCData(result.data)

      console.log('✅ NFC escaneado exitosamente:', parsedData)

      // Actualizar estados
      setStatus('success')
      setData(parsedData)

      // Llamar callback de éxito
      onSuccess?.(parsedData)

      return parsedData
    } catch (err: any) {
      // ========================================
      // MANEJO DE ERRORES
      // ========================================

      console.error('❌ Error en escaneo NFC:', err)

      // Limpiar timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      const errorMsg = getNFCErrorMessage(err)
      setStatus('error')
      setError(errorMsg)
      onError?.(errorMsg)

      return null
    } finally {
      // Limpiar AbortController
      abortControllerRef.current = null
    }
  }, [isSupported, status, timeout, onSuccess, onError])

  /**
   * Cancela el escaneo actual
   *
   * Esta función aborta el escaneo en progreso si existe uno.
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      console.log('🛑 Cancelando escaneo NFC...')
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    setStatus('idle')
    setError('Escaneo cancelado')
  }, [])

  /**
   * Resetea todos los estados del escáner
   *
   * Útil para limpiar el estado después de un escaneo exitoso
   * o para preparar un nuevo escaneo.
   */
  const reset = useCallback(() => {
    // Cancelar escaneo si está en progreso
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    // Resetear estados
    setStatus('idle')
    setData(null)
    setError(null)
  }, [])

  // ========================================
  // RETORNO
  // ========================================

  return {
    isSupported,
    status,
    isScanning: status === 'scanning',
    data,
    error,
    scan,
    cancel,
    reset,
  }
}
