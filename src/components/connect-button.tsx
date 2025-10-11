'use client'

import { type CSSProperties } from 'react'

const neonButtonStyle = {
  '--w3m-accent': '#00F0FF',
  '--w3m-color-accent': '#00F0FF',
  '--w3m-color-inverse': '#000000',
  '--w3m-background': '#021f2a',
  '--w3m-font-size-master': '15px',
  '--w3m-button-border-radius': '9999px'
} as CSSProperties

export const ConnectButton = () => {
  return (
    <div className="appkit-connect">
      <appkit-button style={neonButtonStyle} />
    </div>
  )
}
