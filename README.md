  # 🎨 Swagly - Web3 Digital Marketplace with ENS Integration

  > A decentralized marketplace for digital creators powered by blockchain technology, gasless transactions, and ENS identity management.

  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
  [![Scroll](https://img.shields.io/badge/Chain-Scroll-orange)](https://scroll.io/)
  [![ENS](https://img.shields.io/badge/ENS-Integrated-blue)](https://ens.domains/)

  ## 🚀 Overview

  Swagly is a next-generation Web3 marketplace that enables digital creators to monetize their content through blockchain technology. Built on Scroll (Ethereum L2), Swagly provides a seamless user experience with gasless transactions via account abstraction and decentralized identity through ENS (Ethereum Name Service) subdomain integration.

  ### 🎯 Key Features

  - **🎨 Digital Asset Marketplace**: Buy and sell digital products (images, designs, templates) as NFTs
  - **⛽ Gasless Transactions**: Users never pay gas fees thanks to Biconomy Paymaster integration
  - **🔐 Smart Wallet Integration**: ERC-4337 account abstraction with Nexus smart wallets
  - **🌐 ENS Subdomain System**: Free `username.swagly.eth` subdomains for every user
  - **💳 Multi-Payment Support**: Pay with ETH or stablecoins (USDC, USDT)
  - **🎁 Creator Rewards**: Direct creator support through transparent blockchain payments
  - **📱 Social Login**: Connect via email, Google, Discord, or traditional Web3 wallets
  - **🖼️ IPFS Storage**: Decentralized storage for digital assets via Vercel Blob

  ## 🏗️ Technical Architecture

  ### Blockchain Stack

  - **Chain**: Scroll (Ethereum L2) - ChainID: 534352
  - **Smart Wallets**: Nexus (ERC-4337) via Thirdweb
  - **Gas Sponsorship**: Biconomy Paymaster (EntryPoint v0.7.0)
  - **Identity**: ENS subdomains on Ethereum Mainnet
  - **Storage**: IPFS/Vercel Blob for digital assets

  ### Frontend Stack

  - **Framework**: Next.js 14 (App Router)
  - **Language**: TypeScript
  - **Styling**: Tailwind CSS + shadcn/ui
  - **Web3**: Thirdweb SDK v5
  - **State Management**: React Hooks + Context

  ### Backend Stack

  - **Database**: PostgreSQL (Supabase)
  - **ORM**: Prisma
  - **Authentication**: Thirdweb Connect
  - **API**: Next.js API Routes
  - **File Upload**: Vercel Blob Storage

  ## 💡 How It Works

  ### For Buyers

  1. **Connect Wallet**: Use email, social login, or Web3 wallet
  2. **Get ENS Name**: Automatically claim your free `username.swagly.eth` subdomain
  3. **Browse Marketplace**: Explore digital products from creators
  4. **Purchase Without Gas**: Buy products with zero transaction fees (sponsored by Swagly)
  5. **Instant Download**: Access your purchased digital assets immediately

  ### For Creators

  1. **Upload Products**: Upload images, designs, or digital templates
  2. **Set Pricing**: Price in ETH or stablecoins
  3. **Get Paid Instantly**: Receive payments directly to your wallet
  4. **Track Sales**: Monitor your product performance
  5. **Build Reputation**: Your ENS name becomes your creator identity

  ### ENS Integration Deep Dive

  Swagly implements a sophisticated ENS subdomain management system:

  ```typescript
  // Subdomain Registration Flow
  1. User connects wallet → receives Nexus smart wallet
  2. Backend validates availability of username.swagly.eth
  3. Owner wallet calls ENS Name Wrapper contract
  4. Subdomain created with setSubnodeRecord()
  5. Public Resolver updated with user's address
  6. User can now be identified as username.swagly.eth
  ```

  **Smart Contract Integration**:
  - **Name Wrapper**: `0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401`
  - **Public Resolver**: `0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63`
  - **Parent Domain**: `swagly.eth` (owned by platform)

  ## 🛠️ Getting Started

  ### Prerequisites

  - Node.js 18+ and npm
  - PostgreSQL database (or Supabase account)
  - Thirdweb API keys
  - Biconomy Paymaster account
  - ENS domain ownership (for production)

  ### Installation

  ```bash
  # Clone the repository
  git clone https://github.com/swaglyoficial/SwaglyENS.git
  cd SwaglyENS

  # Install dependencies
  npm install

  # Set up environment variables
  cp .env.example .env
  # Edit .env with your configuration

  # Set up database
  npx prisma generate
  npx prisma db push

  # Run development server
  npm run dev
  ```

  Visit `http://localhost:3000` to see the app.

  ### Environment Variables

  ```env
  # Thirdweb Configuration
  NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_client_id
  THIRDWEB_SECRET_KEY=your_secret_key

  # Database (Supabase/PostgreSQL)
  DATABASE_URL=your_database_url
  DIRECT_URL=your_direct_database_url

  # Biconomy (Gas Sponsorship)
  NEXT_PUBLIC_BICONOMY_PAYMASTER_API_KEY=your_api_key
  NEXT_PUBLIC_BICONOMY_PAYMASTER_URL=your_paymaster_url
  NEXT_PUBLIC_BICONOMY_BUNDLER_URL=your_bundler_url

  # ENS Owner Wallet (for subdomain registration)
  ENS_OWNER_PRIVATE_KEY=your_private_key

  # Creator Wallet (receives platform fees)
  CREATOR_WALLET_ADDRESS=your_wallet_address

  # Storage
  BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
  ```

  ## 📁 Project Structure

  ```
  swagly/
  ├── src/
  │   ├── app/                    # Next.js app router pages
  │   │   ├── api/               # API routes
  │   │   │   ├── ens/          # ENS subdomain endpoints
  │   │   │   └── user/         # User management
  │   │   ├── profile/          # User profile page
  │   │   └── marketplace/      # Product listings
  │   ├── components/            # React components
  │   │   ├── ens-*.tsx         # ENS-related components
  │   │   └── ui/               # shadcn/ui components
  │   ├── hooks/                 # Custom React hooks
  │   │   ├── useEnsName.ts     # ENS name resolution
  │   │   └── useUserEnsName.ts # User ENS management
  │   ├── lib/                   # Utility libraries
  │   │   └── ens-manager.ts    # ENS contract interactions
  │   └── config/               # Configuration files
  ├── prisma/                    # Database schema
  ├── docs/                      # Documentation
  └── public/                    # Static assets
  ```

  ## 🔐 Security Features

  - **Non-custodial**: Users maintain full control of their assets
  - **Smart Contract Audited**: Uses battle-tested ENS and ERC-4337 contracts
  - **Encrypted Storage**: Sensitive data encrypted at rest
  - **Rate Limiting**: API endpoints protected against abuse
  - **Input Validation**: All user inputs sanitized and validated
  - **HTTPS Only**: All communications encrypted in transit

  ## 🎨 Smart Contract Interactions

  ### ENS Subdomain Registration

  ```typescript
  // Register a subdomain under swagly.eth
  const result = await registerSubdomain(
    "alice",                    // Subdomain label
    "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" // Owner address
  );
  // Creates: alice.swagly.eth → 0x742d35...
  ```

  ### Gasless Product Purchase

  ```typescript
  // User buys a product without paying gas
  const tx = await purchaseProduct(productId, {
    paymentToken: USDC_ADDRESS,
    usePaymaster: true  // Biconomy sponsors gas
  });
  ```

  ## 📊 Database Schema

  ```prisma
  model User {
    id            String    @id @default(cuid())
    walletAddress String    @unique
    ensName       String?   @unique  // username.swagly.eth
    email         String?
    products      Product[]
    purchases     Purchase[]
  }

  model Product {
    id          String    @id @default(cuid())
    title       String
    description String
    price       String    // Wei amount
    imageUrl    String    // IPFS/Blob URL
    creatorId   String
    creator     User      @relation(fields: [creatorId])
  }
  ```

  ## 🚀 Deployment

  ### Vercel (Recommended)

  ```bash
  # Install Vercel CLI
  npm i -g vercel

  # Deploy
  vercel --prod
  ```

  ### Environment Setup

  1. Configure all environment variables in Vercel dashboard
  2. Set up Supabase PostgreSQL database
  3. Configure custom domain (optional)
  4. Enable Vercel Blob storage

  ## 🧪 Testing

  ```bash
  # Run tests
  npm test

  # Run tests with coverage
  npm run test:coverage

  # E2E tests
  npm run test:e2e
  ```

  ## 📈 Roadmap

  - [ ] Multi-chain support (Base, Optimism, Arbitrum)
  - [ ] NFT minting for products
  - [ ] Creator royalties on secondary sales
  - [ ] Advanced ENS features (avatars, text records)
  - [ ] Mobile app (React Native)
  - [ ] DAO governance for platform decisions
  - [ ] AI-powered product recommendations

  ## 🤝 Contributing

  Contributions are welcome! Please follow these steps:

  1. Fork the repository
  2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
  3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
  4. Push to the branch (`git push origin feature/AmazingFeature`)
  5. Open a Pull Request

  ## 📄 License

  This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

  ## 🏆 Hackathon Highlights

  ### Innovation

  - **First marketplace with integrated ENS subdomain distribution**: Every user gets a free Web3 identity
  - **True gasless UX**: Users never interact with gas fees through Biconomy sponsorship
  - **Social recovery**: Smart wallets enable account recovery without seed phrases

  ### Technical Excellence

  - **Production-ready code**: Clean architecture with TypeScript, proper error handling
  - **Scalable infrastructure**: Serverless deployment with edge functions
  - **Security first**: Non-custodial design, input validation, rate limiting

  ### User Experience

  - **One-click onboarding**: Email login → Smart wallet → ENS name in seconds
  - **Zero friction**: No gas, no seed phrases, no complexity
  - **Web2 UX with Web3 benefits**: Familiar interface, decentralized backend

  ## 📞 Contact & Links

  - **Website**: [swagly.vercel.app](https://swagly.vercel.app)
  - **Twitter**: [@swaglyoficial](https://twitter.com/swaglyoficial)
  - **Discord**: [Join our community](https://discord.gg/swagly)
  - **Documentation**: [docs/](./docs/)

  ## 🙏 Acknowledgments

  - **Scroll** - L2 infrastructure
  - **Thirdweb** - Smart wallet SDK
  - **Biconomy** - Gas sponsorship
  - **ENS** - Decentralized naming
  - **Vercel** - Deployment platform
  - **Supabase** - Database infrastructure

  ---

  Built with ❤️ by the Swagly team | **Making Web3 accessible to everyone**
