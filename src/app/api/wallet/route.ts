import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUser } from '@/lib/store';
import { v4 as uuid } from 'uuid';

// Register user's external wallet address
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { address } = body;
    
    if (!address || !address.startsWith('0x')) {
      return NextResponse.json({ error: 'Valid address required' }, { status: 400 });
    }
    
    // Check if user already exists
    let user = getUser(address);
    
    if (!user) {
      // Just store their external wallet address
      // No Circle wallet needed - we pay directly to their address
      user = createUser({
        id: uuid(),
        address: address.toLowerCase(),
        walletId: address.toLowerCase(), // Use their address as walletId for simplicity
        createdAt: new Date().toISOString(),
      });
    }
    
    return NextResponse.json({ 
      user,
      message: 'Wallet connected successfully',
    });
  } catch (error) {
    console.error('Wallet error:', error);
    return NextResponse.json({ error: 'Wallet operation failed' }, { status: 500 });
  }
}
