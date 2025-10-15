import type { Metadata, Viewport } from "next";

import { headers } from "next/headers";
import "./globals.css";
import ContextProvider from "@/../context";
import PWAProvider from "@/components/pwa-provider";

const appUrl = process.env.NEXT_PUBLIC_APP_URL;

export const metadata: Metadata = {
  title: "Swagly - Tu Pasaporte Web3",
  description:
    "Colecciona experiencias, escanea NFCs, gana tokens y construye tu perfil on-chain verificable en cada hackathon.",
  applicationName: "Swagly",
  metadataBase: appUrl ? new URL(appUrl) : undefined,
  manifest: "/manifest.webmanifest",
  keywords: ["Web3", "Blockchain", "NFT", "Hackathon", "Tokens", "POAP", "Passport"],
  authors: [{ name: "Swagly" }],
  openGraph: {
    title: "Swagly - Tu Pasaporte Web3",
    description:
      "Colecciona experiencias, escanea NFCs, gana tokens y construye tu perfil on-chain verificable.",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    title: "Swagly",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
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
  const headersData = await headers();
  const cookies = headersData.get("cookie");

  return (
    <html lang="es">
      <body>
        <ContextProvider cookies={cookies}>
          <PWAProvider />
          {children}
        </ContextProvider>
      </body>
    </html>
  );
}
