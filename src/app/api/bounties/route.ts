import { NextRequest, NextResponse } from 'next/server';
import { createBounty, getAllBounties, getOpenBounties } from '@/lib/store';
import { Bounty } from '@/lib/types';
import { v4 as uuid } from 'uuid';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filter = searchParams.get('filter');
  
  const bounties = filter === 'open' ? getOpenBounties() : getAllBounties();
  
  return NextResponse.json({ bounties });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, requirements, reward, creator, creatorWalletId } = body;
    
    if (!title || !description || !requirements || !reward || !creator || !creatorWalletId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const bounty: Bounty = {
      id: uuid(),
      title,
      description,
      requirements,
      reward,
      creator,
      creatorWalletId,
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    
    createBounty(bounty);
    
    return NextResponse.json({ bounty }, { status: 201 });
  } catch (error) {
    console.error('Create bounty error:', error);
    return NextResponse.json({ error: 'Failed to create bounty' }, { status: 500 });
  }
}
