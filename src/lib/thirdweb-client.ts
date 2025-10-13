/**
 * ============================================
 * CLIENTE Y CONTRATO DE THIRDWEB PARA SWAGLY
 * ============================================
 *
 * Este archivo configura el cliente de Thirdweb y la conexión al contrato
 * para poder interactuar con el smart contract desde cualquier parte del código.
 *
 * IMPORTANTE:
 * - Este archivo puede usarse en frontend y backend
 * - Solo usa clientId (seguro para frontend)
 * - Para operaciones que requieren secret key, usa las rutas API
 */

import { createThirdwebClient, getContract } from 'thirdweb'
import { defineChain } from 'thirdweb/chains'
import {
  THIRDWEB_CLIENT_ID,
  SWAGLY_CONTRACT_ADDRESS,
  SCROLL_SEPOLIA_CHAIN_ID,
} from './thirdweb-config'

// ============================================
// CLIENTE DE THIRDWEB
// ============================================

/**
 * Cliente de Thirdweb
 *
 * Este cliente se usa para todas las interacciones con Thirdweb.
 * Se crea una vez y se reutiliza en toda la aplicación.
 *
 * Usa clientId, que es seguro para exponer en el frontend.
 */
export const thirdwebClient = createThirdwebClient({
  clientId: THIRDWEB_CLIENT_ID,
})

// ============================================
// CHAIN CONFIGURATION
// ============================================

/**
 * Configuración de la cadena Scroll Sepolia
 *
 * Scroll Sepolia es la testnet de Scroll (Layer 2 de Ethereum)
 * Chain ID: 534351
 */
export const scrollSepoliaChain = defineChain(SCROLL_SEPOLIA_CHAIN_ID)

// ============================================
// CONTRATO DE SWAGLY
// ============================================

/**
 * Instancia del contrato de Swagly
 *
 * Este objeto representa la conexión al smart contract ERC-1155 de Swagly
 * desplegado en Scroll Sepolia.
 *
 * Puedes usar este objeto para:
 * - Leer datos del contrato (balance, supply, etc.)
 * - Ejecutar funciones del contrato (desde el frontend con wagmi)
 *
 * Para escribir al contrato desde el backend (gasless), usa las rutas API.
 */
export const swaglyContract = getContract({
  client: thirdwebClient,
  chain: scrollSepoliaChain,
  address: SWAGLY_CONTRACT_ADDRESS,
})

// ============================================
// EXPORTS
// ============================================

/**
 * Exportaciones para usar en otros archivos
 */
export {
  thirdwebClient as client,
  scrollSepoliaChain as chain,
  swaglyContract as contract,
}
