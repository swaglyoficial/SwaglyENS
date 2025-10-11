import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/passports/[userId]
 * Obtiene todos los pasaportes de un usuario específico
 * Incluye evento, actividades y progreso
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params

    // Obtener todos los pasaportes del usuario
    const passports = await prisma.passport.findMany({
      where: { userId },
      include: {
        event: true,
        activities: {
          include: {
            activity: {
              include: {
                sponsor: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ passports }, { status: 200 })
  } catch (error) {
    console.error('Error fetching user passports:', error)
    return NextResponse.json(
      { error: 'Error al obtener pasaportes del usuario' },
      { status: 500 }
    )
  }
}
