"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Calendar, Users, Zap, Building2, ShoppingBag, ShoppingCart, CheckCircle2, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type DashboardStats = {
  totalEvents: number
  activeEvents: number
  totalUsers: number
  totalActivities: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    activeEvents: 0,
    totalUsers: 0,
    totalActivities: 0,
  })

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/events")
        const { events } = await response.json()

        const now = new Date()
        const activeEvents = events.filter(
          (event: any) =>
            new Date(event.startDate) <= now && new Date(event.endDate) >= now
        )

        const totalActivities = events.reduce(
          (sum: number, event: any) => sum + (event.activities?.length || 0),
          0
        )

        const totalUsers = events.reduce(
          (sum: number, event: any) => sum + (event.passports?.length || 0),
          0
        )

        setStats({
          totalEvents: events.length,
          activeEvents: activeEvents.length,
          totalUsers,
          totalActivities,
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      }
    }

    fetchStats()
  }, [])

  const glassCard =
    "border-cyan-500/20 bg-black/60 text-cyan-100 shadow-[0_0_28px_rgba(0,240,255,0.1)] backdrop-blur"
  const minimalCard =
    "border-cyan-500/15 bg-white/5 text-cyan-100 shadow-[0_0_18px_rgba(0,240,255,0.08)] backdrop-blur"

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-cyan-50">
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

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-10">
        <header className="flex flex-col gap-6 rounded-3xl border border-cyan-500/30 bg-black/60 p-6 text-center shadow-[0_0_38px_rgba(0,240,255,0.15)] backdrop-blur sm:gap-8 md:flex-row md:items-center md:justify-between md:text-left">
          <div className="space-y-4">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
              Admin panel
            </span>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                Panel de Administracion
              </h1>
              <p className="text-sm text-cyan-200/80 sm:text-base">
                Gestiona eventos, sponsors, actividades y metricas.
              </p>
            </div>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto md:justify-end">
            <Button
              asChild
              className="w-full bg-cyan-500 text-black shadow-[0_0_24px_rgba(0,240,255,0.35)] hover:bg-cyan-400 sm:w-auto"
            >
              <Link href="/admin/analytics">
                <BarChart3 className="mr-2 h-4 w-4" />
                Ver Analíticas
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full border-cyan-500/60 bg-black/40 text-cyan-100 hover:bg-cyan-500/10 sm:w-auto"
            >
              <Link href="/">Ir a la app</Link>
            </Button>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Card className={glassCard}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                Total eventos
              </CardTitle>
              <Calendar className="h-5 w-5 text-cyan-300" />
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-semibold text-white">{stats.totalEvents}</p>
            </CardContent>
          </Card>

          <Card className={glassCard}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                Total usuarios
              </CardTitle>
              <Users className="h-5 w-5 text-cyan-300" />
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-semibold text-white">{stats.totalUsers}</p>
            </CardContent>
          </Card>

          <Card className={glassCard}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                Total actividades
              </CardTitle>
              <Zap className="h-5 w-5 text-cyan-300" />
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-semibold text-white">{stats.totalActivities}</p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          <Card className={minimalCard}>
            <CardHeader>
              <CardTitle className="text-lg text-white">Gestion de eventos</CardTitle>
              <CardDescription className="text-sm text-cyan-200/80">
                Crea/edita/borra eventos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <Button
                asChild
                className="w-full bg-cyan-500 text-black shadow-[0_0_24px_rgba(0,240,255,0.35)] hover:bg-cyan-400"
              >
                <Link href="/admin/events">Gestionar eventos</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className={minimalCard}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <Building2 className="h-5 w-5 text-cyan-300" />
                Gestion de sponsors
              </CardTitle>
              <CardDescription className="text-sm text-cyan-200/80">
                Crea/edita/borra sponsors de cada evento.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <Button
                asChild
                className="w-full bg-cyan-500 text-black shadow-[0_0_24px_rgba(0,240,255,0.35)] hover:bg-cyan-400"
              >
                <Link href="/admin/sponsors">Gestionar sponsors</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className={minimalCard}>
            <CardHeader>
              <CardTitle className="text-lg text-white">Actividades y NFCs</CardTitle>
              <CardDescription className="text-sm text-cyan-200/80">
                Crea/edita/borra actividades de cada evento.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <Button
                asChild
                className="w-full bg-cyan-500 text-black shadow-[0_0_24px_rgba(0,240,255,0.35)] hover:bg-cyan-400"
              >
                <Link href="/admin/activities">Gestionar actividades</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className={minimalCard}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <ShoppingBag className="h-5 w-5 text-cyan-300" />
                Tienda SWAG
              </CardTitle>
              <CardDescription className="text-sm text-cyan-200/80">
                Administra productos de la tienda.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <Button
                asChild
                className="w-full bg-cyan-500 text-black shadow-[0_0_24px_rgba(0,240,255,0.35)] hover:bg-cyan-400"
              >
                <Link href="/admin/products">Gestionar productos</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className={minimalCard}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <ShoppingCart className="h-5 w-5 text-cyan-300" />
                Compras SWAG
              </CardTitle>
              <CardDescription className="text-sm text-cyan-200/80">
                Visualiza todas las transacciones.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <Button
                asChild
                className="w-full bg-cyan-500 text-black shadow-[0_0_24px_rgba(0,240,255,0.35)] hover:bg-cyan-400"
              >
                <Link href="/admin/purchases">Ver compras</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className={minimalCard}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <CheckCircle2 className="h-5 w-5 text-cyan-300" />
                Validación de Evidencias
              </CardTitle>
              <CardDescription className="text-sm text-cyan-200/80">
                Revisa y valida evidencias de actividades.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <Button
                asChild
                className="w-full bg-cyan-500 text-black shadow-[0_0_24px_rgba(0,240,255,0.35)] hover:bg-cyan-400"
              >
                <Link href="/admin/proofs">Validar evidencias</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
