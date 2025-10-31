'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Upload,
  X,
  FileText,
  Clock,
  XCircle,
  Scan,
  Circle
} from 'lucide-react'
import Image from 'next/image'

interface Activity {
  id: string
  name: string
  description: string
  numOfTokens: number
  validationType: string
  requiresProof: boolean
  proofType?: string | null
  proofPrompt?: string | null
  transactionPrompt?: string | null
  referralPrompt?: string | null
  onChainValidationType?: string | null
  validationConfig?: any
  successMessage?: string | null
  sponsor?: {
    name: string
  }
}

interface ActivityProof {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  rejectionReason?: string
  createdAt: string
}

interface PassportActivity {
  activityId: string
  status: 'pending' | 'completed'
  timestamp: string
  proofId?: string
  requiresProof: boolean
  activity: Activity
  proof?: ActivityProof
}

interface ActivityDetailsDialogProps {
  passportActivity: PassportActivity | null
  userId: string
  passportId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ActivityDetailsDialog({
  passportActivity,
  userId,
  passportId,
  open,
  onOpenChange,
  onSuccess,
}: ActivityDetailsDialogProps) {
  const [textProof, setTextProof] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [transactionUrl, setTransactionUrl] = useState('')
  const [referralUrl, setReferralUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showForm, setShowForm] = useState(false)

  if (!passportActivity) return null

  const activity = passportActivity.activity
  const isCompleted = passportActivity.status === 'completed'
  const proof = passportActivity.proof
  const isPending = proof?.status === 'pending'
  const isRejected = proof?.status === 'rejected'
  const isApproved = proof?.status === 'approved'

  const isTransactionValidation = activity.validationType === 'auto_transaction'
  const isReferralValidation = activity.validationType === 'auto_referral_code'
  const needsText = activity.proofType === 'text' || activity.proofType === 'both'
  const needsImage = activity.proofType === 'image' || activity.proofType === 'both'

  // Generar mensaje de validación on-chain
  const getOnChainValidationMessage = () => {
    if (!activity.onChainValidationType || !activity.validationConfig) {
      return null
    }

    if (activity.onChainValidationType === 'usdc_transfer') {
      const { minAmount, decimals } = activity.validationConfig
      return `La transacción debe contener una transferencia de al menos ${minAmount} tokens (${decimals} decimales)`
    } else if (activity.onChainValidationType === 'cashback_event') {
      return 'La transacción debe contener un evento Cashback válido'
    } else if (activity.onChainValidationType === 'token_transfer') {
      const { tokenAddresses, minAmount } = activity.validationConfig
      const tokenList = tokenAddresses.slice(0, 2).join(', ')
      const more = tokenAddresses.length > 2 ? ` y ${tokenAddresses.length - 2} más` : ''
      return `La transacción debe contener una transferencia de tokens específicos (${tokenList}${more})${minAmount > 0 ? ` con al menos ${minAmount} tokens` : ''}`
    }

    return null
  }

  const onChainMessage = getOnChainValidationMessage()

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Tipo de archivo no válido. Solo JPG, PNG y WEBP')
      return
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen es demasiado grande. Máximo 5MB')
      return
    }

    setImageFile(file)

    // Preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
    setError('')
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const isValid = () => {
    if (isTransactionValidation) {
      return transactionUrl.trim().length > 0
    }
    if (isReferralValidation) {
      return referralUrl.trim().length > 0
    }
    if (needsText && !textProof.trim()) return false
    if (needsImage && !imageFile) return false
    return true
  }

