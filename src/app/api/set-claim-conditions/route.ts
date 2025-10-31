import { NextRequest, NextResponse } from 'next/server'
import {
  SWAGLY_CONTRACT_ADDRESS,
  SCROLL_SEPOLIA_CHAIN_ID,
  THIRDWEB_SECRET_KEY,
  THIRDWEB_API_URL,
  CREATOR_WALLET_ADDRESS,
  SetClaimConditionsParams,
  DEFAULT_CLAIM_CONDITION,
} from '@/lib/thirdweb-config'

export const runtime = 'edge'

/**
 * ============================================
 * POST /api/set-claim-conditions
 * ============================================
 *
 * Endpoint para configurar las condiciones de claim de tokens
 *
 * Este endpoint permite al administrador del contrato establecer:
 * - Precio de los tokens (gratis o con costo)
 * - Límites por wallet (cuántos tokens puede reclamar cada usuario)
 * - Fechas de inicio/fin del claim
 * - Whitelists (solo ciertas wallets pueden reclamar)
 * - Supply máximo
 *
 * IMPORTANTE:
 * - Solo el owner/admin del contrato puede llamar esta función
 * - La wallet que firma (CREATOR_WALLET_ADDRESS) debe tener permisos en el contrato
 *
 * Body:
 * {
 *   "conditions": [
 *     {
 *       "startTimestamp": 0,                    // Timestamp de inicio (0 = inmediato)
 *       "maxClaimableSupply": "1000000000000",  // Supply máximo (en string)
 *       "supplyClaimed": "0",                   // Supply ya reclamado
 *       "quantityLimitPerWallet": "0",          // Límite por wallet (0 = sin límite)
 *       "merkleRoot": "0x00...",                // Merkle root para whitelist
 *       "pricePerToken": "0",                   // Precio en wei (0 = gratis)
 *       "currency": "0x00...",                  // Dirección del token (0x0 = nativo)
 *       "metadata": ""                          // Metadata adicional
 *     }
 *   ],
 *   "resetClaimEligibility": false  // Si true, resetea quién puede reclamar
 * }
 *
 * EJEMPLOS DE USO:
 *
 * 1. Hacer que los tokens sean gratis (sin costo):
 * {
 *   "conditions": [{
 *     ...DEFAULT_CLAIM_CONDITION,
 *     "pricePerToken": "0"
 *   }],
 *   "resetClaimEligibility": false
 * }
 *
 * 2. Establecer precio de 0.001 ETH por token:
 * {
 *   "conditions": [{
 *     ...DEFAULT_CLAIM_CONDITION,
 *     "pricePerToken": "1000000000000000"  // 0.001 ETH en wei
 *   }],
 *   "resetClaimEligibility": false
 * }
 *
 * 3. Limitar a 10 tokens por wallet:
 * {
 *   "conditions": [{
 *     ...DEFAULT_CLAIM_CONDITION,
 *     "quantityLimitPerWallet": "10"
 *   }],
 *   "resetClaimEligibility": false
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // ========================================
    // PASO 1: Validar y extraer datos del body
    // ========================================
    const body: SetClaimConditionsParams = await request.json()
    const { conditions, resetClaimEligibility } = body

    // Validar que se proporcionen condiciones
    if (!conditions || !Array.isArray(conditions) || conditions.length === 0) {
      return NextResponse.json(
        {
          error: 'conditions es requerido y debe ser un array no vacío',
          details: 'Debes proporcionar al menos una condición de claim',
        },
        { status: 400 }
      )
    }

    // Validar formato de cada condición
    for (const condition of conditions) {
      // Validar que todos los campos requeridos estén presentes
      const requiredFields = [
        'startTimestamp',
        'maxClaimableSupply',
        'supplyClaimed',
        'quantityLimitPerWallet',
        'merkleRoot',
        'pricePerToken',
        'currency',
        'metadata',
      ]

      for (const field of requiredFields) {
        if (!(field in condition)) {
          return NextResponse.json(
            {
              error: `Campo requerido faltante: ${field}`,
              details: `Cada condición debe incluir: ${requiredFields.join(', ')}`,
            },
            { status: 400 }
          )
        }
      }

      // Validar formato de la dirección de moneda
      if (!condition.currency.match(/^0x[a-fA-F0-9]{40}$/)) {
        return NextResponse.json(
          {
            error: 'currency inválida',
            details: 'La dirección de la moneda debe ser una dirección Ethereum válida',
          },
          { status: 400 }
        )
      }
    }

    console.log('====================================')
    console.log('⚙️  CONFIGURANDO CLAIM CONDITIONS')
    console.log('====================================')
    console.log('📍 Contrato:', SWAGLY_CONTRACT_ADDRESS)
    console.log('🌐 Chain ID:', SCROLL_SEPOLIA_CHAIN_ID)
    console.log('📋 Cantidad de condiciones:', conditions.length)
    console.log('🔄 Reset eligibility:', resetClaimEligibility)
    console.log('💼 Wallet Admin (con permisos):', CREATOR_WALLET_ADDRESS)
    console.log('====================================')
    console.log('Condiciones:')
    conditions.forEach((condition, index) => {
      console.log(`\nCondición ${index + 1}:`)
      console.log('  - Inicio:', condition.startTimestamp === 0 ? 'Inmediato' : new Date(condition.startTimestamp * 1000).toISOString())
      console.log('  - Supply máximo:', condition.maxClaimableSupply)
      console.log('  - Límite por wallet:', condition.quantityLimitPerWallet === '0' ? 'Sin límite' : condition.quantityLimitPerWallet)
      console.log('  - Precio por token:', condition.pricePerToken === '0' ? 'Gratis' : `${condition.pricePerToken} wei`)
      console.log('  - Moneda:', condition.currency === '0x0000000000000000000000000000000000000000' ? 'Nativa/ETH' : condition.currency)
    })
    console.log('====================================')

    // ========================================
    // PASO 2: Preparar los parámetros para setClaimConditions
    // ========================================
    /**
     * La función setClaimConditions del contrato ERC-1155 requiere:
     *
     * function setClaimConditions(
     *   ClaimCondition[] _conditions,    // Array de condiciones
     *   bool _resetClaimEligibility      // Si resetear elegibilidad
     * )
     *
     * Donde ClaimCondition es un struct:
     * struct ClaimCondition {
     *   uint256 startTimestamp;
     *   uint256 maxClaimableSupply;
     *   uint256 supplyClaimed;
     *   uint256 quantityLimitPerWallet;
     *   bytes32 merkleRoot;
     *   uint256 pricePerToken;
     *   address currency;
     *   string metadata;
     * }
     */

    // ========================================
    // PASO 3: Llamar a la API de Thirdweb
    // ========================================
    /**
     * La API de Thirdweb ejecuta la transacción desde el backend
     * usando la secret key para autenticar
     */
    const response = await fetch(THIRDWEB_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Secret key para autenticar (NUNCA exponer en el frontend)
        'x-secret-key': THIRDWEB_SECRET_KEY,
      },
      body: JSON.stringify({
        // Array de llamadas a funciones del contrato
        calls: [
          {
            // Dirección del contrato a llamar
            contractAddress: SWAGLY_CONTRACT_ADDRESS,

            // Firma de la función a llamar (con tipos de parámetros)
            method:
              'function setClaimConditions((uint256 startTimestamp, uint256 maxClaimableSupply, uint256 supplyClaimed, uint256 quantityLimitPerWallet, bytes32 merkleRoot, uint256 pricePerToken, address currency, string metadata)[] _conditions, bool _resetClaimEligibility)',

            // Parámetros de la función
            params: [conditions, resetClaimEligibility],
          },
        ],

        // ID de la blockchain (Scroll Sepolia)
        chainId: SCROLL_SEPOLIA_CHAIN_ID,

        // Wallet que firma la transacción (debe ser owner/admin del contrato)
        from: CREATOR_WALLET_ADDRESS,
      }),
    })

    // ========================================
    // PASO 4: Procesar la respuesta de Thirdweb
    // ========================================
    const data = await response.json()

    // Si la API de Thirdweb devuelve un error
    if (!response.ok) {
      console.error('❌ ERROR EN API DE THIRDWEB:', data)
      return NextResponse.json(
        {
          error: 'Error al configurar claim conditions en blockchain',
          details: data.error || data.message || 'Error desconocido',
          thirdwebResponse: data,
        },
        { status: response.status }
      )
    }

    // ========================================
    // PASO 5: Configuración exitosa
    // ========================================
    console.log('====================================')
    console.log('✅ CLAIM CONDITIONS CONFIGURADAS EXITOSAMENTE')
    console.log('====================================')
    console.log('🔗 Transaction Hash:', data.transactionHash || data.result?.transactionHash || 'N/A')
    console.log('====================================')

    // Respuesta exitosa al frontend
    return NextResponse.json({
      success: true,
      message: 'Claim conditions configuradas exitosamente',
      data: {
        conditionsCount: conditions.length,
        resetClaimEligibility,
        transactionHash: data.transactionHash || data.result?.transactionHash,
        chainId: SCROLL_SEPOLIA_CHAIN_ID,
        contractAddress: SWAGLY_CONTRACT_ADDRESS,
      },
      thirdwebResponse: data, // Respuesta completa de Thirdweb para debugging
    })
  } catch (error) {
    // ========================================
    // MANEJO DE ERRORES GENERALES
    // ========================================
    console.error('❌ ERROR AL CONFIGURAR CLAIM CONDITIONS:', error)

    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    )
  }
}

