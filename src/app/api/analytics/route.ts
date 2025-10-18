import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/analytics?eventId=xxx
 *
 * Endpoint principal de analÃ­ticas para el panel de administraciÃ³n
 *
 * Retorna mÃ©tricas completas del evento:
 * - Usuarios registrados (con pasaportes en el evento)
 * - Actividades completadas vs pendientes
 * - Ranking de actividades mÃ¡s populares
 * - Volumen total de tokens emitidos por el evento
 * - Engagement por sponsor (interacciones, escaneos)
 * - Estado de NFCs (disponibles, escaneados)
 * - Tasa de retenciÃ³n de usuarios
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId es requerido' },
        { status: 400 }
      )
    }

    // Verificar que el evento existe
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        sponsors: true,
        activities: true,
      },
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      )
    }

    // 1. Usuarios registrados (con pasaporte en este evento)
    const totalUsers = await prisma.passport.count({
      where: { eventId },
    })

    // 2. Total de actividades del evento
    const totalActivities = event.activities.length

    // 3. Actividades completadas (PassportActivity con status completed)
    const completedActivities = await prisma.passportActivity.count({
      where: {
        passport: { eventId },
        status: 'completed',
      },
    })

    // 4. Actividades pendientes
    const pendingActivities = await prisma.passportActivity.count({
      where: {
        passport: { eventId },
        status: 'pending',
      },
    })

    // 5. Ranking de actividades mÃ¡s populares (mÃ¡s completadas)
    const activityRanking = await prisma.activity.findMany({
      where: { eventId },
      include: {
        activities: {
          where: { status: 'completed' },
        },
        sponsor: true,
      },
      orderBy: {
        activities: {
          _count: 'desc',
        },
      },
      take: 10, // Top 10
    })

    const formattedActivityRanking = activityRanking.map((activity) => ({
      id: activity.id,
      name: activity.name,
      sponsor: activity.sponsor?.name ?? 'Sin sponsor',
      completions: activity.activities.length,
      tokensPerCompletion: activity.numOfTokens,
      totalTokensIssued: activity.activities.length * activity.numOfTokens,
    }))

    // 6. Volumen total de tokens emitidos (suma de tokens de actividades completadas)
    const totalTokensIssued = activityRanking.reduce(
      (sum, activity) => sum + activity.activities.length * activity.numOfTokens,
      0
    )

    // 7. Engagement por sponsor
    const sponsorEngagement = await Promise.all(
      event.sponsors.map(async (sponsor) => {
        // Actividades del sponsor
        const activities = await prisma.activity.findMany({
          where: {
            eventId,
            sponsorId: sponsor.id,
          },
          include: {
            activities: {
              where: { status: 'completed' },
            },
          },
        })

        // Total de completaciones de actividades del sponsor
        const totalCompletions = activities.reduce(
          (sum, activity) => sum + activity.activities.length,
          0
        )

        // Total de tokens emitidos por el sponsor
        const tokensIssued = activities.reduce(
          (sum, activity) =>
            sum + activity.activities.length * activity.numOfTokens,
          0
        )

        // NFCs del sponsor y escaneos
        const nfcScans = await prisma.scan.count({
          where: {
            nfc: {
              sponsorId: sponsor.id,
              eventId,
            },
          },
        })

        return {
          sponsorId: sponsor.id,
          sponsorName: sponsor.name,
          totalActivities: activities.length,
          totalCompletions,
          tokensIssued,
          nfcScans,
        }
      })
    )

    // 8. Estado de NFCs (disponible vs escaneado)
    const nfcStats = await prisma.nFC.groupBy({
      by: ['status'],
      where: { eventId },
      _count: true,
    })

    const nfcStatusBreakdown = {
      available: nfcStats.find((s) => s.status === 'available')?._count || 0,
      scanned: nfcStats.find((s) => s.status === 'scanned')?._count || 0,
      total: nfcStats.reduce((sum, s) => sum + s._count, 0),
    }

    // 9. Tasa de retenciÃ³n (usuarios que completaron mÃ¡s de X% de actividades)
    const passports = await prisma.passport.findMany({
      where: { eventId },
      select: {
        progress: true,
      },
    })

    // Usuarios que completaron mÃ¡s del 50% de actividades
    const highEngagementUsers = passports.filter(
      (p) => p.progress >= 50
    ).length

    // Usuarios que completaron el 100%
    const completionUsers = passports.filter((p) => p.progress === 100).length

    const retentionRate = totalUsers > 0 ? (highEngagementUsers / totalUsers) * 100 : 0
    const completionRate = totalUsers > 0 ? (completionUsers / totalUsers) * 100 : 0

    // 10. Promedio de progreso de usuarios
    const avgProgress =
      totalUsers > 0
        ? passports.reduce((sum, p) => sum + p.progress, 0) / totalUsers
        : 0

    // Respuesta con todas las mÃ©tricas
    const analytics = {
      event: {
        id: event.id,
        name: event.name,
        startDate: event.startDate,
        endDate: event.endDate,
      },
      users: {
        total: totalUsers,
        highEngagement: highEngagementUsers, // >50% progreso
        completed: completionUsers, // 100% progreso
      },
      activities: {
        total: totalActivities,
        completed: completedActivities,
        pending: pendingActivities,
        ranking: formattedActivityRanking,
      },
      tokens: {
        totalIssued: totalTokensIssued,
        avgPerUser: totalUsers > 0 ? totalTokensIssued / totalUsers : 0,
      },
      sponsors: sponsorEngagement,
      nfcs: nfcStatusBreakdown,
      engagement: {
        avgProgress: Math.round(avgProgress * 100) / 100,
        retentionRate: Math.round(retentionRate * 100) / 100,
        completionRate: Math.round(completionRate * 100) / 100,
      },
    }

    return NextResponse.json({ analytics }, { status: 200 })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Error al obtener analÃ­ticas' },
      { status: 500 }
    )
  }
}

