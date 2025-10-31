import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/passports/fix-requires-proof
 *
 * Endpoint temporal para actualizar el campo requiresProof en PassportActivity
 * basándose en el valor de requiresProof en Activity
 */
export async function POST() {
  try {
    console.log('🔧 Iniciando actualización de requiresProof en PassportActivity...')

    // Obtener todas las actividades con su configuración de requiresProof
    const activities = await prisma.activity.findMany({
      select: {
        id: true,
        name: true,
        requiresProof: true,
      },
    })

    let updatedCount = 0

    // Para cada actividad, actualizar sus PassportActivity
    for (const activity of activities) {
      const result = await prisma.passportActivity.updateMany({
        where: {
          activityId: activity.id,
        },
        data: {
          requiresProof: activity.requiresProof,
        },
      })

      if (result.count > 0) {
        console.log(`  ✅ Actualizada actividad "${activity.name}": ${result.count} PassportActivity(s) actualizados (requiresProof: ${activity.requiresProof})`)
        updatedCount += result.count
      }
    }

    console.log(`✅ Actualización completada: ${updatedCount} PassportActivity(s) actualizados`)

    return NextResponse.json({
      success: true,
      message: 'Campo requiresProof actualizado exitosamente',
      activitiesProcessed: activities.length,
      passportActivitiesUpdated: updatedCount,
    })
  } catch (error) {
    console.error('❌ Error al actualizar requiresProof:', error)
    return NextResponse.json(
      {
        error: 'Error al actualizar requiresProof',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/passports/fix-requires-proof
 *
 * Información sobre el endpoint
 */
export async function GET() {
  return NextResponse.json({
    message: 'Endpoint temporal para sincronizar el campo requiresProof',
    usage: {
      method: 'POST',
      endpoint: '/api/passports/fix-requires-proof',
      description: 'Actualiza el campo requiresProof en todas las PassportActivity basándose en sus Activity correspondientes',
    },
  })
}
