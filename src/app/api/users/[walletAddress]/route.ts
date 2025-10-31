import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/users/[walletAddress]
 * Obtiene un usuario específico por su wallet address
 * Incluye todos sus pasaportes y eventos asociados
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ walletAddress: string }> }
) {
  try {
    const { walletAddress } = await context.params

    // Buscar usuario por wallet address
    const user = await prisma.user.findUnique({
      where: { walletAddress },
      include: {
        passports: {
          include: {
            event: true,
            activities: {
              include: {
                activity: {
                  include: {
                    sponsor: true,
                  },
                },
                proof: true, // Incluir datos de prueba/evidencia si existen
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

/**
 * PATCH /api/users/[walletAddress]
 * Actualiza el nickname de un usuario
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ walletAddress: string }> }
) {
  try {
    const { walletAddress } = await context.params
    const body = await request.json()
    const { nickname } = body

    // Validar que se envió el nickname
    if (!nickname || !nickname.trim()) {
      return NextResponse.json(
        { error: 'El apodo es requerido' },
        { status: 400 }
      )
    }

    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { walletAddress },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si el nickname ya está en uso por otro usuario
    const nicknameExists = await prisma.user.findFirst({
      where: {
        nickname: nickname.trim(),
        walletAddress: {
          not: walletAddress, // Excluir al usuario actual
        },
      },
    })

    if (nicknameExists) {
      return NextResponse.json(
        { error: 'Este apodo ya está en uso por otro usuario' },
        { status: 409 }
      )
    }

    // Actualizar el usuario
    const updatedUser = await prisma.user.update({
      where: { walletAddress },
      data: { nickname: nickname.trim() },
      include: {
        passports: {
          include: {
            event: true,
            activities: {
              include: {
                activity: {
                  include: {
                    sponsor: true,
                  },
                },
                proof: true, // Incluir datos de prueba/evidencia si existen
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    return NextResponse.json({ user: updatedUser }, { status: 200 })
  } catch (error) {
    console.error('Error updating user nickname:', error)
    return NextResponse.json(
      { error: 'Error al actualizar el apodo' },
      { status: 500 }
    )
  }
}

