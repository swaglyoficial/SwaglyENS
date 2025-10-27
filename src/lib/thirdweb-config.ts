/**
 * ============================================
 * CONFIGURACIÓN DE THIRDWEB PARA SWAGLY
 * ============================================
 *
 * Este archivo contiene toda la configuración necesaria para interactuar
 * con el smart contract de Swagly usando Thirdweb.
 *
 * Thirdweb permite:
 * - Ejecutar transacciones gasless (sin que el usuario pague gas)
 * - Ejecutar transacciones desde el backend (sin que el usuario firme)
 * - Gestionar claims de tokens ERC-1155
 *
 * IMPORTANTE:
 * - NUNCA exponer THIRDWEB_SECRET_KEY en el frontend
 * - Solo usar secret key en rutas API (backend)
 * - Usar clientId para operaciones del frontend
 */

// ============================================
// CONSTANTES DE CONFIGURACIÓN
// ============================================

/**
 * Client ID de Thirdweb (puede usarse en frontend)
 * Se obtiene desde: https://thirdweb.com/dashboard
 */
export const THIRDWEB_CLIENT_ID = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || 'ba7a96650ddbf17991e91a37adc04faf'

/**
 * Secret Key de Thirdweb (SOLO para backend)
 * NUNCA exponer en el frontend
 * Se obtiene desde: https://thirdweb.com/dashboard
 */
export const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY || 'w2eFsou5nA2a0Bnkce1p-vf2lyr_iDXtKUUvdMUNp6KdRR8452ipc29Bs3CtWESrdlTyQVrrTmpdjQrbOK-80A'

/**
 * Dirección del contrato SWAG Token (ERC-20)
 * Desplegado en Scroll Mainnet
 */
export const SWAG_TOKEN_ADDRESS = '0xb1Ba6FfC5b45df4e8c58D4b2C7Ab809b7D1aa8E1'

/**
 * Alias para mantener compatibilidad con código existente
 * @deprecated Usa SWAG_TOKEN_ADDRESS en su lugar
 */
export const SWAGLY_CONTRACT_ADDRESS = SWAG_TOKEN_ADDRESS

/**
 * Chain ID de Scroll Mainnet
 * - Scroll Sepolia: 534351
 * - Scroll Mainnet: 534352
 */
export const SCROLL_MAINNET_CHAIN_ID = 534352

/**
 * Alias para mantener compatibilidad con código existente
 * @deprecated Usa SCROLL_MAINNET_CHAIN_ID en su lugar
 */
export const SCROLL_SEPOLIA_CHAIN_ID = SCROLL_MAINNET_CHAIN_ID

/**
 * URL de la API de Thirdweb para ejecutar transacciones
 * Documentación: https://portal.thirdweb.com/contracts/write
 */
export const THIRDWEB_API_URL = 'https://api.thirdweb.com/v1/contracts/write'

/**
 * Dirección de la wallet del creador/owner del contrato
 * Esta wallet debe tener permisos MINTER en el contrato
 * Es la wallet que firma las transacciones gasless
 *
 * NOTA: Reemplaza con tu wallet address que tiene permisos
 */
export const CREATOR_WALLET_ADDRESS = process.env.CREATOR_WALLET_ADDRESS || '<YOUR_WALLET_ADDRESS>'

/**
 * Private Key de la wallet del creador (SOLO para backend)
 * NUNCA exponer en el frontend ni commitear a Git
 * Esta private key se usa para firmar transacciones desde el backend
 *
 * IMPORTANTE:
 * - Esta wallet debe tener ETH en Scroll Sepolia para pagar gas
 * - Debe tener permisos MINTER en el contrato
 */
export const CREATOR_WALLET_PRIVATE_KEY = process.env.CREATOR_WALLET_PRIVATE_KEY || ''

/**
 * Decimales del token Swagly
 * La mayoría de tokens ERC-1155 y ERC-20 usan 18 decimales (como ETH)
 *
 * Si tu token tiene:
 * - 18 decimales: 10 tokens = 10 * 10^18 = 10000000000000000000 wei
 * - 0 decimales: 10 tokens = 10 (cantidad exacta, sin conversión)
 *
 * IMPORTANTE: Verifica en tu contrato cuántos decimales tiene configurados
 */
export const TOKEN_DECIMALS = 18

// ============================================
// CONFIGURACIÓN DE CLAIM POR DEFECTO
// ============================================

/**
 * Interface para los parámetros del struct AllowlistProof
 * Este struct se usa en la función claim para manejar whitelists y límites
 */
export interface AllowlistProof {
  proof: string[]           // Array de bytes32 para merkle proof (vacío = sin whitelist)
  quantityLimitPerWallet: bigint | number  // Límite de tokens por wallet (0 = sin límite)
  pricePerToken: bigint | number           // Precio por token (0 = gratis)
  currency: string          // Dirección de la moneda (0x0 = moneda nativa/gratis)
}

/**
 * Dirección especial de Thirdweb para ETH nativo
 * Thirdweb usa esta dirección en lugar de 0x0 para representar ETH
 */
export const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'

/**
 * Configuración por defecto para claims gratuitos sin restricciones
 *
 * Esta configuración permite:
 * - Reclamar tokens de forma gratuita (pricePerToken = 0)
 * - Sin límite por wallet (quantityLimitPerWallet = 0)
 * - Sin whitelist (proof vacío)
 * - Usar ETH nativo como moneda (para claims gratuitos)
 */
