/**
 * Servicio de validación de transacciones de Scroll usando Etherscan API V2
 * La V2 de Etherscan soporta múltiples chains incluyendo Scroll
 */

// Etherscan API V2 - Soporta Scroll y otras chains
const ETHERSCAN_V2_API_URL = 'https://api.etherscan.io/v2/api'
const SCROLL_CHAIN_ID = 534352 // Scroll Mainnet
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || 'K4D78JQRMVXRBIJEICIT9SY12IXD1QJ8Q6'

export interface ScrollscanTransaction {
  blockHash: string
  blockNumber: string
  from: string
  gas: string
  gasPrice: string
  hash: string
  input: string
  nonce: string
  to: string
  transactionIndex: string
  value: string
  type: string
  chainId: string
  v: string
  r: string
  s: string
}

export interface ValidationResult {
  isValid: boolean
  transaction?: ScrollscanTransaction
  error?: string
}

/**
 * Extrae el hash de transacción de una URL de Scrollscan
 * Soporta formatos:
 * - https://scrollscan.com/tx/0xabc123...
 * - https://www.scrollscan.com/tx/0xabc123...
 * - 0xabc123... (hash directo)
 */
export function extractTransactionHash(input: string): string | null {
  if (!input || typeof input !== 'string') {
    console.error('❌ Input inválido:', input)
    return null
  }

  // Limpiar espacios en blanco
  const cleanInput = input.trim()

  console.log('🔍 Extrayendo hash de:', cleanInput)

  // Si ya es un hash (empieza con 0x y tiene longitud apropiada)
  if (cleanInput.startsWith('0x') && cleanInput.length === 66) {
    console.log('✅ Hash directo detectado')
    return cleanInput.toLowerCase()
  }

  // Intentar extraer de URL
  try {
    const url = new URL(cleanInput)
    const pathParts = url.pathname.split('/')
    const txIndex = pathParts.indexOf('tx')

    console.log('🌐 URL detectada, pathParts:', pathParts)

    if (txIndex !== -1 && pathParts[txIndex + 1]) {
      const hash = pathParts[txIndex + 1]
      console.log('📍 Hash encontrado en URL:', hash)

      if (hash.startsWith('0x') && hash.length === 66) {
        console.log('✅ Hash válido extraído de URL')
        return hash.toLowerCase()
      } else {
        console.error('❌ Hash en URL no válido. Longitud:', hash.length, 'Empieza con 0x:', hash.startsWith('0x'))
      }
    } else {
      console.error('❌ No se encontró /tx/ en la URL')
    }
  } catch (error) {
    // No es una URL válida, intentar buscar patrón 0x...
    console.log('⚠️ No es una URL válida, buscando patrón de hash...')
    const hashPattern = /(0x[a-fA-F0-9]{64})/
    const match = cleanInput.match(hashPattern)
    if (match) {
      console.log('✅ Hash encontrado por patrón:', match[1])
      return match[1].toLowerCase()
    }
  }

  console.error('❌ No se pudo extraer hash válido del input:', cleanInput)
  return null
}

/**
 * Valida una transacción en Scroll Mainnet usando Etherscan API V2
 * La API V2 de Etherscan soporta múltiples chains incluyendo Scroll
 *
 * @param transactionHashOrUrl - URL de Scrollscan o hash de transacción
 * @param userWalletAddress - Dirección de wallet del usuario (opcional, para verificar que sea el remitente)
 * @returns Resultado de la validación con la transacción si es válida
 */
