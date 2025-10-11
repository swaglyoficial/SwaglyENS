import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/activities/[id]
 * Obtiene una actividad específica con todas sus relaciones
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const activity = await prisma.activity.findUnique({
      where: { id },
      include: {
        event: true,
        sponsor: true,
        nfcTags: {
          include: {
            scans: true,
          },
        },
        activities: {
          include: {
            passport: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    })

    if (!activity) {
      return NextResponse.json(
        { error: 'Actividad no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ activity }, { status: 200 })
  } catch (error) {
    console.error('Error fetching activity:', error)
    return NextResponse.json(
      { error: 'Error al obtener actividad' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/activities/[id]
 * Actualiza una actividad existente
 * Body: { name?, description?, numOfTokens?, sponsorId? }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, numOfTokens, sponsorId } = body

    // Validación del número de tokens si se proporciona
    if (numOfTokens !== undefined && numOfTokens < 0) {
      return NextResponse.json(
        { error: 'El número de tokens debe ser positivo' },
        { status: 400 }
      )
    }

    const activity = await prisma.activity.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(numOfTokens !== undefined && { numOfTokens }),
        ...(sponsorId && { sponsorId }),
      },
      include: {
        sponsor: true,
      },
    })

    return NextResponse.json({ activity }, { status: 200 })
  } catch (error) {
    console.error('Error updating activity:', error)
    return NextResponse.json(
      { error: 'Error al actualizar actividad' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/activities/[id]
 * Elimina una actividad
 * Nota: Los NFCs asociados quedarán sin actividad debido a onDelete: Restrict
 * Se debe manejar manualmente o cambiar a Cascade
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verificar si hay NFCs asociados
    const nfcCount = await prisma.nFC.count({
      where: { activityId: id },
    })

    if (nfcCount > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar la actividad porque tiene ${nfcCount} NFC(s) asociado(s). Elimina primero los NFCs.`
        },
        { status: 400 }
      )
    }

    await prisma.activity.delete({
      where: { id },
    })

    return NextResponse.json(
      { message: 'Actividad eliminada correctamente' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting activity:', error)
    return NextResponse.json(
      { error: 'Error al eliminar actividad' },
      { status: 500 }
    )
  }
}
