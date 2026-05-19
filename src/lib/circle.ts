/**
 * Circle SDK wrapper for wallet operations
 */

import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';

const client = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY!,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
});

export async function createWallet() {
  const response = await client.createWallets({
    accountType: 'EOA',
    blockchains: ['ARC-TESTNET'],
    count: 1,
    walletSetId: 'bounty-hunter-wallets',
  });
  return response.data?.wallets?.[0];
}

export async function getWalletBalance(walletId: string) {
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
  const response = await client.createTransaction({
    walletId: fromWalletId,
    tokenAddress: process.env.NEXT_PUBLIC_USDC_ADDRESS!,
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

export { client };
