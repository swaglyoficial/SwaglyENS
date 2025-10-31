import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateReferralLink } from '@/lib/referral-validator'
import { TOKEN_DECIMALS } from '@/lib/thirdweb-config'
import { claimTokensViaThirdweb, ThirdwebApiError } from '@/lib/thirdweb-server'

/**
 * POST /api/proofs/auto-validate-referral
 * Valida automÃ¡ticamente un cÃ³digo de referido y aprueba la actividad
 *
 * Body: {
 *   userId: string,
 *   activityId: string,
 *   passportId: string,
 *   referralUrl: string // URL del referido
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, activityId, passportId, referralUrl } = body

    // Validaciones bÃ¡sicas
    if (!userId || !activityId || !passportId || !referralUrl) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Verificar que la actividad existe y es de tipo auto_referral_code
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
    })

    if (!activity) {
      return NextResponse.json(
        { error: 'Actividad no encontrada' },
        { status: 404 }
      )
    }

    if (activity.validationType !== 'auto_referral_code') {
      return NextResponse.json(
        { error: 'Esta actividad no soporta validaciÃ³n automÃ¡tica de cÃ³digos de referido' },
        { status: 400 }
      )
    }

    // Verificar que el pasaporte existe y pertenece al usuario
    const passport = await prisma.passport.findUnique({
      where: { id: passportId },
      include: {
        user: true,
      },
    })

    if (!passport || passport.userId !== userId) {
      return NextResponse.json(
        { error: 'Pasaporte no vÃ¡lido' },
        { status: 404 }
      )
    }

    // Verificar que no existe ya una prueba aprobada
    const existingApprovedProof = await prisma.activityProof.findFirst({
      where: {
        userId,
        activityId,
        passportId,
        status: 'approved',
      },
    })

    if (existingApprovedProof) {
      return NextResponse.json(
        { error: 'Ya completaste esta actividad' },
        { status: 409 }
      )
    }

    // Verificar que este URL no ha sido usado antes para esta actividad (por cualquier usuario)
    const existingProofWithUrl = await prisma.activityProof.findFirst({
      where: {
        activityId,
        referralUrl,
        NOT: {
          userId: userId, // Excluir al usuario actual para permitir reintentos
        },
      },
    })

    if (existingProofWithUrl) {
      return NextResponse.json(
        { error: 'Este link de referido ya fue usado por otro usuario para completar esta actividad' },
        { status: 409 }
      )
    }

    // Verificar si el usuario actual ya intentÃ³ usar este mismo link antes
    const userExistingProofWithUrl = await prisma.activityProof.findFirst({
      where: {
        userId,
        activityId,
        referralUrl,
      },
    })

    if (userExistingProofWithUrl) {
      return NextResponse.json(
        { error: 'Ya enviaste este link de referido anteriormente. Por favor, proporciona un link diferente.' },
        { status: 409 }
      )
    }

    // Validar el link de referido
    console.log(`ðŸ” Validando cÃ³digo de referido para usuario ${userId}...`)
    const validationResult = await validateReferralLink(referralUrl)

    if (!validationResult.isValid) {
      // Crear o actualizar proof como rechazado
      let proof
      const existingProof = await prisma.activityProof.findFirst({
        where: {
          userId,
          activityId,
          passportId,
        },
      })

      if (existingProof) {
        proof = await prisma.activityProof.update({
          where: { id: existingProof.id },
          data: {
            referralUrl,
            referralCode: null,
            proofType: 'referral',
            status: 'rejected',
            rejectionReason: validationResult.error || 'CÃ³digo de referido no encontrado',
            updatedAt: new Date(),
          },
        })
      } else {
        proof = await prisma.activityProof.create({
          data: {
            userId,
            activityId,
            passportId,
            referralUrl,
            referralCode: null,
            proofType: 'referral',
            status: 'rejected',
            rejectionReason: validationResult.error || 'CÃ³digo de referido no encontrado',
          },
        })
      }

      return NextResponse.json(
        {
          success: false,
          error: validationResult.error,
          proofId: proof.id,
        },
        { status: 400 }
      )
    }

    // âœ… CÃ³digo de referido vÃ¡lido - Proceder a aprobar y recompensar

    // Verificar si ya existe una proof pendiente
    const existingProof = await prisma.activityProof.findFirst({
      where: {
        userId,
        activityId,
        passportId,
      },
    })

    let proof
    let rewardTxHash: string | null = null

    // Intentar acuÃ±ar tokens si la actividad tiene recompensa
    if (activity.numOfTokens > 0) {
      try {
        console.log(`ðŸ’° Reclamando ${activity.numOfTokens} SWAG tokens para ${passport.user.walletAddress}`)

        // Ejecutar claim mediante Thirdweb API
        const decimalsMultiplier = 10n ** BigInt(TOKEN_DECIMALS)
        const quantityInWei = BigInt(activity.numOfTokens) * decimalsMultiplier

        const claimResult = await claimTokensViaThirdweb({
          receiverAddress: passport.user.walletAddress as `0x${string}`,
          quantity: activity.numOfTokens,
          quantityInWei,
        })

        rewardTxHash = claimResult.transactionHash ?? null
        console.log(`Tokens reclamados. TX: ${claimResult.transactionHash ?? 'N/A'}`)
      } catch (error) {
        if (error instanceof ThirdwebApiError) {
          console.error('Error reclamando tokens via Thirdweb API:', error.payload)
        } else {
          console.error('Error reclamando tokens:', error)
        }
        // Continuar sin fallar - la proof se aprueba igual
      }
    }

    // Crear o actualizar la proof como aprobada
    if (existingProof && existingProof.status !== 'approved') {
      proof = await prisma.activityProof.update({
        where: { id: existingProof.id },
        data: {
          referralUrl,
          referralCode: validationResult.refCode,
          proofType: 'referral',
          status: 'approved',
          rejectionReason: null,
          tokensAwarded: activity.numOfTokens,
          rewardTxHash,
          validatedAt: new Date(),
          validatedBy: 'auto', // Sistema automÃ¡tico
          updatedAt: new Date(),
        },
      })
    } else {
      proof = await prisma.activityProof.create({
        data: {
          userId,
          activityId,
          passportId,
          referralUrl,
          referralCode: validationResult.refCode,
          proofType: 'referral',
          status: 'approved',
          tokensAwarded: activity.numOfTokens,
          rewardTxHash,
          validatedAt: new Date(),
          validatedBy: 'auto', // Sistema automÃ¡tico
        },
      })
    }

    // Actualizar PassportActivity a completado
    await prisma.passportActivity.updateMany({
      where: {
        passportId,
        activityId,
      },
      data: {
        status: 'completed',
        proofId: proof.id,
        requiresProof: true,
      },
    })

    // Actualizar progreso del pasaporte
    const totalActivities = await prisma.passportActivity.count({
      where: { passportId },
    })

    const completedActivities = await prisma.passportActivity.count({
      where: {
        passportId,
        status: 'completed',
      },
    })

    const progress = totalActivities > 0
      ? Math.round((completedActivities / totalActivities) * 100)
      : 0

    await prisma.passport.update({
      where: { id: passportId },
      data: { progress },
    })

    console.log(`âœ… Actividad completada automÃ¡ticamente para usuario ${userId} con refCode: ${validationResult.refCode}`)

    return NextResponse.json(
      {
        success: true,
        proofId: proof.id,
        status: 'approved',
        message: 'Â¡CÃ³digo de referido validado! Actividad completada automÃ¡ticamente.',
        tokensAwarded: activity.numOfTokens,
        rewardTxHash,
        refCode: validationResult.refCode,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in auto-validate-referral endpoint:', error)
    return NextResponse.json(
      { error: 'Error al validar el cÃ³digo de referido' },
      { status: 500 }
    )
  }
}

