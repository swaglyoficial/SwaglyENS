'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConnectButton } from '@/components/connect-button'
import { BottomNavigation } from '@/components/bottom-navigation'
import { useSwagBalance } from '@/hooks/useSwagBalance'
import { User, Loader2, ShoppingBag, Sparkles, AlertCircle, CheckCircle2, Shirt } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/**
 * Tipos de productos
 */
interface Product {
  id: 'sudadera' | 'cobija'
  name: string
  description: string
  price: number
  icon: React.ReactNode
  available: boolean
}

/**
 * Página de Tienda SWAG
 * Muestra productos exclusivos para canjear con tokens SWAG
 * Solo disponible para usuarios conectados
 */
export default function ShopPage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const { balance, isLoading: isLoadingBalance, refetch } = useSwagBalance()

  // Estados para el flujo de compra
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [purchaseStatus, setPurchaseStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })

  /**
   * Productos disponibles en la tienda
   */
  const products: Product[] = [
    {
      id: 'sudadera',
      name: 'Sudadera Exclusiva SWAG',
      description: 'Sudadera premium con diseño único del evento. Edición limitada.',
      price: 150,
      icon: <Shirt className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24" />,
      available: true,
    },
    {
      id: 'cobija',
      name: 'Cobija Premium SWAG',
      description: 'Cobija de alta calidad con el logo del evento. Perfecta para el invierno.',
      price: 200,
      icon: <Sparkles className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24" />,
      available: true,
    },
  ]

  /**
   * Redirigir a home si no está conectado
   */
  useEffect(() => {
    if (!isConnected) {
      router.push('/')
    }
  }, [isConnected, router])

  /**
   * Abrir diálogo de confirmación
   */
  const handleBuyClick = (product: Product) => {
    setSelectedProduct(product)
    setShowConfirmDialog(true)
    setPurchaseStatus({ type: null, message: '' })
  }

  /**
   * Procesar la compra
   */
  const handleConfirmPurchase = async () => {
    if (!selectedProduct || !address) return

    setIsPurchasing(true)
    setPurchaseStatus({ type: null, message: '' })

    try {
      // Llamar al endpoint API para procesar la compra
      const response = await fetch('/api/shop/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: selectedProduct.id,
          fromAddress: address,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar la compra')
      }

      // Mostrar mensaje de éxito
      setPurchaseStatus({
        type: 'success',
        message: data.message || '¡Compra exitosa!',
      })

      // Refrescar balance después de 2 segundos
      setTimeout(() => {
        refetch()
      }, 2000)
    } catch (error) {
      console.error('Error en la compra:', error)
      setPurchaseStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Error desconocido al procesar la compra',
      })
    } finally {
      setIsPurchasing(false)
    }
  }

  /**
   * Cerrar diálogo
   */
  const handleCloseDialog = () => {
    setShowConfirmDialog(false)
    setSelectedProduct(null)
    setPurchaseStatus({ type: null, message: '' })
  }

  /**
   * Verificar si el usuario tiene suficiente balance
   */
  const hasEnoughBalance = (price: number) => balance >= price

  // Mostrar loader mientras verifica conexión
  if (!isConnected || isLoadingBalance) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </main>
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-foreground pb-20">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="neon-grid absolute inset-0 opacity-10 sm:opacity-20" aria-hidden />
        <div className="absolute -left-10 top-20 h-48 w-48 rounded-full bg-cyan-400/20 blur-[100px] sm:-left-20 sm:top-32 sm:h-64 sm:w-64 sm:blur-[120px]" aria-hidden />
        <div className="absolute -right-10 top-10 h-56 w-56 rounded-full bg-cyan-500/15 blur-[100px] sm:right-[-12%] sm:top-20 sm:h-72 sm:w-72 sm:blur-[120px]" aria-hidden />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-4 sm:py-6">
        {/* Header con balance */}
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-500/40 bg-cyan-500/10 sm:h-10 sm:w-10">
              <ShoppingBag className="h-4 w-4 text-cyan-400 sm:h-5 sm:w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white sm:text-2xl">Tienda SWAG</h1>
              <p className="text-xs text-cyan-200/70 sm:text-sm">Canjea tus tokens por merch exclusiva</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="inline-flex items-center gap-1.5 border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-cyan-100"
            >
              <span className="text-sm font-bold sm:text-base">
                {balance.toFixed(1)} SWAG
              </span>
            </Badge>
            <ConnectButton />
          </div>
        </div>

        {/* Grid de productos - 2 columnas en mobile, adaptable en desktop */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
          {products.map((product) => {
            const enoughBalance = hasEnoughBalance(product.price)

            return (
              <Card
                key={product.id}
                className="group overflow-hidden border-cyan-500/20 bg-black/40 backdrop-blur-xl transition-all hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/10"
              >
                <CardHeader className="space-y-1 pb-4">
                  <CardTitle className="text-lg text-white sm:text-xl">{product.name}</CardTitle>
                  <CardDescription className="text-sm text-cyan-200/70">
                    {product.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Imagen/Icono del producto */}
                  <div className="relative flex aspect-square items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 p-6 transition-all group-hover:from-cyan-500/15 group-hover:to-cyan-600/10">
                    <div className="text-cyan-400 transition-transform group-hover:scale-110">
                      {product.icon}
                    </div>

                    {/* Badge de precio */}
                    <Badge
                      className="absolute right-3 top-3 border-cyan-500/40 bg-cyan-500/20 text-cyan-100 backdrop-blur-sm"
                    >
                      {product.price} SWAG
                    </Badge>
                  </div>

                  {/* Botón de compra */}
                  <div className="space-y-2">
                    {!enoughBalance && (
                      <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-2 text-xs text-red-200">
                        <AlertCircle className="h-4 w-4" />
                        <span>Balance insuficiente</span>
                      </div>
                    )}

                    <Button
                      size="lg"
                      className="w-full border border-cyan-500/60 bg-cyan-500/20 text-cyan-100 transition-all hover:bg-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleBuyClick(product)}
                      disabled={!product.available || !enoughBalance}
                    >
                      {!product.available ? (
                        'Agotado'
                      ) : !enoughBalance ? (
                        'Balance Insuficiente'
                      ) : (
                        <>
                          <ShoppingBag className="mr-2 h-4 w-4" />
                          Adquirir
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Mensaje informativo */}
        <Card className="mt-6 border-cyan-500/20 bg-cyan-500/5 backdrop-blur-xl sm:mt-8">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-cyan-100">Información importante</p>
              <p className="text-xs text-cyan-200/70 sm:text-sm">
                Los tokens SWAG se transferirán de tu wallet al realizar la compra. Asegúrate de tener
                suficiente balance y gas para la transacción en Scroll Sepolia.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Diálogo de confirmación */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="border-cyan-500/20 bg-black/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-white">
              {purchaseStatus.type ? 'Resultado de la compra' : 'Confirmar compra'}
            </DialogTitle>
            <DialogDescription className="text-cyan-200/70">
              {purchaseStatus.type ? '' : 'Estás a punto de adquirir este producto'}
            </DialogDescription>
          </DialogHeader>

          {/* Estado de la compra */}
          {purchaseStatus.type === 'success' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="rounded-full bg-green-500/20 p-3">
                <CheckCircle2 className="h-12 w-12 text-green-400" />
              </div>
              <p className="text-center text-sm text-green-200">{purchaseStatus.message}</p>
            </div>
          )}

          {purchaseStatus.type === 'error' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="rounded-full bg-red-500/20 p-3">
                <AlertCircle className="h-12 w-12 text-red-400" />
              </div>
              <p className="text-center text-sm text-red-200">{purchaseStatus.message}</p>
            </div>
          )}

          {/* Detalles del producto antes de confirmar */}
          {!purchaseStatus.type && selectedProduct && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4">
                <div>
                  <p className="text-sm font-medium text-white">{selectedProduct.name}</p>
                  <p className="text-xs text-cyan-200/70">Precio</p>
                </div>
                <Badge className="border-cyan-500/40 bg-cyan-500/20 text-cyan-100">
                  {selectedProduct.price} SWAG
                </Badge>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-cyan-200/70">Balance actual</span>
                <span className="font-medium text-white">{balance.toFixed(1)} SWAG</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-cyan-200/70">Balance después</span>
                <span className="font-medium text-white">
                  {(balance - selectedProduct.price).toFixed(1)} SWAG
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            {purchaseStatus.type ? (
              <Button
                onClick={handleCloseDialog}
                className="w-full border border-cyan-500/60 bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/30"
              >
                Cerrar
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleCloseDialog}
                  disabled={isPurchasing}
                  className="border-cyan-500/40 text-cyan-100 hover:bg-cyan-500/10"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmPurchase}
                  disabled={isPurchasing}
                  className="border border-cyan-500/60 bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/30"
                >
                  {isPurchasing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    'Confirmar compra'
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </main>
  )
}
