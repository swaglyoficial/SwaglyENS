import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/nfcs?eventId=xxx
 * Obtiene todos los NFCs de un evento específico con información del estado
 * Incluye información de escaneos para determinar si está disponible o escaneado
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

    const nfcs = await prisma.nFC.findMany({
      where: { eventId },
      include: {
        event: true,
        sponsor: true,
        activity: true,
        scans: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ nfcs }, { status: 200 })
  } catch (error) {
    console.error('Error fetching NFCs:', error)
    return NextResponse.json(
      { error: 'Error al obtener NFCs' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/nfcs
 * Registra un nuevo chip NFC en el sistema
 * Body: {
 *   uuid: string (identificador único del chip),
 *   eventId: string,
 *   sponsorId: string,
 *   activityId: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { uuid, eventId, sponsorId, activityId } = body

    // DEBUG: Ver qué datos llegan
    console.log('📦 Datos recibidos:', { uuid, eventId, sponsorId, activityId })

    // Validación de campos requeridos
    if (!uuid || !eventId || !sponsorId || !activityId) {
      console.log('❌ Faltan campos:', { uuid, eventId, sponsorId, activityId })
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el UUID no esté duplicado
    const existingNFC = await prisma.nFC.findUnique({
      where: { uuid },
    })

    if (existingNFC) {
      return NextResponse.json(
        { error: 'Este UUID de NFC ya está registrado en el sistema' },
        { status: 409 }
      )
    }

    // Verificar que existan las entidades relacionadas
    const [event, sponsor, activity] = await Promise.all([
      prisma.event.findUnique({ where: { id: eventId } }),
      prisma.sponsor.findUnique({ where: { id: sponsorId } }),
      prisma.activity.findUnique({ where: { id: activityId } }),
    ])

    console.log('🔍 Resultados de búsqueda:', {
      event: event ? '✅ Encontrado' : '❌ No encontrado',
      sponsor: sponsor ? '✅ Encontrado' : '❌ No encontrado',
      activity: activity ? '✅ Encontrado' : '❌ No encontrado',
    })

    if (!event || !sponsor || !activity) {
      return NextResponse.json(
        { error: 'Evento, sponsor o actividad no encontrado' },
        { status: 404 }
      )
    }

    const nfc = await prisma.nFC.create({
      data: {
        uuid,
        eventId,
        sponsorId,
        activityId,
        status: 'available', // Estado inicial: disponible
      },
      include: {
        event: true,
        sponsor: true,
        activity: true,
      },
    })

    return NextResponse.json({ nfc }, { status: 201 })
  } catch (error) {
    console.error('Error creating NFC:', error)
    return NextResponse.json(
      { error: 'Error al crear NFC' },
      { status: 500 }
    )
  }
}
