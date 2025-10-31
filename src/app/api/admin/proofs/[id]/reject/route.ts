import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/admin/proofs/[id]/reject
 * Rechaza una evidencia con una razón
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: proofId } = await params
    const body = await request.json()
    const { adminId, reason } = body

    // Validar que se proporcionó una razón
    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: 'La razón del rechazo es requerida' },
        { status: 400 }
      )
    }

    // TODO: Agregar autenticación y verificar que el usuario es admin
    // const admin = await prisma.user.findUnique({ where: { id: adminId } })
    // if (!admin || admin.role !== 'admin') {
    //   return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    // }

    // Obtener la prueba
    const proof = await prisma.activityProof.findUnique({
      where: { id: proofId },
      include: {
        activity: true,
        user: true,
      },
    })

    if (!proof) {
      return NextResponse.json(
        { error: 'Prueba no encontrada' },
        { status: 404 }
      )
    }

    // Verificar que está pendiente
    if (proof.status !== 'pending') {
      return NextResponse.json(
        { error: `Esta prueba ya fue ${proof.status === 'approved' ? 'aprobada' : 'rechazada'}` },
        { status: 400 }
      )
    }

    // Actualizar prueba como rechazada
    const updatedProof = await prisma.activityProof.update({
      where: { id: proofId },
      data: {
        status: 'rejected',
        validatedBy: adminId || 'admin',
        validatedAt: new Date(),
        rejectionReason: reason.trim(),
      },
    })

    console.log(`❌ Prueba rechazada: ${proof.activity.name} - Usuario: ${proof.user.nickname}`)
    console.log(`📝 Razón: ${reason}`)

    return NextResponse.json({
      success: true,
      message: 'Evidencia rechazada',
    })
  } catch (error) {
    console.error('Error rejecting proof:', error)
    return NextResponse.json(
      { error: 'Error al rechazar la evidencia' },
      { status: 500 }
    )
  }
}
