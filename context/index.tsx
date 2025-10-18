/**
 * ============================================
 * CONTEXT PROVIDER - CONFIGURACIÓN DE REOWN APPKIT
 * ============================================
 *
 * Este archivo crea el provider de contexto para:
 * - Reown AppKit (conexión de wallets)
 * - Wagmi (interacción con blockchain)
 * - TanStack Query (cacheo de datos)
 *
 * Funcionalidades:
 * - Conectar wallets (MetaMask, WalletConnect, etc.)
 * - Cambiar entre diferentes redes blockchain
 * - Gestionar estado de conexión
 * - Mostrar tokens personalizados (como SWAG)
 */

'use client'

import { wagmiAdapter, projectId, networks } from '@/../config'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit, type CreateAppKit } from '@reown/appkit/react'
import { mainnet, arbitrum, scroll, base, polygon, scrollSepolia, solanaTestnet } from '@reown/appkit/networks'
import React, { type ReactNode, useEffect, useState } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'
import { SolanaAdapter } from "@reown/appkit-adapter-solana/react";
import { sepolia } from 'thirdweb/chains'

// ============================================
// CONFIGURACIÓN DE TANSTACK QUERY
// ============================================
/**
 * QueryClient maneja el cacheo y sincronización de datos
 * Se usa para optimizar las llamadas a la blockchain y APIs
 */
const queryClient = new QueryClient()

// Validar que el Project ID esté configurado
if (!projectId) {
  throw new Error('Project ID is not defined')
}

const solanaWeb3JsAdapter = new SolanaAdapter();

// ============================================
// METADATA DE LA APLICACIÓN
// ============================================
/**
 * Información que se muestra en wallets cuando el usuario conecta
 */
const metadata = {
  name: 'Swagly',                                              // Nombre de la app
  description: 'Swagly',                                       // Descripción de la app
  url: 'https://www.swagly.xyz/',                             // URL de la app
  icons: ['https://avatars.githubusercontent.com/u/179229932'] // Logo de la app
}

// ============================================
// CONFIGURACIÓN DE TOKENS PERSONALIZADOS
// ============================================
/**
 * Tokens ERC-20 personalizados que se mostrarán en Reown
 *
 * Formato:
 * 'eip155:CHAIN_ID': { address: 'CONTRACT_ADDRESS' }
 *
 * NOTA: Solo funciona con tokens ERC-20, no con ERC-1155
 */
const tokens = {
  // Token SWAG en Scroll Sepolia (Chain ID: 534351)
  'eip155:534351': {
    address: '0x05668BC3Fb05c2894988142a0b730149122192eB',
  }
}

// ============================================
// CONFIGURACIÓN DE REOWN APPKIT
// ============================================
/**
 * Las redes se importan desde el archivo de configuración (config/index.tsx)
 * para asegurar que sean las mismas que usa wagmiAdapter
 */

/**
 * Configuración principal de Reown AppKit
 *
 * AppKit es la UI para conectar wallets y gestionar conexiones
 * Soporta múltiples wallets: MetaMask, WalletConnect, Coinbase, etc.
 */
const appKitConfig: CreateAppKit = {
  // Adaptadores de conexión (Wagmi para EVM chains)
  adapters: [wagmiAdapter,solanaWeb3JsAdapter],

  // Project ID de Reown (obtenido de https://dashboard.reown.com)
  projectId,

  // ============================================
  // REDES BLOCKCHAIN SOPORTADAS
  // ============================================
  /**
   * Lista de todas las redes que el usuario puede seleccionar
   */
  networks: [
    mainnet,              // Ethereum Mainnet
    arbitrum,             // Arbitrum One (Layer 2)
    scroll,               // Scroll (Layer 2)
    base,                 // Base (Layer 2)
    polygon,              // Polygon
    scrollSepolia,        // Scroll Sepolia Testnet ✅ Red principal de desarrollo
    solanaTestnet
  ],
  // ============================================
  // RED POR DEFECTO
  // ============================================
  /**
   * Red que se selecciona automáticamente al abrir la app
   * Scroll Sepolia es la red principal para desarrollo de Swagly
   */
  defaultNetwork: scrollSepolia,

  // Tokens personalizados a mostrar (token SWAG en Scroll Sepolia)
  tokens,

  // Metadata de la app (nombre, descripción, logo)
  metadata,

  // ============================================
  // FUNCIONALIDADES DE APPKIT
  // ============================================
  /**
   * Features habilitadas en Reown AppKit
   *
   * - analytics: Recopila estadísticas de uso (Reown Dashboard)
   * - email: Permite login con email usando Reown Auth
   * - socials: Métodos de login social (Google, Apple, X, GitHub, Farcaster)
   * - emailShowWallets: Muestra opciones de wallets cuando se usa email
   */
  /*features: {
    analytics: true,      // Habilitar analytics de Reown
    email: true,          // Permitir login con email (Reown Auth)
    // Opciones de login social disponibles
    socials: ['google', 'apple', 'x', 'github', 'farcaster'],
    emailShowWallets: true, // Mostrar wallets cuando se usa email
  },*/ //Esta configuración se esta jalando desde el panel de reown por eso se retiró

  // ============================================
  // TEMA VISUAL
  // ============================================
  /**
   * Modo de tema para la interfaz de AppKit
   * Opciones: 'light' | 'dark' | 'auto'
   */
  themeMode: 'dark'
}

// ============================================
// CONTEXT PROVIDER COMPONENT
// ============================================
/**
 * Componente que envuelve toda la aplicación
 *
 * Proporciona:
 * - Conexión a wallets (via Reown AppKit)
 * - Estado de Wagmi (para interactuar con contratos)
 * - Query client (para cacheo de datos)
 *
 * @param children - Componentes hijos de la app
 * @param cookies - Cookies del servidor para SSR (Server-Side Rendering)
 */
function ContextProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
  // Estado para controlar si AppKit ya se inicializó
  const [appKitInitialized, setAppKitInitialized] = useState(false)

  // Inicializar AppKit solo una vez después de que el componente se monte
  useEffect(() => {
    if (!appKitInitialized) {
      createAppKit(appKitConfig)
      setAppKitInitialized(true)
    }
  }, [appKitInitialized])

  // Inicializar estado de Wagmi desde cookies (para SSR)
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

  return (
    // Provider de Wagmi: Maneja conexiones a blockchain y estado de wallets
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      {/* Provider de TanStack Query: Maneja cacheo y sincronización de datos */}
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default ContextProvider
