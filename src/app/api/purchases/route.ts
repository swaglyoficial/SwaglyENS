import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/purchases
 * Registra una compra después de que la transacción on-chain fue exitosa
 * Body esperado:
 * {
 *   productId: string,
 *   walletAddress: string,
 *   txHash: string,
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, walletAddress, txHash } = body

    // Validación de campos requeridos
    if (!productId || !walletAddress) {
      return NextResponse.json(
        { error: 'productId y walletAddress son requeridos' },
        { status: 400 }
      )
    }

    // Obtener el producto para guardar la información al momento de la compra
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    // Crear el registro de compra
    const purchase = await prisma.purchase.create({
      data: {
        productId,
        walletAddress: walletAddress.toLowerCase(),
        productTitle: product.title,
        price: product.price,
        txHash: txHash || null,
        status: 'completed',
      },
    })

    return NextResponse.json({ purchase }, { status: 201 })
  } catch (error) {
    console.error('Error creating purchase:', error)
    return NextResponse.json(
      { error: 'Error al registrar la compra' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/purchases
 * Obtiene compras filtradas por wallet address o todas (admin)
 * Query params opcionales:
 *   - walletAddress: string - Filtrar por dirección de wallet
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('walletAddress')

    const purchases = await prisma.purchase.findMany({
      where: walletAddress ? { walletAddress: walletAddress.toLowerCase() } : undefined,
      include: {
        product: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ purchases }, { status: 200 })
  } catch (error) {
    console.error('Error fetching purchases:', error)
    return NextResponse.json(
      { error: 'Error al obtener compras' },
      { status: 500 }
    )
  }
}
