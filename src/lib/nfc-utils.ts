/**
 * ============================================
 * NFC UTILITIES
 * ============================================
 *
 * Este archivo contiene utilidades para trabajar con la Web NFC API.
 *
 * Web NFC API permite leer y escribir tags NFC desde el navegador web.
 * Actualmente solo está disponible en:
 * - Chrome/Edge en Android (versión 89+)
 * - NO disponible en iOS/Safari
 *
 * Documentación oficial: https://web.dev/nfc/
 */

/**
 * ============================================
 * TIPOS Y INTERFACES
 * ============================================
 */

/**
 * Resultado del escaneo NFC
 */
export interface NFCScanResult {
  success: boolean       // Si el escaneo fue exitoso
  data?: string         // Datos leídos del tag NFC (UUID o JSON string)
  error?: string        // Mensaje de error si algo falló
  serialNumber?: string // Número de serie del tag NFC (opcional)
}

/**
 * Datos parseados del tag NFC
 * Puede ser para pasaporte o para actividad
 */
export interface NFCData {
  type: 'passport' | 'activity' | 'unknown'
  uuid: string          // UUID del evento o del NFC
  rawData: string       // Datos crudos leídos del tag
}

/**
 * ============================================
 * FUNCIONES DE DETECCIÓN
 * ============================================
 */

/**
 * Detecta si el navegador soporta la Web NFC API
 *
 * @returns {boolean} true si el navegador soporta NFC, false en caso contrario
 *
 * @example
 * if (isNFCSupported()) {
 *   console.log('Este dispositivo soporta NFC')
 * } else {
 *   console.log('NFC no disponible, usar QR')
 * }
 */
export function isNFCSupported(): boolean {
  // Verificar si 'NDEFReader' existe en el objeto window
  // NDEFReader es la clase principal de la Web NFC API
  if (typeof window === 'undefined') {
    return false // SSR - no hay window en el servidor
  }

  return 'NDEFReader' in window
}

/**
 * Verifica si el usuario ha dado permisos para usar NFC
 *
 * Esta función usa la Permissions API para verificar el estado del permiso NFC
 *
 * @returns {Promise<boolean>} true si tiene permisos, false en caso contrario
 *
 * @example
 * const hasPermission = await checkNFCPermission()
 * if (hasPermission) {
 *   // Proceder con el escaneo
 * }
 */
export async function checkNFCPermission(): Promise<boolean> {
  if (!isNFCSupported()) {
    return false
  }

  try {
    // Verificar permisos usando la Permissions API
    if ('permissions' in navigator) {
      const permission = await navigator.permissions.query({ name: 'nfc' as PermissionName })
      return permission.state === 'granted'
    }
    // Si no hay Permissions API, asumimos que está disponible
    return true
  } catch (error) {
    console.error('Error verificando permisos NFC:', error)
    return false
  }
}

/**
 * ============================================
 * FUNCIONES DE ESCANEO
 * ============================================
 */

/**
 * Lee un tag NFC y retorna los datos escaneados
 *
 * Esta es la función principal para escanear tags NFC.
 *
 * IMPORTANTE:
 * - Requiere interacción del usuario (debe llamarse desde un event handler)
 * - Requiere HTTPS (o localhost para desarrollo)
 * - El usuario debe acercar el tag NFC al dispositivo mientras escanea
 *
 * @param {AbortSignal} [signal] - Señal opcional para cancelar el escaneo
 * @returns {Promise<NFCScanResult>} Resultado del escaneo con los datos leídos
 *
 * @example
 * const result = await scanNFC()
 * if (result.success) {
 *   console.log('Datos escaneados:', result.data)
 * } else {
 *   console.error('Error:', result.error)
 * }
 */
