'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConnectButton } from '@/components/connect-button'
import { TokenBalance } from '@/components/token-balance'
import { useSwagBalance } from '@/hooks/useSwagBalance'
import { useTransferSwag } from '@/hooks/useTransferSwag'
import { useRequireProfile } from '@/hooks/useRequireProfile'
import { Loader2, ExternalLink, CheckCircle2, AlertCircle, Menu, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import Image from 'next/image'

interface Product {
  id: string
  title: string
  description: string
  price: number
  imageUrl?: string | null
  isAvailable: boolean
  category?: string
}

interface Purchase {
  id: string
  productTitle: string
  price: number
  txHash: string | null
  createdAt: string
  product: {
    imageUrl: string | null
  }
}

export default function ShopPage() {
  const router = useRouter()
  const { hasProfile, isChecking, address, isConnected } = useRequireProfile()
  const { balance, refetch } = useSwagBalance()
  const { transferSwag, hash, isPending, isConfirming, isConfirmed, error: transferError } = useTransferSwag()

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [purchaseStatus, setPurchaseStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })

  const [products, setProducts] = useState<Product[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadingPurchases, setLoadingPurchases] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const CREATOR_WALLET_ADDRESS = '0x645AC03F1db27080A11d3f3a01030c455c7021bD'

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true)
        const response = await fetch('/api/products?availableOnly=false')
        const data = await response.json()
        setProducts(data.products || [])
      } catch (error) {
        console.error('Error fetching products:', error)
        setProducts([])
      } finally {
        setLoadingProducts(false)
      }
    }

    fetchProducts()
  }, [])

  useEffect(() => {
    const fetchPurchases = async () => {
      if (!address) return
      try {
        setLoadingPurchases(true)
        const response = await fetch(`/api/purchases?walletAddress=${address}`)
        const data = await response.json()
        setPurchases(data.purchases || [])
      } catch (error) {
        console.error('Error fetching purchases:', error)
        setPurchases([])
      } finally {
        setLoadingPurchases(false)
      }
    }

    if (isConnected && address) {
      fetchPurchases()
    }
  }, [isConnected, address])

  // NO redirigir automáticamente - solo mostrar loader si no está conectado

  useEffect(() => {
    if (isConfirmed && hash && selectedProduct) {
      const registerPurchase = async () => {
        try {
          await fetch('/api/purchases', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId: selectedProduct.id,
              walletAddress: address,
              txHash: hash,
            }),
          })
          // Refresh purchases
          const response = await fetch(`/api/purchases?walletAddress=${address}`)
          const data = await response.json()
          setPurchases(data.purchases || [])
        } catch (error) {
          console.error('Error registering purchase:', error)
        }
      }

      registerPurchase()
      setPurchaseStatus({
        type: 'success',
        message: '¡Compra exitosa! Los tokens han sido transferidos.',
      })
      setTimeout(() => refetch(), 2000)
    }
  }, [isConfirmed, hash, selectedProduct, address, refetch])

  useEffect(() => {
    if (transferError) {
      setPurchaseStatus({
        type: 'error',
        message: transferError.message || 'Error al procesar la transacción',
      })
    }
  }, [transferError])

  const handleBuyClick = (product: Product) => {
    setSelectedProduct(product)
    setShowConfirmDialog(true)
    setPurchaseStatus({ type: null, message: '' })
  }

  const handleConfirmPurchase = () => {
    if (!selectedProduct || !address) return
    setPurchaseStatus({ type: null, message: '' })
    transferSwag(CREATOR_WALLET_ADDRESS, selectedProduct.price)
  }

  const handleCloseDialog = () => {
    setShowConfirmDialog(false)
    setSelectedProduct(null)
    setPurchaseStatus({ type: null, message: '' })
  }

  const hasEnoughBalance = (price: number) => balance >= price

  if (isChecking || !isConnected || !hasProfile || loadingProducts) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-[#5061EC]" />
      </main>
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white pb-20">
      {/* Background decorativo con líneas mejoradas */}
      <div className="pointer-events-none absolute inset-0">
        <div className="neon-grid absolute inset-0 opacity-5" aria-hidden />

        {/* Línea vertical azul derecha */}
        <div
          className="absolute right-0 top-0 h-[600px] w-1 bg-gradient-to-b from-[#5061EC] via-[#5061EC]/60 to-transparent opacity-60"
          aria-hidden
        />

        {/* Curva azul superior derecha */}
        <div
          className="absolute -right-32 -top-32 h-[300px] w-[300px] rounded-full border-[3px] border-[#5061EC] opacity-30 animate-pulse sm:-right-20 sm:-top-20 sm:h-[400px] sm:w-[400px]"
          aria-hidden
        />

        {/* Curva azul decorativa centro */}
        <svg
          className="absolute right-0 top-1/4 h-[400px] w-[600px] opacity-40 sm:h-[500px] sm:w-[800px]"
          viewBox="0 0 800 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            d="M800 0C800 100 700 200 500 250C300 300 200 350 100 500"
            stroke="url(#blueGradientShop)"
            strokeWidth="2"
            fill="none"
          />
          <defs>
            <linearGradient id="blueGradientShop" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5061EC" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#5061EC" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Curva amarilla inferior izquierda */}
        <svg
          className="absolute -left-32 bottom-0 h-[300px] w-[500px] opacity-50 sm:-left-20 sm:h-[400px] sm:w-[700px]"
          viewBox="0 0 700 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            d="M0 400C100 350 200 300 400 280C600 260 700 200 700 100"
            stroke="url(#yellowGradientShop)"
            strokeWidth="3"
            fill="none"
          />
          <defs>
            <linearGradient id="yellowGradientShop" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FEE887" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#FEE887" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Curva amarilla inferior derecha */}
        <svg
          className="absolute -right-20 bottom-0 h-[250px] w-[400px] opacity-50 sm:h-[350px] sm:w-[600px]"
          viewBox="0 0 600 350"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            d="M600 350C500 300 400 250 250 230C100 210 0 150 0 0"
            stroke="url(#yellowGradient2Shop)"
            strokeWidth="2.5"
            fill="none"
          />
          <defs>
            <linearGradient id="yellowGradient2Shop" x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#FEE887" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#FEE887" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Círculo decorativo amarillo inferior */}
        <div
          className="absolute -bottom-20 left-1/4 h-[150px] w-[150px] rounded-full border-[2px] border-[#FEE887] opacity-25 sm:h-[200px] sm:w-[200px]"
          aria-hidden
        />

        {/* Líneas horizontales decorativas */}
        <div
          className="absolute bottom-0 left-0 h-[2px] w-[200px] bg-gradient-to-r from-[#FEE887] to-transparent opacity-40 sm:w-[400px]"
          aria-hidden
        />
        <div
          className="absolute bottom-10 right-0 h-[2px] w-[250px] bg-gradient-to-l from-[#FEE887] to-transparent opacity-40 sm:bottom-20 sm:w-[500px]"
          aria-hidden
        />

        {/* Línea curva amarilla decorativa superior */}
        <svg
          className="absolute left-0 top-20 h-[200px] w-[300px] opacity-30 sm:h-[300px] sm:w-[500px]"
          viewBox="0 0 500 300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            d="M0 150C100 100 200 50 350 100C450 130 500 180 500 250"
            stroke="url(#yellowGradient3Shop)"
            strokeWidth="2"
            fill="none"
          />
          <defs>
            <linearGradient id="yellowGradient3Shop" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FEE887" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#FEE887" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Línea vertical azul izquierda sutil */}
        <div
          className="absolute left-0 top-1/3 h-[400px] w-[1px] bg-gradient-to-b from-transparent via-[#5061EC]/30 to-transparent opacity-40"
          aria-hidden
        />

        {/* Líneas diagonales sutiles */}
        <div
          className="absolute right-1/4 top-0 h-[300px] w-[1px] rotate-12 bg-gradient-to-b from-[#5061EC]/20 via-transparent to-transparent opacity-30"
          aria-hidden
        />
        <div
          className="absolute left-1/3 bottom-0 h-[250px] w-[1px] -rotate-12 bg-gradient-to-t from-[#FEE887]/20 via-transparent to-transparent opacity-30"
          aria-hidden
        />
      </div>

      {/* Header mejorado con UI/UX */}
      <header className="relative z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-4 sm:px-12 lg:px-20">
          {/* Logo - Solo mundito en móvil, con texto en desktop */}
          <a href="/inicio" className="flex items-center gap-2">
            <div className="rounded-full bg-gradient-to-br from-[#5061EC]/20 to-[#5061EC]/5 p-1 transition-all duration-300 hover:scale-110 hover:from-[#5061EC]/30 hover:to-[#5061EC]/10">
              <Image
                src="/images/LogoSwagly.png"
                alt="Swagly Logo"
                width={40}
                height={40}
                className="h-8 w-8 sm:h-10 sm:w-10"
              />
            </div>
            {/* Texto del logo - Oculto en móvil */}
            <Image
              src="/images/TextoLogoSwagly.png"
              alt="Swagly"
              width={100}
              height={30}
              className="hidden h-auto w-20 sm:block lg:w-24"
            />
          </a>

          {/* Navegación Desktop - Oculta en móvil */}
          <nav className="hidden items-center gap-4 md:flex lg:gap-6">
            <a
              href="/inicio"
              className="group relative px-3 py-2 text-sm font-medium transition-all duration-300 hover:text-[#FEE887]"
            >
              <span className="relative z-10">Inicio</span>
              <div className="absolute inset-0 rounded-lg bg-[#FEE887]/0 transition-all duration-300 group-hover:bg-[#FEE887]/10" />
            </a>
            <a
              href="/shop"
              className="group relative px-3 py-2 text-sm font-medium text-[#FEE887]"
            >
              <span className="relative z-10">Tienda</span>
              <div className="absolute inset-0 rounded-lg bg-[#FEE887]/10" />
            </a>
            <a
              href="/events"
              className="group relative px-3 py-2 text-sm font-medium transition-all duration-300 hover:text-[#FEE887]"
            >
              <span className="relative z-10">Tus eventos</span>
              <div className="absolute inset-0 rounded-lg bg-[#FEE887]/0 transition-all duration-300 group-hover:bg-[#FEE887]/10" />
            </a>

            {/* Balance amarillo */}
            <TokenBalance />

            {/* Icono de perfil azul - Link a perfil */}
            <a
              href="/profile"
              className="group relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-[#5061EC]/40 bg-gradient-to-br from-[#5061EC]/20 to-[#5061EC]/5 shadow-lg shadow-[#5061EC]/20 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:border-[#5061EC]/60 hover:shadow-[#5061EC]/40"
            >
              <svg
                className="h-5 w-5 text-[#5061EC] transition-colors group-hover:text-[#5061EC]"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
          </nav>

          {/* Navegación Móvil - Visible solo en móvil */}
          <div className="flex items-center gap-3 md:hidden">
            {/* Balance amarillo */}
            <TokenBalance />

            {/* Icono de perfil azul */}
            <a
              href="/profile"
              className="group relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-[#5061EC]/40 bg-gradient-to-br from-[#5061EC]/20 to-[#5061EC]/5 shadow-lg shadow-[#5061EC]/20 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:border-[#5061EC]/60 hover:shadow-[#5061EC]/40"
            >
              <svg
                className="h-5 w-5 text-[#5061EC] transition-colors group-hover:text-[#5061EC]"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
            </a>

            {/* Hamburger Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-[#5061EC]/20 text-white transition-all duration-300 hover:bg-[#5061EC]/30"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="border-t border-white/5 bg-black/95 backdrop-blur-xl md:hidden">
            <nav className="space-y-1 px-4 py-4">
              <a
                href="/inicio"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block rounded-lg px-4 py-3 text-sm font-medium text-white transition-all duration-300 hover:bg-[#FEE887]/10 hover:text-[#FEE887]"
              >
                Inicio
              </a>
              <a
                href="/shop"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block rounded-lg px-4 py-3 text-sm font-medium text-[#FEE887] bg-[#FEE887]/10"
              >
                Tienda
              </a>
              <a
                href="/events"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block rounded-lg px-4 py-3 text-sm font-medium text-white transition-all duration-300 hover:bg-[#FEE887]/10 hover:text-[#FEE887]"
              >
                Tus eventos
              </a>
            </nav>
          </div>
        )}
      </header>

      {/* Content */}
      <section className="relative z-10 px-6 py-8 sm:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          {/* Title con animación */}
          <div className="mb-12 text-center">
            <h1 className="mb-3 text-4xl font-bold sm:text-5xl lg:text-6xl">
              <span className="bg-gradient-to-r from-[#FEE887] via-white to-[#FEE887] bg-clip-text text-transparent animate-pulse">
                Tienda
              </span>
            </h1>
            <p className="text-lg text-white/80 sm:text-xl">Cambia tus tokens SWAG por merch exclusiva</p>
          </div>

          {/* Products Grid - Mostrando todos los productos */}
          <div className="mb-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => {
              const enoughBalance = hasEnoughBalance(product.price)

              return (
                <div
                  key={product.id}
                  className="group overflow-hidden rounded-3xl bg-gradient-to-br from-[#FEE887] to-[#FFFACD] p-6 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-[#FEE887]/30"
                >
                  {/* Product Image */}
                  <div className="relative mb-4 aspect-square overflow-hidden rounded-2xl bg-[#5061EC]">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="text-6xl">👕</span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <h3 className="mb-2 text-lg font-bold text-black">{product.title}</h3>
                  <p className="mb-4 text-base font-bold text-black">
                    COSTO: {product.price} SWAG
                  </p>

                  {/* Buy Button */}
                  <Button
                    onClick={() => handleBuyClick(product)}
                    disabled={!product.isAvailable || !enoughBalance}
                    className="w-full rounded-full bg-black text-white hover:bg-black/80 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {!product.isAvailable ? 'Agotado' : !enoughBalance ? 'Balance Insuficiente' : 'Comprar'}
                  </Button>
                </div>
              )
            })}
          </div>

          {/* Purchases Section con UI/UX mejorado */}
          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FEE887] to-[#FFFACD] p-8 shadow-2xl shadow-[#FEE887]/20 transition-all duration-300 hover:shadow-[#FEE887]/40 sm:p-12">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="relative z-10">
              <h2 className="mb-8 text-center text-3xl font-bold text-black sm:text-4xl">
                Tus Compras
              </h2>

              {loadingPurchases ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-black" />
                  <p className="mt-4 text-black/70">Cargando tus compras...</p>
                </div>
              ) : purchases.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl bg-white/60 p-12 text-center backdrop-blur-sm">
                  <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-black/10">
                    <span className="text-5xl">🛍️</span>
                  </div>
                  <h3 className="mb-3 text-2xl font-bold text-black">¡Aún no tienes compras!</h3>
                  <p className="max-w-md text-lg text-black/70">
                    Explora nuestra tienda y canjea tus tokens SWAG por merch exclusiva.
                    <br />
                    <span className="font-semibold text-black">¡Comienza tu colección ahora!</span>
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {purchases.map((purchase) => (
                    <div
                      key={purchase.id}
                      className="group/card relative overflow-hidden rounded-2xl bg-white/60 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white/80 hover:shadow-xl"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-[#5061EC]/5 to-transparent opacity-0 transition-opacity duration-300 group-hover/card:opacity-100" />

                      <div className="relative z-10">
                        <h4 className="mb-3 text-lg font-bold text-black">{purchase.productTitle}</h4>
                        <div className="mb-3 flex items-center gap-2">
                          <div className="rounded-full bg-black/10 px-3 py-1">
                            <p className="text-sm font-bold text-black">{purchase.price} SWAG</p>
                          </div>
                        </div>
                        {purchase.txHash && (
                          <a
                            href={`https://scrollscan.com/tx/${purchase.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg bg-black px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-black/80 hover:underline"
                          >
                            Ver transacción
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Purchase Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="border-[#5061EC]/30 bg-black/95 text-white backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-white">
              {purchaseStatus.type ? 'Resultado de la compra' : 'Confirmar compra'}
            </DialogTitle>
          </DialogHeader>

          {isPending && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="rounded-full bg-yellow-500/20 p-3">
                <Loader2 className="h-12 w-12 animate-spin text-yellow-400" />
              </div>
              <p className="text-center text-sm text-yellow-200">
                Esperando confirmación en tu wallet...
              </p>
            </div>
          )}

          {isConfirming && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="rounded-full bg-blue-500/20 p-3">
                <Loader2 className="h-12 w-12 animate-spin text-blue-400" />
              </div>
              <p className="text-center text-sm text-blue-200">
                Procesando transacción...
              </p>
              {hash && (
                <a
                  href={`https://scrollscan.com/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 underline"
                >
                  Ver en el explorador →
                </a>
              )}
            </div>
          )}

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

          {!purchaseStatus.type && !isPending && !isConfirming && selectedProduct && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg bg-[#5061EC]/10 p-4">
                <p className="mb-2 font-medium text-white">{selectedProduct.title}</p>
                <p className="text-2xl font-bold text-[#FEE887]">{selectedProduct.price} SWAG</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/70">Balance actual</span>
                  <span className="font-medium text-white">{balance.toFixed(1)} SWAG</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Balance después</span>
                  <span className="font-medium text-white">
                    {(balance - selectedProduct.price).toFixed(1)} SWAG
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {purchaseStatus.type || isConfirmed ? (
              <Button
                onClick={handleCloseDialog}
                className="w-full rounded-full bg-[#FEE887] text-black hover:bg-[#FFFACD]"
              >
                Cerrar
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleCloseDialog}
                  disabled={isPending || isConfirming}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmPurchase}
                  disabled={isPending || isConfirming}
                  className="rounded-full bg-[#FEE887] text-black hover:bg-[#FFFACD]"
                >
                  {isPending || isConfirming ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isPending ? 'Esperando...' : 'Confirmando...'}
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
    </main>
  )
}
