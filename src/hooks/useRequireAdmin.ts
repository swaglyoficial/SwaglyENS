/**
 * ============================================
 * HOOK: useRequireAdmin
 * ============================================
 *
 * Hook para verificar que el usuario tenga rol de admin
 * Si no es admin o no está conectado, redirige a home
 */

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useWalletConnection } from './useWalletConnection'

export function useRequireAdmin() {
  const router = useRouter()
  const { address, isConnected } = useWalletConnection()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(true)
  const prevAddress = useRef<string | undefined>(undefined)

  useEffect(() => {
    const checkAdminRole = async () => {
      // Si no está conectado, redirigir a home
      if (!isConnected || !address) {
        setIsChecking(false)
        setIsAdmin(false)
        if (prevAddress.current) {
          // Solo redirigir si había una dirección previa (desconexión)
          router.push('/')
        }
        return
      }

      // Solo verificar si cambió la dirección o es la primera vez
      if (prevAddress.current === address) {
        return
      }

      prevAddress.current = address
      setIsChecking(true)

      try {
        console.log('🔍 Verificando rol de admin para:', address)
        const response = await fetch(`/api/users/${address}`)
        const data = await response.json()

        console.log('📦 Respuesta de API:', data)

        if (response.ok && data.user) {
          // Verificar si el usuario tiene rol de admin
          console.log('👤 Rol del usuario:', data.user.role)
          if (data.user.role === 'admin') {
            console.log('✅ Usuario es admin, permitiendo acceso')
            setIsAdmin(true)
          } else {
            console.warn('⚠️ Acceso denegado: Se requiere rol de administrador')
            setIsAdmin(false)
            router.push('/')
          }
        } else {
          console.warn('⚠️ Usuario no encontrado en la base de datos')
          setIsAdmin(false)
          router.push('/')
        }
      } catch (error) {
        console.error('❌ Error checking admin role:', error)
        setIsAdmin(false)
        router.push('/')
      } finally {
        setIsChecking(false)
      }
    }

    checkAdminRole()
  }, [address, isConnected, router])

  return {
    isAdmin,
    isChecking,
    address,
    isConnected,
  }
}