export async function validateScrollTransaction(
  transactionHashOrUrl: string,
  userWalletAddress?: string
): Promise<ValidationResult> {
  try {
    // Extraer el hash de la URL o input
    const txHash = extractTransactionHash(transactionHashOrUrl)

    if (!txHash) {
      return {
        isValid: false,
        error: 'No se pudo extraer un hash de transacción válido del link proporcionado',
      }
    }

    // Llamar a la Etherscan API V2 con soporte para Scroll
    // V2 requiere chainid para identificar la red
    const url = `${ETHERSCAN_V2_API_URL}?chainid=${SCROLL_CHAIN_ID}&module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${ETHERSCAN_API_KEY}`

    console.log('🔑 Usando Etherscan API V2 para Scroll Mainnet')

    console.log(`🔍 Validando transacción: ${txHash}`)
    console.log(`🌐 URL de consulta: ${url}`)

    const response = await fetch(url)

    if (!response.ok) {
      return {
        isValid: false,
        error: `Error al consultar Scrollscan: ${response.status}`,
      }
    }

    const data = await response.json()

    console.log('📥 Respuesta de Scrollscan:', JSON.stringify(data, null, 2))

    // Verificar si la API retornó un error
    if (data.message && data.message !== 'OK') {
      let errorMessage = `Error de Scrollscan: ${data.message}`

      // Mensajes específicos para errores comunes
      if (data.message === 'NOTOK') {
        if (data.result && typeof data.result === 'string') {
          // Scrollscan incluye el mensaje de error en data.result
          errorMessage = `Error de Scrollscan: ${data.result}`

          // Errores comunes
          if (data.result.includes('Invalid API Key')) {
            errorMessage = 'La API Key de Etherscan/Scrollscan no es válida. Contacta al administrador.'
          } else if (data.result.includes('Max rate limit reached')) {
            errorMessage = 'Límite de peticiones alcanzado. Intenta nuevamente en unos minutos.'
          }
        } else {
          errorMessage = 'Error al consultar Scrollscan. La transacción puede no existir o hubo un problema con la API.'
        }
      }

      console.error('❌ Error de Scrollscan:', errorMessage)

      return {
        isValid: false,
        error: errorMessage,
      }
    }

    // Verificar si la transacción existe
    if (!data.result || data.result === null) {
      return {
        isValid: false,
        error: 'Transacción no encontrada en Scroll Mainnet. Verifica que el link sea correcto.',
      }
    }

    const transaction = data.result as ScrollscanTransaction

    // Verificar que la transacción esté confirmada (tiene blockNumber)
    if (!transaction.blockNumber || transaction.blockNumber === '0x0') {
      return {
        isValid: false,
        error: 'La transacción aún no ha sido confirmada. Espera unos minutos e intenta nuevamente.',
      }
    }

    // Si se proporciona una wallet del usuario, verificar que sea el remitente
    if (userWalletAddress) {
      const normalizedUserWallet = userWalletAddress.toLowerCase()
      const txFrom = transaction.from.toLowerCase()

      if (txFrom !== normalizedUserWallet) {
        return {
          isValid: false,
          error: `La transacción no fue enviada desde tu wallet. Wallet esperada: ${normalizedUserWallet}, Wallet de la transacción: ${txFrom}`,
        }
      }
    }

    console.log(`✅ Transacción válida: ${txHash}`)
    console.log(`   - From: ${transaction.from}`)
    console.log(`   - To: ${transaction.to}`)
    console.log(`   - Block: ${parseInt(transaction.blockNumber, 16)}`)

    return {
      isValid: true,
      transaction,
    }
  } catch (error) {
    console.error('Error validating Scroll transaction:', error)
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Error desconocido al validar la transacción',
    }
  }
}

/**
 * ===========================================
 * ON-CHAIN EVENT VALIDATION
 * ===========================================
 */

// Event signatures (Topic[0]) para identificar eventos
const EVENT_SIGNATURES = {
  TRANSFER: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
  CASHBACK: '0x89d3571a498b5d3d68599f5f00c3016f9604aafa7701c52c1b04109cd909a798',
}

export interface TransactionLog {
  address: string
  topics: string[]
  data: string
  blockNumber: string
  transactionHash: string
  transactionIndex: string
  blockHash: string
  logIndex: string
  removed: boolean
}

export interface TransactionReceipt {
  transactionHash: string
  blockHash: string
  blockNumber: string
  logs: TransactionLog[]
  status: string
  from: string
  to: string
}

export interface OnChainValidationResult {
  isValid: boolean
  error?: string
  details?: {
    amount?: string
    tokenAddress?: string
    eventFound?: boolean
    [key: string]: any
  }
}

/**
 * Obtiene el receipt completo de una transacción (incluyendo todos los logs/eventos)
 */
