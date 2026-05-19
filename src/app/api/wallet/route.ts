import { NextRequest, NextResponse } from 'next/server';
import { createWallet, getWalletBalance } from '@/lib/circle';
import { createUser, getUser } from '@/lib/store';
import { v4 as uuid } from 'uuid';

// Create or get wallet for user
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { address } = body;
    
    if (!address) {
      return NextResponse.json({ error: 'Address required' }, { status: 400 });
    }
    
    // Check if user already exists
    let user = getUser(address);
    
    if (!user) {
      // Create new Circle wallet
      const wallet = await createWallet();
      
      if (!wallet) {
        return NextResponse.json({ error: 'Failed to create wallet' }, { status: 500 });
      }
      
      user = createUser({
        id: uuid(),
        address,
        walletId: wallet.id,
        createdAt: new Date().toISOString(),
      });
    }
    
    // Get balance
    const balances = await getWalletBalance(user.walletId);
    
    return NextResponse.json({ 
      user,
      balances,
    });
  } catch (error) {
    console.error('Wallet error:', error);
    return NextResponse.json({ error: 'Wallet operation failed' }, { status: 500 });
  }
}
