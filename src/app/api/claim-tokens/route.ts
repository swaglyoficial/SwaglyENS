import { NextRequest, NextResponse } from 'next/server'
import {
  SWAG_TOKEN_ADDRESS,
  SCROLL_MAINNET_CHAIN_ID,
  THIRDWEB_SECRET_KEY,
  CREATOR_WALLET_ADDRESS,
  DEFAULT_CLAIM_CONFIG,
  TOKEN_DECIMALS,
  ClaimParams,
} from '@/lib/thirdweb-config'
import { claimTokensViaThirdweb, ThirdwebApiError } from '@/lib/thirdweb-server'

export const runtime = 'edge'

/**
 * POST /api/claim-tokens
 *
 * Endpoint para reclamar tokens usando el SDK de Thirdweb
 *
 * Este endpoint maneja el claim de tokens desde el BACKEND, lo que significa:
 * - El usuario NO necesita firmar ninguna transacciÃ³n
 * - El backend firma la transacciÃ³n con la private key del creator
 * - La transacciÃ³n se ejecuta en la blockchain
 *
 * Flujo:
 * 1. Recibe los datos del usuario (wallet address, cantidad de tokens, actividad)
 * 2. Prepara los parÃ¡metros para la funciÃ³n `claim` del contrato
 * 3. Crea una wallet desde la private key del creator
 * 4. Firma y envÃ­a la transacciÃ³n a la blockchain
 * 5. Devuelve el resultado de la transacciÃ³n
 *
 * Body:
 * {
 *   "receiverAddress": "0x...",  // Wallet del usuario que recibirÃ¡ los tokens
 *   "quantity": 10,               // Cantidad de tokens a enviar
 *   "activityName": "Escanear QR" // Nombre de la actividad (opcional)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // ========================================
    // PASO 1: Validar y extraer datos del body
    // ========================================
    const body: ClaimParams = await request.json()
    const { receiverAddress, quantity, activityName } = body

        // Validar configuraci?n de Thirdweb
    if (!THIRDWEB_SECRET_KEY || THIRDWEB_SECRET_KEY.trim() === '') {
      console.error('THIRDWEB_SECRET_KEY is not configured')
      return NextResponse.json(
        {
          error: 'Configuraci?n del servidor incorrecta',
          details: 'La secret key de Thirdweb no est? configurada. Contacta al administrador.',
        },
        { status: 500 }
      )
    }

    if (
      !CREATOR_WALLET_ADDRESS ||
      CREATOR_WALLET_ADDRESS.trim() === '' ||
      CREATOR_WALLET_ADDRESS.includes('<YOUR')
    ) {
      console.error('CREATOR_WALLET_ADDRESS is not configured')
      return NextResponse.json(
        {
          error: 'Configuraci?n del servidor incorrecta',
          details: 'La wallet del creador no est? configurada correctamente. Contacta al administrador.',
        },
        { status: 500 }
      )
    }

    console.log('====================================')
    console.log('ðŸŽ« INICIANDO CLAIM DE TOKENS')
    console.log('====================================')
    console.log('ðŸ“ Contrato:', SWAG_TOKEN_ADDRESS)
    console.log('ðŸŒ Chain ID:', SCROLL_MAINNET_CHAIN_ID)
    console.log('ðŸ‘¤ Receptor:', receiverAddress)
    console.log('ðŸ’° Cantidad:', quantity)
    console.log('ðŸŽ¯ Actividad:', activityName || 'No especificada')
    console.log('ðŸ’¼ Wallet Creator (firmante):', CREATOR_WALLET_ADDRESS)
    console.log('====================================')

    console.log('------------------------------------')
    console.log('Preparing Thirdweb API transaction')
    console.log('------------------------------------')

    const decimalsMultiplier = 10n ** BigInt(TOKEN_DECIMALS)
    const quantityInWei = BigInt(quantity) * decimalsMultiplier

    console.log('Quantity requested:', quantity, 'tokens')
    console.log('Quantity in wei:', quantityInWei.toString())
    console.log('Token decimals:', TOKEN_DECIMALS)

    const claimResult = await claimTokensViaThirdweb({
      receiverAddress: receiverAddress as `0x${string}`,
      quantity,
      quantityInWei,
    })
    const transactionHash = claimResult.transactionHash ?? null

    console.log('Thirdweb API call completed')
    if (transactionHash) {
      console.log('Transaction hash:', transactionHash)
    }

    console.log('------------------------------------')
    console.log('Tokens sent successfully')
    console.log('------------------------------------')
    console.log('Quantity:', quantity)
    console.log('Receiver:', receiverAddress)
    if (transactionHash) {
      console.log('Transaction hash:', transactionHash)
    }
    console.log('Activity:', activityName || 'No especificada')

    // Respuesta exitosa al frontend
    return NextResponse.json({
      success: true,
      message: `${quantity} tokens enviados exitosamente a ${receiverAddress}`,
      data: {
        receiverAddress,
        quantity,
        activityName,
        transactionHash,
        chainId: SCROLL_MAINNET_CHAIN_ID,
        contractAddress: SWAG_TOKEN_ADDRESS,
      },
      thirdwebResponse: claimResult.thirdwebResponse,
    })
  } catch (error) {
    console.error('Error al reclamar tokens:', error)

    if (error instanceof ThirdwebApiError) {
      return NextResponse.json(
        {
          error: 'Error al ejecutar transacci?n en Thirdweb',
          details: error.message,
          thirdwebResponse: error.payload,
        },
        { status: error.status }
      )
    }

    let errorMessage = 'Error interno del servidor'
    let errorDetails = error instanceof Error ? error.message : 'Error desconocido'

    if (errorDetails.includes('AccessControl') || errorDetails.includes('not authorized')) {
      errorMessage = 'Error de permisos'
      errorDetails = 'La wallet del creador no tiene permisos MINTER en el contrato. Verifica que tenga el rol correcto.'
    }

    if (errorDetails.includes('insufficient funds') || errorDetails.includes('out of gas')) {
      errorMessage = 'Fondos insuficientes'
      errorDetails = 'La wallet del creador no tiene suficiente ETH en Scroll Mainnet para pagar el gas. Agrega fondos.'
    }

    if (errorDetails.includes('network') || errorDetails.includes('timeout')) {
      errorMessage = 'Error de red'
      errorDetails = 'No se pudo conectar a la blockchain. Intenta nuevamente en un momento.'
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/claim-tokens
 *
 * Endpoint de informaciÃ³n (opcional)
 * Devuelve la configuraciÃ³n actual del claim
 */
export async function GET() {
  return NextResponse.json({
    message: 'Endpoint para reclamar tokens usando Thirdweb SDK',
    contractAddress: SWAG_TOKEN_ADDRESS,
    chainId: SCROLL_MAINNET_CHAIN_ID,
    claimConfig: DEFAULT_CLAIM_CONFIG,
    creatorWallet: CREATOR_WALLET_ADDRESS,
    usage: {
      method: 'POST',
      body: {
        receiverAddress: 'string (required) - Wallet que recibirÃ¡ los tokens',
        quantity: 'number (required) - Cantidad de tokens a enviar',
        activityName: 'string (optional) - Nombre de la actividad para logs',
      },
    },
    notes: [
      'La wallet del creador debe tener permisos MINTER en el contrato',
      'La wallet del creador debe tener ETH en Scroll Mainnet para pagar gas',
      'El usuario NO necesita firmar la transacciÃ³n ni pagar gas',
      'Los tokens son enviados automÃ¡ticamente desde el backend',
    ],
  })
}


