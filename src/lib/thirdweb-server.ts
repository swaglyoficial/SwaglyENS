import {
  CREATOR_WALLET_ADDRESS,
  CREATOR_WALLET_PRIVATE_KEY,
  DEFAULT_CLAIM_CONFIG,
  SCROLL_MAINNET_CHAIN_ID,
  SWAG_TOKEN_ADDRESS,
  THIRDWEB_API_URL,
  THIRDWEB_SECRET_KEY,
  TOKEN_DECIMALS,
} from './thirdweb-config'
import { createWalletClient, http, createPublicClient, encodeFunctionData, parseAbi, defineChain } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

// Definir Scroll Mainnet manualmente
const scrollMainnet = defineChain({
  id: 534352,
  name: 'Scroll',
  network: 'scroll',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.scroll.io'],
    },
    public: {
      http: ['https://rpc.scroll.io'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Scrollscan',
      url: 'https://scrollscan.com',
    },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 14,
    },
  },
})

const CLAIM_METHOD_SIGNATURE =
  'function claim(address _receiver, uint256 _quantity, address _currency, uint256 _pricePerToken, (bytes32[] proof, uint256 quantityLimitPerWallet, uint256 pricePerToken, address currency) _allowlistProof, bytes _data) payable'

// ABI simplificado para el método claim
const CLAIM_ABI = parseAbi([
  CLAIM_METHOD_SIGNATURE
])

export class ThirdwebApiError extends Error {
  status: number
  payload: unknown

  constructor(message: string, status: number, payload: unknown) {
    super(message)
    this.name = 'ThirdwebApiError'
    this.status = status
    this.payload = payload
  }
}

export interface ClaimTokensOptions {
  receiverAddress: `0x${string}`
  quantity?: number
  quantityInWei?: bigint
  allowlistProof?:
    | readonly [readonly `0x${string}`[], number | bigint, number | bigint, string]
    | {
        proof: readonly `0x${string}`[]
        quantityLimitPerWallet: number | bigint
        pricePerToken: number | bigint
        currency: string
      }
  pricePerToken?: number | bigint
  currency?: string
  data?: `0x${string}`
  chainId?: number
  contractAddress?: `0x${string}`
  decimals?: number
}

export interface ClaimTokensResult {
  transactionHash?: string
  thirdwebResponse: unknown
  quantityInWei: bigint
}

function ensureServerConfig() {
  if (!THIRDWEB_SECRET_KEY || THIRDWEB_SECRET_KEY.trim() === '') {
    throw new Error('THIRDWEB_SECRET_KEY is not configured')
  }

  if (
    !CREATOR_WALLET_ADDRESS ||
    CREATOR_WALLET_ADDRESS.trim() === '' ||
    CREATOR_WALLET_ADDRESS.includes('<YOUR')
  ) {
    throw new Error('CREATOR_WALLET_ADDRESS is not configured')
  }
}

function toBigIntString(value: number | bigint | undefined) {
  if (typeof value === 'bigint') {
    return value.toString()
  }

  if (typeof value === 'number') {
    return BigInt(value).toString()
  }

  return '0'
}

function computeQuantityInWei(quantity?: number, quantityInWei?: bigint, decimals: number = TOKEN_DECIMALS) {
  if (typeof quantityInWei === 'bigint') {
    return quantityInWei
  }

  if (typeof quantity === 'undefined') {
    throw new Error('quantity or quantityInWei must be provided')
  }

  if (!Number.isInteger(quantity)) {
    throw new Error('quantity must be an integer number of tokens')
  }

  const multiplier = 10n ** BigInt(decimals)
  return BigInt(quantity) * multiplier
}

function normalizeAllowlistProof(
  input:
    | ClaimTokensOptions['allowlistProof']
    | typeof DEFAULT_CLAIM_CONFIG.allowlistProof,
  fallbackCurrency: string
): [readonly `0x${string}`[], string, string, string] {
  if (Array.isArray(input)) {
    const [proof, quantityLimitPerWallet, pricePerToken, currency] = input

    return [
      Array.isArray(proof) ? (proof as readonly `0x${string}`[]) : [],
      toBigIntString(quantityLimitPerWallet as number | bigint | undefined),
      toBigIntString(pricePerToken as number | bigint | undefined),
      (currency as string) ?? fallbackCurrency,
    ]
  }

  if (input && typeof input === 'object' && !Array.isArray(input)) {
    const { proof, quantityLimitPerWallet, pricePerToken, currency } = input as {
      proof: readonly `0x${string}`[]
      quantityLimitPerWallet: number | bigint
      pricePerToken: number | bigint
      currency: string
    }
    return [
      Array.isArray(proof) ? (proof as readonly `0x${string}`[]) : [],
      toBigIntString(quantityLimitPerWallet),
      toBigIntString(pricePerToken),
      currency ?? fallbackCurrency,
    ]
  }

  return [
    [],
    toBigIntString(0),
    toBigIntString(0),
    fallbackCurrency,
  ]
}

