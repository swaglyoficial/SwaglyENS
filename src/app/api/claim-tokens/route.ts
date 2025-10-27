import { NextRequest, NextResponse } from 'next/server'
import { createThirdwebClient, getContract, prepareContractCall, sendTransaction } from 'thirdweb'
import { privateKeyToAccount } from 'thirdweb/wallets'
import { defineChain } from 'thirdweb/chains'
import {
  SWAG_TOKEN_ADDRESS,
  SCROLL_MAINNET_CHAIN_ID,
  THIRDWEB_SECRET_KEY,
  CREATOR_WALLET_ADDRESS,
  CREATOR_WALLET_PRIVATE_KEY,
  DEFAULT_CLAIM_CONFIG,
  TOKEN_DECIMALS,
  ClaimParams,
} from '@/lib/thirdweb-config'

/**
 * POST /api/claim-tokens
 *
 * Endpoint para reclamar tokens usando el SDK de Thirdweb
 *
 * Este endpoint maneja el claim de tokens desde el BACKEND, lo que significa:
 * - El usuario NO necesita firmar ninguna transacción
 * - El backend firma la transacción con la private key del creator
 * - La transacción se ejecuta en la blockchain
 *
 * Flujo:
 * 1. Recibe los datos del usuario (wallet address, cantidad de tokens, actividad)
 * 2. Prepara los parámetros para la función `claim` del contrato
 * 3. Crea una wallet desde la private key del creator
 * 4. Firma y envía la transacción a la blockchain
 * 5. Devuelve el resultado de la transacción
 *
 * Body:
 * {
 *   "receiverAddress": "0x...",  // Wallet del usuario que recibirá los tokens
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

    // Validar que los datos requeridos estén presentes
    if (!receiverAddress || !quantity) {
      return NextResponse.json(
        {
          error: 'receiverAddress y quantity son requeridos',
          details: 'Debes proporcionar la dirección del receptor y la cantidad de tokens',
        },
        { status: 400 }
      )
    }

    // Validar formato de dirección (debe comenzar con 0x y tener 42 caracteres)
    if (!receiverAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        {
          error: 'receiverAddress inválida',
          details: 'La dirección debe ser una dirección Ethereum válida',
        },
        { status: 400 }
      )
    }

    // Validar que quantity sea un número positivo
    if (quantity <= 0) {
      return NextResponse.json(
        {
          error: 'quantity inválida',
          details: 'La cantidad debe ser mayor a 0',
        },
        { status: 400 }
      )
    }

    // Validar que la private key esté configurada
    if (!CREATOR_WALLET_PRIVATE_KEY || CREATOR_WALLET_PRIVATE_KEY === '') {
      console.error('❌ CREATOR_WALLET_PRIVATE_KEY no está configurada en .env')
      return NextResponse.json(
        {
          error: 'Configuración del servidor incorrecta',
          details: 'La private key del creador no está configurada. Contacta al administrador.',
        },
        { status: 500 }
      )
    }

    console.log('====================================')
    console.log('🎫 INICIANDO CLAIM DE TOKENS')
    console.log('====================================')
    console.log('📍 Contrato:', SWAG_TOKEN_ADDRESS)
    console.log('🌐 Chain ID:', SCROLL_MAINNET_CHAIN_ID)
    console.log('👤 Receptor:', receiverAddress)
    console.log('💰 Cantidad:', quantity)
    console.log('🎯 Actividad:', activityName || 'No especificada')
    console.log('💼 Wallet Creator (firmante):', CREATOR_WALLET_ADDRESS)
    console.log('====================================')

    // ========================================
    // PASO 2: Crear cliente y contrato de Thirdweb
    // ========================================
    // Crear el cliente de Thirdweb con la secret key
    const client = createThirdwebClient({
      secretKey: THIRDWEB_SECRET_KEY,
    })

    // Definir la chain (Scroll Mainnet)
    const chain = defineChain(SCROLL_MAINNET_CHAIN_ID)

    // Obtener el contrato
    const contract = getContract({
      client,
      chain,
      address: SWAG_TOKEN_ADDRESS,
    })

    console.log('✅ Cliente y contrato creados')

    // ========================================
    // PASO 3: Crear wallet desde private key
    // ========================================
    // Crear una cuenta desde la private key del creator
    // Esta wallet debe tener permisos MINTER en el contrato
    const account = privateKeyToAccount({
      client,
      privateKey: CREATOR_WALLET_PRIVATE_KEY,
    })

    console.log('✅ Wallet creada desde private key:', account.address)

    // Verificar que la address coincida con la configurada
    if (account.address.toLowerCase() !== CREATOR_WALLET_ADDRESS.toLowerCase()) {
      console.warn('⚠️  ADVERTENCIA: La address de la private key no coincide con CREATOR_WALLET_ADDRESS')
      console.warn('   Private key address:', account.address)
      console.warn('   Configurada:', CREATOR_WALLET_ADDRESS)
    }

    // ========================================
    // PASO 4: Preparar los parámetros para la función claim
    // ========================================
    /**
     * La función claim del contrato ERC-1155 requiere:
     *
     * function claim(
     *   address _receiver,              // Dirección que recibe los tokens
     *   uint256 _quantity,              // Cantidad de tokens
     *   address _currency,              // Moneda para pagar (0x0 = gratis)
     *   uint256 _pricePerToken,         // Precio por token (0 = gratis)
     *   AllowlistProof _allowlistProof, // Proof de whitelist (como array)
     *   bytes _data                     // Datos adicionales (vacío)
     * )
     *
     * IMPORTANTE: AllowlistProof es un struct que se pasa como ARRAY:
     * [
     *   [],    // bytes32[] proof
     *   0,     // uint256 quantityLimitPerWallet
     *   0,     // uint256 pricePerToken
     *   '0x0'  // address currency
     * ]
     */

    console.log('📦 Preparando transacción...')

    // ========================================
    // IMPORTANTE: Ajustar cantidad por decimales
    // ========================================
    /**
     * Los tokens ERC-1155/ERC-20 normalmente tienen decimales (como ETH tiene 18 decimales)
     * Si el token tiene 18 decimales:
     * - 10 tokens = 10 * 10^18 = 10000000000000000000 wei
     *
     * Ejemplo:
     * - quantity = 10 (tokens que el usuario quiere)
     * - TOKEN_DECIMALS = 18
     * - quantityInWei = 10 * (10^18) = 10000000000000000000
     */
    const quantityInWei = BigInt(quantity) * BigInt(10 ** TOKEN_DECIMALS)

    console.log('💰 Cantidad solicitada:', quantity, 'tokens')
    console.log('💰 Cantidad en wei (con decimales):', quantityInWei.toString())
    console.log('📊 Decimales del token:', TOKEN_DECIMALS)


    const [
      proof,
      quantityLimitPerWalletRaw,
      pricePerTokenRaw,
      currency,
    ] = DEFAULT_CLAIM_CONFIG.allowlistProof as [
      readonly `0x${string}`[],
      number | bigint,
      number | bigint,
      string,
    ]

    const quantityLimitPerWalletBigInt =
      typeof quantityLimitPerWalletRaw === 'bigint'
        ? quantityLimitPerWalletRaw
        : BigInt(quantityLimitPerWalletRaw)

    const pricePerTokenBigInt =
      typeof pricePerTokenRaw === 'bigint' ? pricePerTokenRaw : BigInt(pricePerTokenRaw)

    const allowlistProof = {
      proof,
      quantityLimitPerWallet: quantityLimitPerWalletBigInt,
      pricePerToken: pricePerTokenBigInt,
      currency,
    }

    // Preparar la llamada al contrato
    const transaction = prepareContractCall({
      contract,
      method:
        'function claim(address _receiver, uint256 _quantity, address _currency, uint256 _pricePerToken, (bytes32[] proof, uint256 quantityLimitPerWallet, uint256 pricePerToken, address currency) _allowlistProof, bytes _data) payable',
      params: [
        receiverAddress,                     // _receiver: quien recibe los tokens
        quantityInWei,                       // _quantity: cantidad en wei (con decimales)
        DEFAULT_CLAIM_CONFIG.currency,       // _currency: moneda (nativa o gratis)
        BigInt(DEFAULT_CLAIM_CONFIG.pricePerToken), // _pricePerToken: 0 = gratis
        allowlistProof, // _allowlistProof: struct sin restricciones
        DEFAULT_CLAIM_CONFIG.data as `0x${string}`,           // _data: sin datos adicionales
      ],
    })

    console.log('✅ Transacción preparada')

    // ========================================
    // PASO 5: Enviar la transacción a la blockchain
    // ========================================
    console.log('📤 Enviando transacción a la blockchain...')
    console.log('⏳ Esperando confirmación...')

    // Enviar la transacción firmada con la cuenta del creator
    const result = await sendTransaction({
      transaction,
      account,
    })

    console.log('✅ Transacción enviada exitosamente')
    console.log('🔗 Transaction Hash:', result.transactionHash)

    // ========================================
    // PASO 6: Transacción exitosa
    // ========================================
    console.log('====================================')
    console.log('✅ TOKENS ENVIADOS EXITOSAMENTE')
    console.log('====================================')
    console.log('🎫 Cantidad:', quantity)
    console.log('👤 Receptor:', receiverAddress)
    console.log('🔗 Transaction Hash:', result.transactionHash)
    console.log('🎯 Actividad:', activityName || 'No especificada')
    console.log('====================================')

    // Respuesta exitosa al frontend
    return NextResponse.json({
      success: true,
      message: `${quantity} tokens enviados exitosamente a ${receiverAddress}`,
      data: {
        receiverAddress,
        quantity,
        activityName,
        transactionHash: result.transactionHash,
        chainId: SCROLL_MAINNET_CHAIN_ID,
        contractAddress: SWAG_TOKEN_ADDRESS,
      },
    })
  } catch (error) {
    // ========================================
    // MANEJO DE ERRORES GENERALES
    // ========================================
    console.error('❌ ERROR AL RECLAMAR TOKENS:', error)

    // Errores específicos comunes
    let errorMessage = 'Error interno del servidor'
    let errorDetails = error instanceof Error ? error.message : 'Error desconocido'

    // Errores de permisos
    if (errorDetails.includes('AccessControl') || errorDetails.includes('not authorized')) {
      errorMessage = 'Error de permisos'
      errorDetails = 'La wallet del creador no tiene permisos MINTER en el contrato. Verifica que tenga el rol correcto.'
    }

    // Error de fondos insuficientes
    if (errorDetails.includes('insufficient funds') || errorDetails.includes('out of gas')) {
      errorMessage = 'Fondos insuficientes'
      errorDetails = 'La wallet del creador no tiene suficiente ETH en Scroll Mainnet para pagar el gas. Agrega fondos.'
    }

    // Error de conexión a la blockchain
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
 * Endpoint de información (opcional)
 * Devuelve la configuración actual del claim
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
        receiverAddress: 'string (required) - Wallet que recibirá los tokens',
        quantity: 'number (required) - Cantidad de tokens a enviar',
        activityName: 'string (optional) - Nombre de la actividad para logs',
      },
    },
    notes: [
      'La wallet del creador debe tener permisos MINTER en el contrato',
      'La wallet del creador debe tener ETH en Scroll Mainnet para pagar gas',
      'El usuario NO necesita firmar la transacción ni pagar gas',
      'Los tokens son enviados automáticamente desde el backend',
    ],
  })
}
