'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ConnectButton } from '@/components/connect-button'
import { BottomNavigation } from '@/components/bottom-navigation'
import { User, Loader2, HelpCircle, Mail } from 'lucide-react'

/**
 * Página de Información
 * Explica cómo funciona Swagly y proporciona un botón de soporte
 */
export default function InfoPage() {
  const router = useRouter()
  const { isConnected, address } = useWalletConnection()

  /**
   * NO redirigir - permitir ver la página sin wallet
   */

  // Mostrar loader si no está conectado
  if (!isConnected) {
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
      <div className="relative z-10 mx-auto max-w-3xl px-4 py-4 sm:py-6">
        {/* Header compacto */}
        <div className="mb-6 flex items-center justify-between gap-3 sm:mb-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-500/40 bg-cyan-500/10 sm:h-10 sm:w-10">
              <User className="h-4 w-4 text-cyan-400 sm:h-5 sm:w-5" />
            </div>
            <span className="text-sm font-semibold text-white sm:text-base">
              Usuario
            </span>
          </div>
          <ConnectButton />
        </div>

        {/* Título principal */}
        <div className="mb-6 text-center">
          <h1 className="mb-2 text-2xl font-bold text-white sm:mb-3 sm:text-3xl">
            ¿Cómo funciona Swagly?
          </h1>
        </div>

        {/* Contenido informativo */}
        <Card className="mb-6 border-cyan-500/20 bg-black/40 backdrop-blur-xl">
          <CardContent className="p-6 sm:p-8">
            <div className="space-y-6 text-cyan-100">
              <p className="text-sm leading-relaxed sm:text-base">
                Solo debes escanear con NFC o con QR la merch que te den al realizar alguna actividad.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/20">
                    <span className="text-sm font-bold text-cyan-400">1</span>
                  </div>
                  <div>
                    <h3 className="mb-1 text-sm font-semibold text-white sm:text-base">
                      Conecta tu wallet
                    </h3>
                    <p className="text-xs text-cyan-200/70 sm:text-sm">
                      Accede con tu wallet Web3 para crear tu pasaporte digital
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/20">
                    <span className="text-sm font-bold text-cyan-400">2</span>
                  </div>
                  <div>
                    <h3 className="mb-1 text-sm font-semibold text-white sm:text-base">
                      Escanea actividades
                    </h3>
                    <p className="text-xs text-cyan-200/70 sm:text-sm">
                      Completa actividades en el evento y escanea los tags NFC o códigos QR de la merch
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/20">
                    <span className="text-sm font-bold text-cyan-400">3</span>
                  </div>
                  <div>
                    <h3 className="mb-1 text-sm font-semibold text-white sm:text-base">
                      Acumula tokens SWAG
                    </h3>
                    <p className="text-xs text-cyan-200/70 sm:text-sm">
                      Cada actividad te otorga tokens SWAG que puedes usar en la tienda
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/20">
                    <span className="text-sm font-bold text-cyan-400">4</span>
                  </div>
                  <div>
                    <h3 className="mb-1 text-sm font-semibold text-white sm:text-base">
                      Canjea por merch
                    </h3>
                    <p className="text-xs text-cyan-200/70 sm:text-sm">
                      Usa tus tokens para obtener merch exclusiva y NFTs únicos del evento
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botón de soporte */}
        <div className="flex justify-center">
          <Button
            size="lg"
            className="w-full border border-cyan-500/60 bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/30 sm:w-auto"
            onClick={() => {
              // Aquí puedes agregar la lógica para abrir un modal de soporte o redirigir a un formulario
              window.open('mailto:soporte@swagly.io', '_blank')
            }}
          >
            <Mail className="mr-2 h-4 w-4" />
            Soporte
          </Button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </main>
  )
}
