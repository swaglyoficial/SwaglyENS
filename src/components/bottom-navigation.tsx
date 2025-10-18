'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, ShoppingBag, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * BottomNavigation - Barra de navegación inferior
 * Muestra 3 opciones: Tienda, Home, Información
 * Se mantiene fija en la parte inferior de la pantalla
 */
export function BottomNavigation() {
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    { icon: ShoppingBag, label: 'Tienda', path: '/shop' },
    { icon: Home, label: 'Home', path: '/dashboard' },
    { icon: Info, label: 'Info', path: '/info' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-cyan-500/20 bg-black/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-around px-4 py-3 sm:py-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.path

          return (
            <Button
              key={item.path}
              variant="ghost"
              size="sm"
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center gap-1 rounded-lg px-4 py-2 transition-all hover:bg-cyan-500/10 ${
                isActive
                  ? 'text-cyan-400'
                  : 'text-cyan-200/70 hover:text-cyan-200'
              }`}
            >
              <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${isActive ? 'text-cyan-400' : ''}`} />
              <span className="text-xs font-medium">{item.label}</span>
            </Button>
          )
        })}
      </div>
    </nav>
  )
}
