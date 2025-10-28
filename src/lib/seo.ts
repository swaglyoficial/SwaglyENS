/**
 * ============================================
 * SEO CONFIGURATION
 * ============================================
 *
 * Configuración centralizada de metadatos SEO
 * para optimizar el rendimiento y ranking en buscadores
 */

import type { Metadata } from 'next'

export const baseMetadata: Metadata = {
  title: {
    default: 'Swagly - Tu Pasaporte Web3',
    template: '%s | Swagly',
  },
  description:
    'Colecciona experiencias, escanea NFCs, gana tokens y construye tu perfil on-chain verificable en cada hackathon.',
  applicationName: 'Swagly',
  keywords: [
    'Web3',
    'Blockchain',
    'NFT',
    'Hackathon',
    'Tokens',
    'Merch3',
    'Passport',
    'Scroll',
    'Thirdweb',
    'DeFi',
  ],
  authors: [{ name: 'Swagly' }],
  creator: 'Swagly',
  publisher: 'Swagly',
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    siteName: 'Swagly',
    title: 'Swagly - Tu Pasaporte Web3',
    description:
      'Colecciona experiencias, escanea NFCs, gana tokens y construye tu perfil on-chain verificable.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Swagly - Tu Pasaporte Web3',
    description:
      'Colecciona experiencias, escanea NFCs, gana tokens y construye tu perfil on-chain verificable.',
  },
}

/**
 * Genera metadatos específicos para cada página
 */
export function generatePageMetadata(
  title: string,
  description?: string
): Metadata {
  return {
    title,
    description: description || baseMetadata.description,
    openGraph: {
      ...baseMetadata.openGraph,
      title: `${title} | Swagly`,
      description: description || (baseMetadata.description as string),
    },
    twitter: {
      ...baseMetadata.twitter,
      title: `${title} | Swagly`,
      description: description || (baseMetadata.description as string),
    },
  }
}
