/**
 * ============================================
 * CONFIGURACIÓN DE THIRDWEB WALLET
 * ============================================
 *
 * Este archivo contiene la configuración de Thirdweb para conectar wallets
 * y gestionar la autenticación de usuarios.
 */

import { createThirdwebClient } from "thirdweb"
import { scroll } from "thirdweb/chains"

// ============================================
// CLIENT ID DE THIRDWEB
// ============================================
/**
 * Client ID de Thirdweb (puede usarse en frontend)
 * Se obtiene desde: https://thirdweb.com/dashboard
 */
export const THIRDWEB_CLIENT_ID = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || 'ba7a96650ddbf17991e91a37adc04faf'

// ============================================
// CREAR CLIENTE DE THIRDWEB
// ============================================
/**
 * Cliente principal de Thirdweb
 * Este cliente se usa en toda la aplicación para interactuar con la blockchain
 */
export const client = createThirdwebClient({
  clientId: THIRDWEB_CLIENT_ID
})

// ============================================
// CHAINS SOPORTADAS
// ============================================
/**
 * Lista de chains soportadas por la aplicación
 * - scrollSepolia: Red de testnet para desarrollo
 * - scroll: Red principal de producción
 */
export const chains = [scroll]

/**
 * Chain por defecto
 * Scroll Mainnet es la red principal de producción de Swagly
 */
export const defaultChain = scroll

// ============================================
// CONTRATO SWAG TOKEN
// ============================================
/**
 * Dirección del contrato SWAG Token en Scroll Mainnet
 * Este es el token ERC-20 principal de la aplicación
 */
export const SWAG_TOKEN_ADDRESS = '0xb1Ba6FfC5b45df4e8c58D4b2C7Ab809b7D1aa8E1' as const

/**
 * Chain ID de Scroll Mainnet
 */
export const SCROLL_MAINNET_CHAIN_ID = 534352
