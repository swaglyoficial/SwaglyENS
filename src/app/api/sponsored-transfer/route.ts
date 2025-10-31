/**
 * ============================================
 * API ROUTE: Sponsored Transfer with PERMIT
 * ============================================
 *
 * Endpoint para realizar transferencias gasless usando:
 * 1. Usuario firma un permit (off-chain)
 * 2. Backend ejecuta permit + transferFrom usando llave privada (backend paga el gas)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createThirdwebClient, getContract, prepareContractCall, sendTransaction } from 'thirdweb'
import { privateKeyToAccount } from 'thirdweb/wallets'
import { scroll } from 'thirdweb/chains'

const SWAG_TOKEN_ADDRESS = '0xb1Ba6FfC5b45df4e8c58D4b2C7Ab809b7D1aa8E1'
const CHAIN_ID = 534352 // Scroll Mainnet

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { from, to, amount, permit } = body

    // Validar parámetros
    if (!from || !to || !amount || !permit) {
      return NextResponse.json(
        { error: 'Missing required parameters: from, to, amount, permit' },
        { status: 400 }
      )
    }

    // Validar firma del permit
    const { v, r, s, deadline } = permit
    if (!v || !r || !s || !deadline) {
      return NextResponse.json(
        { error: 'Invalid permit signature' },
        { status: 400 }
      )
    }

    // Validar que tenemos la llave privada del backend wallet
    const privateKey = process.env.CREATOR_WALLET_PRIVATE_KEY
    const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID

    if (!privateKey || !clientId) {
      console.error('Missing environment variables: CREATOR_WALLET_PRIVATE_KEY or NEXT_PUBLIC_THIRDWEB_CLIENT_ID')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Convertir amount a wei (18 decimales)
    const amountInWei = BigInt(amount) * BigInt(10 ** 18)

    // Crear cliente de Thirdweb
    const client = createThirdwebClient({
      clientId: clientId,
    })

    // Crear cuenta desde llave privada
    const account = privateKeyToAccount({
      client,
      privateKey: privateKey,
    })

    // Obtener instancia del contrato
    const contract = getContract({
      client,
      chain: scroll,
      address: SWAG_TOKEN_ADDRESS,
    })

    console.log('Executing permit + transferFrom:', {
      from,
      to,
      amount: amountInWei.toString(),
      spender: account.address,
      deadline,
    })

    // 1. Ejecutar permit
    const permitTransaction = prepareContractCall({
      contract,
      method: 'function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)',
      params: [
        from,               // owner
        account.address,    // spender (backend wallet)
        amountInWei,        // value
        BigInt(deadline),   // deadline
        v,                  // v
        r,                  // r
        s,                  // s
      ],
    })

    const permitResult = await sendTransaction({
      transaction: permitTransaction,
      account,
    })

    console.log('Permit executed:', permitResult.transactionHash)

    // 2. Ejecutar transferFrom
    const transferTransaction = prepareContractCall({
      contract,
      method: 'function transferFrom(address from, address to, uint256 amount) returns (bool)',
      params: [from, to, amountInWei],
    })

    const transferResult = await sendTransaction({
      transaction: transferTransaction,
      account,
    })

    console.log('Transfer successful:', transferResult.transactionHash)

    // Retornar el resultado exitoso
    return NextResponse.json({
      success: true,
      permitHash: permitResult.transactionHash,
      transactionHash: transferResult.transactionHash,
      data: {
        permit: permitResult,
        transfer: transferResult,
      },
    })
  } catch (error) {
    console.error('Error in sponsored-transfer:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error
      },
      { status: 500 }
    )
  }
}
