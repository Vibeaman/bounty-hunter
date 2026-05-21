/**
 * Redis-backed store using Upstash
 * Falls back to in-memory for local dev
 */

import { Bounty, User } from './types';
import { Redis } from '@upstash/redis';

// Initialize Redis client if env vars are set
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!redis && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

// Keys
const BOUNTIES_KEY = 'bounties';
const USERS_KEY = 'users';

// In-memory fallback for local dev
const memBounties: Map<string, Bounty> = new Map();
const memUsers: Map<string, User> = new Map();

// Bounty operations
export async function createBounty(bounty: Bounty): Promise<Bounty> {
  const r = getRedis();
  if (r) {
    await r.hset(BOUNTIES_KEY, { [bounty.id]: JSON.stringify(bounty) });
  } else {
    memBounties.set(bounty.id, bounty);
  }
  return bounty;
}

export async function getBounty(id: string): Promise<Bounty | undefined> {
  const r = getRedis();
  if (r) {
    const data = await r.hget<string>(BOUNTIES_KEY, id);
    return data ? JSON.parse(data) : undefined;
  }
  return memBounties.get(id);
}

export async function getAllBounties(): Promise<Bounty[]> {
  const r = getRedis();
  if (r) {
    const data = await r.hgetall<Record<string, string>>(BOUNTIES_KEY);
    if (!data) return [];
    return Object.values(data)
      .map(v => JSON.parse(v) as Bounty)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  return Array.from(memBounties.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function updateBounty(id: string, updates: Partial<Bounty>): Promise<Bounty | undefined> {
  const bounty = await getBounty(id);
  if (!bounty) return undefined;
  
  const updated = { ...bounty, ...updates };
  const r = getRedis();
  if (r) {
    await r.hset(BOUNTIES_KEY, { [id]: JSON.stringify(updated) });
  } else {
    memBounties.set(id, updated);
  }
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
  const r = getRedis();
  const key = user.address.toLowerCase();
  if (r) {
    await r.hset(USERS_KEY, { [key]: JSON.stringify(user) });
  } else {
    memUsers.set(key, user);
  }
  return user;
}

export async function getUser(address: string): Promise<User | undefined> {
  const r = getRedis();
  const key = address.toLowerCase();
  if (r) {
    const data = await r.hget<string>(USERS_KEY, key);
    return data ? JSON.parse(data) : undefined;
  }
  return memUsers.get(key);
}

export async function getUserByWalletId(walletId: string): Promise<User | undefined> {
  const r = getRedis();
  if (r) {
    const data = await r.hgetall<Record<string, string>>(USERS_KEY);
    if (!data) return undefined;
    const users = Object.values(data).map(v => JSON.parse(v) as User);
    return users.find(u => u.walletId === walletId);
  }
  return Array.from(memUsers.values()).find(u => u.walletId === walletId);
}
