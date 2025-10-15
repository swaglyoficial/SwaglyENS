/**
 * ============================================
 * COMPONENTE: UnifiedScanner
 * ============================================
 *
 * Componente unificado que detecta automáticamente si el dispositivo
 * soporta NFC y muestra la opción de escaneo apropiada (NFC o QR).
 *
 * Este componente proporciona una experiencia fluida:
 * - En dispositivos Android con Chrome/Edge → Muestra opción NFC + QR
 * - En dispositivos iOS/Safari → Muestra solo opción QR
 * - Permite al usuario elegir manualmente si ambas opciones están disponibles
 *
 * @example
 * <UnifiedScanner
 *   onScanSuccess={(data) => console.log('Escaneado:', data)}
 *   mode="auto"
 * />
 */

'use client'

import { useState, useEffect } from 'react'
import { QRScanner } from '@/components/qr-scanner'
import { useNFCScanner } from '@/hooks/useNFCScanner'
import { isNFCSupported, type NFCData } from '@/lib/nfc-utils'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Nfc, QrCode, CheckCircle2, AlertCircle, Smartphone } from 'lucide-react'

/**
 * ============================================
 * TIPOS
 * ============================================
 */

/**
 * Modo de escaneo
 */
export type ScanMode = 'auto' | 'nfc' | 'qr' | 'both'

/**
 * Método de escaneo activo
 */
type ActiveMethod = 'nfc' | 'qr'

/**
 * Props del componente UnifiedScanner
 */
interface UnifiedScannerProps {
  /**
   * Callback cuando el escaneo es exitoso
   */
  onScanSuccess: (data: NFCData) => void

  /**
   * Callback cuando hay un error
   */
  onScanError?: (error: string) => void

  /**
   * Callback cuando el usuario cancela
   */
  onCancel?: () => void

