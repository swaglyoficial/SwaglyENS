/**
 * ============================================
 * HOOK: useWalletConnection
 * ============================================
 *
 * Hook simplificado para obtener el estado de conexión de la wallet
 * SIN redirecciones ni delays - solo retorna el estado actual
 */

import { useActiveAccount, useActiveWallet } from 'thirdweb/react'

export function useWalletConnection() {
  const account = useActiveAccount()
  const wallet = useActiveWallet()

  return {
    account,
    wallet,
    address: account?.address,
    isConnected: !!account,
    isLoading: false, // Removido el estado de loading artificial
  }
}
