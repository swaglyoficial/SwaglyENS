import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Acknowledge Turbopack so builds do not fall back to webpack and error.
  turbopack: {},

  // Output standalone para reducir el tamano del bundle
  output: 'standalone',

  // Experimental: reduce bundle size
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-progress',
      '@radix-ui/react-scroll-area',
    ],
  },

  // Optimizacion de imagenes
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // Compilacion optimizada
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Evitar que ciertos paquetes sean empaquetados
  serverExternalPackages: ['@prisma/client', 'prisma'],

  // Excluir archivos innecesarios de Prisma y node_modules
  outputFileTracingExcludes: {
    '*': [
      // SWC binaries (for all platforms except the target)
      'node_modules/@swc/core-linux-x64-gnu',
      'node_modules/@swc/core-linux-x64-musl',
      'node_modules/@swc/core-linux-arm64-gnu',
      'node_modules/@swc/core-linux-arm64-musl',
      'node_modules/@esbuild/**',
      'node_modules/@next/swc-linux-x64-gnu',
      'node_modules/@next/swc-linux-x64-musl',
      'node_modules/@next/swc-linux-arm64-gnu',
      'node_modules/@next/swc-darwin-x64',
      'node_modules/@next/swc-darwin-arm64',
      'node_modules/@next/swc-win32-x64-msvc',
      'node_modules/@next/swc-win32-ia32-msvc',
      'node_modules/@next/swc-win32-arm64-msvc',

      // Prisma engines (keep only needed for deployment)
      'node_modules/prisma/libquery_engine-*',
      'node_modules/@prisma/engines/**',
      'node_modules/.prisma/client/libquery_engine-*',
      'node_modules/.prisma/client/*.node',
      '!node_modules/.prisma/client/*-windows.dll.node',

      // Thirdweb aggressive exclusions
      'node_modules/thirdweb/dist/**/*.map',
      'node_modules/thirdweb/src/**',
      'node_modules/thirdweb/**/*.ts',
      'node_modules/thirdweb/**/*.md',
      'node_modules/thirdweb/node_modules/**',
      'node_modules/thirdweb/**/*.test.*',
      'node_modules/thirdweb/**/test/**',
      'node_modules/thirdweb/**/tests/**',

      // Build tools (not needed in production)
      'node_modules/typescript/**',
      'node_modules/eslint/**',
      'node_modules/prettier/**',
      'node_modules/@typescript-eslint/**',
      'node_modules/ts-node/**',

      // Large dependencies we don't use in serverless
      'node_modules/webpack/**',
      'node_modules/terser/**',
      'node_modules/@babel/**',
      'node_modules/core-js/**',

      // TailwindCSS (only needed at build time)
      'node_modules/tailwindcss/**',
      'node_modules/@tailwindcss/**',
      'node_modules/autoprefixer/**',
      'node_modules/postcss/**',

      // React DevTools & Development
      'node_modules/react-devtools-core/**',
      'node_modules/react-is/**',

      // Source maps
      'node_modules/**/*.map',
      'node_modules/**/*.mjs.map',
      'node_modules/**/*.cjs.map',

      // Documentation
      'node_modules/**/README.md',
      'node_modules/**/LICENSE',
      'node_modules/**/LICENSE.md',
      'node_modules/**/CHANGELOG.md',
      'node_modules/**/*.md',
      'node_modules/**/HISTORY.md',

      // Tests
      'node_modules/**/__tests__/**',
      'node_modules/**/__mocks__/**',
      'node_modules/**/*.test.js',
      'node_modules/**/*.test.ts',
      'node_modules/**/*.spec.js',
      'node_modules/**/*.spec.ts',
      'node_modules/**/test/**',
      'node_modules/**/tests/**',

      // Examples & Demos
      'node_modules/**/example/**',
      'node_modules/**/examples/**',
      'node_modules/**/demo/**',
      'node_modules/**/docs/**',

      // TypeScript definitions (not needed at runtime)
      'node_modules/**/*.d.ts',
      'node_modules/**/*.d.ts.map',
    ],

    // Exclude thirdweb from ALL routes that don't use it
    '/api/activities/**': ['node_modules/thirdweb/**'],
    '/api/analytics/**': ['node_modules/thirdweb/**'],
    '/api/events/**': ['node_modules/thirdweb/**'],
    '/api/nfcs/**': ['node_modules/thirdweb/**'],
    '/api/passports/**': ['node_modules/thirdweb/**'],
    '/api/products/**': ['node_modules/thirdweb/**'],
    '/api/purchases/**': ['node_modules/thirdweb/**'],
    '/api/scans/**': ['node_modules/thirdweb/**'],
    '/api/shop/**': ['node_modules/thirdweb/**'],
    '/api/sponsors/**': ['node_modules/thirdweb/**'],
    '/api/users/**': ['node_modules/thirdweb/**'],
    '/api/upload/**': ['node_modules/thirdweb/**'],
    '/api/upload-proof-image/**': ['node_modules/thirdweb/**'],
    '/api/admin/proofs/[id]/reject/**': ['node_modules/thirdweb/**'],
  },

  outputFileTracingIncludes: {
    '/api/**/*': ['./node_modules/@prisma/client/**/*', './prisma/schema.prisma'],
  },

  // Webpack config para resolver warnings de pino-pretty
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('pino-pretty');
    }
    return config;
  },

  // Configuracion de headers para cache
  async headers() {
    return [
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/products/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          },
        ],
      },
      {
        source: '/:path*.{jpg,jpeg,png,gif,webp,avif,svg}',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
