export interface Bounty {
  id: string;
  title: string;
  description: string;
  requirements: string;
  reward: string; // USDC amount
  creator: string;
  creatorWalletId: string;
  status: 'open' | 'claimed' | 'submitted' | 'completed' | 'refunded';
  claimedBy?: string;
  claimedAt?: string;
  submission?: string;
  submittedAt?: string;
  verificationResult?: {
    approved: boolean;
    reason: string;
    feedback: string;
  };
  createdAt: string;
  completedAt?: string;
}

export interface User {
  id: string;
  address: string;
  walletId: string;
  createdAt: string;
}
