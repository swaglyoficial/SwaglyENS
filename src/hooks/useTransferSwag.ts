/**
 * ============================================
 * HOOK: useTransferSwag
 * ============================================
 *
 * Hook para transferir tokens SWAG usando Thirdweb
 * Permite al usuario transferir tokens desde su wallet a otra dirección
 */

import { useSendTransaction, useActiveAccount } from 'thirdweb/react'
import { getContract, prepareContractCall, toWei } from 'thirdweb'
import { client, defaultChain, SWAG_TOKEN_ADDRESS } from '@/../config/thirdweb'

// Obtener el contrato del token SWAG en Scroll Mainnet
const contract = getContract({
  client,
  chain: defaultChain,
  address: SWAG_TOKEN_ADDRESS,
})

export function useTransferSwag() {
  const account = useActiveAccount()
  const {
    mutate: sendTransaction,
    data: transactionResult,
    isPending,
    isError,
    error,
  } = useSendTransaction()

  /**
   * Transfiere tokens SWAG a una dirección
   * @param to Dirección del receptor
   * @param amount Cantidad de tokens (sin decimales, ej: 150 para 150 SWAG)
   */
  const transferSwag = (to: string, amount: number) => {
    if (!account) {
      console.error('No account connected')
      return
    }

    const amountInWei = toWei(amount.toString())

    const transaction = prepareContractCall({
      contract,
      method: 'function transfer(address to, uint256 amount) returns (bool)',
      params: [to, amountInWei],
    })

    sendTransaction(transaction)
  }

  return {
    transferSwag,
    hash: transactionResult?.transactionHash,
    isPending,
    isConfirming: isPending, // Thirdweb maneja confirmación automáticamente
    isConfirmed: !!transactionResult && !isPending,
    isLoading: isPending,
    error,
  }
}
