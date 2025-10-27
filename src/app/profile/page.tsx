'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import Image from 'next/image'
import { Loader2, User, Edit2, Check, X, Menu } from 'lucide-react'
import { ConnectButton } from '@/components/connect-button'
import { TokenBalance } from '@/components/token-balance'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface UserProfile {
  id: string
  nickname: string
  walletAddress: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()

  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [newNickname, setNewNickname] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!isConnected) {
      router.push('/')
      return
    }
  }, [isConnected, router])

  const fetchUserData = async () => {
    if (!address) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/users/${address}`)
      const data = await response.json()

      if (response.ok && data.user) {
        setUser(data.user)
        setNewNickname(data.user.nickname)
      } else {
        router.push('/onboarding')
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      setError('Error al cargar tu perfil')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isConnected && address) {
      fetchUserData()
    }
  }, [isConnected, address, router])

  const handleEditClick = () => {
    setIsEditing(true)
    setError('')
    setSuccessMessage('')
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setNewNickname(user?.nickname || '')
    setError('')
  }

  const handleSaveNickname = async () => {
    if (!newNickname.trim()) {
      setError('El apodo no puede estar vacío')
      return
    }

    if (newNickname.trim().length < 3) {
      setError('El apodo debe tener al menos 3 caracteres')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/users/${address}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname: newNickname.trim(),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        setIsEditing(false)
        setSuccessMessage('¡Apodo actualizado exitosamente!')
        setTimeout(() => setSuccessMessage(''), 3000)
      } else {
        setError(data.error || 'Error al actualizar el apodo')
      }
    } catch (error) {
      console.error('Error updating nickname:', error)
      setError('Error al conectar con el servidor')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isConnected || isLoading) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-[#5061EC]" />
      </main>
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white pb-20">
      {/* Background decorativo */}
      <div className="pointer-events-none absolute inset-0">
        <div className="neon-grid absolute inset-0 opacity-5" aria-hidden />

        {/* Línea vertical azul derecha */}
        <div
          className="absolute right-0 top-0 h-[600px] w-1 bg-gradient-to-b from-[#5061EC] via-transparent to-transparent opacity-30"
          aria-hidden
        />

        {/* Curva azul superior */}
        <svg
          className="absolute right-0 top-1/4 h-[400px] w-[600px] opacity-40 sm:h-[500px] sm:w-[800px]"
          viewBox="0 0 800 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            d="M800 0C800 100 700 200 500 250C300 300 200 350 100 500"
            stroke="url(#blueGradientProfile)"
            strokeWidth="2"
            fill="none"
          />
          <defs>
            <linearGradient id="blueGradientProfile" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5061EC" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#5061EC" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Curva amarilla inferior */}
        <svg
          className="absolute -left-32 bottom-0 h-[300px] w-[500px] opacity-50 sm:-left-20 sm:h-[400px] sm:w-[700px]"
          viewBox="0 0 700 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            d="M0 400C100 350 200 300 400 280C600 260 700 200 700 100"
            stroke="url(#yellowGradientProfile)"
            strokeWidth="3"
            fill="none"
          />
          <defs>
            <linearGradient id="yellowGradientProfile" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FEE887" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#FEE887" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Header */}
      <header className="relative z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-4 sm:px-12 lg:px-20">
          {/* Logo - Solo mundito en móvil, con texto en desktop */}
          <a href="/inicio" className="flex items-center gap-2">
            <div className="rounded-full bg-gradient-to-br from-[#5061EC]/20 to-[#5061EC]/5 p-1 transition-all duration-300 hover:scale-110 hover:from-[#5061EC]/30 hover:to-[#5061EC]/10">
              <Image
                src="/images/LogoSwagly.png"
                alt="Swagly Logo"
                width={40}
                height={40}
                className="h-8 w-8 sm:h-10 sm:w-10"
              />
            </div>
            {/* Texto del logo - Oculto en móvil */}
            <Image
              src="/images/TextoLogoSwagly.png"
              alt="Swagly"
              width={100}
              height={30}
              className="hidden h-auto w-20 sm:block lg:w-24"
            />
          </a>

          {/* Navegación Desktop - Oculta en móvil */}
          <nav className="hidden items-center gap-4 md:flex lg:gap-6">
            <a
              href="/inicio"
              className="group relative px-3 py-2 text-sm font-medium transition-all duration-300 hover:text-[#FEE887]"
            >
              <span className="relative z-10">Inicio</span>
              <div className="absolute inset-0 rounded-lg bg-[#FEE887]/0 transition-all duration-300 group-hover:bg-[#FEE887]/10" />
            </a>
            <a
              href="/shop"
              className="group relative px-3 py-2 text-sm font-medium transition-all duration-300 hover:text-[#FEE887]"
            >
              <span className="relative z-10">Tienda</span>
              <div className="absolute inset-0 rounded-lg bg-[#FEE887]/0 transition-all duration-300 group-hover:bg-[#FEE887]/10" />
            </a>
            <a
              href="/events"
              className="group relative px-3 py-2 text-sm font-medium transition-all duration-300 hover:text-[#FEE887]"
            >
              <span className="relative z-10">Tus eventos</span>
              <div className="absolute inset-0 rounded-lg bg-[#FEE887]/0 transition-all duration-300 group-hover:bg-[#FEE887]/10" />
            </a>

            {/* Balance amarillo */}
            <TokenBalance />

            {/* Icono de perfil activo */}
            <button className="group relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-[#5061EC] bg-gradient-to-br from-[#5061EC]/30 to-[#5061EC]/10 shadow-lg shadow-[#5061EC]/40 backdrop-blur-sm">
              <svg
                className="h-5 w-5 text-[#5061EC] transition-colors"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </nav>

          {/* Navegación Móvil - Visible solo en móvil */}
          <div className="flex items-center gap-3 md:hidden">
            {/* Balance amarillo */}
            <TokenBalance />

            {/* Icono de perfil activo */}
            <button className="group relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-[#5061EC] bg-gradient-to-br from-[#5061EC]/30 to-[#5061EC]/10 shadow-lg shadow-[#5061EC]/40 backdrop-blur-sm">
              <svg
                className="h-5 w-5 text-[#5061EC] transition-colors"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* Hamburger Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-[#5061EC]/20 text-white transition-all duration-300 hover:bg-[#5061EC]/30"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="border-t border-white/5 bg-black/95 backdrop-blur-xl md:hidden">
            <nav className="space-y-1 px-4 py-4">
              <a
                href="/inicio"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block rounded-lg px-4 py-3 text-sm font-medium text-white transition-all duration-300 hover:bg-[#FEE887]/10 hover:text-[#FEE887]"
              >
                Inicio
              </a>
              <a
                href="/shop"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block rounded-lg px-4 py-3 text-sm font-medium text-white transition-all duration-300 hover:bg-[#FEE887]/10 hover:text-[#FEE887]"
              >
                Tienda
              </a>
              <a
                href="/events"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block rounded-lg px-4 py-3 text-sm font-medium text-white transition-all duration-300 hover:bg-[#FEE887]/10 hover:text-[#FEE887]"
              >
                Tus eventos
              </a>
            </nav>
          </div>
        )}
      </header>

      {/* Content */}
      <section className="relative z-10 px-6 py-12 sm:px-12 lg:px-20">
        <div className="mx-auto max-w-3xl">
          {/* Title */}
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-bold sm:text-5xl">
              <span className="bg-gradient-to-r from-[#5061EC] via-white to-[#5061EC] bg-clip-text text-transparent">
                Mi Perfil
              </span>
            </h1>
            <p className="text-lg text-white/80">
              Gestiona tu información personal y configuración de wallet
            </p>
          </div>

          {/* Profile Card */}
          <div className="group relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#5061EC] to-[#4051CC] p-8 shadow-2xl shadow-[#5061EC]/30 transition-all duration-300 hover:shadow-[#5061EC]/50 sm:p-12">
            {/* Efecto hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="relative z-10">
              {/* Profile Icon */}
              <div className="mb-8 flex justify-center">
                <div className="relative">
                  <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white/30 bg-gradient-to-br from-white/20 to-white/5 shadow-xl">
                    <User className="h-16 w-16 text-white" />
                  </div>
                  {/* Decoración */}
                  <div className="absolute -right-2 -top-2 h-8 w-8 rounded-full border-2 border-white/40 bg-[#FEE887]" />
                </div>
              </div>

              {/* Nickname Section */}
              <div className="mb-8">
                <label className="mb-3 block text-center text-sm font-semibold text-white/80">
                  Tu Apodo
                </label>

                {!isEditing ? (
                  <div className="flex items-center justify-center gap-4">
                    <h2 className="text-3xl font-bold text-white sm:text-4xl">
                      {user?.nickname}
                    </h2>
                    <Button
                      onClick={handleEditClick}
                      className="rounded-full bg-white/20 p-3 text-white transition-all hover:scale-110 hover:bg-white/30"
                      size="sm"
                    >
                      <Edit2 className="h-5 w-5" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Input
                        value={newNickname}
                        onChange={(e) => setNewNickname(e.target.value)}
                        placeholder="Ingresa tu nuevo apodo"
                        className="flex-1 rounded-full border-white/30 bg-white/10 text-center text-lg font-bold text-white placeholder:text-white/50"
                        maxLength={20}
                      />
                    </div>
                    <div className="flex justify-center gap-3">
                      <Button
                        onClick={handleSaveNickname}
                        disabled={isSaving}
                        className="rounded-full bg-gradient-to-r from-[#FEE887] to-[#FFFACD] px-6 text-black font-bold shadow-lg hover:scale-105"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Guardar
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                        className="rounded-full bg-white/20 px-6 text-white hover:bg-white/30"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

                <p className="mt-4 text-center text-sm text-white/70">
                  Este es el nombre que verán otros usuarios en el evento
                </p>
              </div>

              {/* Messages */}
              {error && (
                <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-center">
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              )}

              {successMessage && (
                <div className="mb-6 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-center">
                  <p className="text-sm text-green-200">{successMessage}</p>
                </div>
              )}

              {/* Wallet Address */}
              <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
                <label className="mb-3 block text-center text-sm font-semibold text-white/80">
                  Dirección de Wallet
                </label>
                <p className="break-all text-center font-mono text-sm text-white/90">
                  {address}
                </p>
                <p className="mt-2 text-center text-xs text-white/60">
                  Esta es tu dirección única en la blockchain
                </p>
              </div>
            </div>
          </div>

          {/* Wallet Connection Card */}
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#FEE887] to-[#FFFACD] p-8 shadow-2xl shadow-[#FEE887]/20 sm:p-12">
            <div className="text-center">
              <h3 className="mb-4 text-2xl font-bold text-black sm:text-3xl">
                Gestión de Wallet
              </h3>
              <p className="mb-6 text-base text-black/70">
                Conecta, desconecta o cambia tu wallet usando el botón de abajo
              </p>

              {/* Wallet Connect Button */}
              <div className="flex justify-center">
                <div className="transform transition-all duration-300 hover:scale-105">
                  <ConnectButton />
                </div>
              </div>

              <p className="mt-6 text-sm text-black/60">
                💡 Puedes cambiar de wallet o desconectarte en cualquier momento
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
