import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'

/**
 * Hook para transferir tokens SWAG usando wagmi
 * Permite al usuario transferir tokens desde su wallet a otra dirección
 *
 * IMPORTANTE: No especificamos chainId para que wagmi use automáticamente
 * la red conectada del usuario. Esto evita conflictos con el formato CAIP-2
 * que usa Reown AppKit.
 */

const SWAG_TOKEN_ADDRESS = '0x05668BC3Fb05c2894988142a0b730149122192eB' as const

// ABI simplificado para transfer
const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: 'success', type: 'bool' }],
  },
] as const

export function useTransferSwag() {
  const {
    data: hash,
    isPending,
    writeContract,
    error: writeError,
  } = useWriteContract()

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash,
    // No especificamos chainId - wagmi usa automáticamente la red conectada
  })

  /**
   * Transfiere tokens SWAG a una dirección
   * @param to Dirección del receptor
   * @param amount Cantidad de tokens (sin decimales, ej: 150 para 150 SWAG)
   */
  const transferSwag = (to: string, amount: number) => {
    const amountInWei = parseUnits(amount.toString(), 18)

    writeContract({
      address: SWAG_TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [to as `0x${string}`, amountInWei],
      // No especificamos chainId - wagmi usa automáticamente la red conectada del usuario
    })
  }

  return {
    transferSwag,
    hash,
    isPending, // Esperando que el usuario firme
    isConfirming, // Esperando confirmación en la blockchain
    isConfirmed, // Transacción confirmada
    isLoading: isPending || isConfirming,
    error: writeError || confirmError,
  }
}
