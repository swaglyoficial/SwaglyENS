/**
 * Hook para reclamar tokens ERC-1155 del smart contract de Swagly
 * Usa wagmi para interactuar con el contrato desde el frontend
 * El usuario firma la transacción con su wallet conectada
 */

'use client'

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import {
  SWAGLY_CONTRACT_ABI,
  SWAGLY_CONTRACT_ADDRESS,
  SCROLL_SEPOLIA_CHAIN_ID,
} from '@/lib/contract-abi'

export interface ClaimTokensParams {
  receiverAddress: `0x${string}` // Dirección que recibirá los tokens (normalmente la del usuario)
  quantity: bigint // Cantidad de tokens a reclamar (usar BigInt para uint256)
}

/**
 * Hook para reclamar tokens
 * @returns Objeto con funciones y estados para el proceso de claim
 */
export function useClaimTokens() {
  // Hook de wagmi para escribir al contrato
  const {
    data: hash,
    writeContract,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract()

  // Hook para esperar que la transacción se confirme en la blockchain
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash,
  })

  /**
   * Función para iniciar el proceso de claim
   * Esta función abrirá la wallet del usuario para que firme la transacción
   */
  const claimTokens = async ({ receiverAddress, quantity }: ClaimTokensParams) => {
    try {
      // Preparar los parámetros para la función claim del contrato
      // La función claim requiere:
      // - _receiver: dirección que recibe los tokens
      // - _quantity: cantidad de tokens
      // - _currency: dirección de la moneda (0x0 = nativa)
      // - _pricePerToken: precio por token (0 = gratis)
      // - _allowlistProof: struct con condiciones (sin restricciones)
      // - _data: bytes adicionales (vacío)

      const allowlistProof = {
        proof: [], // Sin merkle proof = sin whitelist
        quantityLimitPerWallet: BigInt(0), // Sin límite por wallet
        pricePerToken: BigInt(0), // Gratis
        currency: '0x0000000000000000000000000000000000000000' as `0x${string}`, // Moneda nativa
      }

      // Llamar a writeContract de wagmi
      writeContract({
        address: SWAGLY_CONTRACT_ADDRESS,
        abi: SWAGLY_CONTRACT_ABI,
        functionName: 'claim',
        chainId: SCROLL_SEPOLIA_CHAIN_ID,
        args: [
          receiverAddress, // _receiver
          quantity, // _quantity
          '0x0000000000000000000000000000000000000000', // _currency (address(0) = nativa)
          BigInt(0), // _pricePerToken (0 = gratis)
          allowlistProof, // _allowlistProof
          '0x', // _data (vacío)
        ],
        // El valor a enviar (si el claim tiene costo, iría aquí)
        // value: BigInt(0), // Sin costo
      })
    } catch (error) {
      console.error('Error al preparar claim:', error)
      throw error
    }
  }

  // Estados combinados para facilitar el uso
  const isLoading = isWritePending || isConfirming
  const error = writeError || confirmError

  return {
    claimTokens, // Función para iniciar el claim
    isLoading, // true mientras se espera firma o confirmación
    isWritePending, // true mientras se espera que el usuario firme
    isConfirming, // true mientras se espera confirmación en blockchain
    isConfirmed, // true cuando la transacción se confirma
    hash, // Hash de la transacción (para exploradores de bloques)
    error, // Error si algo falla
  }
}
