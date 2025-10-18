'use client'

import type { CSSProperties } from 'react'

const neonButtonVars = {
  '--w3m-accent': '#00F0FF',
  '--w3m-color-accent': '#00F0FF',
  '--w3m-color-inverse': '#000000',
  '--w3m-background': '#021f2a',
  '--w3m-font-size-master': '15px',
  '--w3m-button-border-radius': '9999px',
} satisfies Record<string, string>

export const ConnectButton = () => (
  <div className="appkit-connect" style={neonButtonVars as CSSProperties}>
    <appkit-button />
  </div>
)
