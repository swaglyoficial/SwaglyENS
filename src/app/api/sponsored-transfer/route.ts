/**
 * ============================================
 * API ROUTE: Sponsored Transfer with PERMIT
 * ============================================
 *
 * Endpoint para realizar transferencias gasless usando:
 * 1. Usuario firma un permit (off-chain)
 * 2. Backend ejecuta permit + transferFrom usando llave privada (backend paga el gas)
 * 3. Espera confirmación de cada transacción antes de continuar
 */

import { NextRequest, NextResponse } from 'next/server'
import { createThirdwebClient, getContract, prepareContractCall, sendTransaction, waitForReceipt } from 'thirdweb'
import { privateKeyToAccount } from 'thirdweb/wallets'
import { scroll } from 'thirdweb/chains'

const SWAG_TOKEN_ADDRESS = '0xb1Ba6FfC5b45df4e8c58D4b2C7Ab809b7D1aa8E1'
const CHAIN_ID = 534352 // Scroll Mainnet

// Configuración de timeouts y reintentos
const MAX_RETRIES = 2
const TRANSACTION_TIMEOUT_MS = 60000 // 60 segundos

/**
 * Ejecuta una transacción con reintentos automáticos
 */
async function executeTransactionWithRetry(
  transactionFn: () => Promise<any>,
  retries = MAX_RETRIES
): Promise<any> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Reintento ${attempt}/${retries}...`)
        // Esperar un poco antes de reintentar (backoff exponencial)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
      }

      return await transactionFn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      console.error(`Intento ${attempt + 1} falló:`, lastError.message)

      // Si es el último intento, lanzar el error
      if (attempt === retries) {
        throw lastError
      }
    }
  }

  throw lastError || new Error('Transaction failed after retries')
}

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

    console.log('====================================')
    console.log('🚀 EXECUTING SPONSORED TRANSFER')
    console.log('====================================')
    console.log('Executing permit + transferFrom:', {
      from,
      to,
      amount: amountInWei.toString(),
      spender: account.address,
      deadline,
    })

    // 1. Ejecutar permit CON ESPERA DE CONFIRMACIÓN
    console.log('📝 Step 1/2: Executing permit...')
    const permitResult = await executeTransactionWithRetry(async () => {
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

      const result = await sendTransaction({
        transaction: permitTransaction,
        account,
      })

      console.log('✅ Permit transaction sent:', result.transactionHash)
      console.log('⏳ Waiting for permit confirmation...')

      // IMPORTANTE: Esperar confirmación antes de continuar
      const receipt = await waitForReceipt({
        client,
        chain: scroll,
        transactionHash: result.transactionHash,
      })

      console.log('✅ Permit confirmed! Block:', receipt.blockNumber)

      return { ...result, receipt }
    })

    // 2. Ejecutar transferFrom CON ESPERA DE CONFIRMACIÓN
    console.log('📝 Step 2/2: Executing transferFrom...')
    const transferResult = await executeTransactionWithRetry(async () => {
      const transferTransaction = prepareContractCall({
        contract,
        method: 'function transferFrom(address from, address to, uint256 amount) returns (bool)',
        params: [from, to, amountInWei],
      })

      const result = await sendTransaction({
        transaction: transferTransaction,
        account,
      })

      console.log('✅ Transfer transaction sent:', result.transactionHash)
      console.log('⏳ Waiting for transfer confirmation...')

      // IMPORTANTE: Esperar confirmación antes de retornar al frontend
      const receipt = await waitForReceipt({
        client,
        chain: scroll,
        transactionHash: result.transactionHash,
      })

      console.log('✅ Transfer confirmed! Block:', receipt.blockNumber)

      return { ...result, receipt }
    })

    console.log('====================================')
    console.log('✅ TRANSFER COMPLETED SUCCESSFULLY')
    console.log('====================================')
    console.log('Permit TX:', permitResult.transactionHash)
    console.log('Transfer TX:', transferResult.transactionHash)
    console.log('====================================')

    // Retornar el resultado exitoso
    return NextResponse.json({
      success: true,
      permitHash: permitResult.transactionHash,
      transactionHash: transferResult.transactionHash,
      data: {
        permit: {
          hash: permitResult.transactionHash,
          blockNumber: permitResult.receipt?.blockNumber?.toString(),
          status: permitResult.receipt?.status,
        },
        transfer: {
          hash: transferResult.transactionHash,
          blockNumber: transferResult.receipt?.blockNumber?.toString(),
          status: transferResult.receipt?.status,
        },
      },
    })
  } catch (error) {
    console.error('====================================')
    console.error('❌ ERROR IN SPONSORED TRANSFER')
    console.error('====================================')
    console.error(error)
    console.error('====================================')

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Mensajes de error más específicos para el usuario
    let userMessage = 'Error al procesar la transacción'

    if (errorMessage.includes('nonce')) {
      userMessage = 'Error de sincronización. Por favor, intenta nuevamente.'
    } else if (errorMessage.includes('insufficient')) {
      userMessage = 'Balance insuficiente para completar la transacción'
    } else if (errorMessage.includes('deadline')) {
      userMessage = 'La firma ha expirado. Por favor, intenta nuevamente.'
    } else if (errorMessage.includes('timeout')) {
      userMessage = 'La transacción tomó demasiado tiempo. Verifica el explorador de bloques.'
    }

    return NextResponse.json(
      {
        error: userMessage,
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}
