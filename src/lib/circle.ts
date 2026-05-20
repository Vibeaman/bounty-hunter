/**
 * Circle SDK wrapper for wallet operations
 */

import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';

// Lazy initialization to avoid build-time errors
let _client: ReturnType<typeof initiateDeveloperControlledWalletsClient> | null = null;

function getClient() {
  if (!_client) {
    if (!process.env.CIRCLE_API_KEY || !process.env.CIRCLE_ENTITY_SECRET) {
      throw new Error('Circle credentials not configured');
    }
    _client = initiateDeveloperControlledWalletsClient({
      apiKey: process.env.CIRCLE_API_KEY,
      entitySecret: process.env.CIRCLE_ENTITY_SECRET,
    });
  }
  return _client;
}

export async function createWallet() {
  const client = getClient();
  const response = await client.createWallets({
    accountType: 'EOA',
    blockchains: ['ARC-TESTNET'],
    count: 1,
    walletSetId: 'bounty-hunter-wallets',
  });
  return response.data?.wallets?.[0];
}

export async function getWalletBalance(walletId: string) {
  const client = getClient();
  const response = await client.getWalletTokenBalance({
    id: walletId,
  });
  return response.data?.tokenBalances;
}

export async function transferUSDC(
  fromWalletId: string,
  toAddress: string,
  amount: string
) {
  const client = getClient();
  const response = await client.createTransaction({
    walletId: fromWalletId,
    tokenAddress: process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x3600000000000000000000000000000000000000',
    destinationAddress: toAddress,
    amount: [amount],
    fee: {
      type: 'level',
      config: {
        feeLevel: 'MEDIUM',
      },
    },
  });
  return response.data;
}
