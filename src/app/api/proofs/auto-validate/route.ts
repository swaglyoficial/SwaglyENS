import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  validateScrollTransaction,
  extractTransactionHash,
  validateUSDCTransfer,
  validateCashbackEvent,
  validateTokenTransfer,
} from '@/lib/scrollscan'
import { TOKEN_DECIMALS } from '@/lib/thirdweb-config'
import { claimTokensViaThirdweb, ThirdwebApiError } from '@/lib/thirdweb-server'

/**
 * POST /api/proofs/auto-validate
 * Valida automÃ¡ticamente una transacciÃ³n de Scrollscan y aprueba la actividad
 *
 * Body: {
 *   userId: string,
 *   activityId: string,
 *   passportId: string,
 *   transactionUrl: string // URL completo de Scrollscan
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, activityId, passportId, transactionUrl } = body

    // Validaciones bÃ¡sicas
    if (!userId || !activityId || !passportId || !transactionUrl) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Verificar que la actividad existe y es de tipo auto_transaction
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
    })

    if (!activity) {
      return NextResponse.json(
        { error: 'Actividad no encontrada' },
        { status: 404 }
      )
    }

    if (activity.validationType !== 'auto_transaction') {
      return NextResponse.json(
        { error: 'Esta actividad no soporta validaciÃ³n automÃ¡tica de transacciones' },
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

    // Extraer el hash para verificar duplicados
    const txHash = extractTransactionHash(transactionUrl)

    if (!txHash) {
      return NextResponse.json(
        { error: 'No se pudo extraer un hash vÃ¡lido del link proporcionado' },
        { status: 400 }
      )
    }

    // ========================================
    // VALIDACIÃ“N DE DUPLICADOS DE TRANSACCIÃ“N
    // ========================================
    // Una transacciÃ³n solo puede usarse UNA VEZ en TODO el sistema

    // 1. Verificar si este hash ya fue usado en CUALQUIER actividad aprobada
    const existingApprovedProofWithHash = await prisma.activityProof.findFirst({
      where: {
        transactionHash: txHash,
        status: 'approved',
      },
      include: {
        activity: true,
        user: true,
      },
    })

    if (existingApprovedProofWithHash) {
      // Si fue usado por el mismo usuario en otra actividad
      if (existingApprovedProofWithHash.userId === userId) {
        return NextResponse.json(
          { error: `Ya usaste esta transacciÃ³n para completar la actividad "${existingApprovedProofWithHash.activity.name}". Cada transacciÃ³n solo puede usarse una vez.` },
          { status: 409 }
        )
      } else {
        // Si fue usado por otro usuario
        return NextResponse.json(
          { error: 'Esta transacciÃ³n ya fue usada por otro usuario. Cada transacciÃ³n solo puede usarse una vez en el sistema.' },
          { status: 409 }
        )
      }
    }

    // 2. Verificar si el usuario actual ya intentÃ³ usar esta misma transacciÃ³n antes para ESTA actividad (permitir reintentos si fue rechazada)
    const userExistingProofWithHash = await prisma.activityProof.findFirst({
      where: {
        userId,
        activityId,
        transactionHash: txHash,
      },
    })

    if (userExistingProofWithHash) {
      return NextResponse.json(
        { error: 'Ya enviaste este link de transacciÃ³n anteriormente para esta actividad. Por favor, proporciona un link diferente.' },
        { status: 409 }
      )
    }

    // Validar la transacciÃ³n en Scrollscan (solo que exista, sin validar wallet)
    console.log(`ðŸ” Validando que la transacciÃ³n existe...`)
    const validationResult = await validateScrollTransaction(
      transactionUrl
      // NO pasamos userWalletAddress para que solo valide que la transacciÃ³n existe
    )

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
            transactionUrl,
            transactionHash: txHash,
            proofType: 'transaction',
            status: 'rejected',
            rejectionReason: validationResult.error || 'TransacciÃ³n invÃ¡lida',
            updatedAt: new Date(),
          },
        })
      } else {
        proof = await prisma.activityProof.create({
          data: {
            userId,
            activityId,
            passportId,
            transactionUrl,
            transactionHash: txHash,
            proofType: 'transaction',
            status: 'rejected',
            rejectionReason: validationResult.error || 'TransacciÃ³n invÃ¡lida',
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

    // âœ… TransacciÃ³n vÃ¡lida en Scrollscan

    // ========================================
    // VALIDACIÃ“N ON-CHAIN (si estÃ¡ configurada)
    // ========================================
    if (activity.onChainValidationType && activity.validationConfig) {
      console.log(`ðŸ” Aplicando validaciÃ³n on-chain: ${activity.onChainValidationType}`)

      let onChainValidation

      try {
        if (activity.onChainValidationType === 'usdc_transfer') {
          // Validar transferencia de USDC (o cualquier token ERC20)
          const config = activity.validationConfig as { minAmount: number; decimals: number }
          onChainValidation = await validateUSDCTransfer(transactionUrl, config)
        } else if (activity.onChainValidationType === 'cashback_event') {
          // Validar evento Cashback de ether.fi
          const config = activity.validationConfig as { requirePaid: boolean }
          onChainValidation = await validateCashbackEvent(transactionUrl, config)
        } else if (activity.onChainValidationType === 'token_transfer') {
          // Validar transferencia de tokens especÃ­ficos (weETH, etc)
          const config = activity.validationConfig as { tokenAddresses: string[]; minAmount?: number }
          onChainValidation = await validateTokenTransfer(transactionUrl, config)
        }

        // Si la validaciÃ³n on-chain falla, rechazar la proof
        if (onChainValidation && !onChainValidation.isValid) {
          console.log(`âŒ ValidaciÃ³n on-chain fallÃ³: ${onChainValidation.error}`)

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
                transactionUrl,
                transactionHash: txHash,
                proofType: 'transaction',
                status: 'rejected',
                rejectionReason: `ValidaciÃ³n on-chain fallÃ³: ${onChainValidation.error}`,
                updatedAt: new Date(),
              },
            })
          } else {
            proof = await prisma.activityProof.create({
              data: {
                userId,
                activityId,
                passportId,
                transactionUrl,
                transactionHash: txHash,
                proofType: 'transaction',
                status: 'rejected',
                rejectionReason: `ValidaciÃ³n on-chain fallÃ³: ${onChainValidation.error}`,
              },
            })
          }

          return NextResponse.json(
            {
              success: false,
              error: onChainValidation.error,
              proofId: proof.id,
              onChainValidation: onChainValidation.details,
            },
            { status: 400 }
          )
        }

        console.log(`âœ… ValidaciÃ³n on-chain exitosa`, onChainValidation?.details)
      } catch (error) {
        console.error('âŒ Error en validaciÃ³n on-chain:', error)

        // Rechazar la proof por error en validaciÃ³n
        let proof
        const existingProof = await prisma.activityProof.findFirst({
          where: {
            userId,
            activityId,
            passportId,
          },
        })

        const errorMessage = error instanceof Error ? error.message : 'Error desconocido en validaciÃ³n on-chain'

        if (existingProof) {
          proof = await prisma.activityProof.update({
            where: { id: existingProof.id },
            data: {
              transactionUrl,
              transactionHash: txHash,
              proofType: 'transaction',
              status: 'rejected',
              rejectionReason: errorMessage,
              updatedAt: new Date(),
            },
          })
        } else {
          proof = await prisma.activityProof.create({
            data: {
              userId,
              activityId,
              passportId,
              transactionUrl,
              transactionHash: txHash,
              proofType: 'transaction',
              status: 'rejected',
              rejectionReason: errorMessage,
            },
          })
        }

        return NextResponse.json(
          {
            success: false,
            error: errorMessage,
            proofId: proof.id,
          },
          { status: 400 }
        )
      }
    }

    // âœ… TransacciÃ³n vÃ¡lida y validaciÃ³n on-chain pasada (si aplicaba) - Proceder a aprobar y recompensar

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
        console.log(`ðŸ'° Reclamando ${activity.numOfTokens} SWAG tokens para ${passport.user.walletAddress}`)

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
          transactionUrl,
          transactionHash: txHash,
          proofType: 'transaction',
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
          transactionUrl,
          transactionHash: txHash,
          proofType: 'transaction',
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

    console.log(`âœ… Actividad completada automÃ¡ticamente para usuario ${userId}`)

    return NextResponse.json(
      {
        success: true,
        proofId: proof.id,
        status: 'approved',
        message: 'Â¡TransacciÃ³n validada! Actividad completada automÃ¡ticamente.',
        tokensAwarded: activity.numOfTokens,
        rewardTxHash,
        transactionDetails: validationResult.transaction,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in auto-validate endpoint:', error)
    return NextResponse.json(
      { error: 'Error al validar la transacciÃ³n' },
      { status: 500 }
    )
  }
}

