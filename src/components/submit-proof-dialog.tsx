'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle2, AlertCircle, Upload, X } from 'lucide-react'
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
  sponsor?: {
    name: string
  }
}

interface SubmitProofDialogProps {
  activity: Activity
  userId: string
  passportId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function SubmitProofDialog({
  activity,
  userId,
  passportId,
  open,
  onOpenChange,
  onSuccess,
}: SubmitProofDialogProps) {
  const [textProof, setTextProof] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [transactionUrl, setTransactionUrl] = useState('')
  const [referralUrl, setReferralUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const isTransactionValidation = activity.validationType === 'auto_transaction'
  const isReferralValidation = activity.validationType === 'auto_referral_code'
  const needsText = activity.proofType === 'text' || activity.proofType === 'both'
  const needsImage = activity.proofType === 'image' || activity.proofType === 'both'

  // Default to text if proofType is not specified
  const effectiveProofType = activity.proofType || 'text'

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

        // Esperar 2 segundos y cerrar
        setTimeout(() => {
          onOpenChange(false)
          onSuccess()
          resetForm()
        }, 2000)

        return
      }

      // Si es validación por código de referido, usar endpoint especial
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

        // Esperar 2 segundos y cerrar
        setTimeout(() => {
          onOpenChange(false)
          onSuccess()
          resetForm()
        }, 2000)

        return
      }

      // Flujo normal para evidencia manual (texto/imagen)
      let imageUrl = null

      // Si hay imagen, subirla primero
      if (imageFile) {
        const formData = new FormData()
        formData.append('image', imageFile)
        formData.append('userId', userId)
        formData.append('activityId', activity.id)

        const uploadResponse = await fetch('/api/upload-proof-image', {
          method: 'POST',
          body: formData,
        })

        const uploadData = await uploadResponse.json()

        if (!uploadResponse.ok) {
          throw new Error(uploadData.error || 'Error al subir la imagen')
        }

        imageUrl = uploadData.imageUrl
      }

