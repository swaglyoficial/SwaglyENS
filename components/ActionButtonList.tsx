'use client'
import { useDisconnect, useAppKit, useAppKitNetwork } from '@reown/appkit/react'
import { networks } from '@/../config'

const buttonClassName =
  'neon-action-button inline-flex items-center justify-center rounded-full border border-[#00F0FF]/40 px-4 py-2 text-sm font-medium text-white transition hover:border-[#00F0FF] hover:text-black hover:shadow-[0_0_20px_rgba(0,240,255,0.45)] hover:bg-[#00F0FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00F0FF]'

export const ActionButtonList = () => {
  const { disconnect } = useDisconnect()
  const { open } = useAppKit()
  const { switchNetwork } = useAppKitNetwork()

  const handleDisconnect = async () => {
    try {
      await disconnect()
    } catch (error) {
      console.error('Failed to disconnect:', error)
    }
  }

  return (
    <div className="flex flex-wrap gap-3 text-sm">
      <button className={buttonClassName} onClick={() => open()}>
        Abrir AppKit
      </button>
      <button className={buttonClassName} onClick={handleDisconnect}>
        Desconectar
      </button>
      <button className={buttonClassName} onClick={() => switchNetwork(networks[1])}>
        Cambiar de red
      </button>
    </div>
  )
}
