'use client'

import { useRequireAdmin } from '@/hooks/useRequireAdmin'
import { Loader2 } from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAdmin, isChecking } = useRequireAdmin()

  // Mostrar loader mientras verifica permisos de admin
  if (isChecking || !isAdmin) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </main>
    )
  }

  // Si es admin, mostrar el contenido
  return <>{children}</>
}
