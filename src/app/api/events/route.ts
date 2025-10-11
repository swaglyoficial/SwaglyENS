import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/events
 * Obtiene todos los eventos con sus relaciones (sponsors, actividades, NFCs)
 * Útil para el panel de administración para listar todos los eventos
 */
export async function GET() {
  try {
    const events = await prisma.event.findMany({
      include: {
        sponsors: true,
        activities: true,
        nfcTags: true,
        passports: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ events }, { status: 200 })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Error al obtener eventos' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/events
 * Crea un nuevo evento
 * Body esperado:
 * {
 *   name: string,
 *   description: string,
 *   startDate: string (ISO),
 *   endDate: string (ISO)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, startDate, endDate } = body

    // Validación de campos requeridos
    if (!name || !description || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    // Validación de fechas
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start >= end) {
      return NextResponse.json(
        { error: 'La fecha de inicio debe ser anterior a la fecha de fin' },
        { status: 400 }
      )
    }

    const event = await prisma.event.create({
      data: {
        name,
        description,
        startDate: start,
        endDate: end,
      },
    })

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Error al crear evento' },
      { status: 500 }
    )
  }
}