export async function scanNFC(signal?: AbortSignal): Promise<NFCScanResult> {
  // ========================================
  // VALIDACIONES INICIALES
  // ========================================

  // Verificar si NFC está soportado
  if (!isNFCSupported()) {
    return {
      success: false,
      error: 'NFC no está disponible en este dispositivo. Por favor, usa el escaneo QR.',
    }
  }

  try {
    // ========================================
    // INICIALIZAR EL LECTOR NFC
    // ========================================

    // @ts-ignore - NDEFReader no está en los tipos de TypeScript por defecto
    const ndef = new NDEFReader()

    // ========================================
    // SOLICITAR PERMISO Y COMENZAR ESCANEO
    // ========================================

    // scan() solicita permisos automáticamente si no los tiene
    // y comienza a escuchar por tags NFC cercanos
    await ndef.scan({ signal })

    console.log('✅ Escaneo NFC iniciado. Acerca el tag NFC al dispositivo...')

    // ========================================
    // ESPERAR A QUE SE LEA UN TAG
    // ========================================

    // Retornar una promesa que se resuelve cuando se lee un tag
    return new Promise<NFCScanResult>((resolve) => {
      // Listener para cuando se detecta un tag NFC
      ndef.addEventListener(
        'reading',
        // @ts-ignore
        ({ message, serialNumber }: any) => {
          console.log('📱 Tag NFC detectado!')
          console.log('Serial:', serialNumber)
          console.log('Message:', message)

          // ========================================
          // PROCESAR LOS DATOS DEL TAG
          // ========================================

          try {
            // Los datos NFC vienen en records
            // Cada record puede tener diferentes tipos de datos
            const records = message.records

            if (records.length === 0) {
              resolve({
                success: false,
                error: 'El tag NFC está vacío',
              })
              return
            }

            // Leer el primer record (usualmente contiene el texto)
            const record = records[0]

            // Decodificar los datos según el tipo
            let data = ''

            if (record.recordType === 'text') {
              // Si es texto plano, decodificarlo
              const textDecoder = new TextDecoder(record.encoding || 'utf-8')
              data = textDecoder.decode(record.data)
            } else if (record.recordType === 'url') {
              // Si es URL, decodificarlo
              const textDecoder = new TextDecoder('utf-8')
              data = textDecoder.decode(record.data)
            } else {
              // Para otros tipos, intentar decodificar como texto
              const textDecoder = new TextDecoder('utf-8')
              data = textDecoder.decode(record.data)
            }

            console.log('📝 Datos leídos:', data)

            // ========================================
            // RETORNAR RESULTADO EXITOSO
            // ========================================

            resolve({
              success: true,
              data: data.trim(),
              serialNumber: serialNumber,
            })
          } catch (error) {
            console.error('Error procesando datos NFC:', error)
            resolve({
              success: false,
              error: 'Error al procesar los datos del tag NFC',
            })
          }
        },
        { once: true } // Solo escuchar una vez
      )

      // Listener para errores durante el escaneo
      ndef.addEventListener(
        'readingerror',
        () => {
          console.error('❌ Error leyendo tag NFC')
          resolve({
            success: false,
            error: 'Error al leer el tag NFC. Por favor, intenta de nuevo.',
          })
        },
        { once: true }
      )

      // Si el escaneo es cancelado
      if (signal) {
        signal.addEventListener('abort', () => {
          resolve({
            success: false,
            error: 'Escaneo cancelado',
          })
        })
      }
    })
  } catch (error: any) {
    // ========================================
    // MANEJO DE ERRORES
    // ========================================

    console.error('Error al escanear NFC:', error)

    // Errores comunes y sus mensajes amigables
    if (error.name === 'NotAllowedError') {
      return {
        success: false,
        error: 'Permisos de NFC denegados. Por favor, permite el acceso a NFC en tu navegador.',
      }
    }

    if (error.name === 'NotSupportedError') {
      return {
        success: false,
        error: 'NFC no está soportado en este dispositivo.',
      }
    }

    if (error.name === 'NotReadableError') {
      return {
        success: false,
        error: 'No se pudo acceder al lector NFC. Asegúrate de que NFC esté habilitado en tu dispositivo.',
      }
    }

    // Error genérico
    return {
      success: false,
      error: error.message || 'Error desconocido al escanear NFC',
    }
  }
}

