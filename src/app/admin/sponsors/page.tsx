"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Building2,
  Sparkles,
  QrCode,
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

export default function SponsorsManagement() {
  const [events, setEvents] = useState<any[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [sponsors, setSponsors] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSponsor, setEditingSponsor] = useState<any | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

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

  const loadSponsors = async (eventId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/sponsors?eventId=${eventId}`)
      const { sponsors } = await response.json()
      setSponsors(sponsors)
    } catch (error) {
      console.error("Error fetching sponsors:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!selectedEventId) {
      setSponsors([])
      return
    }

    loadSponsors(selectedEventId)
  }, [selectedEventId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedEventId) {
      alert("Selecciona un evento antes de crear un sponsor")
      return
    }

    try {
      const url = editingSponsor
        ? `/api/sponsors/${editingSponsor.id}`
        : "/api/sponsors"
      const method = editingSponsor ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          eventId: selectedEventId,
        }),
      })

      if (response.ok) {
        setIsDialogOpen(false)
        resetForm()
        loadSponsors(selectedEventId)
      } else {
        const { error } = await response.json()
        alert(error || "Error al guardar el sponsor")
      }
    } catch (error) {
      console.error("Error saving sponsor:", error)
      alert("Error al guardar el sponsor")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminaras al sponsor y sus asociaciones. Continuar?")) {
      return
    }

    try {
      const response = await fetch(`/api/sponsors/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        loadSponsors(selectedEventId)
      } else {
        const { error } = await response.json()
        alert(error || "Error al eliminar el sponsor")
      }
    } catch (error) {
      console.error("Error deleting sponsor:", error)
      alert("Error al eliminar el sponsor")
    }
  }

  const handleEdit = (sponsor: any) => {
    setEditingSponsor(sponsor)
    setFormData({
      name: sponsor.name,
      description: sponsor.description,
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setEditingSponsor(null)
    setFormData({
      name: "",
      description: "",
    })
  }

  const selectedEvent = events.find((event) => event.id === selectedEventId)
  const totalActivities = sponsors.reduce(
    (sum, sponsor) => sum + (sponsor.activities?.length || 0),
    0
  )
  const totalNfc = sponsors.reduce(
    (sum, sponsor) => sum + (sponsor.nfcTags?.length || 0),
    0
  )

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
              Gestion de sponsors
            </span>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                Conecta marcas con experiencias
              </h1>
              <p className="text-sm text-cyan-200/80 sm:text-base">
                Define beneficios, visibilidad y actividades para cada aliado estrategico del evento.
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
                <Button
                  className={`${neonPrimaryButton} w-full sm:w-auto`}
                  disabled={!selectedEventId}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {editingSponsor ? "Editar sponsor" : "Nuevo sponsor"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl border-cyan-500/30 bg-black/90 text-cyan-50">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    {editingSponsor ? "Editar sponsor" : "Crear sponsor"}
                  </DialogTitle>
                  <DialogDescription className="text-cyan-200/70">
                    Completa los datos principales del patrocinador y asignalo al evento seleccionado.
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-cyan-200/80">
                      Nombre del sponsor
                    </Label>
                    <Input
                      id="name"
                      placeholder="Ej: Polygon, Chainlink"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="border-cyan-500/30 bg-black/60 text-cyan-100 placeholder:text-cyan-200/50"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-cyan-200/80">
                      Descripcion
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Describe beneficios, activaciones y presencia de la marca."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="border-cyan-500/30 bg-black/60 text-cyan-100 placeholder:text-cyan-200/50"
                      rows={4}
                      required
                    />
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
                      {editingSponsor ? "Guardar cambios" : "Crear sponsor"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {events.length === 0 ? (
          <Card className={glassCard}>
            <CardHeader>
              <CardTitle className="text-white">Necesitas un evento</CardTitle>
              <CardDescription className="text-cyan-200/70">
                Crea un evento desde el panel principal para comenzar a invitar sponsors.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-cyan-200/80">
              <p>
                Aun no hay eventos disponibles. Dirigete a Gestion de eventos, crea una experiencia y vuelve para conectar marcas.
              </p>
              <Button asChild className={neonPrimaryButton}>
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
                    Cambia para administrar otros sponsors
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
                      {new Date(selectedEvent.startDate).toLocaleDateString()} -
                      {" "}
                      {new Date(selectedEvent.endDate).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className={glassCard}>
                <CardHeader className="space-y-1 pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                    Sponsors activos
                  </CardTitle>
                  <CardDescription className="text-cyan-200/70">
                    Marcas disponibles para el evento
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-end justify-between">
                  <p className="text-4xl font-semibold text-white">{sponsors.length}</p>
                  <Building2 className="h-6 w-6 text-cyan-300" />
                </CardContent>
                <div className="px-6 pb-4 text-xs text-cyan-200/70">
                  Mantener aliados activos impulsa la experiencia
                </div>
              </Card>

              <Card className={glassCard}>
                <CardHeader className="space-y-1 pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                    Actividades asignadas
                  </CardTitle>
                  <CardDescription className="text-cyan-200/70">
                    Workshops, retos y sesiones especiales
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-end justify-between">
                  <p className="text-4xl font-semibold text-white">{totalActivities}</p>
                  <Sparkles className="h-6 w-6 text-cyan-300" />
                </CardContent>
                <div className="px-6 pb-4 text-xs text-cyan-200/70">
                  Alinea objetivos y recompensas por sponsor
                </div>
              </Card>

              <Card className={glassCard}>
                <CardHeader className="space-y-1 pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                    NFCs vinculados
                  </CardTitle>
                  <CardDescription className="text-cyan-200/70">
                    Check-ins y activaciones fisicas
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-end justify-between">
                  <p className="text-4xl font-semibold text-white">{totalNfc}</p>
                  <QrCode className="h-6 w-6 text-cyan-300" />
                </CardContent>
                <div className="px-6 pb-4 text-xs text-cyan-200/70">
                  Sincroniza inventario antes de abrir puertas
                </div>
              </Card>
            </section>

            <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
              <Card className={glassCard}>
                <CardHeader>
                  <CardTitle className="text-white">Sponsors del evento</CardTitle>
                  <CardDescription className="text-cyan-200/70">
                    Gestiona beneficios, actividades y activos NFC
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="py-12 text-center text-cyan-200/70">
                      Cargando sponsors...
                    </div>
                  ) : sponsors.length === 0 ? (
                    <div className="py-12 text-center text-cyan-200/70">
                      Todavia no hay sponsors asignados. Crea el primero para comenzar.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table className="min-w-[720px] text-sm text-cyan-100">
                        <TableHeader>
                          <TableRow className="border-cyan-500/10">
                            <TableHead className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                              Sponsor
                            </TableHead>
                            <TableHead className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                              Descripcion
                            </TableHead>
                            <TableHead className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                              Actividades
                            </TableHead>
                            <TableHead className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                              NFCs
                            </TableHead>
                            <TableHead className="text-right text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                              Acciones
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sponsors.map((sponsor) => (
                            <TableRow
                              key={sponsor.id}
                              className="border-cyan-500/10 transition-colors hover:bg-cyan-500/5"
                            >
                              <TableCell className="text-base font-semibold text-white">
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-5 w-5 text-cyan-300" />
                                  <span>{sponsor.name}</span>
                                </div>
                              </TableCell>
                              <TableCell className="max-w-[280px] text-xs text-cyan-200/70">
                                {sponsor.description}
                              </TableCell>
                              <TableCell>
                                <Badge className="border-cyan-500/40 bg-black/40 text-cyan-200/80">
                                  {sponsor.activities?.length || 0}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className="border-cyan-500/40 bg-black/40 text-cyan-200/80">
                                  {sponsor.nfcTags?.length || 0}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex flex-wrap justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className={iconButtonClasses}
                                    onClick={() => handleEdit(sponsor)}
                                    aria-label="Editar sponsor"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="border-red-500/60 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                                    onClick={() => handleDelete(sponsor.id)}
                                    aria-label="Eliminar sponsor"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className={subtleCard}>
                <CardHeader>
                  <CardTitle className="text-white">Tips de colaboracion</CardTitle>
                  <CardDescription className="text-cyan-200/70">
                    Mantener a tus sponsors felices es clave
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-cyan-200/80">
                  <ul className="space-y-2">
                    <li>1. Define KPIs para cada marca desde el inicio.</li>
                    <li>2. Documenta materiales y necesidades logisticas.</li>
                    <li>3. Comunica performances usando el dashboard de analiticas.</li>
                    <li>4. Renueva acuerdos basados en engagement real.</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
