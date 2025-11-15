'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, TrendingUp, Users, Activity, ShoppingCart, Coins, Award, BarChart3, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts'

interface AnalyticsData {
  totalPassports: number
  averageProgress: number
  usersWithFullProgress: number
  totalActivities: number
  completedActivitiesCount: number
  completionRate: number
  totalTokensClaimed: number
  totalPurchases: number
  totalTokensSpent: number
  progressDistribution: {
    '0-25%': number
    '25-50%': number
    '50-75%': number
    '75-99%': number
    '100%': number
  }
  activityStats: Array<{
    activityId: string
    activityTitle: string
    usersCompleted: number
    completionRate: number
  }>
  topActivities: Array<{
    activityId: string
    activityTitle: string
    usersCompleted: number
    completionRate: number
  }>
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/analytics')
        const data = await response.json()

        if (data.success) {
          setAnalytics(data.analytics)
        }
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </main>
    )
  }

  if (!analytics) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black">
        <div className="text-center">
          <p className="text-cyan-100">Error al cargar analíticas</p>
          <Button asChild className="mt-4">
            <Link href="/admin">Volver al dashboard</Link>
          </Button>
        </div>
      </main>
    )
  }

  // Preparar datos para gráficas
  const progressDistributionData = [
    { name: '0-25%', value: analytics.progressDistribution['0-25%'] },
    { name: '25-50%', value: analytics.progressDistribution['25-50%'] },
    { name: '50-75%', value: analytics.progressDistribution['50-75%'] },
    { name: '75-99%', value: analytics.progressDistribution['75-99%'] },
    { name: '100%', value: analytics.progressDistribution['100%'] },
  ]

  const COLORS = ['#ef4444', '#f59e0b', '#eab308', '#84cc16', '#22c55e']

  const glassCard =
    'border-cyan-500/20 bg-black/60 text-cyan-100 shadow-[0_0_28px_rgba(0,240,255,0.1)] backdrop-blur'

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-cyan-50">
      {/* Background decorativo */}
      <div className="pointer-events-none absolute inset-0">
        <div className="neon-grid absolute inset-0 opacity-10" aria-hidden />
        <div
          className="absolute -left-24 top-40 h-72 w-72 rounded-full bg-cyan-500/15 blur-[120px]"
          aria-hidden
        />
        <div
          className="absolute bottom-[-15%] right-[-10%] h-80 w-80 rounded-full bg-cyan-400/20 blur-[140px]"
          aria-hidden
        />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-10">
        {/* Header */}
        <header className="flex flex-col gap-4 rounded-3xl border border-cyan-500/30 bg-black/60 p-6 shadow-[0_0_38px_rgba(0,240,255,0.15)] backdrop-blur">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Button
                asChild
                variant="outline"
                size="icon"
                className="border-cyan-500/60 bg-black/40 text-cyan-100 hover:bg-cyan-500/10"
              >
                <Link href="/admin">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <BarChart3 className="h-6 w-6 text-cyan-400" />
                  <h1 className="text-2xl font-bold text-white sm:text-3xl">Analíticas</h1>
                </div>
                <p className="text-sm text-cyan-200/80">
                  Métricas y estadísticas de tu aplicación
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Métricas principales en cards */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className={glassCard}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-cyan-300">
                Pasaportes Creados
              </CardTitle>
              <Users className="h-5 w-5 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{analytics.totalPassports}</div>
              <p className="text-xs text-cyan-200/60 mt-1">Total de usuarios registrados</p>
            </CardContent>
          </Card>

          <Card className={glassCard}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-cyan-300">
                Progreso Promedio
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{analytics.averageProgress.toFixed(1)}%</div>
              <p className="text-xs text-cyan-200/60 mt-1">Media de completación de pasaportes</p>
            </CardContent>
          </Card>

          <Card className={glassCard}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-cyan-300">
                100% Completado
              </CardTitle>
              <Award className="h-5 w-5 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{analytics.usersWithFullProgress}</div>
              <p className="text-xs text-cyan-200/60 mt-1">
                De {analytics.totalPassports} usuarios totales
              </p>
            </CardContent>
          </Card>

          <Card className={glassCard}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-cyan-300">
                Actividades Completadas
              </CardTitle>
              <Activity className="h-5 w-5 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {analytics.completedActivitiesCount}/{analytics.totalActivities}
              </div>
              <p className="text-xs text-cyan-200/60 mt-1">
                {analytics.completionRate.toFixed(1)}% del total
              </p>
            </CardContent>
          </Card>

          <Card className={glassCard}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-cyan-300">
                Tokens Claimeados
              </CardTitle>
              <Coins className="h-5 w-5 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {analytics.totalTokensClaimed.toLocaleString()}
              </div>
              <p className="text-xs text-cyan-200/60 mt-1">SWAG distribuidos a usuarios</p>
            </CardContent>
          </Card>

          <Card className={glassCard}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-cyan-300">
                Productos Comprados
              </CardTitle>
              <ShoppingCart className="h-5 w-5 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{analytics.totalPurchases}</div>
              <p className="text-xs text-cyan-200/60 mt-1">Transacciones completadas</p>
            </CardContent>
          </Card>

          <Card className={glassCard}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-cyan-300">
                Tokens Gastados
              </CardTitle>
              <Coins className="h-5 w-5 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {analytics.totalTokensSpent.toLocaleString()}
              </div>
              <p className="text-xs text-cyan-200/60 mt-1">SWAG utilizados en compras</p>
            </CardContent>
          </Card>

          <Card className={glassCard}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-cyan-300">Engagement</CardTitle>
              <BarChart3 className="h-5 w-5 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {analytics.totalPassports > 0
                  ? ((analytics.usersWithFullProgress / analytics.totalPassports) * 100).toFixed(1)
                  : 0}
                %
              </div>
              <p className="text-xs text-cyan-200/60 mt-1">Tasa de completación</p>
            </CardContent>
          </Card>
        </section>

        {/* Gráficas */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Distribución de Progreso - Pie Chart */}
          <Card className={glassCard}>
            <CardHeader>
              <CardTitle className="text-white">Distribución de Progreso</CardTitle>
              <CardDescription className="text-cyan-200/70">
                Porcentaje de completación de pasaportes por usuario
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] sm:h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={progressDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius="80%"
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {progressDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.9)',
                      border: '1px solid rgba(6, 182, 212, 0.3)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top 5 Actividades Más Completadas - Bar Chart */}
          <Card className={glassCard}>
            <CardHeader>
              <CardTitle className="text-white">Top 5 Actividades</CardTitle>
              <CardDescription className="text-cyan-200/70">
                Actividades con mayor participación
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] sm:h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.topActivities} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(6, 182, 212, 0.1)" />
                  <XAxis type="number" stroke="#06b6d4" />
                  <YAxis
                    type="category"
                    dataKey="activityTitle"
                    stroke="#06b6d4"
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.9)',
                      border: '1px solid rgba(6, 182, 212, 0.3)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="usersCompleted" fill="#06b6d4" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de todas las actividades */}
        <Card className={glassCard}>
          <CardHeader>
            <CardTitle className="text-white">Detalle de Actividades</CardTitle>
            <CardDescription className="text-cyan-200/70">
              Participación detallada por actividad
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cyan-500/20">
                    <th className="pb-3 text-left font-medium text-cyan-300">Actividad</th>
                    <th className="pb-3 text-center font-medium text-cyan-300">Usuarios</th>
                    <th className="pb-3 text-center font-medium text-cyan-300">Tasa</th>
                    <th className="pb-3 text-right font-medium text-cyan-300">Progreso</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.activityStats.map((activity, index) => (
                    <tr
                      key={activity.activityId}
                      className="border-b border-cyan-500/10 transition-colors hover:bg-cyan-500/5"
                    >
                      <td className="py-3 text-white">{activity.activityTitle}</td>
                      <td className="py-3 text-center text-cyan-100">
                        {activity.usersCompleted} / {analytics.totalPassports}
                      </td>
                      <td className="py-3 text-center text-cyan-100">
                        {activity.completionRate.toFixed(1)}%
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-cyan-500/20">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-cyan-600"
                              style={{ width: `${activity.completionRate}%` }}
                            />
                          </div>
                          <span className="text-xs text-cyan-300">
                            {activity.completionRate.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
