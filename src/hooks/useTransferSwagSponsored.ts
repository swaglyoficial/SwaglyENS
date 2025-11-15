/**
 * ============================================
 * HOOK: useTransferSwagSponsored
 * ============================================
 *
 * Hook para transferir tokens SWAG usando PERMIT + transferFrom gasless
 * 1. Usuario firma un permit off-chain (sin gas)
 * 2. Backend ejecuta permit + transferFrom (backend paga el gas)
 */

import { useState } from 'react'
import { useActiveAccount } from 'thirdweb/react'
import { getContract, readContract } from 'thirdweb'
import { scroll } from 'thirdweb/chains'
import { client } from '@/lib/thirdweb-client'

interface PermitSignature {
  v: number
  r: string
  s: string
  deadline: number
}

export function useTransferSwagSponsored() {
  const account = useActiveAccount()
  const [isPending, setIsPending] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [hash, setHash] = useState<string | undefined>(undefined)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Genera el hash del mensaje EIP-712 para el permit
   */
  const getPermitHash = async (
    owner: string,
    spender: string,
    value: bigint,
    nonce: bigint,
    deadline: number,
    chainId: number,
    contractAddress: string
  ) => {
    const domain = {
      name: 'SWAGLY', // IMPORTANTE: Debe coincidir con el nombre del contrato
      version: '1',
      chainId,
      verifyingContract: contractAddress,
    }

    const types = {
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    }

    const message = {
      owner,
      spender,
      value: value.toString(),
      nonce: nonce.toString(),
      deadline,
    }

    return { domain, types, message }
  }

  /**
   * Lee el nonce actual del usuario desde el contrato
   */
  const getNonce = async (userAddress: string): Promise<bigint> => {
    const SWAG_TOKEN_ADDRESS = '0xb1Ba6FfC5b45df4e8c58D4b2C7Ab809b7D1aa8E1'

    const contract = getContract({
      client,
      chain: scroll, // Scroll Mainnet
      address: SWAG_TOKEN_ADDRESS,
    })

    try {
      // Leer el nonce del contrato usando la función nonces(address)
      const nonce = await readContract({
        contract,
        method: 'function nonces(address owner) view returns (uint256)',
        params: [userAddress],
      })

      return nonce as bigint
    } catch (error) {
      console.error('Error reading nonce:', error)
      // Si falla la lectura, empezar con 0
      return BigInt(0)
    }
  }

  /**
   * Firma el permit usando EIP-712
   */
  const signPermit = async (
    spender: string,
    value: bigint,
    deadline: number
  ): Promise<PermitSignature> => {
    if (!account) {
      throw new Error('No account connected')
    }

    const SWAG_TOKEN_ADDRESS = '0xb1Ba6FfC5b45df4e8c58D4b2C7Ab809b7D1aa8E1'
    const CHAIN_ID = 534352

    // Obtener el nonce actual del usuario desde el contrato
    const nonce = await getNonce(account.address)

    console.log('User nonce:', nonce.toString())

    const { domain, types, message } = await getPermitHash(
      account.address,
      spender,
      value,
      nonce,
      deadline,
      CHAIN_ID,
      SWAG_TOKEN_ADDRESS
    )

    // Firmar con EIP-712
    const signature = await account.signTypedData({
      domain,
      types,
      message,
      primaryType: 'Permit',
    })

    // Separar la firma en v, r, s
    const r = signature.slice(0, 66)
    const s = '0x' + signature.slice(66, 130)
    const v = parseInt(signature.slice(130, 132), 16)

    return { v, r, s, deadline }
  }

  /**
   * Transfiere tokens SWAG usando permit + transferFrom gasless
   * @param to Dirección del receptor
   * @param amount Cantidad de tokens (sin decimales, ej: 150 para 150 SWAG)
   */
  const transferSwagSponsored = async (to: string, amount: number) => {
    if (!account) {
      const error = new Error('No account connected')
      setError(error)
      return
    }

    try {
      // Reset estados
      setIsPending(true)
      setIsConfirming(false)
      setIsConfirmed(false)
      setError(null)
      setHash(undefined)

      console.log('🚀 Iniciando transferencia patrocinada...')

      // 1. Crear deadline (24 horas desde ahora)
      const deadline = Math.floor(Date.now() / 1000) + 86400

      // 2. Convertir amount a wei
      const amountInWei = BigInt(amount) * BigInt(10 ** 18)

      console.log('📝 Firmando permit...')
      // 3. Firmar el permit (off-chain, sin gas)
      const permitSignature = await signPermit(
        process.env.NEXT_PUBLIC_CREATOR_WALLET_ADDRESS!, // El spender será tu backend wallet
        amountInWei,
        deadline
      )

      console.log('✅ Permit firmado, enviando al backend...')

      // 4. El usuario ya firmó, ahora el backend procesa
      setIsPending(false)
      setIsConfirming(true)

      // 5. Enviar al backend para ejecutar permit + transferFrom
      // El backend esperará confirmación de ambas transacciones antes de responder
      const response = await fetch('/api/sponsored-transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: account.address,
          to,
          amount,
          permit: permitSignature,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to execute sponsored transfer')
      }

      // El backend ya esperó la confirmación de AMBAS transacciones
      console.log('✅ Transacción confirmada en blockchain:', data.transactionHash)
      console.log('📊 Detalles:', data.data)

      setIsConfirming(false)
      setIsConfirmed(true)
      setHash(data.transactionHash)

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      setIsPending(false)
      setIsConfirming(false)
      setIsConfirmed(false)
      console.error('Error in sponsored transfer:', error)
    }
  }

  /**
   * Resetea todos los estados del hook
   * Útil para iniciar una nueva transacción limpia
   */
  const reset = () => {
    setIsPending(false)
    setIsConfirming(false)
    setIsConfirmed(false)
    setHash(undefined)
    setError(null)
  }

  return {
    transferSwagSponsored,
    reset,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    isLoading: isPending || isConfirming,
    error,
  }
}
