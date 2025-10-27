import { useReadContract, useAccount } from 'wagmi'
import { formatUnits } from 'viem'

/**
 * Hook para obtener el balance de tokens SWAG del usuario conectado
 * Lee el balance del contrato ERC20 en Scroll Sepolia
 *
 * IMPORTANTE: No especificamos chainId para que wagmi use automáticamente
 * la red conectada del usuario. Esto evita conflictos con el formato CAIP-2
 * que usa Reown AppKit.
 */

const SWAG_TOKEN_ADDRESS = '0x05668BC3Fb05c2894988142a0b730149122192eB' as const

// ABI simplificado para balanceOf
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
  },
] as const

export function useSwagBalance() {
  const { address } = useAccount()

  const { data, isError, isLoading, refetch } = useReadContract({
    address: SWAG_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    // No especificamos chainId - wagmi usa automáticamente la red conectada
    query: {
      enabled: !!address, // Solo ejecutar si hay una dirección conectada
      refetchInterval: 10000, // Refrescar cada 10 segundos
    },
  })

  // Convertir balance de wei a tokens (18 decimales)
  const balance = data ? parseFloat(formatUnits(data, 18)) : 0

  return {
    balance,
    isLoading,
    isError,
    refetch,
  }
}
