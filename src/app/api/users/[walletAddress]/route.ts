import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/users/[walletAddress]
 * Obtiene un usuario específico por su wallet address
 * Incluye todos sus pasaportes y eventos asociados
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { walletAddress: string } }
) {
  try {
    const { walletAddress } = params

    // Buscar usuario por wallet address
    const user = await prisma.user.findUnique({
      where: { walletAddress },
      include: {
        passports: {
          include: {
            event: true,
            activities: {
              include: {
                activity: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    // Si no existe el usuario, devolver 404
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user }, { status: 200 })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Error al obtener usuario' },
      { status: 500 }
    )
  }
}