/**
 * ============================================
 * FUNCIONES DE PARSEO
 * ============================================
 */

/**
 * Parsea los datos leídos del tag NFC y determina el tipo
 *
 * Los tags NFC pueden contener dos tipos de datos:
 * 1. Para pasaportes: "passport:UUID" o JSON {"type":"passport","eventUuid":"..."}
 * 2. Para actividades: "activity:UUID" o JSON {"type":"activity","nfcUuid":"..."}
 *
 * @param {string} rawData - Datos crudos leídos del tag NFC
 * @returns {NFCData} Datos parseados con el tipo y UUID
 *
 * @example
 * const data = parseNFCData('passport:550e8400-e29b-41d4-a716-446655440000')
 * // => { type: 'passport', uuid: '550e8400-e29b-41d4-a716-446655440000', rawData: '...' }
 */
export function parseNFCData(rawData: string): NFCData {
  const trimmedData = rawData.trim()

  try {
    // ========================================
    // INTENTAR PARSEAR COMO JSON
    // ========================================

    if (trimmedData.startsWith('{')) {
      const parsed = JSON.parse(trimmedData)

      // Formato para pasaporte: {"type":"passport","eventUuid":"..."}
      if (parsed.type === 'passport' && parsed.eventUuid) {
        return {
          type: 'passport',
          uuid: parsed.eventUuid,
          rawData: trimmedData,
        }
      }

      // Formato para actividad: {"type":"activity","nfcUuid":"..."}
      if (parsed.type === 'activity' && parsed.nfcUuid) {
        return {
          type: 'activity',
          uuid: parsed.nfcUuid,
          rawData: trimmedData,
        }
      }
    }

    // ========================================
    // INTENTAR PARSEAR COMO STRING SIMPLE
    // ========================================

    // Formato: "passport:UUID"
    if (trimmedData.startsWith('passport:')) {
      const uuid = trimmedData.replace('passport:', '')
      return {
        type: 'passport',
        uuid,
        rawData: trimmedData,
      }
    }

    // Formato: "activity:UUID"
    if (trimmedData.startsWith('activity:')) {
      const uuid = trimmedData.replace('activity:', '')
      return {
        type: 'activity',
        uuid,
        rawData: trimmedData,
      }
    }

    // ========================================
    // SI NO COINCIDE CON NINGÚN FORMATO
    // ========================================

    // Asumir que es un UUID directo (para actividades)
    // En producción, los tags NFC deberían tener el formato correcto
    return {
      type: 'unknown',
      uuid: trimmedData,
      rawData: trimmedData,
    }
  } catch (error) {
    console.error('Error parseando datos NFC:', error)

    // Si falla el parseo, retornar como desconocido
    return {
      type: 'unknown',
      uuid: trimmedData,
      rawData: trimmedData,
    }
  }
}

/**
 * ============================================
 * FUNCIONES DE UTILIDAD
 * ============================================
 */

/**
 * Valida que un UUID tenga el formato correcto
 *
 * @param {string} uuid - UUID a validar
 * @returns {boolean} true si el UUID es válido, false en caso contrario
 *
 * @example
 * isValidUUID('550e8400-e29b-41d4-a716-446655440000') // => true
 * isValidUUID('invalid-uuid') // => false
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Obtiene un mensaje de error amigable según el tipo de error NFC
 *
 * @param {any} error - Error capturado
 * @returns {string} Mensaje de error amigable
 */
export function getNFCErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error
  }

  if (error?.name) {
    switch (error.name) {
      case 'NotAllowedError':
        return 'Permisos de NFC denegados. Por favor, permite el acceso a NFC.'
      case 'NotSupportedError':
        return 'Tu dispositivo no soporta NFC.'
      case 'NotReadableError':
        return 'NFC no está habilitado en tu dispositivo.'
      case 'AbortError':
        return 'Escaneo cancelado.'
      default:
        return error.message || 'Error al escanear NFC'
    }
  }

  return 'Error desconocido al escanear NFC'
}
