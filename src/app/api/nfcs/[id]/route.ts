import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/nfcs/[id]
 * Obtiene un NFC específico con todos sus escaneos y relaciones
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const nfc = await prisma.nFC.findUnique({
      where: { id },
      include: {
        event: true,
        sponsor: true,
        activity: true,
        scans: {
          include: {
            user: true,
          },
          orderBy: {
            timestamp: 'desc',
          },
        },
      },
    })

    if (!nfc) {
      return NextResponse.json(
        { error: 'NFC no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ nfc }, { status: 200 })
  } catch (error) {
    console.error('Error fetching NFC:', error)
    return NextResponse.json(
      { error: 'Error al obtener NFC' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/nfcs/[id]
 * Actualiza un NFC existente
 * Body: { uuid?, activityId?, sponsorId?, status? }
 * Permite cambiar el estado manualmente (disponible/escaneado)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { uuid, activityId, sponsorId, status } = body

    // Si se actualiza el UUID, verificar que no exista
    if (uuid) {
      const existingNFC = await prisma.nFC.findFirst({
        where: {
          uuid,
          NOT: { id },
        },
      })

      if (existingNFC) {
        return NextResponse.json(
          { error: 'Este UUID ya está en uso por otro NFC' },
          { status: 409 }
        )
      }
    }

    const nfc = await prisma.nFC.update({
      where: { id },
      data: {
        ...(uuid && { uuid }),
        ...(activityId && { activityId }),
        ...(sponsorId && { sponsorId }),
        ...(status && { status }),
      },
      include: {
        event: true,
        sponsor: true,
        activity: true,
      },
    })

    return NextResponse.json({ nfc }, { status: 200 })
  } catch (error) {
    console.error('Error updating NFC:', error)
    return NextResponse.json(
      { error: 'Error al actualizar NFC' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/nfcs/[id]
 * Elimina un NFC del sistema (cascada eliminará los escaneos asociados)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.nFC.delete({
      where: { id },
    })

    return NextResponse.json(
      { message: 'NFC eliminado correctamente' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting NFC:', error)
    return NextResponse.json(
      { error: 'Error al eliminar NFC' },
      { status: 500 }
    )
  }
}
