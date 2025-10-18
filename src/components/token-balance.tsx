'use client'

import { Badge } from '@/components/ui/badge'
import { Wallet, Loader2 } from 'lucide-react'
import { useSwagBalance } from '@/hooks/useSwagBalance'

interface TokenBalanceProps {
  className?: string
}

/**
 * TokenBalance - Componente para mostrar el balance de tokens SWAG del usuario conectado
 * Lee el balance directamente de la blockchain usando el hook useSwagBalance
 * @param className - Clases CSS adicionales
 */
export function TokenBalance({ className = '' }: TokenBalanceProps) {
  const { balance, isLoading } = useSwagBalance()

  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center gap-1.5 border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-cyan-100 ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin sm:h-4 sm:w-4" />
          <span className="text-sm font-bold sm:text-base">
            Cargando...
          </span>
        </>
      ) : (
        <>
          <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="text-sm font-bold sm:text-base">
            {balance.toFixed(1)} SWAG
          </span>
        </>
      )}
    </Badge>
  )
}
