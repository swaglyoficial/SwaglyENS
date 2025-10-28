/**
 * ============================================
 * ACTION BUTTON LIST - LISTA DE ACCIONES
 * ============================================
 *
 * Componente que muestra botones de acciones para:
 * - Desconectar wallet
 * - Cambiar de red
 */

'use client'

import { useActiveWallet, useDisconnect, useSwitchActiveWalletChain } from 'thirdweb/react'
import { chains } from '@/../config/thirdweb'

const buttonClassName =
  'neon-action-button inline-flex items-center justify-center rounded-full border border-[#00F0FF]/40 px-4 py-2 text-sm font-medium text-white transition hover:border-[#00F0FF] hover:text-black hover:shadow-[0_0_20px_rgba(0,240,255,0.45)] hover:bg-[#00F0FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00F0FF]'

export const ActionButtonList = () => {
  const wallet = useActiveWallet()
  const { disconnect } = useDisconnect()
  const switchChain = useSwitchActiveWalletChain()

  const handleDisconnect = async () => {
    try {
      if (wallet) {
        disconnect(wallet)
      }
    } catch (error) {
      console.error('Failed to disconnect:', error)
    }
  }

  const handleSwitchNetwork = async () => {
    try {
      // Cambiar a la siguiente chain en la lista
      const currentChainIndex = chains.findIndex(c => c.id === wallet?.getChain()?.id)
      const nextChain = chains[(currentChainIndex + 1) % chains.length]

      if (wallet && nextChain) {
        await switchChain(nextChain)
      }
    } catch (error) {
      console.error('Failed to switch network:', error)
    }
  }

  return (
    <div className="flex flex-wrap gap-3 text-sm">
      <button className={buttonClassName} onClick={handleDisconnect}>
        Desconectar
      </button>
      <button className={buttonClassName} onClick={handleSwitchNetwork}>
        Cambiar de red
      </button>
    </div>
  )
}
