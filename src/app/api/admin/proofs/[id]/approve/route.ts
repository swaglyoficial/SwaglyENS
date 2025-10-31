import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TOKEN_DECIMALS } from '@/lib/thirdweb-config'
import { claimTokensViaThirdweb, ThirdwebApiError } from '@/lib/thirdweb-server'

/**
 * POST /api/admin/proofs/[id]/approve
 * Aprueba una evidencia y envÃ­a tokens automÃ¡ticamente al usuario
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: proofId } = await params

    // Body opcional (adminId no se usa por ahora)
    const body = await request.json().catch(() => ({}))
    const { adminId } = body

    // TODO: Agregar autenticaciÃ³n y verificar que el usuario es admin
    // Validar que el admin es realmente admin
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
        passport: true,
      },
    })

    if (!proof) {
      return NextResponse.json(
        { error: 'Prueba no encontrada' },
        { status: 404 }
      )
    }

    // Verificar que estÃ¡ pendiente
    if (proof.status !== 'pending') {
      return NextResponse.json(
        { error: `Esta prueba ya fue ${proof.status === 'approved' ? 'aprobada' : 'rechazada'}` },
        { status: 400 }
      )
    }

    // PASO 1: Enviar tokens usando Thirdweb
    console.log(`ðŸ“¤ Enviando ${proof.activity.numOfTokens} tokens a ${proof.user.walletAddress}`)

    let transactionHash: string | null = null

    try {
      const decimalsMultiplier = 10n ** BigInt(TOKEN_DECIMALS)
      const quantityInWei = BigInt(proof.activity.numOfTokens) * decimalsMultiplier

      const claimResult = await claimTokensViaThirdweb({
        receiverAddress: proof.user.walletAddress as `0x${string}`,
        quantity: proof.activity.numOfTokens,
        quantityInWei,
      })

      transactionHash = claimResult.transactionHash ?? null
      console.log(`Tokens enviados. TX: ${claimResult.transactionHash ?? 'N/A'}`)
    } catch (error) {
      if (error instanceof ThirdwebApiError) {
        console.error('Error enviando tokens via Thirdweb API:', error.payload)
        return NextResponse.json(
          {
            error: 'Error al enviar tokens',
            details: error.message,
            thirdwebResponse: error.payload,
          },
          { status: error.status }
        )
      }

      console.error('Error enviando tokens:', error)
      return NextResponse.json(
        { error: 'Error al enviar tokens. Intenta nuevamente.' },
        { status: 500 }
      )
    }
// PASO 2: Actualizar prueba como aprobada (solo si el claim fue exitoso)
    const updatedProof = await prisma.activityProof.update({
      where: { id: proofId },
      data: {
        status: 'approved',
        validatedBy: adminId || 'admin',
        validatedAt: new Date(),
        tokensAwarded: proof.activity.numOfTokens,
        transactionHash,
      },
    })

    // PASO 3: Actualizar PassportActivity como completada
    await prisma.passportActivity.updateMany({
      where: {
        passportId: proof.passportId,
        activityId: proof.activityId,
      },
      data: {
        status: 'completed',
        timestamp: new Date(),
      },
    })

    // PASO 4: Actualizar progreso del pasaporte
    const allActivities = await prisma.passportActivity.count({
      where: { passportId: proof.passportId },
    })

    const completedActivities = await prisma.passportActivity.count({
      where: {
        passportId: proof.passportId,
        status: 'completed',
      },
    })

    const progress = Math.round((completedActivities / allActivities) * 100)

    await prisma.passport.update({
      where: { id: proof.passportId },
      data: { progress },
    })

    console.log(`ðŸŽ‰ Prueba aprobada exitosamente. Progreso actualizado: ${progress}%`)

    return NextResponse.json({
      success: true,
      transactionHash,
      tokensAwarded: proof.activity.numOfTokens,
      progress,
      message: 'Evidencia aprobada y tokens enviados exitosamente',
    })
  } catch (error) {
    console.error('Error approving proof:', error)
    return NextResponse.json(
      { error: 'Error al aprobar la evidencia' },
      { status: 500 }
    )
  }
}



