'use client'

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAccount } from "wagmi"
import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, Sparkles } from "lucide-react"

import { ConnectButton } from "@/components/connect-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

/**
 * Página principal de Swagly
 * Muestra la landing page y maneja la redirección automática cuando el usuario conecta su wallet
 * - Si el usuario está conectado, verifica si tiene datos en la BD
 * - Si no tiene datos, redirige a /onboarding
 * - Si tiene datos completos, redirige a /dashboard
 */
export default function Home() {
  const router = useRouter()
  const { address, isConnected } = useAccount()

  /**
   * Verifica el estado del usuario cuando conecta su wallet
   * y redirige automáticamente según su estado
   */
  useEffect(() => {
    async function checkUserStatus() {
      if (!address || !isConnected) return

      try {
        // Verificar si el usuario existe en la base de datos
        const response = await fetch(`/api/users/${address}`)
        const data = await response.json()

        if (response.ok && data.user) {
          // Usuario existe, verificar si tiene pasaportes
          if (data.user.passports && data.user.passports.length > 0) {
            // Tiene pasaportes, redirigir al dashboard
            router.push('/dashboard')
          } else {
            // No tiene pasaportes, redirigir a onboarding
            router.push('/onboarding')
          }
        } else {
          // Usuario no existe, redirigir a onboarding
          router.push('/onboarding')
        }
      } catch (error) {
        console.error('Error checking user status:', error)
        // En caso de error, redirigir a onboarding para que complete el proceso
        router.push('/onboarding')
      }
    }

    if (isConnected && address) {
      checkUserStatus()
    }
  }, [isConnected, address, router])

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black text-foreground px-4 py-8 sm:px-6 lg:px-8">
      {/* Background effects - optimizados para móviles */}
      <div className="pointer-events-none absolute inset-0">
        <div className="neon-grid absolute inset-0 opacity-10 sm:opacity-20" aria-hidden />
        <div className="absolute -left-10 top-20 h-48 w-48 rounded-full bg-cyan-400/20 blur-[100px] sm:-left-20 sm:top-32 sm:h-64 sm:w-64 sm:blur-[120px]" aria-hidden />
        <div className="absolute -right-10 top-10 h-56 w-56 rounded-full bg-cyan-500/15 blur-[100px] sm:right-[-12%] sm:top-6 sm:h-72 sm:w-72 sm:blur-[120px]" aria-hidden />
        <div className="absolute bottom-[-10%] left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[100px] sm:bottom-[-18%] sm:h-64 sm:w-64 sm:blur-[110px]" aria-hidden />
      </div>

      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-8 text-center sm:gap-12 sm:py-12">
        {/* Header con logo - más compacto en móviles */}
        <header className="flex flex-col items-center gap-3 sm:gap-4">
          <div className="relative grid h-16 w-16 place-items-center rounded-xl border border-cyan-500/60 bg-white/5 shadow-[0_0_25px_rgba(0,240,255,0.2)] backdrop-blur transition-all hover:shadow-[0_0_35px_rgba(0,240,255,0.35)] sm:h-20 sm:w-20 sm:rounded-2xl">
            <Image
              src="/reown.svg"
              alt="Swagly logo"
              width={64}
              height={64}
              priority
              className="h-12 w-12 opacity-90 sm:h-14 sm:w-14"
            />
          </div>
          <Badge variant="secondary" className="border border-cyan-500/60 bg-cyan-500/10 text-cyan-100 text-sm sm:text-base">
            Swagly
          </Badge>
        </header>

        {/* Hero Section - simplificado y más limpio */}
        <section className="flex flex-col items-center gap-6 sm:gap-8" id="experiencia">
          <Badge className="inline-flex items-center gap-1.5 border border-cyan-500/40 bg-cyan-500/10 text-cyan-100 px-3 py-1 text-xs sm:gap-2 sm:text-sm">
            <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            Beta privada
          </Badge>

          <div className="space-y-4 sm:space-y-5">
            <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
              Tu pasaporte Web3 para cada hackathon
            </h1>
            <p className="text-base text-cyan-200/80 sm:text-lg lg:text-xl max-w-2xl mx-auto">
              Colecciona experiencias, escanea NFCs, gana tokens y construye tu perfil on-chain verificable.
            </p>
          </div>

          {/* Botones - stack en móviles, row en desktop */}
          <div className="flex w-full max-w-md flex-col items-center justify-center gap-3 sm:max-w-none sm:flex-row sm:gap-4">
            <div className="w-full sm:w-auto">
              <ConnectButton />
            </div>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-cyan-500/60 text-cyan-100 hover:bg-cyan-500/10 hover:border-cyan-500/80 transition-all w-full sm:w-auto"
            >
              <Link href="#experiencia" className="inline-flex items-center justify-center">
                Descubre más
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Features list - más compacta y legible */}
          <div className="mt-4 sm:mt-6 grid gap-3 text-left max-w-xl mx-auto w-full sm:gap-4">
            <div className="flex items-start gap-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 backdrop-blur-sm transition-colors hover:bg-cyan-500/10 sm:p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20">
                <span className="text-lg">📱</span>
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm sm:text-base">Dashboard unificado</h3>
                <p className="text-xs text-cyan-200/70 sm:text-sm">Para asistentes y organizadores</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 backdrop-blur-sm transition-colors hover:bg-cyan-500/10 sm:p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20">
                <span className="text-lg">🎁</span>
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm sm:text-base">Recompensas en tokens</h3>
                <p className="text-xs text-cyan-200/70 sm:text-sm">Métricas de engagement en tiempo real</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 backdrop-blur-sm transition-colors hover:bg-cyan-500/10 sm:p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20">
                <span className="text-lg">🔗</span>
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm sm:text-base">Integración simple</h3>
                <p className="text-xs text-cyan-200/70 sm:text-sm">Plug-and-play con tu stack Web3</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

