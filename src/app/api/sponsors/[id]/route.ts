import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/sponsors/[id]
 * Obtiene un sponsor específico con sus actividades y NFCs
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const sponsor = await prisma.sponsor.findUnique({
      where: { id },
      include: {
        event: true,
        activities: {
          include: {
            nfcTags: true,
          },
        },
        nfcTags: true,
      },
    })

    if (!sponsor) {
      return NextResponse.json(
        { error: 'Sponsor no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ sponsor }, { status: 200 })
  } catch (error) {
    console.error('Error fetching sponsor:', error)
    return NextResponse.json(
      { error: 'Error al obtener sponsor' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/sponsors/[id]
 * Actualiza un sponsor existente
 * Body: { name?, description? }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description } = body

    const sponsor = await prisma.sponsor.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
      },
    })

    return NextResponse.json({ sponsor }, { status: 200 })
  } catch (error) {
    console.error('Error updating sponsor:', error)
    return NextResponse.json(
      { error: 'Error al actualizar sponsor' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/sponsors/[id]
 * Elimina un sponsor (cascada eliminará sus actividades y NFCs)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.sponsor.delete({
      where: { id },
    })

    return NextResponse.json(
      { message: 'Sponsor eliminado correctamente' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting sponsor:', error)
    return NextResponse.json(
      { error: 'Error al eliminar sponsor' },
      { status: 500 }
    )
  }
}
