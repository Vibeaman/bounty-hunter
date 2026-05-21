/**
 * Simple store with hardcoded sample bounties for demo
 */

import { Bounty, User } from './types';

// Sample bounties that always show up
const SAMPLE_BOUNTIES: Bounty[] = [
  {
    id: 'sample-1',
    title: 'Design a DeFi Dashboard UI',
    description: 'Create a clean, modern dashboard design for a DeFi portfolio tracker. Should include wallet overview, token balances, and transaction history sections.',
    requirements: 'Figma file with at least 3 screens: Dashboard overview, Token details, and Transaction history. Must use dark theme with purple/blue accents. Include mobile responsive designs.',
    reward: '450',
    creator: '0x742d35Cc6634C0532925a3b844Bc9e7595f8fE00',
    creatorWalletId: '0x742d35Cc6634C0532925a3b844Bc9e7595f8fE00',
    category: 'Design',
    status: 'open',
    createdAt: '2026-05-20T10:00:00.000Z',
  },
  {
    id: 'sample-2',
    title: 'Write Technical Documentation for Smart Contract',
    description: 'Document our ERC-721 NFT minting contract. Explain each function, parameters, and provide usage examples for developers.',
    requirements: 'Markdown documentation covering: Contract overview, All public functions with parameters and return values, Code examples for minting and transferring, Security considerations. At least 1500 words.',
    reward: '200',
    creator: '0x8Ba1f109551bD432803012645Ac136ddd64DBa72',
    creatorWalletId: '0x8Ba1f109551bD432803012645Ac136ddd64DBa72',
    category: 'Writing',
    status: 'open',
    createdAt: '2026-05-19T14:30:00.000Z',
  },
  {
    id: 'sample-3',
    title: 'Build a Token Price API Endpoint',
    description: 'Create a REST API that fetches real-time token prices from multiple DEXs and returns aggregated data.',
    requirements: 'Node.js/TypeScript API with: GET /price/:token endpoint, Fetch from at least 2 sources (Uniswap, Sushiswap), Return JSON with price, 24h change, volume. Include error handling and rate limiting.',
    reward: '600',
    creator: '0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec',
    creatorWalletId: '0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec',
    category: 'Development',
    status: 'open',
    createdAt: '2026-05-21T08:15:00.000Z',
  },
  {
    id: 'sample-4',
    title: 'Create Social Media Launch Campaign',
    description: 'Plan and create content for our token launch across Twitter, Discord, and Telegram. Need engaging posts that build hype.',
    requirements: '10 Twitter posts with visuals, 5 Discord announcements, 3 Telegram messages. Include a content calendar for 2-week rollout. Posts should highlight utility, team, and roadmap.',
    reward: '180',
    creator: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    creatorWalletId: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    category: 'Marketing',
    status: 'open',
    createdAt: '2026-05-18T16:45:00.000Z',
  },
  {
    id: 'sample-5',
    title: 'Competitive Analysis: Top 5 L2 Solutions',
    description: 'Research and compare the top Layer 2 scaling solutions. We need detailed insights to inform our deployment strategy.',
    requirements: 'Report comparing Arbitrum, Optimism, Base, zkSync, and Polygon. Include: TPS, fees, TVL, developer tools, ecosystem size, pros/cons. Minimum 2000 words with data sources cited.',
    reward: '350',
    creator: '0x2546BcD3c84621e976D8185a91A922aE77ECEc30',
    creatorWalletId: '0x2546BcD3c84621e976D8185a91A922aE77ECEc30',
    category: 'Research',
    status: 'open',
    createdAt: '2026-05-21T11:00:00.000Z',
  },
  {
    id: 'sample-6',
    title: 'Design NFT Collection Artwork',
    description: 'Create 5 unique base character designs for a cyberpunk-themed NFT collection. These will be used to generate 10,000 variations.',
    requirements: '5 distinct character designs in PNG format (2000x2000px). Cyberpunk aesthetic with neon colors. Each character should have clearly separable layers (background, body, accessories, effects) for trait generation.',
    reward: '800',
    creator: '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
    creatorWalletId: '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
    category: 'Design',
    status: 'claimed',
    claimedBy: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    claimedAt: '2026-05-21T12:00:00.000Z',
    createdAt: '2026-05-17T09:30:00.000Z',
  },
];

// In-memory storage that persists during warm instances
const bounties: Map<string, Bounty> = new Map();
const users: Map<string, User> = new Map();

// Initialize with sample bounties
function initSamples() {
  if (bounties.size === 0) {
    SAMPLE_BOUNTIES.forEach(b => bounties.set(b.id, b));
  }
}

// Bounty operations
export async function createBounty(bounty: Bounty): Promise<Bounty> {
  initSamples();
  bounties.set(bounty.id, bounty);
  return bounty;
}

export async function getBounty(id: string): Promise<Bounty | undefined> {
  initSamples();
  return bounties.get(id);
}

export async function getAllBounties(): Promise<Bounty[]> {
  initSamples();
  return Array.from(bounties.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function updateBounty(id: string, updates: Partial<Bounty>): Promise<Bounty | undefined> {
  initSamples();
  const bounty = bounties.get(id);
  if (!bounty) return undefined;
  
  const updated = { ...bounty, ...updates };
  bounties.set(id, updated);
  return updated;
}

export async function getOpenBounties(): Promise<Bounty[]> {
  const all = await getAllBounties();
  return all.filter(b => b.status === 'open');
}

export async function getUserBounties(address: string): Promise<Bounty[]> {
  const all = await getAllBounties();
  return all.filter(b => b.creator === address || b.claimedBy === address);
}

// User operations
export async function createUser(user: User): Promise<User> {
  users.set(user.address.toLowerCase(), user);
  return user;
}

export async function getUser(address: string): Promise<User | undefined> {
  return users.get(address.toLowerCase());
}

export async function getUserByWalletId(walletId: string): Promise<User | undefined> {
  return Array.from(users.values()).find(u => u.walletId === walletId);
}
