'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Calendar,
  ExternalLink,
  Loader2,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ActivityProof {
  id: string
  userId: string
  activityId: string
  passportId: string
  proofType: string
  textProof: string | null
  imageUrl: string | null
  status: 'pending' | 'approved' | 'rejected'
  validatedBy: string | null
  validatedAt: string | null
  rejectionReason: string | null
  tokensAwarded: number
  transactionHash: string | null
  createdAt: string
  user: {
    id: string
    nickname: string
    walletAddress: string
  }
  activity: {
    id: string
    name: string
    description: string
    numOfTokens: number
    sponsor: {
      name: string
    }
  }
  passport: {
    event: {
      name: string
    }
  }
}

export default function ProofsManagement() {
  const [proofs, setProofs] = useState<ActivityProof[]>([])
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected'>('pending')

  // Dialog states
  const [selectedProof, setSelectedProof] = useState<ActivityProof | null>(null)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const loadProofs = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/proofs?status=${statusFilter}`)
      const data = await response.json()

      if (data.success) {
        setProofs(data.proofs)
        setCounts(data.counts)
      }
    } catch (error) {
      console.error('Error fetching proofs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProofs()
  }, [statusFilter])

  const handleApprove = async () => {
    if (!selectedProof) return

    setIsProcessing(true)
    try {
      const response = await fetch(`/api/admin/proofs/${selectedProof.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success) {
        setShowApproveDialog(false)
        setSelectedProof(null)
        loadProofs() // Refresh list
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error approving proof:', error)
      alert('Error al aprobar la evidencia')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedProof || !rejectionReason.trim()) {
      alert('Por favor ingresa un motivo de rechazo')
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch(`/api/admin/proofs/${selectedProof.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: rejectionReason }),
      })

      const data = await response.json()

      if (data.success) {
        setShowRejectDialog(false)
        setSelectedProof(null)
        setRejectionReason('')
        loadProofs() // Refresh list
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error rejecting proof:', error)
      alert('Error al rechazar la evidencia')
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pendiente</Badge>
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Aprobada</Badge>
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Rechazada</Badge>
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0A0A0A] to-black p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/admin">
              <Button
                variant="ghost"
                className="mb-4 text-white/70 hover:text-white"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Admin
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-white sm:text-4xl">
              Validación de Evidencias
            </h1>
            <p className="mt-2 text-white/70">
              Revisa y valida las evidencias enviadas por los usuarios
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card className="border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="text-yellow-400">Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-8 w-8 text-yellow-400" />
                <span className="text-4xl font-bold text-white">{counts.pending}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-500/30 bg-gradient-to-br from-green-500/10 to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-400">Aprobadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-8 w-8 text-green-400" />
                <span className="text-4xl font-bold text-white">{counts.approved}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-500/30 bg-gradient-to-br from-red-500/10 to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="text-red-400">Rechazadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <XCircle className="h-8 w-8 text-red-400" />
                <span className="text-4xl font-bold text-white">{counts.rejected}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtrar por estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="approved">Aprobadas</SelectItem>
                <SelectItem value="rejected">Rechazadas</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Proofs List */}
        <Card>
          <CardHeader>
            <CardTitle>Evidencias {statusFilter === 'pending' ? 'Pendientes' : statusFilter === 'approved' ? 'Aprobadas' : 'Rechazadas'}</CardTitle>
            <CardDescription>
              {proofs.length} evidencia{proofs.length !== 1 ? 's' : ''} encontrada{proofs.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-[#5061EC]" />
              </div>
            ) : proofs.length === 0 ? (
              <div className="py-8 text-center text-white/60">
                No hay evidencias {statusFilter === 'pending' ? 'pendientes' : statusFilter === 'approved' ? 'aprobadas' : 'rechazadas'}
              </div>
            ) : (
              <div className="space-y-4">
                {proofs.map((proof) => (
                  <div
                    key={proof.id}
                    className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4 transition-all hover:border-white/20"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      {/* Left side - Info */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-white">{proof.activity.name}</h3>
                            <p className="text-sm text-white/60">
                              {proof.activity.sponsor.name} • {proof.passport.event.name}
                            </p>
                          </div>
                          {getStatusBadge(proof.status)}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{proof.user.nickname}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(proof.createdAt).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Text Proof */}
                        {proof.textProof && (
                          <div className="rounded-lg border border-[#5061EC]/20 bg-[#5061EC]/5 p-3">
                            <p className="text-xs font-semibold text-[#5061EC] mb-1">Descripción:</p>
                            <p className="text-sm text-white/90">{proof.textProof}</p>
                          </div>
                        )}

                        {/* Rejection Reason */}
                        {proof.status === 'rejected' && proof.rejectionReason && (
                          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
                            <p className="text-xs font-semibold text-red-400 mb-1">Motivo de rechazo:</p>
                            <p className="text-sm text-red-200">{proof.rejectionReason}</p>
                          </div>
                        )}

                        {/* Transaction Hash */}
                        {proof.transactionHash && (
                          <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3">
                            <p className="text-xs font-semibold text-green-400 mb-1">Transaction Hash:</p>
                            <div className="flex items-center gap-2">
                              <code className="text-xs text-green-200 break-all">{proof.transactionHash}</code>
                              <a
                                href={`https://sepolia.scrollscan.com/tx/${proof.transactionHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0"
                              >
                                <ExternalLink className="h-4 w-4 text-green-400 hover:text-green-300" />
                              </a>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right side - Image and Actions */}
                      <div className="flex flex-col gap-3 lg:w-72">
                        {/* Image Preview */}
                        {proof.imageUrl && (
                          <div className="relative h-48 w-full overflow-hidden rounded-lg border border-white/20">
                            <Image
                              src={proof.imageUrl}
                              alt="Evidencia"
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}

                        {/* Action Buttons - Only for pending */}
                        {proof.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => {
                                setSelectedProof(proof)
                                setShowApproveDialog(true)
                              }}
                              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white hover:opacity-90"
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Aprobar
                            </Button>
                            <Button
                              onClick={() => {
                                setSelectedProof(proof)
                                setShowRejectDialog(true)
                              }}
                              variant="destructive"
                              className="flex-1"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Rechazar
                            </Button>
                          </div>
                        )}

                        {/* Tokens Badge */}
                        <div className="rounded-full bg-gradient-to-r from-[#FEE887]/30 to-[#FFFACD]/20 px-4 py-2 text-center">
                          <span className="text-lg font-bold text-[#FEE887]">
                            {proof.activity.numOfTokens} SWAG
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="border-[#5061EC]/30 bg-black/95 text-white backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Aprobar Evidencia</DialogTitle>
            <DialogDescription className="text-white/70">
              ¿Estás seguro de que quieres aprobar esta evidencia? Los tokens serán enviados automáticamente al usuario.
            </DialogDescription>
          </DialogHeader>

          {selectedProof && (
            <div className="space-y-3 py-4">
              <div className="rounded-lg border border-[#5061EC]/20 bg-[#5061EC]/10 p-4">
                <p className="text-sm text-white/80">
                  <strong>Actividad:</strong> {selectedProof.activity.name}
                </p>
                <p className="text-sm text-white/80 mt-1">
                  <strong>Usuario:</strong> {selectedProof.user.nickname}
                </p>
                <p className="text-sm text-white/80 mt-1">
                  <strong>Tokens a enviar:</strong> {selectedProof.activity.numOfTokens} SWAG
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
              disabled={isProcessing}
              className="border-[#5061EC]/30 text-white hover:bg-[#5061EC]/10"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isProcessing}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:opacity-90"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Aprobar y Enviar Tokens
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="border-[#5061EC]/30 bg-black/95 text-white backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Rechazar Evidencia</DialogTitle>
            <DialogDescription className="text-white/70">
              Por favor proporciona un motivo claro del rechazo para que el usuario pueda corregir y reenviar su evidencia.
            </DialogDescription>
          </DialogHeader>

          {selectedProof && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
                <p className="text-sm text-white/80">
                  <strong>Actividad:</strong> {selectedProof.activity.name}
                </p>
                <p className="text-sm text-white/80 mt-1">
                  <strong>Usuario:</strong> {selectedProof.user.nickname}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rejectionReason">Motivo del rechazo</Label>
                <Textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Ej: La imagen no muestra claramente la evidencia solicitada..."
                  className="min-h-[100px] border-[#5061EC]/30 bg-black/50 text-white"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false)
                setRejectionReason('')
              }}
              disabled={isProcessing}
              className="border-[#5061EC]/30 text-white hover:bg-[#5061EC]/10"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleReject}
              disabled={isProcessing || !rejectionReason.trim()}
              variant="destructive"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Rechazar Evidencia
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
