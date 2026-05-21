import { NextRequest, NextResponse } from 'next/server';
import { createBounty, getAllBounties } from '@/lib/store';
import { v4 as uuid } from 'uuid';
import { Bounty } from '@/lib/types';

// Get all bounties
export async function GET() {
  try {
    const bounties = await getAllBounties();
    return NextResponse.json({ bounties });
  } catch (error) {
    console.error('Get bounties error:', error);
    return NextResponse.json({ error: 'Failed to fetch bounties' }, { status: 500 });
  }
}

// Create a new bounty
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, requirements, reward, creator, creatorWalletId, category } = body;
    
    if (!title || !description || !requirements || !reward || !creator) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const bounty: Bounty = {
      id: uuid(),
      title,
      description,
      requirements,
      reward,
      creator,
      creatorWalletId: creatorWalletId || creator,
      category: category || 'Development',
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    
    await createBounty(bounty);
    
    return NextResponse.json({ bounty });
  } catch (error) {
    console.error('Create bounty error:', error);
    return NextResponse.json({ error: 'Failed to create bounty' }, { status: 500 });
  }
}