  /**
   * Modo de escaneo:
   * - 'auto': Detecta automáticamente y usa NFC si está disponible
   * - 'nfc': Solo NFC (muestra error si no está disponible)
   * - 'qr': Solo QR
   * - 'both': Muestra ambas opciones y permite al usuario elegir
   *
   * Por defecto: 'auto'
   */
  mode?: ScanMode

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

export function UnifiedScanner({
  onScanSuccess,
  onScanError,
  onCancel,
  mode = 'auto',
  className = '',
}: UnifiedScannerProps) {
  // ========================================
  // ESTADOS
  // ========================================

  const [nfcSupported, setNfcSupported] = useState(false)
  const [activeMethod, setActiveMethod] = useState<ActiveMethod | null>(null)
  const [isCheckingSupport, setIsCheckingSupport] = useState(true)

  // ========================================
  // HOOKS
  // ========================================

  // Hook para escaneo NFC
  const nfcScanner = useNFCScanner({
    onSuccess: onScanSuccess,
    onError: onScanError,
  })

  // ========================================
  // EFECTOS
  // ========================================

  /**
   * Detectar soporte NFC al montar el componente
   */
  useEffect(() => {
    const checkSupport = () => {
      const supported = isNFCSupported()
      setNfcSupported(supported)
      setIsCheckingSupport(false)

      console.log('📱 NFC soportado:', supported)

      // Determinar el método activo según el modo
      if (mode === 'auto') {
        // Auto: Preferir NFC si está disponible
        setActiveMethod(supported ? 'nfc' : 'qr')
      } else if (mode === 'nfc') {
        setActiveMethod('nfc')
      } else if (mode === 'qr') {
        setActiveMethod('qr')
      } else if (mode === 'both') {
        // Both: Mostrar tabs, default a NFC si está disponible
        setActiveMethod(supported ? 'nfc' : 'qr')
      }
    }

    checkSupport()
  }, [mode])

  // ========================================
  // HANDLERS
  // ========================================

  /**
   * Maneja el escaneo NFC
   */
  const handleNFCScan = async () => {
    const result = await nfcScanner.scan()
    if (!result) {
      // El error ya se maneja en el hook
      console.error('Error en escaneo NFC')
    }
  }

  /**
   * Maneja el cambio de método de escaneo en las tabs
   */
  const handleMethodChange = (value: string) => {
    setActiveMethod(value as ActiveMethod)
    // Resetear estados de ambos scanners
    nfcScanner.reset()
  }

  // ========================================
  // RENDERIZADO CONDICIONAL
  // ========================================

  /**
   * Mostrar loader mientras se verifica soporte
   */
  if (isCheckingSupport) {
    return (
      <div className={`flex flex-col items-center justify-center space-y-4 p-8 ${className}`}>
        <Loader2 className="h-12 w-12 animate-spin text-cyan-400" />
        <p className="text-sm text-cyan-200">Verificando capacidades del dispositivo...</p>
      </div>
    )
  }

  /**
   * Si el modo es 'nfc' pero no está soportado, mostrar error
   */
  if (mode === 'nfc' && !nfcSupported) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-red-500/30 bg-red-500/10 p-8">
          <AlertCircle className="h-12 w-12 text-red-400" />
          <div className="text-center">
            <p className="mb-2 text-lg font-semibold text-red-200">NFC no disponible</p>
            <p className="text-sm text-red-200/70">
              Tu dispositivo no soporta NFC. Por favor, usa un dispositivo Android con Chrome o
              Edge.
            </p>
          </div>
        </div>
      </div>
    )
  }

  /**
   * Modo 'auto' o cuando solo hay una opción disponible
   */
  if (mode === 'auto' || (mode !== 'both' && activeMethod)) {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* ========================================
            MOSTRAR MÉTODO ACTIVO
            ======================================== */}

        {activeMethod === 'nfc' ? (
          // ========================================
          // ESCANEO NFC
          // ========================================
          <div className="space-y-4">
            {/* Información sobre NFC */}
            <div className="flex items-center gap-3 rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-4">
              <Nfc className="h-8 w-8 text-cyan-400" />
              <div className="flex-1">
                <p className="font-semibold text-cyan-100">Escaneo NFC</p>
                <p className="text-xs text-cyan-200/70">
                  Acerca tu dispositivo al tag NFC cuando presiones el botón
                </p>
              </div>
            </div>

            {/* Botón de escaneo NFC */}
            <Button
              onClick={handleNFCScan}
              disabled={nfcScanner.isScanning}
              className="w-full border border-cyan-500/60 bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/30"
              size="lg"
            >
              {nfcScanner.isScanning ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Acerca el tag NFC...
                </>
              ) : (
                <>
                  <Nfc className="mr-2 h-5 w-5" />
                  Escanear NFC
                </>
              )}
            </Button>

            {/* Mensajes de estado */}
            {nfcScanner.error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
                <p className="text-sm text-red-200">{nfcScanner.error}</p>
              </div>
            )}

            {nfcScanner.status === 'success' && nfcScanner.data && (
              <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-green-400" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-200">¡Escaneo exitoso!</p>
                  <p className="text-xs text-green-200/70">
                    Tipo: {nfcScanner.data.type === 'passport' ? 'Pasaporte' : 'Actividad'}
                  </p>
                </div>
              </div>
            )}

            {/* Botón para cancelar */}
            {nfcScanner.isScanning && (
              <Button
                onClick={nfcScanner.cancel}
                variant="outline"
                className="w-full border-red-500/30 text-red-200 hover:bg-red-500/10"
              >
                Cancelar
              </Button>
            )}

            {/* Opción alternativa: Usar QR si NFC falla */}
            {!nfcScanner.isScanning && mode === 'auto' && (
              <div className="text-center">
                <button
                  onClick={() => setActiveMethod('qr')}
                  className="text-xs text-cyan-400 underline hover:text-cyan-300"
                >
                  ¿Problemas con NFC? Prueba con código QR
                </button>
              </div>
            )}
          </div>
        ) : (
          // ========================================
          // ESCANEO QR
          // ========================================
          <div className="space-y-4">
            {/* Información sobre QR */}
            <div className="flex items-center gap-3 rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-4">
              <QrCode className="h-8 w-8 text-cyan-400" />
              <div className="flex-1">
                <p className="font-semibold text-cyan-100">Escaneo QR</p>
                <p className="text-xs text-cyan-200/70">
                  Usa la cámara para escanear el código QR
                </p>
              </div>
            </div>

            {/* Componente de escaneo QR */}
            <QRScanner
              onScanSuccess={onScanSuccess}
              onScanError={onScanError}
              onCancel={onCancel}
            />

            {/* Opción alternativa: Usar NFC si está disponible */}
            {nfcSupported && mode === 'auto' && (
              <div className="text-center">
                <button
                  onClick={() => setActiveMethod('nfc')}
                  className="text-xs text-cyan-400 underline hover:text-cyan-300"
                >
                  ¿Prefieres usar NFC?
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  /**
   * Modo 'both': Mostrar tabs con ambas opciones
   */
  if (mode === 'both') {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* ========================================
            INFORMACIÓN DEL DISPOSITIVO
            ======================================== */}

        <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-cyan-400" />
            <p className="text-xs text-cyan-200/70">
              {nfcSupported
                ? 'Tu dispositivo soporta NFC y QR. Elige tu método preferido.'
                : 'Tu dispositivo solo soporta escaneo QR.'}
            </p>
          </div>
        </div>

        {/* ========================================
            TABS PARA SELECCIONAR MÉTODO
            ======================================== */}

        <Tabs
          value={activeMethod || 'qr'}
          onValueChange={handleMethodChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 bg-black/40">
            <TabsTrigger
              value="nfc"
              disabled={!nfcSupported}
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-100"
            >
              <Nfc className="mr-2 h-4 w-4" />
              NFC
            </TabsTrigger>
            <TabsTrigger
              value="qr"
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-100"
            >
              <QrCode className="mr-2 h-4 w-4" />
              QR
            </TabsTrigger>
          </TabsList>

          {/* Tab de NFC */}
          <TabsContent value="nfc" className="mt-4">
            <div className="space-y-4">
              {/* Información sobre NFC */}
              <div className="flex items-center gap-3 rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-4">
                <Nfc className="h-8 w-8 text-cyan-400" />
                <div className="flex-1">
                  <p className="font-semibold text-cyan-100">Escaneo NFC</p>
                  <p className="text-xs text-cyan-200/70">
                    Acerca tu dispositivo al tag NFC cuando presiones el botón
                  </p>
                </div>
              </div>

              {/* Botón de escaneo NFC */}
              <Button
                onClick={handleNFCScan}
                disabled={nfcScanner.isScanning}
                className="w-full border border-cyan-500/60 bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/30"
                size="lg"
              >
                {nfcScanner.isScanning ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Acerca el tag NFC...
                  </>
                ) : (
                  <>
                    <Nfc className="mr-2 h-5 w-5" />
                    Escanear NFC
                  </>
                )}
              </Button>

              {/* Mensajes de estado */}
              {nfcScanner.error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                  <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
                  <p className="text-sm text-red-200">{nfcScanner.error}</p>
                </div>
              )}

              {nfcScanner.status === 'success' && nfcScanner.data && (
                <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-400" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-green-200">¡Escaneo exitoso!</p>
                    <p className="text-xs text-green-200/70">
                      Tipo: {nfcScanner.data.type === 'passport' ? 'Pasaporte' : 'Actividad'}
                    </p>
                  </div>
                </div>
              )}

              {/* Botón para cancelar */}
              {nfcScanner.isScanning && (
                <Button
                  onClick={nfcScanner.cancel}
                  variant="outline"
                  className="w-full border-red-500/30 text-red-200 hover:bg-red-500/10"
                >
                  Cancelar
                </Button>
              )}
            </div>
          </TabsContent>

          {/* Tab de QR */}
          <TabsContent value="qr" className="mt-4">
            <QRScanner
              onScanSuccess={onScanSuccess}
              onScanError={onScanError}
              onCancel={onCancel}
            />
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  // Fallback (no debería llegar aquí)
  return null
}
