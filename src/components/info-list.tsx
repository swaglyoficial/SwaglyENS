/**
 * ============================================
 * INFO LIST - LISTA DE INFORMACIÓN
 * ============================================
 *
 * Componente que muestra información de la wallet conectada usando Thirdweb
 */

'use client'

import { useMemo } from "react"
import { useActiveAccount, useActiveWallet } from "thirdweb/react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useClientMounted } from "@/hooks/use-client-mounted"

const formatValue = (value: unknown) => {
  if (value === undefined || value === null) return "—"
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (Array.isArray(value)) return value.join(", ")
  return String(value)
}

export const InfoList = () => {
  const account = useActiveAccount()
  const wallet = useActiveWallet()
  const mounted = useClientMounted()

  const isConnected = !!account
  const address = account?.address
  const chainId = wallet?.getChain()?.id
  const chainName = wallet?.getChain()?.name

  const sections = useMemo(
    () => [
      {
        id: "account",
        title: "Cuenta",
        description: "Datos de la cuenta conectada.",
        badge: isConnected ? "Conectada" : "Desconectada",
        items: [
          { label: "Address", value: formatValue(address) },
          { label: "Chain ID", value: formatValue(chainId) },
          { label: "Chain Name", value: formatValue(chainName) },
        ]
      },
      {
        id: "wallet",
        title: "Wallet",
        description: "Información de la wallet activa.",
        items: [
          { label: "Wallet ID", value: formatValue(wallet?.id) },
        ]
      }
    ],
    [
      address,
      chainId,
      chainName,
      isConnected,
      wallet?.id
    ]
  )

  if (!mounted) {
    return null
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {sections.map(({ id, title, description, items, badge }) => (
        <Card
          key={id}
          className="border-cyan-500/30 bg-background/60 text-foreground shadow-[0_0_25px_rgba(0,240,255,0.08)] backdrop-blur"
        >
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-200">
                {title}
              </CardTitle>
              {badge ? (
                <Badge variant="secondary" className="border border-cyan-500/50 bg-cyan-500/10 text-cyan-100">
                  {badge}
                </Badge>
              ) : null}
            </div>
            {description ? (
              <CardDescription className="text-[0.7rem] text-muted-foreground">
                {description}
              </CardDescription>
            ) : null}
            <Separator className="bg-cyan-500/30" />
          </CardHeader>
          <CardContent className="pt-2">
            <ScrollArea className="max-h-44 pr-2">
              <dl className="space-y-3 text-xs text-muted-foreground">
                {items.map(({ label, value }) => (
                  <div
                    key={`${id}-${label}`}
                    className="rounded-lg border border-cyan-500/20 bg-black/60 px-3 py-2"
                  >
                    <dt className="text-[0.65rem] uppercase tracking-[0.35em] text-cyan-200/80">
                      {label}
                    </dt>
                    <dd className="mt-1 font-mono text-[0.7rem] text-cyan-100">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </ScrollArea>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