/**
 * ============================================
 * GET /api/set-claim-conditions
 * ============================================
 *
 * Endpoint de información (opcional)
 * Devuelve información sobre cómo usar este endpoint y ejemplos
 */
export async function GET() {
  return NextResponse.json({
    message: 'Endpoint para configurar las condiciones de claim de tokens',
    contractAddress: SWAGLY_CONTRACT_ADDRESS,
    chainId: SCROLL_SEPOLIA_CHAIN_ID,
    defaultCondition: DEFAULT_CLAIM_CONDITION,
    usage: {
      method: 'POST',
      body: {
        conditions: 'array (required) - Array de ClaimCondition objects',
        resetClaimEligibility: 'boolean (required) - Si resetear elegibilidad de claim',
      },
    },
    examples: {
      makeTokensFree: {
        description: 'Hacer que los tokens sean completamente gratis',
        body: {
          conditions: [
            {
              ...DEFAULT_CLAIM_CONDITION,
              pricePerToken: '0',
            },
          ],
          resetClaimEligibility: false,
        },
      },
      setPrice: {
        description: 'Establecer precio de 0.001 ETH por token',
        body: {
          conditions: [
            {
              ...DEFAULT_CLAIM_CONDITION,
              pricePerToken: '1000000000000000', // 0.001 ETH en wei
            },
          ],
          resetClaimEligibility: false,
        },
      },
      limitPerWallet: {
        description: 'Limitar a 10 tokens por wallet',
        body: {
          conditions: [
            {
              ...DEFAULT_CLAIM_CONDITION,
              quantityLimitPerWallet: '10',
            },
          ],
          resetClaimEligibility: false,
        },
      },
      scheduledClaim: {
        description: 'Claim que comienza en una fecha específica',
        body: {
          conditions: [
            {
              ...DEFAULT_CLAIM_CONDITION,
              startTimestamp: Math.floor(new Date('2025-01-01').getTime() / 1000),
            },
          ],
          resetClaimEligibility: false,
        },
      },
    },
  })
}
