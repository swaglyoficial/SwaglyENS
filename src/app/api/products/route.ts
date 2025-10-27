import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/products
 * Obtiene todos los productos disponibles en la tienda
 * Query params opcionales:
 *   - availableOnly: 'true' para obtener solo productos disponibles
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const availableOnly = searchParams.get('availableOnly') === 'true'

    const products = await prisma.product.findMany({
      where: availableOnly ? { isAvailable: true } : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ products }, { status: 200 })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Error al obtener productos' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/products
 * Crea un nuevo producto en la tienda
 * Body esperado:
 * {
 *   title: string,
 *   description: string,
 *   price: number (precio en tokens SWAG),
 *   imageUrl?: string,
 *   isAvailable?: boolean
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, price, imageUrl, isAvailable } = body

    // Validación de campos requeridos
    if (!title || !description || price === undefined || price === null) {
      return NextResponse.json(
        { error: 'Título, descripción y precio son requeridos' },
        { status: 400 }
      )
    }

    // Validación de precio
    if (typeof price !== 'number' || price < 0) {
      return NextResponse.json(
        { error: 'El precio debe ser un número positivo' },
        { status: 400 }
      )
    }

    const product = await prisma.product.create({
      data: {
        title,
        description,
        price: Math.floor(price), // Asegurar que sea un entero
        imageUrl: imageUrl || null,
        isAvailable: isAvailable !== undefined ? isAvailable : true,
      },
    })

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Error al crear producto' },
      { status: 500 }
    )
  }
}
