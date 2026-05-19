/**
 * Simple in-memory store (replace with database in production)
 */

import { Bounty, User } from './types';

// In-memory storage (for hackathon demo)
const bounties: Map<string, Bounty> = new Map();
const users: Map<string, User> = new Map();

// Bounty operations
export function createBounty(bounty: Bounty): Bounty {
  bounties.set(bounty.id, bounty);
  return bounty;
}

export function getBounty(id: string): Bounty | undefined {
  return bounties.get(id);
}

export function getAllBounties(): Bounty[] {
  return Array.from(bounties.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function updateBounty(id: string, updates: Partial<Bounty>): Bounty | undefined {
  const bounty = bounties.get(id);
  if (!bounty) return undefined;
  
  const updated = { ...bounty, ...updates };
  bounties.set(id, updated);
  return updated;
}

export function getOpenBounties(): Bounty[] {
  return getAllBounties().filter(b => b.status === 'open');
}

export function getUserBounties(address: string): Bounty[] {
  return getAllBounties().filter(b => b.creator === address || b.claimedBy === address);
}

// User operations
export function createUser(user: User): User {
  users.set(user.address, user);
  return user;
}

export function getUser(address: string): User | undefined {
  return users.get(address);
}

export function getUserByWalletId(walletId: string): User | undefined {
  return Array.from(users.values()).find(u => u.walletId === walletId);
}
