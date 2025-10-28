/**
 * ============================================
 * CONNECT BUTTON - BOTÓN DE CONEXIÓN DE WALLET
 * ============================================
 *
 * Componente que muestra el botón para conectar wallets usando Thirdweb
 */

'use client'

import { ConnectButton as ThirdwebConnectButton } from "thirdweb/react"
import { client, chains, defaultChain } from "@/../config/thirdweb"
import { inAppWallet } from "thirdweb/wallets"

// Configuración de wallets soportadas
const wallets = [
  inAppWallet({
    auth: {
      options: ["google", "apple", "telegram", "passkey"]
    }
  })
]

export const ConnectButton = () => (
  <div className="appkit-connect">
    <ThirdwebConnectButton
      client={client}
      wallets={wallets}
      chain={defaultChain}
      chains={chains}
      theme="dark"
      connectButton={{
        label: "Conectar Wallet",
        style: {
          background: '#FEE887',
          color: '#000000',
          borderRadius: '9999px',
          fontSize: '15px',
          fontWeight: '500',
          padding: '10px 20px',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 0 20px rgba(254,232,135,0.45)',
        }
      }}
      connectModal={{
        size: "compact",
        title: "Conectar a Swagly",
        titleIcon: "https://avatars.githubusercontent.com/u/179229932"
      }}
    />
  </div>
)
