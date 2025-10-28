import type { Metadata, Viewport } from "next";
import { Inter } from 'next/font/google'

import "./globals.css";
import ContextProvider from "@/../context";
import PWAProvider from "@/components/pwa-provider";

// Optimización de fuentes con next/font
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  fallback: ['system-ui', 'arial'],
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL;

export const metadata: Metadata = {
  title: {
    default: "Swagly - Tu Pasaporte Web3",
    template: "%s | Swagly"
  },
  description:
    "Colecciona experiencias, escanea NFCs, gana tokens y construye tu perfil on-chain verificable en cada hackathon.",
  applicationName: "Swagly",
  metadataBase: appUrl ? new URL(appUrl) : undefined,
  manifest: "/manifest.webmanifest",
  keywords: ["Web3", "Blockchain", "NFT", "Hackathon", "Tokens", "POAP", "Passport", "Scroll", "Thirdweb"],
  authors: [{ name: "Swagly" }],
  creator: "Swagly",
  publisher: "Swagly",
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
    title: "Swagly - Tu Pasaporte Web3",
    description:
      "Colecciona experiencias, escanea NFCs, gana tokens y construye tu perfil on-chain verificable.",
    type: "website",
    locale: "es_ES",
    siteName: "Swagly",
  },
  twitter: {
    card: "summary_large_image",
    title: "Swagly - Tu Pasaporte Web3",
    description: "Colecciona experiencias, escanea NFCs, gana tokens y construye tu perfil on-chain verificable.",
  },
  appleWebApp: {
    capable: true,
    title: "Swagly",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png" }],
    shortcut: [{ url: "/icons/icon-192x192.png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#111827",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable}>
      <body className={inter.className}>
        <ContextProvider>
          <PWAProvider />
          {children}
        </ContextProvider>
      </body>
    </html>
  );
}