  const handleSubmit = async () => {
    if (!isValid()) {
      setError('Por favor completa todos los campos requeridos')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      // Si es validación por transacción, usar endpoint especial
      if (isTransactionValidation) {
        const response = await fetch('/api/proofs/auto-validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            activityId: activity.id,
            passportId,
            transactionUrl,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Error al validar la transacción')
        }

        setSuccess(true)

        // Esperar 2 segundos y refrescar
        setTimeout(() => {
          onSuccess()
          resetForm()
          setShowForm(false)
        }, 2000)
        return
      }

      // Si es validación por referido
      if (isReferralValidation) {
        const response = await fetch('/api/proofs/auto-validate-referral', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            activityId: activity.id,
            passportId,
            referralUrl,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Error al validar el código de referido')
        }

        setSuccess(true)

        // Esperar 2 segundos y refrescar
        setTimeout(() => {
          onSuccess()
          resetForm()
          setShowForm(false)
        }, 2000)
        return
      }

      // Validación manual con imagen
      let imageUrl = null

      if (imageFile) {
        const formData = new FormData()
        formData.append('image', imageFile)

        const uploadResponse = await fetch('/api/upload-proof-image', {
          method: 'POST',
          body: formData,
        })

        if (!uploadResponse.ok) {
          throw new Error('Error al subir la imagen')
        }

        const uploadData = await uploadResponse.json()
        imageUrl = uploadData.url
      }

      // Enviar evidencia
      const response = await fetch('/api/proofs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          activityId: activity.id,
          passportId,
          proofType: activity.proofType || 'text',
          textProof: needsText ? textProof : null,
          imageUrl,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar evidencia')
      }

      setSuccess(true)

      // Esperar 2 segundos y refrescar
      setTimeout(() => {
        onSuccess()
        resetForm()
        setShowForm(false)
      }, 2000)
    } catch (err: any) {
      console.error('Error submitting proof:', err)
      setError(err.message || 'Error al enviar evidencia')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setTextProof('')
    setImageFile(null)
    setImagePreview(null)
    setTransactionUrl('')
    setReferralUrl('')
    setError('')
    setSuccess(false)
  }

  const handleClose = () => {
    resetForm()
    setShowForm(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-2xl overflow-y-auto border-[#5061EC]/30 bg-gradient-to-br from-black via-[#5061EC]/5 to-black p-0 text-white backdrop-blur-xl">
        <DialogTitle className="sr-only">
          Detalles de la actividad: {activity.name}
        </DialogTitle>

        {/* Header con gradiente */}
        <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-[#5061EC] to-[#4051CC] px-4 pb-6 pt-8 sm:px-6 sm:pb-8 sm:pt-12">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />

          <div className="relative z-10 space-y-4">
            {/* Status Badge */}
            <div className="flex justify-center">
              {isCompleted || isApproved ? (
                <div className="flex items-center gap-2 rounded-full border-2 border-green-400/40 bg-green-500/20 px-3 py-1.5 shadow-lg shadow-green-500/20 backdrop-blur-sm sm:px-4 sm:py-2">
                  <CheckCircle2 className="h-4 w-4 text-green-300 sm:h-5 sm:w-5" />
                  <span className="text-sm font-bold text-green-100 sm:text-base">Completada</span>
                </div>
              ) : isPending ? (
                <div className="flex items-center gap-2 rounded-full border-2 border-yellow-400/40 bg-yellow-500/20 px-3 py-1.5 shadow-lg shadow-yellow-500/20 backdrop-blur-sm sm:px-4 sm:py-2">
                  <Clock className="h-4 w-4 text-yellow-300 sm:h-5 sm:w-5" />
                  <span className="text-sm font-bold text-yellow-100 sm:text-base">Pendiente</span>
                </div>
              ) : isRejected ? (
                <div className="flex items-center gap-2 rounded-full border-2 border-red-400/40 bg-red-500/20 px-3 py-1.5 shadow-lg shadow-red-500/20 backdrop-blur-sm sm:px-4 sm:py-2">
                  <XCircle className="h-4 w-4 text-red-300 sm:h-5 sm:w-5" />
                  <span className="text-sm font-bold text-red-100 sm:text-base">Rechazada</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-full border-2 border-[#FEE887]/40 bg-[#FEE887]/20 px-3 py-1.5 shadow-lg shadow-[#FEE887]/20 backdrop-blur-sm sm:px-4 sm:py-2">
                  <Circle className="h-4 w-4 text-[#FEE887] sm:h-5 sm:w-5" />
                  <span className="text-sm font-bold text-[#FEE887] sm:text-base">Por completar</span>
                </div>
              )}
            </div>

            {/* Activity Name */}
            <h3 className="text-center text-lg font-bold leading-tight text-white sm:text-xl lg:text-2xl">
              {activity.name}
            </h3>

            {/* Tokens Badge */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute -inset-2 animate-pulse rounded-full bg-[#FEE887]/20 blur-xl" />
                <div className="relative rounded-full bg-gradient-to-r from-[#FEE887] to-[#FFFACD] px-4 py-2 shadow-xl shadow-[#FEE887]/30 sm:px-5 sm:py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-black/70 sm:text-sm">Recompensa:</span>
                    <span className="text-base font-bold text-black sm:text-lg">
                      {activity.numOfTokens} SWAG
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4 p-4 sm:p-6">
          {/* Description */}
          {activity.description && (
            <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-3 sm:p-4">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-1 w-4 rounded-full bg-gradient-to-r from-[#5061EC] to-[#5061EC]/40 sm:w-6" />
                <p className="text-xs font-bold uppercase tracking-wider text-[#5061EC] sm:text-sm">
                  Descripción
                </p>
              </div>
              <p className="text-sm leading-relaxed text-white/90">
                {activity.description}
              </p>
            </div>
          )}

          {/* Sponsor */}
          {activity.sponsor && (
            <div className="rounded-xl border border-[#FEE887]/20 bg-gradient-to-br from-[#FEE887]/10 to-transparent p-3 sm:p-4">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-1 w-4 rounded-full bg-gradient-to-r from-[#FEE887] to-[#FEE887]/40 sm:w-6" />
                <p className="text-xs font-bold uppercase tracking-wider text-[#FEE887] sm:text-sm">
                  Sponsor
                </p>
              </div>
              <p className="text-sm font-bold text-white sm:text-base">
                {activity.sponsor.name}
              </p>
            </div>
          )}

          {/* Proof Status and Form */}
          {passportActivity.requiresProof && (
            <div className="space-y-3">
              {/* Status Messages */}
              {isPending && (
                <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 sm:p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-400 sm:h-5 sm:w-5" />
                    <p className="text-sm font-bold text-yellow-300">Pendiente de aprobación</p>
                  </div>
                  <p className="text-xs text-yellow-200/80 sm:text-sm">
                    Tu evidencia ha sido enviada y está siendo revisada por el administrador.
                  </p>
                </div>
              )}

              {isRejected && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 sm:p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-400 sm:h-5 sm:w-5" />
                    <p className="text-sm font-bold text-red-300">Evidencia Rechazada</p>
                  </div>
                  {proof?.rejectionReason && (
                    <p className="mb-2 text-xs text-red-200/90 sm:text-sm">
                      <strong>Motivo:</strong> {proof.rejectionReason}
                    </p>
                  )}
                  <p className="text-xs text-red-200/70">
                    Puedes corregir y reenviar tu evidencia.
                  </p>
                </div>
              )}

              {isApproved && (
                <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-3 sm:p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400 sm:h-5 sm:w-5" />
                    <p className="text-sm font-bold text-green-300">Evidencia Aprobada</p>
                  </div>
                  <p className="text-xs text-green-200/80 sm:text-sm">
                    {activity.successMessage || '¡Tu evidencia fue aprobada! Los tokens han sido enviados a tu wallet.'}
                  </p>
                </div>
              )}

              {/* Submit Form */}
              {!isApproved && !isPending && (showForm || isRejected) && (
                <div className="space-y-4 rounded-xl border border-[#5061EC]/20 bg-[#5061EC]/5 p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white sm:text-base">Enviar Evidencia</h4>
                    {!isRejected && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowForm(false)
                          resetForm()
                        }}
                        className="h-auto p-1 text-white/60 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Transaction URL */}
                  {isTransactionValidation && (
                    <div className="space-y-2">
                      <Label className="text-sm text-white">Link de Scrollscan</Label>
                      <input
                        type="text"
                        value={transactionUrl}
                        onChange={(e) => setTransactionUrl(e.target.value)}
                        placeholder="https://scrollscan.com/tx/0x..."
                        className="w-full rounded-lg border border-[#5061EC]/30 bg-black/50 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#5061EC] focus:outline-none"
                        disabled={isSubmitting || success}
                      />
                      <p className="text-xs text-white/50">
                        {activity.transactionPrompt || 'Pega el link completo de tu transacción desde Scrollscan.com'}
                      </p>

                      {onChainMessage && (
                        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 flex-shrink-0 text-yellow-400 mt-0.5" />
                            <div className="space-y-1">
                              <p className="text-xs font-semibold text-yellow-100">Validación on-chain requerida</p>
                              <p className="text-xs text-yellow-200/80">{onChainMessage}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Referral URL */}
                  {isReferralValidation && (
                    <div className="space-y-2">
                      <Label className="text-sm text-white">Link de Referido</Label>
                      <input
                        type="text"
                        value={referralUrl}
                        onChange={(e) => setReferralUrl(e.target.value)}
                        placeholder="https://example.com/ref/ABC123"
                        className="w-full rounded-lg border border-purple-500/30 bg-black/50 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-purple-500 focus:outline-none"
                        disabled={isSubmitting || success}
                      />
                      <p className="text-xs text-white/50">
                        {activity.referralPrompt || 'Pega el link que contiene tu código de referido'}
                      </p>
                    </div>
                  )}

                  {/* Text Proof */}
                  {needsText && !isTransactionValidation && !isReferralValidation && (
                    <div className="space-y-2">
                      <Label className="text-sm text-white">Descripción</Label>
                      <Textarea
                        value={textProof}
                        onChange={(e) => setTextProof(e.target.value)}
                        placeholder={activity.proofPrompt || 'Describe cómo completaste esta actividad...'}
                        className="min-h-[100px] border-[#5061EC]/30 bg-black/50 text-sm text-white placeholder:text-white/40"
                        disabled={isSubmitting || success}
                      />
                    </div>
                  )}

                  {/* Image Upload */}
                  {needsImage && !isTransactionValidation && !isReferralValidation && (
                    <div className="space-y-2">
                      <Label className="text-sm text-white">Imagen</Label>
                      {!imagePreview ? (
                        <label className="group relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#5061EC]/30 bg-black/50 p-4 transition-all duration-300 hover:border-[#5061EC]/50 hover:bg-black/70 sm:p-6">
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={handleImageChange}
                            className="hidden"
                            disabled={isSubmitting || success}
                          />
                          <Upload className="mb-2 h-6 w-6 text-[#5061EC] transition-all group-hover:scale-110 sm:h-8 sm:w-8" />
                          <p className="text-xs text-center text-white/70 sm:text-sm">
                            Haz clic para subir una imagen
                          </p>
                          <p className="mt-1 text-xs text-center text-white/50">
                            JPG, PNG o WEBP (máx. 5MB)
                          </p>
                        </label>
                      ) : (
                        <div className="relative">
                          <div className="relative h-40 overflow-hidden rounded-lg sm:h-48">
                            <Image
                              src={imagePreview}
                              alt="Preview"
                              fill
                              className="object-cover"
                            />
                          </div>
                          <button
                            onClick={handleRemoveImage}
                            className="absolute right-2 top-2 rounded-full bg-red-500/90 p-1.5 text-white transition-all hover:bg-red-600"
                            disabled={isSubmitting || success}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-400 mt-0.5" />
                        <p className="text-xs text-red-200 sm:text-sm">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Success Message */}
                  {success && (
                    <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-400" />
                        <p className="text-sm font-semibold text-green-200">
                          ¡Evidencia enviada exitosamente!
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  {!success && (
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !isValid()}
                      className="w-full bg-gradient-to-r from-[#FEE887] to-[#FFFACD] text-sm font-bold text-black hover:opacity-90 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <FileText className="mr-2 h-4 w-4" />
                          Enviar Evidencia
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}

              {/* Show Form Button */}
              {!isApproved && !isPending && !showForm && !isRejected && (
                <Button
                  onClick={() => setShowForm(true)}
                  className="w-full bg-gradient-to-r from-[#FEE887] to-[#FFFACD] text-sm font-bold text-black hover:opacity-90"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Enviar Evidencia
                </Button>
              )}
            </div>
          )}

          {/* Completed Timestamp */}
          {isCompleted && passportActivity.timestamp && (
            <div className="rounded-xl border border-green-500/20 bg-gradient-to-br from-green-500/10 to-transparent p-3 sm:p-4">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-1 w-4 rounded-full bg-gradient-to-r from-green-400 to-green-400/40 sm:w-6" />
                <p className="text-xs font-bold uppercase tracking-wider text-green-300 sm:text-sm">
                  Completada el
                </p>
              </div>
              <p className="text-sm font-semibold text-green-200">
                {new Date(passportActivity.timestamp).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
