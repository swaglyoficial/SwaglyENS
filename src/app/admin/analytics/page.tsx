"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Users,
  Zap,
  TrendingUp,
  Coins,
  BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

export default function AnalyticsDashboard() {
  const [events, setEvents] = useState<any[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch("/api/events")
        const { events } = await response.json()
        setEvents(events)
        if (events.length > 0) {
          setSelectedEventId(events[0].id)
        }
      } catch (error) {
        console.error("Error fetching events:", error)
      }
    }

    fetchEvents()
  }, [])

  useEffect(() => {
    if (!selectedEventId) return

    async function fetchAnalytics() {
      setLoading(true)
      try {
        const response = await fetch(`/api/analytics?eventId=${selectedEventId}`)
        const { analytics } = await response.json()
        setAnalytics(analytics)
      } catch (error) {
        console.error("Error fetching analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [selectedEventId])

  const glassCard =
    "border-cyan-500/20 bg-black/60 text-cyan-100 shadow-[0_0_28px_rgba(0,240,255,0.1)] backdrop-blur"
  const subtleCard =
    "border-cyan-500/15 bg-white/5 text-cyan-100 shadow-[0_0_18px_rgba(0,240,255,0.08)] backdrop-blur"
  const neonOutlineButton =
    "border-cyan-500/60 bg-black/40 text-cyan-100 hover:bg-cyan-500/10"
  const selectedEvent = events.find((event) => event.id === selectedEventId)

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-cyan-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="neon-grid absolute inset-0 opacity-10" aria-hidden />
        <div
          className="absolute -left-24 top-36 h-72 w-72 rounded-full bg-cyan-500/15 blur-[130px]"
          aria-hidden
        />
        <div
          className="absolute bottom-[-18%] right-[-10%] h-80 w-80 rounded-full bg-cyan-400/20 blur-[140px]"
          aria-hidden
        />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-10">
        <header className="flex flex-col gap-6 rounded-3xl border border-cyan-500/30 bg-black/60 p-6 shadow-[0_0_38px_rgba(0,240,255,0.15)] backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="space-y-4 text-center md:text-left">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
              Dashboard de analiticas
            </span>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                Observa el pulso de tu evento en vivo
              </h1>
              <p className="text-sm text-cyan-200/80 sm:text-base">
                Revisa engagement, emisiones de tokens y actividad de sponsors desde cualquier dispositivo.
              </p>
            </div>
          </div>
          <Button
            asChild
            variant="outline"
            className={`${neonOutlineButton} w-full sm:w-auto`}
          >
            <Link href="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al panel
            </Link>
          </Button>
        </header>
        {events.length === 0 ? (
          <Card className={glassCard}>
            <CardHeader>
              <CardTitle className="text-white">Crea un evento primero</CardTitle>
              <CardDescription className="text-cyan-200/70">
                Necesitas un evento para visualizar metricas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-cyan-200/80">
              <p>
                Dirigete a Gestion de eventos, lanza una experiencia y vuelve para revisar tus datos en tiempo real.
              </p>
              <Button asChild className="bg-cyan-500 text-black shadow-[0_0_28px_rgba(0,240,255,0.35)] hover:bg-cyan-400">
                <Link href="/admin/events">Ir a Gestion de eventos</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Card className={glassCard}>
                <CardHeader className="space-y-1 pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                    Evento seleccionado
                  </CardTitle>
                  <CardDescription className="text-cyan-200/70">
                    Cambia para explorar otras metricas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select
                    value={selectedEventId}
                    onValueChange={(value) => setSelectedEventId(value)}
                  >
                    <SelectTrigger className={`${neonOutlineButton} w-full justify-between`}>
                      <SelectValue placeholder="Selecciona un evento" />
                    </SelectTrigger>
                    <SelectContent className="border-cyan-500/30 bg-black/90 text-cyan-50">
                      {events.map((event) => (
                        <SelectItem
                          key={event.id}
                          value={event.id}
                          className="focus:bg-cyan-500/20 data-[state=checked]:bg-cyan-500/20"
                        >
                          {event.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedEvent && (
                    <p className="text-xs text-cyan-200/70">
                      {new Date(selectedEvent.startDate).toLocaleDateString()} - {new Date(selectedEvent.endDate).toLocaleDateString()}
                    </p>
                  )}
                  {analytics && !loading && (
                    <p className="text-xs text-cyan-200/70">
                      Datos actualizados hace instantes
                    </p>
                  )}
                </CardContent>
              </Card>

              {loading ? (
                <Card className={glassCard}>
                  <CardHeader>
                    <CardTitle className="text-white">Cargando metricas...</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-cyan-200/70">
                      Preparando resumen de usuarios, actividades y tokens.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                analytics && (
                  <>
                    <Card className={glassCard}>
                      <CardHeader className="space-y-1 pb-2">
                        <CardTitle className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                          Usuarios totales
                        </CardTitle>
                        <CardDescription className="text-cyan-200/70">
                          Engagement alto y participacion activa
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex items-end justify-between">
                        <p className="text-4xl font-semibold text-white">{analytics.users.total}</p>
                        <Users className="h-6 w-6 text-cyan-300" />
                      </CardContent>
                      <div className="px-6 pb-4 text-xs text-cyan-200/70">
                        {analytics.users.highEngagement} usuarios superan 50% de progreso
                      </div>
                    </Card>

                    <Card className={glassCard}>
                      <CardHeader className="space-y-1 pb-2">
                        <CardTitle className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                          Actividades completadas
                        </CardTitle>
                        <CardDescription className="text-cyan-200/70">
                          Progreso dentro del recorrido
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex items-end justify-between">
                        <p className="text-4xl font-semibold text-white">{analytics.activities.completed}</p>
                        <Zap className="h-6 w-6 text-cyan-300" />
                      </CardContent>
                      <div className="px-6 pb-4 text-xs text-cyan-200/70">
                        De {analytics.activities.total} actividades disponibles
                      </div>
                    </Card>

                    <Card className={glassCard}>
                      <CardHeader className="space-y-1 pb-2">
                        <CardTitle className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                          Tokens emitidos
                        </CardTitle>
                        <CardDescription className="text-cyan-200/70">
                          Volumen total de SWAG entregado
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex items-end justify-between">
                        <div className="flex items-center gap-2 text-white">
                          <Coins className="h-6 w-6 text-cyan-300" />
                          <p className="text-4xl font-semibold">
                            {analytics.tokens.totalIssued.toLocaleString()}
                          </p>
                        </div>
                      </CardContent>
                      <div className="px-6 pb-4 text-xs text-cyan-200/70">
                        Promedio de {Math.round(analytics.tokens.avgPerUser)} tokens por usuario
                      </div>
                    </Card>
                  </>
                )
              )}
            </section>
            {loading && (
              <p className="text-center text-cyan-200/70">Cargando analiticas...</p>
            )}

            {!loading && !analytics && (
              <Card className={glassCard}>
                <CardHeader>
                  <CardTitle className="text-white">Sin datos disponibles</CardTitle>
                  <CardDescription className="text-cyan-200/70">
                    Aun no hay metricas generadas para este evento.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-cyan-200/80">
                    Ejecuta actividades y registra escaneos para comenzar a poblar el dashboard.
                  </p>
                </CardContent>
              </Card>
            )}

            {!loading && analytics && (
              <>
                <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                  <Card className={glassCard}>
                    <CardHeader>
                      <CardTitle className="text-white">Engagement general</CardTitle>
                      <CardDescription className="text-cyan-200/70">
                        Seguimiento del progreso y retencion de asistentes
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm text-cyan-200/80">
                          <span>Tasa de completacion</span>
                          <span className="font-semibold text-white">
                            {analytics.engagement.completionRate}%
                          </span>
                        </div>
                        <Progress value={analytics.engagement.completionRate} />
                        <p className="text-xs text-cyan-200/70">
                          {analytics.users.completed} usuarios finalizaron todas las actividades
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm text-cyan-200/80">
                          <span>Retencion</span>
                          <span className="font-semibold text-white">
                            {analytics.engagement.retentionRate}%
                          </span>
                        </div>
                        <Progress value={analytics.engagement.retentionRate} />
                        <p className="text-xs text-cyan-200/70">
                          Usuarios que mantienen actividad constante durante el evento
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <Card className={[glassCard, "p-4"].join(" ")}> 
                          <div className="text-sm text-cyan-200/70">Promedio de progreso</div>
                          <div className="text-3xl font-semibold text-white">
                            {analytics.engagement.avgProgress}%
                          </div>
                        </Card>
                        <Card className={[glassCard, "p-4"].join(" ")}> 
                          <div className="text-sm text-cyan-200/70">Usuarios comprometidos</div>
                          <div className="text-3xl font-semibold text-white">
                            {analytics.users.highEngagement}
                          </div>
                        </Card>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={subtleCard}>
                    <CardHeader>
                      <CardTitle className="text-white">Highlights rapidos</CardTitle>
                      <CardDescription className="text-cyan-200/70">
                        Datos clave para compartir con stakeholders
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-cyan-200/80">
                      <div>
                        <p className="font-semibold text-white">Usuarios que completaron todo</p>
                        <p>{analytics.users.completed}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-white">Tokens emitidos</p>
                        <p>{analytics.tokens.totalIssued.toLocaleString()} SWAG</p>
                      </div>
                      <div>
                        <p className="font-semibold text-white">Actividades activas</p>
                        <p>{analytics.activities.total}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Card className={glassCard}>
                    <CardHeader>
                      <CardTitle className="text-white">Estado de NFCs</CardTitle>
                      <CardDescription className="text-cyan-200/70">
                        Disponibles vs escaneados por jornada
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid gap-4 sm:grid-cols-3">
                        <Card className={[glassCard, "p-4 text-center"].join(" ")}> 
                          <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                            Totales
                          </p>
                          <p className="text-3xl font-semibold text-white">
                            {analytics.nfcs.total}
                          </p>
                        </Card>
                        <Card className={[glassCard, "p-4 text-center"].join(" ")}> 
                          <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                            Disponibles
                          </p>
                          <p className="text-3xl font-semibold text-white">
                            {analytics.nfcs.available}
                          </p>
                        </Card>
                        <Card className={[glassCard, "p-4 text-center"].join(" ")}> 
                          <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                            Escaneados
                          </p>
                          <p className="text-3xl font-semibold text-white">
                            {analytics.nfcs.scanned}
                          </p>
                        </Card>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm text-cyan-200/80">
                          <span>Porcentaje escaneado</span>
                          <span className="font-semibold text-white">
                            {analytics.nfcs.total > 0
                              ? Math.round((analytics.nfcs.scanned / analytics.nfcs.total) * 100)
                              : 0}
                            %
                          </span>
                        </div>
                        <Progress
                          value={
                            analytics.nfcs.total > 0
                              ? (analytics.nfcs.scanned / analytics.nfcs.total) * 100
                              : 0
                          }
                        />
                        <p className="text-xs text-cyan-200/70">
                          Considera reponer chips escaneados para evitar cuellos de botella.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={glassCard}>
                    <CardHeader>
                      <CardTitle className="text-white">Usuarios destacados</CardTitle>
                      <CardDescription className="text-cyan-200/70">
                        Top perfiles por engagement y completacion
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-cyan-200/80">
                      <div className="flex items-center justify-between">
                        <span>Engagement alto</span>
                        <span className="font-semibold text-white">
                          {analytics.users.highEngagement}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Usuarios que completaron todo</span>
                        <span className="font-semibold text-white">
                          {analytics.users.completed}
                        </span>
                      </div>
                      <p className="text-xs text-cyan-200/70">
                        Usa estos datos para destacar historias de asistentes y nutrir contenido de redes.
                      </p>
                    </CardContent>
                  </Card>
                </div>
                <Card className={glassCard}>
                  <CardHeader>
                    <CardTitle className="text-white">Ranking de actividades</CardTitle>
                    <CardDescription className="text-cyan-200/70">
                      Actividades con mayor numero de completaciones
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics.activities.ranking.length === 0 ? (
                      <p className="text-center text-cyan-200/70 py-8">
                        Aun no hay actividades completadas.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table className="min-w-[720px] text-sm text-cyan-100">
                          <TableHeader>
                            <TableRow className="border-cyan-500/10">
                              <TableHead className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                                #
                              </TableHead>
                              <TableHead className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                                Actividad
                              </TableHead>
                              <TableHead className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                                Sponsor
                              </TableHead>
                              <TableHead className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                                Completaciones
                              </TableHead>
                              <TableHead className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                                Tokens por actividad
                              </TableHead>
                              <TableHead className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                                Total tokens
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {analytics.activities.ranking.map((activity: any, index: number) => (
                              <TableRow
                                key={activity.id}
                                className="border-cyan-500/10 transition-colors hover:bg-cyan-500/5"
                              >
                                <TableCell>
                                  <Badge
                                    variant={index < 3 ? "secondary" : "outline"}
                                    className="border-cyan-500/40 bg-black/40 text-cyan-100"
                                  >
                                    {index + 1}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-white">{activity.name}</TableCell>
                                <TableCell className="text-cyan-200/80">{activity.sponsor}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2 text-white">
                                    <TrendingUp className="h-4 w-4 text-cyan-300" />
                                    <span className="font-semibold">{activity.completions}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1 text-white">
                                    <Coins className="h-4 w-4 text-cyan-300" />
                                    <span>{activity.tokensPerCompletion}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="font-semibold text-white">
                                  {activity.totalTokensIssued.toLocaleString()}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className={glassCard}>
                  <CardHeader>
                    <CardTitle className="text-white">Engagement por sponsor</CardTitle>
                    <CardDescription className="text-cyan-200/70">
                      Participacion, tokens y escaneos por marca
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics.sponsors.length === 0 ? (
                      <p className="text-center text-cyan-200/70 py-8">
                        Aun no hay datos de sponsors.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table className="min-w-[720px] text-sm text-cyan-100">
                          <TableHeader>
                            <TableRow className="border-cyan-500/10">
                              <TableHead className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                                Sponsor
                              </TableHead>
                              <TableHead className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                                Actividades
                              </TableHead>
                              <TableHead className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                                Completaciones
                              </TableHead>
                              <TableHead className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                                Tokens emitidos
                              </TableHead>
                              <TableHead className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                                Escaneos NFC
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {analytics.sponsors.map((sponsor: any) => (
                              <TableRow
                                key={sponsor.sponsorId}
                                className="border-cyan-500/10 transition-colors hover:bg-cyan-500/5"
                              >
                                <TableCell className="text-white">{sponsor.sponsorName}</TableCell>
                                <TableCell className="text-cyan-200/80">{sponsor.totalActivities}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2 text-white">
                                    <BarChart3 className="h-4 w-4 text-cyan-300" />
                                    <span className="font-semibold">{sponsor.totalCompletions}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1 text-white">
                                    <Coins className="h-4 w-4 text-cyan-300" />
                                    <span className="font-semibold">
                                      {sponsor.tokensIssued.toLocaleString()}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-cyan-200/80">{sponsor.nfcScans}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </>
        )}
      </div>
    </main>
  )
}





