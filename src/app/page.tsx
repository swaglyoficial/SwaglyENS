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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="neon-grid absolute inset-0 opacity-20" aria-hidden />
        <div className="absolute -left-20 top-32 h-64 w-64 rounded-full bg-cyan-400/25 blur-[120px]" aria-hidden />
        <div className="absolute right-[-12%] top-6 h-72 w-72 rounded-full bg-cyan-500/20 blur-[120px]" aria-hidden />
        <div className="absolute bottom-[-18%] left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-500/25 blur-[110px]" aria-hidden />
      </div>

      <div className="relative z-10 flex w-full max-w-3xl flex-col items-center gap-12 px-6 py-20 text-center sm:px-12">
        <header className="flex flex-col items-center gap-4">
          <div className="relative grid h-20 w-20 place-items-center rounded-2xl border border-cyan-500/60 bg-white/5 shadow-[0_0_35px_rgba(0,240,255,0.25)] backdrop-blur">
            <Image
              src="/reown.svg"
              alt="Swagly logo"
              width={72}
              height={72}
              priority
              className="h-14 w-14 opacity-90"
            />
          </div>
          <Badge variant="secondary" className="border border-cyan-500/60 bg-cyan-500/10 text-cyan-100">
            Swagly
          </Badge>
        </header>

        <section className="flex flex-col items-center gap-8" id="experiencia">
          <Badge className="inline-flex items-center gap-2 border border-cyan-500/40 bg-cyan-500/10 text-cyan-100">
            <Sparkles className="h-3.5 w-3.5" />
            Beta privada
          </Badge>

          <div className="space-y-5">
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              Tu pasaporte Web3 para coleccionar cada logro
            </h1>
            <div className="space-y-4 text-cyan-200/80 sm:text-lg">
              <p>
                Colecciona tu experiencia hackathon y presume tu recorrido on-chain con un perfil verificable.
              </p>
              <p>
                Escanea stickers NFC, participa en workshops, acumula POAPs y deja que cada actividad sume dentro de tu identidad Swagly.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <ConnectButton />
            <Button
              asChild
              variant="outline"
              className="border-cyan-500/60 text-cyan-100 hover:bg-cyan-500/10"
            >
              <Link href="#experiencia">
                Descubre la experiencia
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <ul className="space-y-3 text-sm text-muted-foreground sm:text-base">
            <li>- Dashboard unificado para asistentes y organizadores.</li>
            <li>- Recompensas en tokens y metricas de engagement en tiempo real.</li>
            <li>- Integracion plug-and-play con tu stack Web3 favorito.</li>
          </ul>
        </section>
      </div>
    </main>
  )
}

