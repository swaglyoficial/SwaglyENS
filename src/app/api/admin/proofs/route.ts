import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/proofs
 * Lista todas las pruebas de evidencias (filtradas por status si se especifica)
 * Solo accesible por administradores
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Agregar autenticación y verificar que el usuario es admin
    // const { userId } = await auth(request)
    // const user = await prisma.user.findUnique({ where: { id: userId } })
    // if (!user || user.role !== 'admin') {
    //   return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    // }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'pending', 'approved', 'rejected', o null (todos)

    // Construir filtro
    const where: any = {}
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      where.status = status
    }

    // Obtener pruebas con relaciones
    const proofs = await prisma.activityProof.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            walletAddress: true,
          },
        },
        activity: {
          include: {
            sponsor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        passport: {
          include: {
            event: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Contar por status
    const pendingCount = await prisma.activityProof.count({
      where: { status: 'pending' },
    })

    const approvedCount = await prisma.activityProof.count({
      where: { status: 'approved' },
    })

    const rejectedCount = await prisma.activityProof.count({
      where: { status: 'rejected' },
    })

    return NextResponse.json({
      success: true,
      proofs,
      counts: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
      },
    })
  } catch (error) {
    console.error('Error fetching proofs:', error)
    return NextResponse.json(
      { error: 'Error al obtener las pruebas' },
      { status: 500 }
    )
  }
}
