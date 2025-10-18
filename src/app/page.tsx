'use client'

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAccount } from "wagmi"
import Image from "next/image"

import { ConnectButton } from "@/components/connect-button"

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
      {/* Background effects - manteniendo colores originales */}
      <div className="pointer-events-none absolute inset-0">
        <div className="neon-grid absolute inset-0 opacity-10 sm:opacity-20" aria-hidden />
        <div className="absolute -left-10 top-20 h-48 w-48 rounded-full bg-cyan-400/20 blur-[100px] sm:-left-20 sm:top-32 sm:h-64 sm:w-64 sm:blur-[120px]" aria-hidden />
        <div className="absolute -right-10 bottom-20 h-56 w-56 rounded-full bg-cyan-500/15 blur-[100px] sm:right-[-12%] sm:h-72 sm:w-72 sm:blur-[120px]" aria-hidden />
        <div className="absolute bottom-[-10%] left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[100px] sm:h-64 sm:w-64 sm:blur-[110px]" aria-hidden />
      </div>

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-6 text-center sm:gap-8 sm:max-w-lg">
        {/* Logo del perrito Swagly */}
        <div className="relative flex flex-col items-center gap-4">
          <div className="rounded-2xl bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 p-4 shadow-[0_0_40px_rgba(0,240,255,0.15)]">
            <Image
              src="/images/swagly-dog.png"
              alt="Swagly mascot"
              width={200}
              height={200}
              priority
              className="h-40 w-40 sm:h-48 sm:w-48 md:h-56 md:w-56"
            />
          </div>
          <div className="flex flex-col items-center gap-1">
            <h1 className="text-4xl font-bold text-white sm:text-5xl md:text-6xl">
              Swagly
            </h1>
            <p className="text-sm font-medium text-cyan-200/70 sm:text-base">
              By Merch3
            </p>
          </div>
        </div>

        {/* Botón Connect Wallet */}
        <div className="w-full">
          <ConnectButton />
        </div>

        {/* Descripción */}
        <div className="space-y-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 backdrop-blur-sm sm:p-6">
          <p className="text-sm leading-relaxed text-cyan-100 sm:text-base">
            Explora, juega y gana. Completa actividades, acumula Tokens SWAG y canjéalos por merch exclusiva y NFTs únicos.
          </p>

          {/* Slogan final */}
          <p className="text-base font-semibold text-white sm:text-lg">
            ¡Vive tu evento como nunca antes!
          </p>
        </div>
      </div>
    </main>
  )
}

