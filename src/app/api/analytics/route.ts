/**
 * ============================================
 * API ROUTE: Analytics Dashboard
 * ============================================
 *
 * Endpoint para obtener todas las métricas y analíticas de la aplicación
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // 1. Pasaportes creados del evento (total)
    const totalPassports = await prisma.passport.count()

    // 2. Obtener todos los pasaportes con sus actividades completadas
    const passportsWithActivities = await prisma.passport.findMany({
      include: {
        activities: {
          where: {
            status: 'completed',
          },
          select: {
            activityId: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            activities: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    })

    // 3. Calcular media de progreso de las actividades
    let totalProgressPercentage = 0
    const passportProgressData = passportsWithActivities.map((passport) => {
      const totalActivities = passport.event.activities.length
      const completedActivities = passport.activities.length
      const progress = totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0
      totalProgressPercentage += progress
      return {
        passportId: passport.id,
        progress,
        completedActivities,
        totalActivities,
      }
    })

    const averageProgress =
      passportsWithActivities.length > 0 ? totalProgressPercentage / passportsWithActivities.length : 0

    // 4. Cuántos usuarios completaron el 100% de progreso
    const usersWithFullProgress = passportProgressData.filter((p) => p.progress === 100).length

    // 5. Actividades completadas respecto al total
    const totalActivities = await prisma.activity.count()
    const uniqueCompletedActivities = await prisma.passportActivity.groupBy({
      by: ['activityId'],
      where: {
        status: 'completed',
      },
    })
    const completedActivitiesCount = uniqueCompletedActivities.length

    // 6. Por cada actividad, cuántos usuarios la realizaron
    const activitiesWithUserCount = await prisma.activity.findMany({
      select: {
        id: true,
        name: true,
        numOfTokens: true,
        activities: {
          where: {
            status: 'completed',
          },
          select: {
            passportId: true,
          },
        },
      },
    })

    const activityStats = activitiesWithUserCount.map((activity) => ({
      activityId: activity.id,
      activityTitle: activity.name,
      usersCompleted: activity.activities.length,
      completionRate:
        totalPassports > 0 ? (activity.activities.length / totalPassports) * 100 : 0,
    }))

    // 7. Número total de tokens claimeados
    // Sumamos los tokens de todas las actividades completadas
    let totalTokensClaimed = 0
    activitiesWithUserCount.forEach((activity) => {
      totalTokensClaimed += activity.numOfTokens * activity.activities.length
    })

    // 8. Número total de productos comprados en la tienda
    const totalPurchases = await prisma.purchase.count()

    // 9. Número total de tokens que se transfirieron en la compra
    const purchasesData = await prisma.purchase.findMany({
      select: {
        price: true,
      },
    })

    const totalTokensSpent = purchasesData.reduce((sum, purchase) => sum + purchase.price, 0)

    // 10. Datos adicionales útiles para gráficas
    // Distribución de progreso por rangos
    const progressDistribution = {
      '0-25%': passportProgressData.filter((p) => p.progress >= 0 && p.progress < 25).length,
      '25-50%': passportProgressData.filter((p) => p.progress >= 25 && p.progress < 50).length,
      '50-75%': passportProgressData.filter((p) => p.progress >= 50 && p.progress < 75).length,
      '75-99%': passportProgressData.filter((p) => p.progress >= 75 && p.progress < 100).length,
      '100%': passportProgressData.filter((p) => p.progress === 100).length,
    }

    // Top 5 actividades más completadas
    const topActivities = activityStats
      .sort((a, b) => b.usersCompleted - a.usersCompleted)
      .slice(0, 5)

    // Retornar todas las métricas
    return NextResponse.json({
      success: true,
      analytics: {
        // Métricas principales
        totalPassports,
        averageProgress: Math.round(averageProgress * 100) / 100, // 2 decimales
        usersWithFullProgress,
        totalActivities,
        completedActivitiesCount,
        completionRate:
          totalActivities > 0
            ? Math.round((completedActivitiesCount / totalActivities) * 100 * 100) / 100
            : 0,
        totalTokensClaimed,
        totalPurchases,
        totalTokensSpent,

        // Datos detallados para gráficas
        progressDistribution,
        activityStats,
        topActivities,
        passportProgressData: passportProgressData.slice(0, 10), // Solo los primeros 10 para el ejemplo
      },
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener analíticas',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
