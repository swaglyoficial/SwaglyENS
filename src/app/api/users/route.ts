import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/users
 * Obtiene todos los usuarios registrados
 * Útil para el panel de administración
 */
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        passports: {
          include: {
            event: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ users }, { status: 200 })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/users
 * Crea o actualiza un usuario con su wallet y nickname
 * Body esperado:
 * {
 *   walletAddress: string,
 *   nickname: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress, nickname } = body

    // Validación de campos requeridos
    if (!walletAddress || !nickname) {
      return NextResponse.json(
        { error: 'Wallet address y nickname son requeridos' },
        { status: 400 }
      )
    }

    // Verificar si el usuario ya existe con esta wallet
    const existingUser = await prisma.user.findUnique({
      where: { walletAddress },
    })

    let user

    if (existingUser) {
      // Actualizar el nickname del usuario existente
      user = await prisma.user.update({
        where: { walletAddress },
        data: { nickname },
      })
    } else {
      // Crear nuevo usuario
      user = await prisma.user.create({
        data: {
          walletAddress,
          nickname,
        },
      })
    }

    return NextResponse.json({ user }, { status: existingUser ? 200 : 201 })
  } catch (error) {
    console.error('Error creating/updating user:', error)
    return NextResponse.json(
      { error: 'Error al crear/actualizar usuario' },
      { status: 500 }
    )
  }
}
