import {
  CREATOR_WALLET_ADDRESS,
  DEFAULT_CLAIM_CONFIG,
  SCROLL_MAINNET_CHAIN_ID,
  SWAG_TOKEN_ADDRESS,
  THIRDWEB_API_URL,
  THIRDWEB_SECRET_KEY,
  TOKEN_DECIMALS,
} from './thirdweb-config'

const CLAIM_METHOD_SIGNATURE =
  'function claim(address _receiver, uint256 _quantity, address _currency, uint256 _pricePerToken, (bytes32[] proof, uint256 quantityLimitPerWallet, uint256 pricePerToken, address currency) _allowlistProof, bytes _data) payable'

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

  const requestBody = {
    chainId,
    from: CREATOR_WALLET_ADDRESS,
    calls: [
      {
        contractAddress,
        method: CLAIM_METHOD_SIGNATURE,
        params: [
          options.receiverAddress,
          quantityInWei.toString(),
          currency,
          toBigIntString(pricePerToken),
          allowlistProof,
          data,
        ],
      },
    ],
  }

  const response = await fetch(THIRDWEB_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-secret-key': THIRDWEB_SECRET_KEY,
    },
    body: JSON.stringify(requestBody),
  })

  let payload: unknown

  try {
    payload = await response.json()
  } catch (error) {
    payload = { error: 'Unable to parse Thirdweb API response', cause: error }
  }

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload && 'error' in payload
        ? String((payload as { error: unknown }).error)
        : `Thirdweb API responded with status ${response.status}`

    throw new ThirdwebApiError(message, response.status, payload)
  }

  const transactionHash =
    (payload as Record<string, any>)?.transactionHash ??
    (payload as Record<string, any>)?.result?.transactionHash ??
    (payload as Record<string, any>)?.receipt?.transactionHash ??
    (payload as Record<string, any>)?.result?.receipt?.transactionHash

  return {
    transactionHash: transactionHash ?? undefined,
    thirdwebResponse: payload,
    quantityInWei,
  }
}
