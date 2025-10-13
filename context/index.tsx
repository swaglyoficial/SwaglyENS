'use client'

import { wagmiAdapter, projectId } from '@/../config'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { mainnet, arbitrum, scroll, base, polygon, scrollSepolia } from '@reown/appkit/networks'
import React, { type ReactNode, useRef } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'

// Set up queryClient
const queryClient = new QueryClient()

if (!projectId) {
  throw new Error('Project ID is not defined')
}

// Set up metadata
const metadata = {
  name: 'Swagly',
  description: 'Swagly',
  url: 'https://www.swagly.xyz/',
  icons: ['https://avatars.githubusercontent.com/u/179229932']
}

const tokens = {
  'eip155:534351': {
    address: '0x05668BC3Fb05c2894988142a0b730149122192eB',
  }
}//configuración de token de SWAG en Reown


const appKitConfig = {
  adapters: [wagmiAdapter],
  projectId,
  networks: [mainnet, arbitrum, scroll, base, polygon, scrollSepolia],
  defaultNetwork: scrollSepolia, // Cambiar a Scroll Sepolia para desarrollo
  tokens,//llamar a traer el token de SWAG
  metadata,
  features: {
    analytics: true,
    email: true,
    socials: ['google', 'apple', 'x', 'github', 'farcaster'],
    emailShowWallets: true,
  },
  themeMode: 'dark'
}

function ContextProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
  const appKitRef = useRef<ReturnType<typeof createAppKit> | null>(null)
  if (!appKitRef.current) {
    appKitRef.current = createAppKit(appKitConfig)
  }

  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}

export default ContextProvider