export async function getTransactionReceipt(
  transactionHashOrUrl: string
): Promise<{ receipt?: TransactionReceipt; error?: string }> {
  try {
    const txHash = extractTransactionHash(transactionHashOrUrl)

    if (!txHash) {
      return {
        error: 'No se pudo extraer un hash de transacción válido',
      }
    }

    const url = `${ETHERSCAN_V2_API_URL}?chainid=${SCROLL_CHAIN_ID}&module=proxy&action=eth_getTransactionReceipt&txhash=${txHash}&apikey=${ETHERSCAN_API_KEY}`

    console.log(`🔍 Obteniendo receipt de transacción: ${txHash}`)

    const response = await fetch(url)

    if (!response.ok) {
      return {
        error: `Error al consultar Scrollscan: ${response.status}`,
      }
    }

    const data = await response.json()

    if (data.message && data.message !== 'OK') {
      return {
        error: `Error de Scrollscan: ${data.result || data.message}`,
      }
    }

    if (!data.result || data.result === null) {
      return {
        error: 'Receipt no encontrado',
      }
    }

    const receipt = data.result as TransactionReceipt

    console.log(`✅ Receipt obtenido: ${receipt.logs.length} eventos encontrados`)

    return { receipt }
  } catch (error) {
    console.error('Error getting transaction receipt:', error)
    return {
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

/**
 * Valida si una transacción contiene una transferencia de USDC (o cualquier token ERC20)
 * con un monto mínimo especificado
 *
 * @param transactionHashOrUrl - Hash o URL de la transacción
 * @param config - Configuración de validación
 * @returns Resultado de la validación
 */
export async function validateUSDCTransfer(
  transactionHashOrUrl: string,
  config: {
    minAmount: number // Cantidad mínima (ej: 25 para 25 USDC)
    decimals: number // Decimales del token (ej: 6 para USDC)
  }
): Promise<OnChainValidationResult> {
  try {
    const { receipt, error } = await getTransactionReceipt(transactionHashOrUrl)

    if (error || !receipt) {
      return {
        isValid: false,
        error: error || 'No se pudo obtener el receipt',
      }
    }

    // Buscar eventos Transfer en todos los logs
    const transferLogs = receipt.logs.filter(
      (log) => log.topics[0]?.toLowerCase() === EVENT_SIGNATURES.TRANSFER
    )

    if (transferLogs.length === 0) {
      return {
        isValid: false,
        error: 'No se encontraron eventos Transfer en esta transacción',
      }
    }

    console.log(`🔍 Encontrados ${transferLogs.length} eventos Transfer`)

    // Verificar cada Transfer para encontrar uno que cumpla con el monto mínimo
    for (const log of transferLogs) {
      try {
        // El value está en log.data como uint256 (32 bytes en hex)
        const valueHex = log.data.startsWith('0x') ? log.data : `0x${log.data}`
        const valueBigInt = BigInt(valueHex)

        // Convertir de wei/smallest unit a unidades normales
        const divisor = BigInt(10 ** config.decimals)
        const amount = Number(valueBigInt / divisor)

        console.log(`  📊 Transfer de ${amount} tokens desde ${log.address}`)

        if (amount >= config.minAmount) {
          return {
            isValid: true,
            details: {
              amount: amount.toString(),
              tokenAddress: log.address,
              eventFound: true,
              minAmountRequired: config.minAmount,
            },
          }
        }
      } catch (error) {
        console.error('Error procesando log Transfer:', error)
        continue
      }
    }

    return {
      isValid: false,
      error: `No se encontró ninguna transferencia con al menos ${config.minAmount} tokens. Se requiere un mínimo de ${config.minAmount}.`,
    }
  } catch (error) {
    console.error('Error validating USDC transfer:', error)
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

/**
 * Valida si una transacción contiene un evento Cashback de ether.fi
 *
 * @param transactionHashOrUrl - Hash o URL de la transacción
 * @param config - Configuración de validación
 * @returns Resultado de la validación
 */
export async function validateCashbackEvent(
  transactionHashOrUrl: string,
  config: {
    requirePaid: boolean // Si true, verifica que el campo "paid" sea true
  }
): Promise<OnChainValidationResult> {
  try {
    const { receipt, error } = await getTransactionReceipt(transactionHashOrUrl)

    if (error || !receipt) {
      return {
        isValid: false,
        error: error || 'No se pudo obtener el receipt',
      }
    }

    // Buscar eventos Cashback en todos los logs
    const cashbackLogs = receipt.logs.filter(
      (log) => log.topics[0]?.toLowerCase() === EVENT_SIGNATURES.CASHBACK
    )

    if (cashbackLogs.length === 0) {
      return {
        isValid: false,
        error: 'No se encontró ningún evento Cashback en esta transacción',
      }
    }

    console.log(`🔍 Encontrados ${cashbackLogs.length} eventos Cashback`)

    // Verificar cada evento Cashback
    for (const log of cashbackLogs) {
      try {
        // El campo "paid" es el topic[3] (indexed bool)
        // En Solidity, los boolean indexed son 0x0...0 (false) o 0x0...1 (true)
        if (config.requirePaid) {
          const paidTopic = log.topics[3]
          if (!paidTopic) {
            console.log('  ⚠️ Evento Cashback sin campo "paid"')
            continue
          }

          // Verificar si el último byte es 0x01 (true)
          const paidValue = BigInt(paidTopic)
          const isPaid = paidValue === BigInt(1)

          console.log(`  📊 Cashback desde ${log.address}, paid: ${isPaid}`)

          if (isPaid) {
            return {
              isValid: true,
              details: {
                eventFound: true,
                paid: true,
                contractAddress: log.address,
              },
            }
          }
        } else {
          // Si no requiere verificar "paid", cualquier evento Cashback es válido
          return {
            isValid: true,
            details: {
              eventFound: true,
              contractAddress: log.address,
            },
          }
        }
      } catch (error) {
        console.error('Error procesando log Cashback:', error)
        continue
      }
    }

    if (config.requirePaid) {
      return {
        isValid: false,
        error: 'Se encontró evento Cashback pero el campo "paid" no es true',
      }
    } else {
      return {
        isValid: false,
        error: 'No se pudo validar el evento Cashback',
      }
    }
  } catch (error) {
    console.error('Error validating Cashback event:', error)
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

/**
 * Valida si una transacción contiene una transferencia de tokens específicos
 * (ej: weETH, weETHs)
 *
 * @param transactionHashOrUrl - Hash o URL de la transacción
 * @param config - Configuración de validación
 * @returns Resultado de la validación
 */
export async function validateTokenTransfer(
  transactionHashOrUrl: string,
  config: {
    tokenAddresses: string[] // Direcciones de contratos válidos (ej: weETH, weETHs)
    minAmount?: number // Cantidad mínima (default: 0, cualquier cantidad)
  }
): Promise<OnChainValidationResult> {
  try {
    const { receipt, error } = await getTransactionReceipt(transactionHashOrUrl)

    if (error || !receipt) {
      return {
        isValid: false,
        error: error || 'No se pudo obtener el receipt',
      }
    }

    // Normalizar direcciones a lowercase para comparación
    const normalizedAddresses = config.tokenAddresses.map((addr) => addr.toLowerCase())
    const minAmount = config.minAmount || 0

    // Buscar eventos Transfer de los contratos especificados
    const tokenTransferLogs = receipt.logs.filter((log) => {
      return (
        log.topics[0]?.toLowerCase() === EVENT_SIGNATURES.TRANSFER &&
        normalizedAddresses.includes(log.address.toLowerCase())
      )
    })

    if (tokenTransferLogs.length === 0) {
      return {
        isValid: false,
        error: `No se encontró ninguna transferencia de los tokens especificados: ${config.tokenAddresses.join(', ')}`,
      }
    }

    console.log(`🔍 Encontrados ${tokenTransferLogs.length} eventos Transfer de tokens especificados`)

    // Verificar cada Transfer
    for (const log of tokenTransferLogs) {
      try {
        const valueHex = log.data.startsWith('0x') ? log.data : `0x${log.data}`
        const valueBigInt = BigInt(valueHex)

        console.log(`  📊 Transfer del token ${log.address}, value: ${valueBigInt.toString()}`)

        // Si hay monto mínimo, verificarlo (asumiendo 18 decimales para weETH)
        if (minAmount > 0) {
          const divisor = BigInt(10 ** 18) // weETH usa 18 decimales
          const amount = Number(valueBigInt / divisor)

          if (amount >= minAmount) {
            return {
              isValid: true,
              details: {
                amount: amount.toString(),
                tokenAddress: log.address,
                eventFound: true,
              },
            }
          }
        } else {
          // Si no hay monto mínimo, cualquier transferencia > 0 es válida
          if (valueBigInt > BigInt(0)) {
            return {
              isValid: true,
              details: {
                amount: valueBigInt.toString(),
                tokenAddress: log.address,
                eventFound: true,
              },
            }
          }
        }
      } catch (error) {
        console.error('Error procesando log Transfer:', error)
        continue
      }
    }

    return {
      isValid: false,
      error: `Se encontraron transferencias de los tokens especificados, pero ninguna cumple con el monto mínimo de ${minAmount}`,
    }
  } catch (error) {
    console.error('Error validating token transfer:', error)
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}
