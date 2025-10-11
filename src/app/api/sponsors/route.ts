import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/sponsors?eventId=xxx
 * Obtiene todos los sponsors de un evento específico
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

    const sponsors = await prisma.sponsor.findMany({
      where: { eventId },
      include: {
        activities: true,
        nfcTags: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({ sponsors }, { status: 200 })
  } catch (error) {
    console.error('Error fetching sponsors:', error)
    return NextResponse.json(
      { error: 'Error al obtener sponsors' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/sponsors
 * Crea un nuevo sponsor para un evento
 * Body: { eventId: string, name: string, description: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventId, name, description } = body

    // Validación de campos requeridos
    if (!eventId || !name || !description) {
      return NextResponse.json(
        { error: 'eventId, name y description son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el evento existe
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      )
    }

    const sponsor = await prisma.sponsor.create({
      data: {
        eventId,
        name,
        description,
      },
    })

    return NextResponse.json({ sponsor }, { status: 201 })
  } catch (error) {
    console.error('Error creating sponsor:', error)
    return NextResponse.json(
      { error: 'Error al crear sponsor' },
      { status: 500 }
    )
  }
}
