import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/proofs
 * Usuario envía evidencia (texto o imagen) para una actividad que requiere validación manual
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, activityId, passportId, proofType, textProof, imageUrl } = body

    // Validaciones básicas
    if (!userId || !activityId || !passportId || !proofType) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Validar que el tipo de proof sea válido
    if (!['text', 'image', 'both'].includes(proofType)) {
      return NextResponse.json(
        { error: 'Tipo de prueba inválido' },
        { status: 400 }
      )
    }

    // Validar que se envió el contenido apropiado
    if (proofType === 'text' && !textProof) {
      return NextResponse.json(
        { error: 'El texto de la prueba es requerido' },
        { status: 400 }
      )
    }

    if (proofType === 'image' && !imageUrl) {
      return NextResponse.json(
        { error: 'La imagen es requerida' },
        { status: 400 }
      )
    }

    if (proofType === 'both' && !textProof && !imageUrl) {
      return NextResponse.json(
        { error: 'Se requiere al menos texto o imagen' },
        { status: 400 }
      )
    }

    // Verificar que la actividad existe y requiere validación
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
    })

    if (!activity) {
      return NextResponse.json(
        { error: 'Actividad no encontrada' },
        { status: 404 }
      )
    }

    if (!activity.requiresProof) {
      return NextResponse.json(
        { error: 'Esta actividad no requiere validación manual' },
        { status: 400 }
      )
    }

    // Verificar que el pasaporte existe y pertenece al usuario
    const passport = await prisma.passport.findUnique({
      where: { id: passportId },
    })

    if (!passport || passport.userId !== userId) {
      return NextResponse.json(
        { error: 'Pasaporte no válido' },
        { status: 404 }
      )
    }

    // Verificar que no existe ya una prueba aprobada para esta actividad
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

    // Verificar si ya existe una prueba pendiente o rechazada
    const existingProof = await prisma.activityProof.findFirst({
      where: {
        userId,
        activityId,
        passportId,
      },
    })

    let proof

    if (existingProof && existingProof.status === 'rejected') {
      // Si fue rechazada, actualizarla para reenvío
      proof = await prisma.activityProof.update({
        where: { id: existingProof.id },
        data: {
          proofType,
          textProof: (proofType === 'text' || proofType === 'both') ? textProof : null,
          imageUrl: (proofType === 'image' || proofType === 'both') ? imageUrl : null,
          status: 'pending',
          rejectionReason: null,
          updatedAt: new Date(),
        },
      })
    } else if (existingProof && existingProof.status === 'pending') {
      return NextResponse.json(
        { error: 'Ya enviaste una evidencia que está en revisión' },
        { status: 409 }
      )
    } else {
      // Crear nueva prueba
      proof = await prisma.activityProof.create({
        data: {
          userId,
          activityId,
          passportId,
          proofType,
          textProof: (proofType === 'text' || proofType === 'both') ? textProof : null,
          imageUrl: (proofType === 'image' || proofType === 'both') ? imageUrl : null,
          status: 'pending',
        },
      })

      // Actualizar PassportActivity para indicar que requiere validación
      await prisma.passportActivity.updateMany({
        where: {
          passportId,
          activityId,
        },
        data: {
          proofId: proof.id,
          requiresProof: true,
        },
      })
    }

    return NextResponse.json(
      {
        success: true,
        proofId: proof.id,
        status: 'pending',
        message: 'Evidencia enviada. Espera validación del administrador.',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating proof:', error)
    return NextResponse.json(
      { error: 'Error al enviar la evidencia' },
      { status: 500 }
    )
  }
}
