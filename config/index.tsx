/**
 * ============================================
 * ARCHIVO DE CONFIGURACIÓN DE WAGMI Y REOWN
 * ============================================
 *
 * Este archivo configura todas las redes blockchain que soporta la aplicación
 * y crea el adaptador de Wagmi para conectar wallets.
 */

import { cookieStorage, createStorage, http } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, arbitrum, scroll, base, polygon, scrollSepolia, solanaTestnet } from '@reown/appkit/networks'

// ============================================
// PROJECT ID DE REOWN
// ============================================
// Obtener desde: https://dashboard.reown.com
// Este ID es necesario para usar WalletConnect/Reown
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID

if (!projectId) {
  throw new Error('Project ID is not defined')
}

// ============================================
// LISTA DE REDES SOPORTADAS
// ============================================
/**
 * Array de todas las redes blockchain que la app soporta
 *
 * Mainnets (producción):
 * - mainnet: Ethereum Mainnet
 * - arbitrum: Arbitrum One (Layer 2 de Ethereum)
 * - scroll: Scroll (Layer 2 de Ethereum)
 * - base: Base (Layer 2 de Coinbase)
 * - polygon: Polygon (sidechain de Ethereum)
 *
 * Testnets (desarrollo):
 * - scrollSepolia: Scroll Sepolia Testnet (para desarrollo de Swagly)
 */
export const networks = [
  mainnet,              // Ethereum Mainnet
  arbitrum,             // Arbitrum One
  scroll,               // Scroll
  base,                 // Base
  polygon,              // Polygon
  scrollSepolia,        // Scroll Sepolia Testnet (red principal de desarrollo)
  solanaTestnet
]

//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId,
  networks
})




export const config = wagmiAdapter.wagmiConfig