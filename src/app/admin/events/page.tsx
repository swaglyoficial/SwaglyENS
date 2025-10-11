'use client'

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Users,
  Zap,
  Building2,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface Event {
  id: string
  name: string
  description: string
  startDate: string
  endDate: string
  sponsors?: any[]
  activities?: any[]
  nfcTags?: any[]
  passports?: any[]
}

export default function EventsManagement() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
  })

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/events")
      const { events } = await response.json()
      setEvents(events)
    } catch (error) {
      console.error("Error fetching events:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingEvent ? `/api/events/${editingEvent.id}` : "/api/events"
      const method = editingEvent ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setIsDialogOpen(false)
        resetForm()
        fetchEvents()
      } else {
        const { error } = await response.json()
        alert(error || "Error al guardar el evento")
      }
    } catch (error) {
      console.error("Error saving event:", error)
      alert("Error al guardar el evento")
    }
  }

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Estas seguro de eliminar este evento? Esta accion eliminara sponsors, actividades y NFCs asociados."
      )
    ) {
      return
    }

    try {
      const response = await fetch(`/api/events/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchEvents()
      } else {
        const { error } = await response.json()
        alert(error || "Error al eliminar el evento")
      }
    } catch (error) {
      console.error("Error deleting event:", error)
      alert("Error al eliminar el evento")
    }
  }

  const handleEdit = (event: Event) => {
    setEditingEvent(event)
    setFormData({
      name: event.name,
      description: event.description,
      startDate: event.startDate ? event.startDate.slice(0, 16) : "",
      endDate: event.endDate ? event.endDate.slice(0, 16) : "",
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setEditingEvent(null)
    setFormData({
      name: "",
      description: "",
      startDate: "",
      endDate: "",
    })
  }

  const glassCard =
    "border-cyan-500/20 bg-black/60 text-cyan-100 shadow-[0_0_28px_rgba(0,240,255,0.1)] backdrop-blur"
  const subtleCard =
    "border-cyan-500/15 bg-white/5 text-cyan-100 shadow-[0_0_18px_rgba(0,240,255,0.08)] backdrop-blur"
  const neonPrimaryButton =
    "bg-cyan-500 text-black shadow-[0_0_28px_rgba(0,240,255,0.35)] hover:bg-cyan-400"
  const neonOutlineButton =
    "border-cyan-500/60 bg-black/40 text-cyan-100 hover:bg-cyan-500/10"
  const iconButtonClasses =
    "border-cyan-500/40 bg-black/40 text-cyan-100 hover:bg-cyan-500/10"

  const totalSponsors = events.reduce(
    (sum, event) => sum + (event.sponsors?.length || 0),
    0
  )
  const totalActivities = events.reduce(
    (sum, event) => sum + (event.activities?.length || 0),
    0
  )
  const totalPassports = events.reduce(
    (sum, event) => sum + (event.passports?.length || 0),
    0
  )
  const activeEvents = events.filter((event) => isEventActive(event)).length

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
              Gestion de eventos
            </span>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                Construye experiencias memorables
              </h1>
              <p className="text-sm text-cyan-200/80 sm:text-base">
                Controla fechas, sponsors, actividades y NFCs.
              </p>
            </div>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto md:justify-end">
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
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open)
                if (!open) resetForm()
              }}
            >
              <DialogTrigger asChild>
                <Button className={`${neonPrimaryButton} w-full sm:w-auto`}>
                  <Plus className="mr-2 h-4 w-4" />
                  {editingEvent ? "Editar evento" : "Nuevo evento"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl border-cyan-500/30 bg-black/90 text-cyan-50">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    {editingEvent ? "Editar evento" : "Crear evento"}
                  </DialogTitle>
                  <DialogDescription className="text-cyan-200/70">
                    Define la informacion base del evento. Podras actualizarla cuando quieras.
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="name" className="text-cyan-200/80">
                        Nombre del evento
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Hackathon Swagly 2025"
                        className="border-cyan-500/30 bg-black/60 text-cyan-100 placeholder:text-cyan-200/50"
                        required
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="description" className="text-cyan-200/80">
                        Descripcion
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        rows={4}
                        placeholder="Resume la dinamica del evento, horarios y metas."
                        className="border-cyan-500/30 bg-black/60 text-cyan-100 placeholder:text-cyan-200/50"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="startDate" className="text-cyan-200/80">
                        Fecha de inicio
                      </Label>
                      <div className="relative">
                        <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300" />
                        <Input
                          id="startDate"
                          type="datetime-local"
                          value={formData.startDate}
                          onChange={(e) =>
                            setFormData({ ...formData, startDate: e.target.value })
                          }
                          className="border-cyan-500/30 bg-black/60 pl-10 text-cyan-100"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate" className="text-cyan-200/80">
                        Fecha de cierre
                      </Label>
                      <div className="relative">
                        <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300" />
                        <Input
                          id="endDate"
                          type="datetime-local"
                          value={formData.endDate}
                          onChange={(e) =>
                            setFormData({ ...formData, endDate: e.target.value })
                          }
                          className="border-cyan-500/30 bg-black/60 pl-10 text-cyan-100"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="gap-2 sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      className={neonOutlineButton}
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" className={neonPrimaryButton}>
                      {editingEvent ? "Guardar cambios" : "Crear evento"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className={glassCard}>
            <CardHeader className="space-y-1 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                Eventos totales
              </CardTitle>
              <CardDescription className="text-cyan-200/70">
                Resumen general de Swagly
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <p className="text-4xl font-semibold text-white">{events.length}</p>
              <Calendar className="h-6 w-6 text-cyan-300" />
            </CardContent>
          </Card>

          <Card className={glassCard}>
            <CardHeader className="space-y-1 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                Actividades
              </CardTitle>
              <CardDescription className="text-cyan-200/70">
                Misiones y workshops vinculado
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <p className="text-4xl font-semibold text-white">{totalActivities}</p>
              <Zap className="h-6 w-6 text-cyan-300" />
            </CardContent>
          </Card>

          <Card className={glassCard}>
            <CardHeader className="space-y-1 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                Sponsors gestionados
              </CardTitle>
              <CardDescription className="text-cyan-200/70">
                Marcas presentes en tus eventos
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <p className="text-4xl font-semibold text-white">{totalSponsors}</p>
              <Building2 className="h-6 w-6 text-cyan-300" />
            </CardContent>
          </Card>

          <Card className={glassCard}>
            <CardHeader className="space-y-1 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                Pasaportes generados
              </CardTitle>
              <CardDescription className="text-cyan-200/70">
                Usuarios que viven la experiencia
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <p className="text-4xl font-semibold text-white">{totalPassports}</p>
              <Users className="h-6 w-6 text-cyan-300" />
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6">
          <Card className={glassCard}>
            <CardHeader>
              <CardTitle className="text-white">Eventos registrados</CardTitle>
              <CardDescription className="text-cyan-200/70">
                {events.length} evento(s) en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <div className="py-12 text-center text-cyan-200/70">
                  Cargando eventos...
                </div>
              ) : events.length === 0 ? (
                <div className="py-12 text-center text-cyan-200/70">
                  No hay eventos creados. Crea tu primer evento.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table className="min-w-[720px] text-sm text-cyan-100">
                    <TableHeader>
                      <TableRow className="border-cyan-500/10">
                        <TableHead className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                          Nombre
                        </TableHead>
                        <TableHead className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                          Estado
                        </TableHead>
                        <TableHead className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                          Fechas
                        </TableHead>
                        <TableHead className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                          Estadisticas
                        </TableHead>
                        <TableHead className="text-right text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                          Acciones
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {events.map((event) => (
                        <TableRow
                          key={event.id}
                          className="border-cyan-500/10 transition-colors hover:bg-cyan-500/5"
                        >
                          <TableCell className="max-w-[220px] text-base font-semibold text-white">
                            <p className="truncate" title={event.name}>
                              {event.name}
                            </p>
                            <p className="text-xs text-cyan-200/70">
                              {event.description}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={
                                isEventActive(event)
                                  ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-100"
                                  : "border-cyan-500/30 bg-black/40 text-cyan-200/70"
                              }
                            >
                              {isEventActive(event) ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-xs text-cyan-200/80">
                              <Calendar className="h-4 w-4 text-cyan-300" />
                              <div className="space-y-1">
                                <p>{new Date(event.startDate).toLocaleDateString()}</p>
                                <p className="text-cyan-200/60">
                                  {new Date(event.endDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-xs text-cyan-200/80">
                              <p>{event.sponsors?.length || 0} sponsors</p>
                              <p>{event.activities?.length || 0} actividades</p>
                              <p>{event.nfcTags?.length || 0} NFCs</p>
                              <p>{event.passports?.length || 0} usuarios</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-wrap justify-end gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className={iconButtonClasses}
                                onClick={() => handleEdit(event)}
                                aria-label="Editar evento"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="border-red-500/60 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                                onClick={() => handleDelete(event.id)}
                                aria-label="Eliminar evento"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button
                                asChild
                                size="sm"
                                className={`${neonPrimaryButton} px-4`}
                              >
                                <Link href={`/admin/events/${event.id}`}>
                                  Ver detalles
                                </Link>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    </Table>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-500/20 bg-black/40 p-4 text-xs text-cyan-200/70">
                    <span>{activeEvents} eventos activos hoy - {events.length} totales</span>
                    <span className="font-semibold text-cyan-100">Usa "Ver detalles" para actualizar rapidamente cada ficha.</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}

function isEventActive(event: Event) {
  const now = new Date()
  const start = new Date(event.startDate)
  const end = new Date(event.endDate)
  return start <= now && end >= now
}



















