/**
 * ============================================
 * HOOK: useSwagBalance
 * ============================================
 *
 * Hook para obtener el balance de tokens SWAG del usuario conectado
 * Lee el balance del contrato ERC20 en Scroll Sepolia usando Thirdweb
 */

import { useActiveAccount, useReadContract } from 'thirdweb/react'
import { getContract } from 'thirdweb'
import { client, defaultChain, SWAG_TOKEN_ADDRESS } from '@/../config/thirdweb'
import { toEther } from 'thirdweb'

// Obtener el contrato del token SWAG en Scroll Mainnet
const contract = getContract({
  client,
  chain: defaultChain,
  address: SWAG_TOKEN_ADDRESS,
})

export function useSwagBalance() {
  const account = useActiveAccount()

  const { data, isLoading, isError, refetch } = useReadContract({
    contract,
    method: 'function balanceOf(address account) view returns (uint256)',
    params: [account?.address || '0x0000000000000000000000000000000000000000'],
    queryOptions: {
      enabled: !!account?.address, // Solo ejecutar si hay una dirección conectada
    },
  })

  // Convertir balance de wei a tokens (18 decimales)
  const balance = data ? parseFloat(toEther(data)) : 0

  return {
    balance,
    isLoading,
    isError,
    refetch,
  }
}
