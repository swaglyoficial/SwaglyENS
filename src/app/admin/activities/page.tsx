"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Coins,
  Sparkles,
  Gauge,
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

export default function ActivitiesManagement() {
  const [events, setEvents] = useState<any[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [sponsors, setSponsors] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [nfcs, setNfcs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false)
  const [isNFCDialogOpen, setIsNFCDialogOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<any | null>(null)
  const [editingNFC, setEditingNFC] = useState<any | null>(null)

  const [activityForm, setActivityForm] = useState({
    name: "",
    description: "",
    sponsorId: "",
    numOfTokens: 0,
  })

  const [nfcForm, setNfcForm] = useState({
    uuid: "",
    sponsorId: "",
    activityId: "",
  })

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch("/api/events")
        const data = await response.json()
        const events = data.events || []
        setEvents(events)
        if (events.length > 0) {
          setSelectedEventId(events[0].id)
        }
      } catch (error) {
        console.error("Error fetching events:", error)
        setEvents([])
      }
    }

    fetchEvents()
  }, [])

  useEffect(() => {
    if (!selectedEventId) {
      setSponsors([])
      setActivities([])
      setNfcs([])
      return
    }

    async function fetchData() {
      setLoading(true)
      try {
        const sponsorsRes = await fetch(`/api/sponsors?eventId=${selectedEventId}`)
        const { sponsors } = await sponsorsRes.json()
        setSponsors(sponsors)

        const activitiesRes = await fetch(`/api/activities?eventId=${selectedEventId}`)
        const { activities } = await activitiesRes.json()
        setActivities(activities)

        const nfcsRes = await fetch(`/api/nfcs?eventId=${selectedEventId}`)
        const { nfcs } = await nfcsRes.json()
        setNfcs(nfcs)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedEventId])

  const handleActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingActivity
        ? `/api/activities/${editingActivity.id}`
        : "/api/activities"
      const method = editingActivity ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...activityForm,
          eventId: selectedEventId,
        }),
      })

      if (response.ok) {
        setIsActivityDialogOpen(false)
        resetActivityForm()
        const activitiesRes = await fetch(`/api/activities?eventId=${selectedEventId}`)
        const { activities } = await activitiesRes.json()
        setActivities(activities)
      } else {
        const { error } = await response.json()
        alert(error || "Error al guardar actividad")
      }
    } catch (error) {
      console.error("Error saving activity:", error)
      alert("Error al guardar actividad")
    }
  }
  const handleDeleteActivity = async (id: string) => {
    if (!confirm("Eliminar esta actividad? Los NFCs asociados deben eliminarse primero.")) {
      return
    }

    try {
      const response = await fetch(`/api/activities/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        const activitiesRes = await fetch(`/api/activities?eventId=${selectedEventId}`)
        const { activities } = await activitiesRes.json()
        setActivities(activities)
      } else {
        const { error } = await response.json()
        alert(error || "Error al eliminar actividad")
      }
    } catch (error) {
      console.error("Error deleting activity:", error)
    }
  }

  const handleEditActivity = (activity: any) => {
    setEditingActivity(activity)
    setActivityForm({
      name: activity.name,
      description: activity.description,
      sponsorId: activity.sponsorId,
      numOfTokens: activity.numOfTokens,
    })
    setIsActivityDialogOpen(true)
  }

  const resetActivityForm = () => {
    setActivityForm({
      name: "",
      description: "",
      sponsorId: "",
      numOfTokens: 0,
    })
    setEditingActivity(null)
  }

  const handleNFCSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingNFC ? `/api/nfcs/${editingNFC.id}` : "/api/nfcs"
      const method = editingNFC ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...nfcForm,
          eventId: selectedEventId,
        }),
      })

      if (response.ok) {
        setIsNFCDialogOpen(false)
        resetNfcForm()
        const nfcsRes = await fetch(`/api/nfcs?eventId=${selectedEventId}`)
        const { nfcs } = await nfcsRes.json()
        setNfcs(nfcs)
      } else {
        const { error } = await response.json()
        alert(error || "Error al guardar NFC")
      }
    } catch (error) {
      console.error("Error saving NFC:", error)
      alert("Error al guardar NFC")
    }
  }

  const handleDeleteNFC = async (id: string) => {
    if (!confirm("Seguro que deseas eliminar este NFC?")) {
      return
    }

    try {
      const response = await fetch(`/api/nfcs/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        const nfcsRes = await fetch(`/api/nfcs?eventId=${selectedEventId}`)
        const { nfcs } = await nfcsRes.json()
        setNfcs(nfcs)
      } else {
        const { error } = await response.json()
        alert(error || "Error al eliminar NFC")
      }
    } catch (error) {
      console.error("Error deleting NFC:", error)
    }
  }

  const handleEditNFC = (nfc: any) => {
    setEditingNFC(nfc)
    setNfcForm({
      uuid: nfc.uuid,
      sponsorId: nfc.sponsorId,
      activityId: nfc.activityId,
    })
    setIsNFCDialogOpen(true)
  }

  const resetNfcForm = () => {
    setNfcForm({
      uuid: "",
      sponsorId: "",
      activityId: "",
    })
    setEditingNFC(null)
  }
  const selectedEvent = events.find((event) => event.id === selectedEventId)

  const totalTokens = activities.reduce(
    (sum, activity) => sum + (activity.numOfTokens || 0),
    0
  )
  const totalNfcs = nfcs.length
  const availableNfcs = nfcs.filter((nfc) => nfc.status === "available").length

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
              Actividades y NFCs
            </span>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                Disena misiones y check-ins impactantes
              </h1>
              <p className="text-sm text-cyan-200/80 sm:text-base">
                Configura retos, tokens y chips NFC con un layout responsivo que mantiene la estetica neon de Swagly.
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
              open={isActivityDialogOpen}
              onOpenChange={(open) => {
                setIsActivityDialogOpen(open)
                if (!open) resetActivityForm()
              }}
            >
              <DialogTrigger asChild>
                <Button
                  className={`${neonPrimaryButton} w-full sm:w-auto`}
                  disabled={!selectedEventId}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {editingActivity ? "Editar actividad" : "Nueva actividad"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl border-cyan-500/30 bg-black/90 text-cyan-50">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    {editingActivity ? "Editar actividad" : "Crear actividad"}
                  </DialogTitle>
                  <DialogDescription className="text-cyan-200/70">
                    Define la actividad, asigna tokens y vincula un sponsor responsable.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleActivitySubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="activity-name" className="text-cyan-200/80">
                      Nombre de la actividad
                    </Label>
                    <Input
                      id="activity-name"
                      placeholder="Ej: Workshop de Solidity"
                      value={activityForm.name}
                      onChange={(e) =>
                        setActivityForm({ ...activityForm, name: e.target.value })
                      }
                      className="border-cyan-500/30 bg-black/60 text-cyan-100 placeholder:text-cyan-200/50"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="activity-desc" className="text-cyan-200/80">
                      Descripcion
                    </Label>
                    <Textarea
                      id="activity-desc"
                      placeholder="Explica dinamica, requisitos y objetivo de la actividad."
                      value={activityForm.description}
                      onChange={(e) =>
                        setActivityForm({
                          ...activityForm,
                          description: e.target.value,
                        })
                      }
                      className="border-cyan-500/30 bg-black/60 text-cyan-100 placeholder:text-cyan-200/50"
                      rows={4}
                      required
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="activity-sponsor" className="text-cyan-200/80">
                        Sponsor
                      </Label>
                      <Select
                        value={activityForm.sponsorId}
                        onValueChange={(value) =>
                          setActivityForm({ ...activityForm, sponsorId: value })
                        }
                      >
                        <SelectTrigger
                          id="activity-sponsor"
                          className={`${neonOutlineButton} w-full justify-between`}
                        >
                          <SelectValue placeholder="Selecciona sponsor" />
                        </SelectTrigger>
                        <SelectContent className="border-cyan-500/30 bg-black/90 text-cyan-50">
                          {sponsors?.map((sponsor) => (
                            <SelectItem
                              key={sponsor.id}
                              value={sponsor.id}
                              className="focus:bg-cyan-500/20 data-[state=checked]:bg-cyan-500/20"
                            >
                              {sponsor.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="activity-tokens" className="text-cyan-200/80">
                        Tokens SWAG a otorgar
                      </Label>
                      <Input
                        id="activity-tokens"
                        type="number"
                        min="0"
                        placeholder="Ej: 50"
                        value={activityForm.numOfTokens}
                        onChange={(e) =>
                          setActivityForm({
                            ...activityForm,
                            numOfTokens: Number.parseInt(e.target.value, 10) || 0,
                          })
                        }
                        className="border-cyan-500/30 bg-black/60 text-cyan-100"
                        required
                      />
                    </div>
                  </div>

                  <DialogFooter className="gap-2 sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      className={neonOutlineButton}
                      onClick={() => setIsActivityDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" className={neonPrimaryButton}>
                      {editingActivity ? "Guardar" : "Crear"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog
              open={isNFCDialogOpen}
              onOpenChange={(open) => {
                setIsNFCDialogOpen(open)
                if (!open) resetNfcForm()
              }}
            >
              <DialogTrigger asChild>
                <Button
                  className={`${neonOutlineButton} w-full sm:w-auto`}
                  disabled={!selectedEventId || activities.length === 0}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {editingNFC ? "Editar NFC" : "Registrar NFC"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl border-cyan-500/30 bg-black/90 text-cyan-50">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    {editingNFC ? "Editar NFC" : "Registrar NFC"}
                  </DialogTitle>
                  <DialogDescription className="text-cyan-200/70">
                    Liga un identificador fisico a una actividad y sponsor para rastrear escaneos.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleNFCSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="nfc-uuid" className="text-cyan-200/80">
                      UUID del NFC
                    </Label>
                    <Input
                      id="nfc-uuid"
                      placeholder="Ej: 0xA1B2C3D4"
                      value={nfcForm.uuid}
                      onChange={(e) =>
                        setNfcForm({ ...nfcForm, uuid: e.target.value })
                      }
                      className="border-cyan-500/30 bg-black/60 text-cyan-100 placeholder:text-cyan-200/50"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nfc-sponsor" className="text-cyan-200/80">
                      Sponsor
                    </Label>
                    <Select
                      value={nfcForm.sponsorId}
                      onValueChange={(value) =>
                        setNfcForm({ ...nfcForm, sponsorId: value })
                      }
                    >
                      <SelectTrigger
                        id="nfc-sponsor"
                        className={`${neonOutlineButton} w-full justify-between`}
                      >
                        <SelectValue placeholder="Selecciona sponsor" />
                      </SelectTrigger>
                      <SelectContent className="border-cyan-500/30 bg-black/90 text-cyan-50">
                        {sponsors?.map((sponsor) => (
                          <SelectItem
                            key={sponsor.id}
                            value={sponsor.id}
                            className="focus:bg-cyan-500/20 data-[state=checked]:bg-cyan-500/20"
                          >
                            {sponsor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nfc-activity" className="text-cyan-200/80">
                      Actividad
                    </Label>
                    <Select
                      value={nfcForm.activityId}
                      onValueChange={(value) =>
                        setNfcForm({ ...nfcForm, activityId: value })
                      }
                    >
                      <SelectTrigger
                        id="nfc-activity"
                        className={`${neonOutlineButton} w-full justify-between`}
                      >
                        <SelectValue placeholder="Selecciona actividad" />
                      </SelectTrigger>
                      <SelectContent className="border-cyan-500/30 bg-black/90 text-cyan-50">
                        {activities?.map((activity) => (
                          <SelectItem
                            key={activity.id}
                            value={activity.id}
                            className="focus:bg-cyan-500/20 data-[state=checked]:bg-cyan-500/20"
                          >
                            {activity.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <DialogFooter className="gap-2 sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      className={neonOutlineButton}
                      onClick={() => setIsNFCDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" className={neonPrimaryButton}>
                      {editingNFC ? "Guardar" : "Registrar"}
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
              <CardTitle className="text-white">Crea un evento primero</CardTitle>
              <CardDescription className="text-cyan-200/70">
                Necesitas un evento para asociar actividades y NFCs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-cyan-200/80">
              <p>
                Dirigete a Gestion de eventos, crea tu experiencia y vuelve para configurar misiones y check-ins.
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
                    Cambia para editar otras experiencias
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
                      {events?.map((event) => (
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
                    Actividades
                  </CardTitle>
                  <CardDescription className="text-cyan-200/70">
                    Retos vivos dentro del evento
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-end justify-between">
                  <p className="text-4xl font-semibold text-white">{activities.length}</p>
                  <Sparkles className="h-6 w-6 text-cyan-300" />
                </CardContent>
                <div className="px-6 pb-4 text-xs text-cyan-200/70">
                  Mantiene a los asistentes activos y comprometidos
                </div>
              </Card>

              <Card className={glassCard}>
                <CardHeader className="space-y-1 pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                    Tokens asignados
                  </CardTitle>
                  <CardDescription className="text-cyan-200/70">
                    Recompensas totales en juego
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-end justify-between">
                  <div className="flex items-center gap-2 text-white">
                    <Coins className="h-6 w-6 text-cyan-300" />
                    <p className="text-4xl font-semibold">{totalTokens}</p>
                  </div>
                </CardContent>
                <div className="px-6 pb-4 text-xs text-cyan-200/70">
                  Ajusta incentivos segun desempeno del evento
                </div>
              </Card>

              <Card className={glassCard}>
                <CardHeader className="space-y-1 pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                    NFCs activos
                  </CardTitle>
                  <CardDescription className="text-cyan-200/70">
                    Disponibles vs escaneados en vivo
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-end justify-between">
                  <div>
                    <p className="text-4xl font-semibold text-white">{totalNfcs}</p>
                    <p className="text-xs text-cyan-200/70">
                      {availableNfcs} disponibles / {totalNfcs - availableNfcs} escaneados
                    </p>
                  </div>
                  <Gauge className="h-6 w-6 text-cyan-300" />
                </CardContent>
                <div className="px-6 pb-4 text-xs text-cyan-200/70">
                  Verifica inventario antes de cada dinamica
                </div>
              </Card>
            </section>
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className={glassCard}>
                <CardHeader>
                  <CardTitle className="text-white">Actividades</CardTitle>
                  <CardDescription className="text-cyan-200/70">
                    {activities.length} actividad(es) configuradas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="py-12 text-center text-cyan-200/70">
                      Cargando actividades...
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="py-12 text-center text-cyan-200/70">
                      No hay actividades. Crea la primera.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table className="min-w-[700px] text-sm text-cyan-100">
                        <TableHeader>
                          <TableRow className="border-cyan-500/10">
                            <TableHead className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                              Actividad
                            </TableHead>
                            <TableHead className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                              Sponsor
                            </TableHead>
                            <TableHead className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                              Tokens
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
                          {activities?.map((activity) => (
                            <TableRow
                              key={activity.id}
                              className="border-cyan-500/10 transition-colors hover:bg-cyan-500/5"
                            >
                              <TableCell className="max-w-[240px] text-base font-semibold text-white">
                                <p className="truncate" title={activity.name}>
                                  {activity.name}
                                </p>
                                <p className="text-xs text-cyan-200/70">
                                  {activity.description}
                                </p>
                              </TableCell>
                              <TableCell className="text-xs text-cyan-200/80">
                                {activity.sponsor?.name || "Sin sponsor"}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2 text-base text-white">
                                  <Coins className="h-4 w-4 text-cyan-300" />
                                  <span>{activity.numOfTokens}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className="border-cyan-500/40 bg-black/40 text-cyan-200/80">
                                  {activity.nfcTags?.length || 0}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex flex-wrap justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className={iconButtonClasses}
                                    onClick={() => handleEditActivity(activity)}
                                    aria-label="Editar actividad"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="border-red-500/60 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                                    onClick={() => handleDeleteActivity(activity.id)}
                                    aria-label="Eliminar actividad"
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

              <div className="grid gap-6">
                <Card className={glassCard}>
                  <CardHeader>
                    <CardTitle className="text-white">NFCs registrados</CardTitle>
                    <CardDescription className="text-cyan-200/70">
                      Controla estados y escaneos por chip
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="py-12 text-center text-cyan-200/70">
                        Cargando NFCs...
                      </div>
                    ) : nfcs.length === 0 ? (
                      <div className="py-12 text-center text-cyan-200/70">
                        No hay NFCs registrados.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table className="min-w-[700px] text-sm text-cyan-100">
                          <TableHeader>
                            <TableRow className="border-cyan-500/10">
                              <TableHead className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                                UUID
                              </TableHead>
                              <TableHead className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                                Actividad
                              </TableHead>
                              <TableHead className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                                Sponsor
                              </TableHead>
                              <TableHead className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                                Estado
                              </TableHead>
                              <TableHead className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                                Escaneos
                              </TableHead>
                              <TableHead className="text-right text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                                Acciones
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {nfcs?.map((nfc) => (
                              <TableRow
                                key={nfc.id}
                                className="border-cyan-500/10 transition-colors hover:bg-cyan-500/5"
                              >
                                <TableCell className="font-mono text-xs text-cyan-200/80">
                                  {nfc.uuid}
                                </TableCell>
                                <TableCell className="text-xs text-cyan-200/80">
                                  {nfc.activity?.name || "Sin actividad"}
                                </TableCell>
                                <TableCell className="text-xs text-cyan-200/80">
                                  {nfc.sponsor?.name || "Sin sponsor"}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    className={
                                      nfc.status === "available"
                                        ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-100"
                                        : "border-cyan-500/30 bg-black/40 text-cyan-200/70"
                                    }
                                  >
                                    {nfc.status === "available" ? "Disponible" : "Escaneado"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-cyan-200/80">
                                  {nfc.scans?.length || 0}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex flex-wrap justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className={iconButtonClasses}
                                      onClick={() => handleEditNFC(nfc)}
                                      aria-label="Editar NFC"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="border-red-500/60 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                                      onClick={() => handleDeleteNFC(nfc.id)}
                                      aria-label="Eliminar NFC"
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
                    <CardTitle className="text-white">Checklist operativo</CardTitle>
                    <CardDescription className="text-cyan-200/70">
                      Asegura una experiencia fluida para asistentes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-cyan-200/80">
                    <ul className="space-y-2">
                      <li>1. Verifica que cada actividad tenga NFC asignado.</li>
                      <li>2. Prueba escaneos antes de abrir puertas.</li>
                      <li>3. Reasigna chips si detectas fallas en campo.</li>
                      <li>4. Exporta escaneos diarios para validar avances.</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  )
}




