/**
 * ============================================
 * HOOK: useRequireProfile
 * ============================================
 *
 * Hook para verificar que el usuario tenga un perfil configurado
 * Si no tiene perfil, redirige a /profile para que lo cree
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWalletConnection } from './useWalletConnection'

export function useRequireProfile() {
  const router = useRouter()
  const { address, isConnected } = useWalletConnection()
  const [hasProfile, setHasProfile] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkProfile = async () => {
      if (!isConnected || !address) {
        setIsChecking(false)
        return
      }

      try {
        const response = await fetch(`/api/users/${address}`)
        const data = await response.json()

        if (response.ok && data.user) {
          setHasProfile(true)
        } else {
          setHasProfile(false)
          // Redirigir a profile si no tiene perfil
          router.push('/profile')
        }
      } catch (error) {
        console.error('Error checking profile:', error)
        setHasProfile(false)
      } finally {
        setIsChecking(false)
      }
    }

    checkProfile()
  }, [address, isConnected, router])

  return {
    hasProfile,
    isChecking,
    address,
    isConnected,
  }
}
