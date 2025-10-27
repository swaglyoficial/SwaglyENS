/**
 * ============================================
 * CONTEXT PROVIDER - CONFIGURACIÓN DE THIRDWEB
 * ============================================
 *
 * Este archivo crea el provider de contexto para:
 * - Thirdweb Connect (conexión de wallets)
 * - In-App Wallets (autenticación con redes sociales)
 * - TanStack Query (cacheo de datos)
 *
 * Funcionalidades:
 * - Conectar wallets (MetaMask, WalletConnect, etc.)
 * - Login social (Google, Apple, Telegram, Passkey)
 * - Cambiar entre diferentes redes blockchain
 * - Gestionar estado de conexión
 * - Auto-reconexión de wallets
 */

'use client'

import React, { type ReactNode } from 'react'
import { ThirdwebProvider, AutoConnect } from "thirdweb/react"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { client } from '@/../config/thirdweb'

// ============================================
// CONFIGURACIÓN DE TANSTACK QUERY
// ============================================
/**
 * QueryClient maneja el cacheo y sincronización de datos
 * Se usa para optimizar las llamadas a la blockchain y APIs
 */
const queryClient = new QueryClient()

// ============================================
// CONTEXT PROVIDER COMPONENT
// ============================================
/**
 * Componente que envuelve toda la aplicación
 *
 * Proporciona:
 * - Conexión a wallets (via Thirdweb)
 * - Auto-reconexión de wallets
 * - Query client (para cacheo de datos)
 *
 * @param children - Componentes hijos de la app
 */
function ContextProvider({ children }: { children: ReactNode }) {
  return (
    <ThirdwebProvider>
      {/* AutoConnect reconecta automáticamente la última wallet usada */}
      <AutoConnect client={client} timeout={15000} />
      {/* Provider de TanStack Query: Maneja cacheo y sincronización de datos */}
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ThirdwebProvider>
  )
}

export default ContextProvider
