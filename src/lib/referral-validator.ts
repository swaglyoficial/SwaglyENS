/**
 * Servicio de validación de códigos de referido
 * Hace fetch de un URL y verifica si contiene "refCode" en el contenido
 */

export interface ReferralValidationResult {
  isValid: boolean
  refCode?: string
  error?: string
}

/**
 * Valida un link de referido haciendo fetch del contenido y buscando "refCode"
 * Busca el patrón: \"refCode\": o \\"refCode\\":
 */
export async function validateReferralLink(
  url: string
): Promise<ReferralValidationResult> {
  try {
    // Validar que sea un URL válido
    let validUrl: URL
    try {
      validUrl = new URL(url)
    } catch (error) {
      return {
        isValid: false,
        error: 'URL inválido. Por favor proporciona un link válido.',
      }
    }

    // Solo permitir HTTP y HTTPS
    if (!['http:', 'https:'].includes(validUrl.protocol)) {
      return {
        isValid: false,
        error: 'Solo se permiten URLs HTTP o HTTPS.',
      }
    }

    console.log(`🔍 Validando link de referido: ${url}`)

    // Hacer fetch con timeout de 10 segundos
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    let response: Response
    try {
      response = await fetch(url, {
        method: 'GET',
        redirect: 'follow', // Equivalente a curl -L
        signal: controller.signal,
        headers: {
          'User-Agent': 'Swagly-Validator/1.0',
        },
      })
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            isValid: false,
            error: 'Timeout: El link tardó demasiado en responder (máx 10 seg).',
          }
        }
      }

      return {
        isValid: false,
        error: 'No se pudo acceder al link. Verifica que sea correcto.',
      }
    }

    clearTimeout(timeoutId)

    if (!response.ok) {
      return {
        isValid: false,
        error: `Error HTTP ${response.status}: No se pudo obtener el contenido del link.`,
      }
    }

    // Leer el contenido (limitado a 1MB para seguridad)
    const contentLength = response.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > 1024 * 1024) {
      return {
        isValid: false,
        error: 'El contenido del link es demasiado grande (máx 1MB).',
      }
    }

    const content = await response.text()

    // Buscar el patrón \"refCode\": o \\"refCode\":
    // Soporta tanto JSON escapado como JSON normal
    const patterns = [
      /\\"refCode\\":\s*\\"([^"\\]+)\\"/,  // \"refCode\":\"VALUE\"
      /"refCode":\s*"([^"]+)"/,             // "refCode":"VALUE"
      /\\"refCode\\":/,                     // Solo buscar que exista \"refCode\":
      /"refCode":/,                         // Solo buscar que exista "refCode":
    ]

    let refCode: string | undefined

    for (const pattern of patterns) {
      const match = content.match(pattern)
      if (match) {
        // Si el patrón captura un grupo (el valor del refCode)
        if (match[1]) {
          refCode = match[1]
        } else {
          // Si solo encontramos la key sin valor, es válido de todas formas
          refCode = 'found'
        }
        break
      }
    }

    if (refCode) {
      console.log(`✅ Código de referido encontrado: ${refCode}`)
      return {
        isValid: true,
        refCode,
      }
    } else {
      console.log(`❌ No se encontró "refCode" en el contenido del link`)
      return {
        isValid: false,
        error: 'No se encontró un código de referido válido en este link. Verifica que sea el link correcto.',
      }
    }
  } catch (error) {
    console.error('Error validando link de referido:', error)
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Error desconocido al validar el link.',
    }
  }
}
