'use client'

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Package,
  ImageIcon,
  Upload,
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
import Image from "next/image"

interface Product {
  id: string
  title: string
  description: string
  price: number
  imageUrl?: string | null
  isAvailable: boolean
  createdAt: string
  updatedAt: string
}

export default function ProductsManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    imageUrl: "",
    isAvailable: true,
  })

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/products")
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error("Error fetching products:", error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingImage(true)
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const { imageUrl } = await response.json()
        setFormData((prev) => ({ ...prev, imageUrl }))
      } else {
        const { error } = await response.json()
        alert(error || 'Error al subir la imagen')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Error al subir la imagen')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products"
      const method = editingProduct ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: parseInt(formData.price),
        }),
      })

      if (response.ok) {
        setIsDialogOpen(false)
        resetForm()
        fetchProducts()
      } else {
        const { error } = await response.json()
        alert(error || "Error al guardar el producto")
      }
    } catch (error) {
      console.error("Error saving product:", error)
      alert("Error al guardar el producto")
    }
  }

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer."
      )
    ) {
      return
    }

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchProducts()
      } else {
        const { error } = await response.json()
        alert(error || "Error al eliminar el producto")
      }
    } catch (error) {
      console.error("Error deleting product:", error)
      alert("Error al eliminar el producto")
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      title: product.title,
      description: product.description,
      price: product.price.toString(),
      imageUrl: product.imageUrl || "",
      isAvailable: product.isAvailable,
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setEditingProduct(null)
    setFormData({
      title: "",
      description: "",
      price: "",
      imageUrl: "",
      isAvailable: true,
    })
  }

  const glassCard =
    "border-cyan-500/20 bg-black/60 text-cyan-100 shadow-[0_0_28px_rgba(0,240,255,0.1)] backdrop-blur"
  const neonPrimaryButton =
    "bg-cyan-500 text-black shadow-[0_0_28px_rgba(0,240,255,0.35)] hover:bg-cyan-400"
  const neonOutlineButton =
    "border-cyan-500/60 bg-black/40 text-cyan-100 hover:bg-cyan-500/10"
  const iconButtonClasses =
    "border-cyan-500/40 bg-black/40 text-cyan-100 hover:bg-cyan-500/10"

  const totalProducts = products?.length ?? 0
  const availableProducts = products?.filter((p) => p.isAvailable).length ?? 0
  const totalValue = products?.reduce((sum, p) => sum + p.price, 0) ?? 0

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
              Gestión de productos
            </span>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                Administra tu tienda SWAG
              </h1>
              <p className="text-sm text-cyan-200/80 sm:text-base">
                Agrega, edita y gestiona productos exclusivos de tu tienda.
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
                  {editingProduct ? "Editar producto" : "Nuevo producto"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl border-cyan-500/30 bg-black/90 text-cyan-50">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    {editingProduct ? "Editar producto" : "Crear producto"}
                  </DialogTitle>
                  <DialogDescription className="text-cyan-200/70">
                    Define la información del producto. Podrás actualizarla cuando quieras.
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="title" className="text-cyan-200/80">
                        Título del producto
                      </Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Sudadera Exclusiva SWAG"
                        className="border-cyan-500/30 bg-black/60 text-cyan-100 placeholder:text-cyan-200/50"
                        required
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="description" className="text-cyan-200/80">
                        Descripción
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        rows={4}
                        placeholder="Describe el producto, características, talla, etc."
                        className="border-cyan-500/30 bg-black/60 text-cyan-100 placeholder:text-cyan-200/50"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-cyan-200/80">
                        Precio (tokens SWAG)
                      </Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({ ...formData, price: e.target.value })
                        }
                        placeholder="150"
                        className="border-cyan-500/30 bg-black/60 text-cyan-100 placeholder:text-cyan-200/50"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="isAvailable" className="text-cyan-200/80">
                        Disponibilidad
                      </Label>
                      <select
                        id="isAvailable"
                        value={formData.isAvailable ? "true" : "false"}
                        onChange={(e) =>
                          setFormData({ ...formData, isAvailable: e.target.value === "true" })
                        }
                        className="flex h-10 w-full rounded-md border border-cyan-500/30 bg-black/60 px-3 py-2 text-cyan-100"
                      >
                        <option value="true">Disponible</option>
                        <option value="false">No disponible</option>
                      </select>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="image" className="text-cyan-200/80">
                        Imagen del producto
                      </Label>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <Input
                            id="image"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploadingImage}
                            className="border-cyan-500/30 bg-black/60 text-cyan-100 file:text-cyan-100"
                          />
                          {uploadingImage && (
                            <span className="text-sm text-cyan-200/70">Subiendo...</span>
                          )}
                        </div>
                        {formData.imageUrl && (
                          <div className="relative h-32 w-32 overflow-hidden rounded-lg border border-cyan-500/30">
                            <Image
                              src={formData.imageUrl}
                              alt="Preview"
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        )}
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
                      {editingProduct ? "Guardar cambios" : "Crear producto"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Card className={glassCard}>
            <CardHeader className="space-y-1 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                Productos totales
              </CardTitle>
              <CardDescription className="text-cyan-200/70">
                Todos los productos en la tienda
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <p className="text-4xl font-semibold text-white">{totalProducts}</p>
              <Package className="h-6 w-6 text-cyan-300" />
            </CardContent>
          </Card>

          <Card className={glassCard}>
            <CardHeader className="space-y-1 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                Productos disponibles
              </CardTitle>
              <CardDescription className="text-cyan-200/70">
                Actualmente en venta
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <p className="text-4xl font-semibold text-white">{availableProducts}</p>
              <ImageIcon className="h-6 w-6 text-cyan-300" />
            </CardContent>
          </Card>

          <Card className={glassCard}>
            <CardHeader className="space-y-1 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                Valor total
              </CardTitle>
              <CardDescription className="text-cyan-200/70">
                Suma de precios (tokens SWAG)
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <p className="text-4xl font-semibold text-white">{totalValue}</p>
              <span className="text-sm text-cyan-300">SWAG</span>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6">
          <Card className={glassCard}>
            <CardHeader>
              <CardTitle className="text-white">Productos registrados</CardTitle>
              <CardDescription className="text-cyan-200/70">
                {products?.length ?? 0} producto(s) en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <div className="py-12 text-center text-cyan-200/70">
                  Cargando productos...
                </div>
              ) : (products?.length ?? 0) === 0 ? (
                <div className="py-12 text-center text-cyan-200/70">
                  No hay productos creados. Crea tu primer producto.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="min-w-[720px] text-sm text-cyan-100">
                    <TableHeader>
                      <TableRow className="border-cyan-500/10">
                        <TableHead className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                          Imagen
                        </TableHead>
                        <TableHead className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                          Producto
                        </TableHead>
                        <TableHead className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                          Precio
                        </TableHead>
                        <TableHead className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                          Estado
                        </TableHead>
                        <TableHead className="text-right text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                          Acciones
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products?.map((product) => (
                        <TableRow
                          key={product.id}
                          className="border-cyan-500/10 transition-colors hover:bg-cyan-500/5"
                        >
                          <TableCell>
                            <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-cyan-500/30 bg-black/40">
                              {product.imageUrl ? (
                                <Image
                                  src={product.imageUrl}
                                  alt={product.title}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <ImageIcon className="h-6 w-6 text-cyan-300/50" />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[220px]">
                            <p className="truncate font-semibold text-white" title={product.title}>
                              {product.title}
                            </p>
                            <p className="text-xs text-cyan-200/70">
                              {product.description}
                            </p>
                          </TableCell>
                          <TableCell>
                            <span className="text-base font-semibold text-cyan-100">
                              {product.price} SWAG
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={
                                product.isAvailable
                                  ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-100"
                                  : "border-red-500/50 bg-red-500/15 text-red-200"
                              }
                            >
                              {product.isAvailable ? "Disponible" : "No disponible"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-wrap justify-end gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className={iconButtonClasses}
                                onClick={() => handleEdit(product)}
                                aria-label="Editar producto"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="border-red-500/60 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                                onClick={() => handleDelete(product.id)}
                                aria-label="Eliminar producto"
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
        </section>
      </div>
    </main>
  )
}
