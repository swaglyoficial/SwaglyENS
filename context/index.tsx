'use client'

import { wagmiAdapter, projectId } from '@/../config'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { mainnet, arbitrum, scroll, base, polygon } from '@reown/appkit/networks'
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

const appKitConfig = {
  adapters: [wagmiAdapter],
  projectId,
  networks: [mainnet, arbitrum, scroll, base, polygon],
  defaultNetwork: mainnet,
  metadata,
  features: {
    analytics: true,
    email: true,
    socials: ['google', 'apple', 'x', 'github', 'farcaster'],
    emailShowWallets: true
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