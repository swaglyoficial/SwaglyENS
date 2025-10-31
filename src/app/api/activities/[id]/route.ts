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
    const {
      name,
      description,
      numOfTokens,
      sponsorId,
      validationType,
      requiresProof,
      proofType,
      proofPrompt,
      transactionPrompt,
      referralPrompt,
      onChainValidationType,
      validationConfig,
      successMessage
    } = body

    // Validación del número de tokens si se proporciona
    if (numOfTokens !== undefined && numOfTokens < 0) {
      return NextResponse.json(
        { error: 'El número de tokens debe ser positivo' },
        { status: 400 }
      )
    }

    // Preparar datos de actualización
    const updateData: any = {}

    if (name) updateData.name = name
    if (description) updateData.description = description
    if (numOfTokens !== undefined) updateData.numOfTokens = numOfTokens
    if (sponsorId) updateData.sponsorId = sponsorId
    if (validationType) updateData.validationType = validationType
    if (requiresProof !== undefined) updateData.requiresProof = requiresProof
    if (successMessage !== undefined) updateData.successMessage = successMessage

    // Actualizar campos de validación según el tipo
    if (validationType === 'manual') {
      updateData.proofType = proofType || null
      updateData.proofPrompt = proofPrompt || null
      updateData.transactionPrompt = null
      updateData.referralPrompt = null
      updateData.onChainValidationType = null
      updateData.validationConfig = null
    } else if (validationType === 'auto_transaction') {
      updateData.proofType = null
      updateData.proofPrompt = null
      updateData.transactionPrompt = transactionPrompt || null
      updateData.referralPrompt = null
      // Permitir actualizar campos on-chain
      if (onChainValidationType !== undefined) {
        updateData.onChainValidationType = onChainValidationType
      }
      if (validationConfig !== undefined) {
        updateData.validationConfig = validationConfig
      }
    } else if (validationType === 'auto_referral_code') {
      updateData.proofType = null
      updateData.proofPrompt = null
      updateData.transactionPrompt = null
      updateData.referralPrompt = referralPrompt || null
      updateData.onChainValidationType = null
      updateData.validationConfig = null
    } else if (validationType === 'scan') {
      updateData.proofType = null
      updateData.proofPrompt = null
      updateData.transactionPrompt = null
      updateData.referralPrompt = null
      updateData.onChainValidationType = null
      updateData.validationConfig = null
    }

    const activity = await prisma.activity.update({
      where: { id },
      data: updateData,
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
