'use client'

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  ArrowLeft,
  ShoppingCart,
  Package,
  DollarSign,
  ExternalLink,
  TrendingUp,
  Calendar,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface Purchase {
  id: string
  productId: string
  walletAddress: string
  productTitle: string
  price: number
  txHash: string | null
  status: string
  createdAt: string
  product: {
    id: string
    title: string
    imageUrl: string | null
  }
}

export default function PurchasesManagement() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPurchases = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/purchases")
      const data = await response.json()
      setPurchases(data.purchases || [])
    } catch (error) {
      console.error("Error fetching purchases:", error)
      setPurchases([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPurchases()
  }, [])

  const glassCard =
    "border-cyan-500/20 bg-black/60 text-cyan-100 shadow-[0_0_28px_rgba(0,240,255,0.1)] backdrop-blur"
  const neonOutlineButton =
    "border-cyan-500/60 bg-black/40 text-cyan-100 hover:bg-cyan-500/10"

  const totalPurchases = purchases?.length ?? 0
  const totalRevenue = purchases?.reduce((sum, p) => sum + p.price, 0) ?? 0
  const uniqueCustomers = new Set(purchases?.map((p) => p.walletAddress)).size

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

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
              Gestión de compras
            </span>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                Compras de la tienda SWAG
              </h1>
              <p className="text-sm text-cyan-200/80 sm:text-base">
                Visualiza todas las transacciones y compras realizadas por los usuarios.
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
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Card className={glassCard}>
            <CardHeader className="space-y-1 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                Compras totales
              </CardTitle>
              <CardDescription className="text-cyan-200/70">
                Todas las transacciones completadas
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <p className="text-4xl font-semibold text-white">{totalPurchases}</p>
              <ShoppingCart className="h-6 w-6 text-cyan-300" />
            </CardContent>
          </Card>

          <Card className={glassCard}>
            <CardHeader className="space-y-1 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                Ingresos totales
              </CardTitle>
              <CardDescription className="text-cyan-200/70">
                Tokens SWAG recibidos
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <p className="text-4xl font-semibold text-white">{totalRevenue}</p>
              <span className="text-sm text-cyan-300">SWAG</span>
            </CardContent>
          </Card>

          <Card className={glassCard}>
            <CardHeader className="space-y-1 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                Clientes únicos
              </CardTitle>
              <CardDescription className="text-cyan-200/70">
                Wallets que han comprado
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <p className="text-4xl font-semibold text-white">{uniqueCustomers}</p>
              <TrendingUp className="h-6 w-6 text-cyan-300" />
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6">
          <Card className={glassCard}>
            <CardHeader>
              <CardTitle className="text-white">Historial de compras</CardTitle>
              <CardDescription className="text-cyan-200/70">
                {totalPurchases} compra(s) registradas en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <div className="py-12 text-center text-cyan-200/70">
                  Cargando compras...
                </div>
              ) : totalPurchases === 0 ? (
                <div className="py-12 text-center text-cyan-200/70">
                  No hay compras registradas aún.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="min-w-[720px] text-sm text-cyan-100">
                    <TableHeader>
                      <TableRow className="border-cyan-500/10">
                        <TableHead className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                          Producto
                        </TableHead>
                        <TableHead className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                          Cliente
                        </TableHead>
                        <TableHead className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                          Precio
                        </TableHead>
                        <TableHead className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                          Fecha
                        </TableHead>
                        <TableHead className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                          Estado
                        </TableHead>
                        <TableHead className="text-right text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                          TX Hash
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchases?.map((purchase) => (
                        <TableRow
                          key={purchase.id}
                          className="border-cyan-500/10 transition-colors hover:bg-cyan-500/5"
                        >
                          <TableCell className="max-w-[180px]">
                            <p className="truncate font-semibold text-white" title={purchase.productTitle}>
                              {purchase.productTitle}
                            </p>
                          </TableCell>
                          <TableCell>
                            <code className="rounded bg-cyan-500/10 px-2 py-1 text-xs text-cyan-200">
                              {truncateAddress(purchase.walletAddress)}
                            </code>
                          </TableCell>
                          <TableCell>
                            <span className="text-base font-semibold text-cyan-100">
                              {purchase.price} SWAG
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-cyan-200/80">
                              <Calendar className="h-3 w-3" />
                              <span className="text-xs">{formatDate(purchase.createdAt)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className="border-green-500/50 bg-green-500/15 text-green-200"
                            >
                              {purchase.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {purchase.txHash ? (
                              <a
                                href={`https://sepolia.scrollscan.com/tx/${purchase.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-cyan-400 underline hover:text-cyan-300"
                              >
                                Ver TX
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <span className="text-xs text-cyan-200/50">N/A</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