      // Enviar la prueba
      const proofResponse = await fetch('/api/proofs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          activityId: activity.id,
          passportId,
          proofType: needsImage ? 'image' : 'text',
          textProof: needsText ? textProof : null,
          imageUrl: needsImage ? imageUrl : null,
        }),
      })

      const proofData = await proofResponse.json()

      if (!proofResponse.ok) {
        throw new Error(proofData.error || 'Error al enviar la evidencia')
      }

      setSuccess(true)

      // Esperar 2 segundos y cerrar
      setTimeout(() => {
        onOpenChange(false)
        onSuccess()
        resetForm()
      }, 2000)
    } catch (err: any) {
      console.error('Error submitting proof:', err)
      setError(err.message || 'Error al enviar la evidencia')
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
    if (!isSubmitting) {
      onOpenChange(false)
      setTimeout(resetForm, 300) // Reset después de cerrar animación
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="border-[#5061EC]/30 bg-black/95 text-white backdrop-blur-xl w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-white sm:text-2xl">
            Enviar Evidencia
          </DialogTitle>
          <DialogDescription className="text-sm text-white/70 sm:text-base">
            {isTransactionValidation
              ? (activity.transactionPrompt || 'Pega el link completo de tu transacción desde Scrollscan.com')
              : isReferralValidation
              ? (activity.referralPrompt || 'Pega el link que contiene tu código de referido')
              : (activity.proofPrompt || 'Por favor proporciona evidencia de que completaste esta actividad.')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Información de la actividad */}
          <div className="rounded-lg border border-[#5061EC]/20 bg-gradient-to-br from-[#5061EC]/10 to-transparent p-4">
            <h4 className="mb-2 font-bold text-white">{activity.name}</h4>
            {activity.sponsor && (
              <p className="text-sm text-[#FEE887]">
                Actividad de {activity.sponsor.name}
              </p>
            )}
            <div className="mt-3 flex items-center gap-2">
              <div className="rounded-full bg-gradient-to-r from-[#FEE887]/30 to-[#FFFACD]/20 px-3 py-1 text-sm font-bold text-[#FEE887] shadow-lg">
                {activity.numOfTokens} SWAG
              </div>
            </div>
          </div>

          {/* Campo de link de transacción si es validación automática */}
          {isTransactionValidation && (
            <div className="space-y-2">
              <Label className="text-white">
                Link de Scrollscan
              </Label>
              <input
                type="text"
                value={transactionUrl}
                onChange={(e) => setTransactionUrl(e.target.value)}
                placeholder="https://scrollscan.com/tx/0x..."
                className="w-full rounded-lg border border-[#5061EC]/30 bg-black/50 px-3 py-2 text-white placeholder:text-white/40 focus:border-[#5061EC] focus:outline-none"
                disabled={isSubmitting || success}
              />
              <p className="text-xs text-white/50">
                {activity.transactionPrompt || 'Pega el link completo de tu transacción desde Scrollscan.com'}
              </p>

              {/* Mensaje de validación on-chain */}
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

          {/* Campo de link de referido si es validación automática de referido */}
          {isReferralValidation && (
            <div className="space-y-2">
              <Label className="text-white">
                Link de Referido
              </Label>
              <input
                type="text"
                value={referralUrl}
                onChange={(e) => setReferralUrl(e.target.value)}
                placeholder="https://example.com/ref/ABC123"
                className="w-full rounded-lg border border-purple-500/30 bg-black/50 px-3 py-2 text-white placeholder:text-white/40 focus:border-purple-500 focus:outline-none"
                disabled={isSubmitting || success}
              />
              <p className="text-xs text-white/50">
                {activity.referralPrompt || 'Pega el link que contiene tu código de referido'}
              </p>
            </div>
          )}

          {/* Campo de texto si es necesario */}
          {!isTransactionValidation && !isReferralValidation && needsText && (
            <div className="space-y-2">
              <Label className="text-white">
                Descripción {needsImage && '(opcional)'}
              </Label>
              <Textarea
                value={textProof}
                onChange={(e) => setTextProof(e.target.value)}
                placeholder="Describe tu experiencia o lo que hiciste..."
                className="min-h-[120px] border-[#5061EC]/30 bg-black/50 text-white placeholder:text-white/40"
                disabled={isSubmitting || success}
              />
            </div>
          )}

          {/* Campo de imagen si es necesario */}
          {!isTransactionValidation && !isReferralValidation && needsImage && (
            <div className="space-y-2">
              <Label className="text-white">
                Imagen {needsText && '(opcional)'}
              </Label>

              {imagePreview ? (
                <div className="relative rounded-xl overflow-hidden border border-[#5061EC]/30">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    width={500}
                    height={300}
                    className="w-full h-auto"
                  />
                  {!isSubmitting && !success && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-40 rounded-xl border-2 border-dashed border-[#5061EC]/30 bg-[#5061EC]/5 cursor-pointer hover:bg-[#5061EC]/10 transition-all">
                  <div className="flex flex-col items-center gap-2">
                    <div className="rounded-full bg-[#5061EC]/20 p-3">
                      <Upload className="h-6 w-6 text-[#5061EC]" />
                    </div>
                    <p className="text-sm text-white/70">Clic para subir imagen</p>
                    <p className="text-xs text-white/50">PNG, JPG, WEBP (max 5MB)</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                    disabled={isSubmitting || success}
                  />
                </label>
              )}
            </div>
          )}

          {/* Mensajes de estado */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          {isSubmitting && (
            <div className="flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3">
              <Loader2 className="h-5 w-5 animate-spin text-yellow-400 shrink-0" />
              <p className="text-sm text-yellow-200">
                {isTransactionValidation
                  ? 'Validando transacción...'
                  : isReferralValidation
                  ? 'Validando código de referido...'
                  : 'Enviando evidencia...'
                }
              </p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 p-3">
              <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
              <p className="text-sm text-green-200">
                {isTransactionValidation
                  ? '¡Transacción validada! Actividad completada y tokens otorgados.'
                  : isReferralValidation
                  ? '¡Código de referido válido! Actividad completada y tokens otorgados.'
                  : '¡Evidencia enviada! Espera la validación del administrador.'
                }
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="border-[#5061EC]/30 text-white hover:bg-[#5061EC]/10"
          >
            {success ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!success && (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !isValid()}
              className="bg-gradient-to-r from-[#FEE887] to-[#FFFACD] text-black font-bold hover:opacity-90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar evidencia'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