export async function claimTokensViaThirdweb(options: ClaimTokensOptions): Promise<ClaimTokensResult> {
  ensureServerConfig()

  const chainId = options.chainId ?? SCROLL_MAINNET_CHAIN_ID
  const contractAddress = options.contractAddress ?? SWAG_TOKEN_ADDRESS
  const currency = options.currency ?? DEFAULT_CLAIM_CONFIG.currency
  const data = options.data ?? (DEFAULT_CLAIM_CONFIG.data as `0x${string}`)
  const pricePerToken = options.pricePerToken ?? DEFAULT_CLAIM_CONFIG.pricePerToken
  const allowlistProofSource = options.allowlistProof ?? DEFAULT_CLAIM_CONFIG.allowlistProof

  const quantityInWei = computeQuantityInWei(options.quantity, options.quantityInWei, options.decimals)

  const allowlistProof = normalizeAllowlistProof(allowlistProofSource, currency)

  console.log('====================================')
  console.log('🚀 CLAIM DE TOKENS CON VIEM')
  console.log('====================================')
  console.log('📋 Detalles del claim:')
  console.log(`   - Receptor: ${options.receiverAddress}`)
  console.log(`   - Cantidad: ${options.quantity} tokens (${quantityInWei.toString()} wei)`)
  console.log(`   - Contrato: ${contractAddress}`)
  console.log(`   - Chain: Scroll Mainnet (${chainId})`)
  console.log(`   - Wallet firmante: ${CREATOR_WALLET_ADDRESS}`)
  console.log('====================================')

  try {
    // Crear cuenta desde la private key
    if (!CREATOR_WALLET_PRIVATE_KEY || CREATOR_WALLET_PRIVATE_KEY.trim() === '') {
      throw new Error('CREATOR_WALLET_PRIVATE_KEY no está configurada en el .env')
    }

    const account = privateKeyToAccount(CREATOR_WALLET_PRIVATE_KEY.startsWith('0x')
      ? CREATOR_WALLET_PRIVATE_KEY as `0x${string}`
      : `0x${CREATOR_WALLET_PRIVATE_KEY}` as `0x${string}`)

    console.log('✅ Cuenta creada desde private key:', account.address)

    // Crear cliente público para leer estado de la blockchain
    const publicClient = createPublicClient({
      chain: scrollMainnet,
      transport: http(),
    })

    // Crear cliente de wallet para firmar transacciones
    const walletClient = createWalletClient({
      account,
      chain: scrollMainnet,
      transport: http(),
    })

    console.log('✅ Clientes de viem creados')

    // Preparar los parámetros del claim
    const claimParams = [
      options.receiverAddress,
      quantityInWei,
      currency as `0x${string}`,
      BigInt(toBigIntString(pricePerToken)),
      {
        proof: allowlistProof[0],
        quantityLimitPerWallet: BigInt(allowlistProof[1]),
        pricePerToken: BigInt(allowlistProof[2]),
        currency: allowlistProof[3] as `0x${string}`,
      },
      data,
    ] as const

    console.log('📦 Parámetros del claim:', {
      receiver: options.receiverAddress,
      quantity: quantityInWei.toString(),
      currency,
      pricePerToken: toBigIntString(pricePerToken),
      allowlistProof: {
        proof: allowlistProof[0],
        quantityLimitPerWallet: allowlistProof[1],
        pricePerToken: allowlistProof[2],
        currency: allowlistProof[3],
      },
      data,
    })

    // Enviar la transacción
    console.log('📤 Enviando transacción...')
    const hash = await walletClient.writeContract({
      address: contractAddress as `0x${string}`,
      abi: CLAIM_ABI,
      functionName: 'claim',
      args: claimParams,
      account,
    })

    console.log('✅ Transacción enviada!')
    console.log('📝 Transaction Hash:', hash)

    // Esperar a que se confirme la transacción
    console.log('⏳ Esperando confirmación de la transacción...')
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      confirmations: 1,
    })

    console.log('====================================')
    console.log('✅ TRANSACCIÓN CONFIRMADA')
    console.log('====================================')
    console.log(`📝 TX Hash: ${hash}`)
    console.log(`📊 Block: ${receipt.blockNumber}`)
    console.log(`⛽ Gas usado: ${receipt.gasUsed}`)
    console.log(`✅ Status: ${receipt.status}`)
    console.log('====================================')

    return {
      transactionHash: hash,
      thirdwebResponse: { receipt, hash },
      quantityInWei,
    }
  } catch (error) {
    console.error('====================================')
    console.error('❌ ERROR AL EJECUTAR CLAIM')
    console.error('====================================')
    console.error(error)

    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'

    throw new ThirdwebApiError(
      `Error al ejecutar claim con viem: ${errorMessage}`,
      500,
      { error: errorMessage, originalError: error }
    )
  }
}
