import { createThirdwebClient,getContract } from "thirdweb";
import { inAppWallet } from "thirdweb/wallets";
import {defineChain} from "thirdweb/chains"
const client = createThirdwebClient({ clientId: "ba7a96650ddbf17991e91a37adc04faf" });
const wallet = inAppWallet({auth:{options:["apple","telegram","google","passkey"]},executionMode:{mode:"EIP7702",sponsorGas: true}});

// Google OAuth
const account = await wallet.connect({
  client,
  strategy: "google",
});

const contract = getContract({
  client,
  chain: defineChain(534352),
  address: "0xb1Ba6FfC5b45df4e8c58D4b2C7Ab809b7D1aa8E1",
});

// Once connected, you can use the account to send transactions
console.log("Connected as:", account?.address);
