import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/activities?eventId=xxx
 * Obtiene todas las actividades de un evento específico
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId es requerido' },
        { status: 400 }
      )
    }

    const activities = await prisma.activity.findMany({
      where: { eventId },
      include: {
        sponsor: true,
        nfcTags: true,
        activities: true, // PassportActivities
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ activities }, { status: 200 })
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { error: 'Error al obtener actividades' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/activities
 * Crea una nueva actividad para un evento
 * Body: {
 *   eventId: string,
 *   sponsorId: string,
 *   name: string,
 *   description: string,
 *   numOfTokens: number
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventId, sponsorId, name, description, numOfTokens } = body

    // Validación de campos requeridos
    if (!eventId || !sponsorId || !name || !description) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    // Validación del número de tokens
    if (numOfTokens !== undefined && numOfTokens < 0) {
      return NextResponse.json(
        { error: 'El número de tokens debe ser positivo' },
        { status: 400 }
      )
    }

    // Verificar que el evento y sponsor existen
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    })

    const sponsor = await prisma.sponsor.findUnique({
      where: { id: sponsorId },
    })

    if (!event || !sponsor) {
      return NextResponse.json(
        { error: 'Evento o sponsor no encontrado' },
        { status: 404 }
      )
    }

    const activity = await prisma.activity.create({
      data: {
        eventId,
        sponsorId,
        name,
        description,
        numOfTokens: numOfTokens || 0,
      },
      include: {
        sponsor: true,
      },
    })

    return NextResponse.json({ activity }, { status: 201 })
  } catch (error) {
    console.error('Error creating activity:', error)
    return NextResponse.json(
      { error: 'Error al crear actividad' },
      { status: 500 }
    )
  }
}
