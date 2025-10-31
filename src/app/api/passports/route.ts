import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/passports
 * Obtiene todos los pasaportes con sus relaciones
 */
export async function GET() {
  try {
    const passports = await prisma.passport.findMany({
      include: {
        user: true,
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
    })

    return NextResponse.json({ passports }, { status: 200 })
  } catch (error) {
    console.error('Error fetching passports:', error)
    return NextResponse.json(
      { error: 'Error al obtener pasaportes' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/passports
 * Crea un nuevo pasaporte digital para un usuario en un evento específico
 * Body esperado:
 * {
 *   userId: string,
 *   eventId: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, eventId } = body

    // Validación de campos requeridos
    if (!userId || !eventId) {
      return NextResponse.json(
        { error: 'userId y eventId son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el evento existe y obtener sus actividades
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        activities: true,
      },
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si ya existe un pasaporte para este usuario en este evento
    const existingPassport = await prisma.passport.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    })

    if (existingPassport) {
      return NextResponse.json(
        { error: 'Ya existe un pasaporte para este evento' },
        { status: 400 }
      )
    }

    // Crear el pasaporte con sus actividades asociadas
    const passport = await prisma.passport.create({
      data: {
        userId,
        eventId,
        progress: 0,
        activities: {
          create: event.activities.map((activity) => ({
            activityId: activity.id,
            status: 'pending',
            requiresProof: activity.requiresProof,
          })),
        },
      },
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
    })

    return NextResponse.json({ passport }, { status: 201 })
  } catch (error) {
    console.error('Error creating passport:', error)
    return NextResponse.json(
      { error: 'Error al crear pasaporte' },
      { status: 500 }
    )
  }
}