export const DEFAULT_CLAIM_CONFIG = {
  // Dirección de moneda (dirección especial de Thirdweb para ETH nativo)
  currency: NATIVE_TOKEN_ADDRESS,

  // Precio por token (0 = gratis)
  pricePerToken: 0,

  /**
   * Struct AllowlistProof como ARRAY (requerido por Thirdweb API)
   * IMPORTANTE: Los structs deben pasarse como arrays en el orden de sus campos
   *
   * Orden de campos del struct AllowlistProof:
   * [0] bytes32[] proof
   * [1] uint256 quantityLimitPerWallet
   * [2] uint256 pricePerToken
   * [3] address currency
   */
  allowlistProof: [
    [],                     // proof: Sin merkle proof
    0,                      // quantityLimitPerWallet: Sin límite por wallet
    0,                      // pricePerToken: Gratis
    NATIVE_TOKEN_ADDRESS,   // currency: ETH nativo (dirección especial de Thirdweb)
  ],

  // Datos adicionales (vacío)
  data: '0x',
}

// ============================================
// INTERFACES Y TIPOS
// ============================================

/**
 * Interface para los parámetros de la función claim
 */
export interface ClaimParams {
  receiverAddress: string   // Wallet que recibirá los tokens
  quantity: number          // Cantidad de tokens a enviar
  activityName?: string     // Nombre de la actividad (opcional, para logs)
}

/**
 * Interface para una condición de claim
 * Se usa en setClaimConditions para configurar cómo los usuarios pueden reclamar tokens
 */
export interface ClaimCondition {
  startTimestamp: number           // Timestamp de inicio del claim (0 = inmediato)
  maxClaimableSupply: string       // Supply máximo que se puede reclamar (en string para BigInt)
  supplyClaimed: string            // Supply ya reclamado (en string para BigInt)
  quantityLimitPerWallet: string   // Límite por wallet (en string para BigInt, 0 = sin límite)
  merkleRoot: string               // Merkle root para whitelist (0x0 = sin whitelist)
  pricePerToken: string            // Precio por token en wei (en string para BigInt, 0 = gratis)
  currency: string                 // Dirección de la moneda (0x0 = nativa)
  metadata: string                 // Metadata adicional (URL IPFS, etc.)
}

/**
 * Interface para los parámetros de setClaimConditions
 */
export interface SetClaimConditionsParams {
  conditions: ClaimCondition[]     // Array de condiciones de claim
  resetClaimEligibility: boolean   // Si true, resetea quién puede reclamar
}

/**
 * Condición de claim por defecto (gratis, sin límites)
 *
 * Esta configuración:
 * - Permite claims inmediatos (startTimestamp = 0)
 * - Sin límite de supply (maxClaimableSupply muy alto)
 * - Sin límite por wallet
 * - Sin whitelist
 * - Gratis (pricePerToken = 0)
 * - Usa ETH nativo como moneda
 */
export const DEFAULT_CLAIM_CONDITION: ClaimCondition = {
  startTimestamp: 0,                                    // Comienza inmediatamente
  maxClaimableSupply: '1000000000000000000',           // 1 billón de tokens (supply muy alto)
  supplyClaimed: '0',                                   // Ninguno reclamado aún
  quantityLimitPerWallet: '0',                          // Sin límite por wallet
  merkleRoot: '0x0000000000000000000000000000000000000000000000000000000000000000', // Sin whitelist
  pricePerToken: '0',                                   // Gratis
  currency: NATIVE_TOKEN_ADDRESS,                       // ETH nativo (dirección especial de Thirdweb)
  metadata: '',                                         // Sin metadata
}

// ============================================
// FUNCIONES HELPER
// ============================================

/**
 * Crea una nueva condición de claim con precio específico
 * Útil cuando quieras que los tokens tengan un costo
 *
 * @param priceInWei - Precio por token en wei (1 ETH = 10^18 wei)
 * @param currency - Dirección del token ERC20 a usar como moneda (por defecto = ETH nativo)
 * @returns ClaimCondition configurada con precio
 *
 * @example
 * // Claim que cuesta 0.001 ETH por token
 * const condition = createPaidClaimCondition('1000000000000000')
 */
export function createPaidClaimCondition(
  priceInWei: string,
  currency: string = NATIVE_TOKEN_ADDRESS
): ClaimCondition {
  return {
    ...DEFAULT_CLAIM_CONDITION,
    pricePerToken: priceInWei,
    currency,
  }
}

/**
 * Crea una nueva condición de claim con límite por wallet
 * Útil cuando quieras limitar cuántos tokens puede reclamar cada usuario
 *
 * @param limitPerWallet - Cantidad máxima de tokens por wallet
 * @returns ClaimCondition configurada con límite
 *
 * @example
 * // Cada wallet puede reclamar máximo 10 tokens
 * const condition = createLimitedClaimCondition(10)
 */
export function createLimitedClaimCondition(limitPerWallet: number): ClaimCondition {
  return {
    ...DEFAULT_CLAIM_CONDITION,
    quantityLimitPerWallet: limitPerWallet.toString(),
  }
}

/**
 * Crea una nueva condición de claim con fecha de inicio
 * Útil cuando quieras que el claim comience en una fecha futura
 *
 * @param startDate - Fecha de inicio del claim
 * @returns ClaimCondition configurada con fecha de inicio
 *
 * @example
 * // Claim que comienza el 1 de enero de 2025
 * const condition = createScheduledClaimCondition(new Date('2025-01-01'))
 */
export function createScheduledClaimCondition(startDate: Date): ClaimCondition {
  return {
    ...DEFAULT_CLAIM_CONDITION,
    startTimestamp: Math.floor(startDate.getTime() / 1000), // Convertir a timestamp Unix
  }
}
