import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/passports/sync
 *
 * Sincroniza todos los pasaportes existentes con las actividades de sus eventos
 *
 * Este endpoint:
 * 1. Busca todos los pasaportes o un pasaporte específico
 * 2. Verifica qué actividades del evento NO están en el pasaporte
 * 3. Agrega las actividades faltantes como "pending"
 * 4. Recalcula el progreso del pasaporte
 *
 * Body (opcional):
 * {
 *   passportId: string,  // Si se proporciona, solo sincroniza este pasaporte
 *   eventId: string,     // Si se proporciona, sincroniza todos los pasaportes de este evento
 * }
 *
 * Si no se proporciona body, sincroniza TODOS los pasaportes del sistema
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { passportId, eventId } = body

    let passportsToSync: { id: string; eventId: string }[] = []

    // ========================================
    // PASO 1: Determinar qué pasaportes sincronizar
    // ========================================
    if (passportId) {
      // Sincronizar solo un pasaporte específico
      const passport = await prisma.passport.findUnique({
        where: { id: passportId },
        select: { id: true, eventId: true },
      })

      if (!passport) {
        return NextResponse.json(
          { error: 'Pasaporte no encontrado' },
          { status: 404 }
        )
      }

      passportsToSync = [passport]
    } else if (eventId) {
      // Sincronizar todos los pasaportes de un evento
      passportsToSync = await prisma.passport.findMany({
        where: { eventId },
        select: { id: true, eventId: true },
      })
    } else {
      // Sincronizar TODOS los pasaportes del sistema
      passportsToSync = await prisma.passport.findMany({
        select: { id: true, eventId: true },
      })
    }

    if (passportsToSync.length === 0) {
      return NextResponse.json({
        message: 'No hay pasaportes para sincronizar',
        passportsSynced: 0,
      })
    }

    console.log(`🔄 Iniciando sincronización de ${passportsToSync.length} pasaporte(s)...`)

    let totalActivitiesAdded = 0
    const syncResults: Array<{
      passportId: string
      activitiesAdded: number
      newProgress: number
    }> = []

    // ========================================
    // PASO 2: Sincronizar cada pasaporte
    // ========================================
    for (const passport of passportsToSync) {
      // Obtener todas las actividades del evento (con requiresProof)
      const eventActivities = await prisma.activity.findMany({
        where: { eventId: passport.eventId },
        select: { id: true, requiresProof: true },
      })

      // Obtener actividades que ya están en el pasaporte
      const existingPassportActivities = await prisma.passportActivity.findMany({
        where: { passportId: passport.id },
        select: { activityId: true },
      })

      const existingActivityIds = new Set(
        existingPassportActivities.map((pa) => pa.activityId)
      )

      // Encontrar actividades faltantes
      const missingActivities = eventActivities.filter(
        (activity) => !existingActivityIds.has(activity.id)
      )

      // Si hay actividades faltantes, agregarlas
      if (missingActivities.length > 0) {
        console.log(`  📝 Agregando ${missingActivities.length} actividad(es) faltante(s) al pasaporte ${passport.id}`)

        await prisma.passportActivity.createMany({
          data: missingActivities.map((activity) => ({
            passportId: passport.id,
            activityId: activity.id,
            status: 'pending',
            requiresProof: activity.requiresProof,
          })),
          skipDuplicates: true,
        })

        totalActivitiesAdded += missingActivities.length
      }

      // ========================================
      // PASO 3: Recalcular progreso del pasaporte
      // ========================================
      const allPassportActivities = await prisma.passportActivity.findMany({
        where: { passportId: passport.id },
      })

      const completedCount = allPassportActivities.filter(
        (pa) => pa.status === 'completed'
      ).length

      const newProgress = allPassportActivities.length > 0
        ? Math.round((completedCount / allPassportActivities.length) * 100)
        : 0

      // Actualizar progreso en la base de datos
      await prisma.passport.update({
        where: { id: passport.id },
        data: { progress: newProgress },
      })

      syncResults.push({
        passportId: passport.id,
        activitiesAdded: missingActivities.length,
        newProgress,
      })
    }

    console.log(`✅ Sincronización completada:`)
    console.log(`   - Pasaportes sincronizados: ${passportsToSync.length}`)
    console.log(`   - Actividades agregadas en total: ${totalActivitiesAdded}`)

    return NextResponse.json({
      success: true,
      message: `${passportsToSync.length} pasaporte(s) sincronizado(s) exitosamente`,
      passportsSynced: passportsToSync.length,
      totalActivitiesAdded,
      results: syncResults,
    })
  } catch (error) {
    console.error('❌ Error al sincronizar pasaportes:', error)
    return NextResponse.json(
      {
        error: 'Error al sincronizar pasaportes',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/passports/sync
 *
 * Endpoint de información
 * Muestra cómo usar el endpoint de sincronización
 */
export async function GET() {
  return NextResponse.json({
    message: 'Endpoint para sincronizar pasaportes con las actividades de sus eventos',
    usage: {
      method: 'POST',
      endpoint: '/api/passports/sync',
      body: {
        passportId: 'string (optional) - Sincronizar un pasaporte específico',
        eventId: 'string (optional) - Sincronizar todos los pasaportes de un evento',
        none: 'Si no se proporciona body, sincroniza TODOS los pasaportes',
      },
    },
    examples: {
      syncAll: {
        description: 'Sincronizar todos los pasaportes del sistema',
        body: {},
      },
      syncEvent: {
        description: 'Sincronizar todos los pasaportes de un evento',
        body: {
          eventId: 'uuid-del-evento',
        },
      },
      syncOne: {
        description: 'Sincronizar un pasaporte específico',
        body: {
          passportId: 'uuid-del-pasaporte',
        },
      },
    },
  })
}
