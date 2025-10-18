import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/shop/purchase
 * Procesa la compra de un producto en la tienda
 * Transfiere tokens SWAG del usuario al creador usando Thirdweb
 */

// Productos disponibles
const PRODUCTS = {
  sudadera: {
    id: 'sudadera',
    name: 'Sudadera Exclusiva SWAG',
    price: 150, // tokens SWAG
  },
  cobija: {
    id: 'cobija',
    name: 'Cobija Premium SWAG',
    price: 200, // tokens SWAG
  },
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, fromAddress } = body

    // Validar parámetros
    if (!productId || !fromAddress) {
      console.error('❌ [SHOP] Parámetros faltantes:', { productId, fromAddress })
      return NextResponse.json(
        { error: 'Se requiere productId y fromAddress' },
        { status: 400 }
      )
    }

    // Validar que el producto existe
    const product = PRODUCTS[productId as keyof typeof PRODUCTS]
    if (!product) {
      console.error('❌ [SHOP] Producto no encontrado:', productId)
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    // Obtener variables de entorno
    const secretKey = process.env.THIRDWEB_SECRET_KEY
    const creatorWallet = process.env.CREATOR_WALLET_ADDRESS

    if (!secretKey || !creatorWallet) {
      console.error('❌ [SHOP] Variables de entorno faltantes')
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      )
    }

    // Configuración del contrato y red
    const CONTRACT_ADDRESS = '0x05668BC3Fb05c2894988142a0b730149122192eB'
    const CHAIN_ID = 534351 // Scroll Sepolia

    // Convertir precio a la unidad correcta (asumiendo 18 decimales para el token ERC20)
    const amount = (product.price * 10 ** 18).toString()

    console.log('🛒 [SHOP] Iniciando transacción de compra:')
    console.log('  - Producto:', product.name)
    console.log('  - Precio:', product.price, 'SWAG')
    console.log('  - De (comprador):', fromAddress)
    console.log('  - A (creador):', creatorWallet)
    console.log('  - Cantidad (wei):', amount)
    console.log('  - Contrato:', CONTRACT_ADDRESS)
    console.log('  - Chain ID:', CHAIN_ID)

    // Hacer la llamada a la API de Thirdweb para transferir tokens
    const response = await fetch('https://api.thirdweb.com/v1/contracts/write', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-secret-key': secretKey,
      },
      body: JSON.stringify({
        calls: [
          {
            contractAddress: CONTRACT_ADDRESS,
            method: 'function transfer(address to, uint256 amount) returns (bool)',
            params: [creatorWallet, amount],
          },
        ],
        chainId: CHAIN_ID,
        from: fromAddress,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ [SHOP] Error en la API de Thirdweb:')
      console.error('  - Status:', response.status)
      console.error('  - Respuesta:', JSON.stringify(data, null, 2))

      return NextResponse.json(
        { error: 'Error al procesar la transferencia', details: data },
        { status: response.status }
      )
    }

    console.log('✅ [SHOP] Transacción exitosa:')
    console.log('  - Tx Hash:', data.transactionHash || 'N/A')
    console.log('  - Respuesta:', JSON.stringify(data, null, 2))

    return NextResponse.json({
      success: true,
      product: product.name,
      amount: product.price,
      transaction: data,
      message: `¡Compra exitosa! Has adquirido ${product.name} por ${product.price} SWAG`,
    })
  } catch (error) {
    console.error('❌ [SHOP] Error inesperado en la compra:')
    console.error(error)

    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    )
  }
}
