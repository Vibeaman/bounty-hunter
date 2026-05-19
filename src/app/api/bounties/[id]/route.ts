import { NextRequest, NextResponse } from 'next/server';
import { getBounty, updateBounty } from '@/lib/store';
import { verifySubmission } from '@/lib/ai';
import { transferUSDC } from '@/lib/circle';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const bounty = getBounty(id);
  
  if (!bounty) {
    return NextResponse.json({ error: 'Bounty not found' }, { status: 404 });
  }
  
  return NextResponse.json({ bounty });
}

// Claim, submit, or other actions
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const bounty = getBounty(id);
  
  if (!bounty) {
    return NextResponse.json({ error: 'Bounty not found' }, { status: 404 });
  }
  
  try {
    const body = await req.json();
    const { action, address, walletId, submission } = body;
    
    switch (action) {
      case 'claim': {
        if (bounty.status !== 'open') {
          return NextResponse.json({ error: 'Bounty is not open' }, { status: 400 });
        }
        
        const updated = updateBounty(id, {
          status: 'claimed',
          claimedBy: address,
          claimedAt: new Date().toISOString(),
        });
        
        return NextResponse.json({ bounty: updated });
      }
      
      case 'submit': {
        if (bounty.status !== 'claimed') {
          return NextResponse.json({ error: 'Bounty is not claimed' }, { status: 400 });
        }
        
        if (bounty.claimedBy !== address) {
          return NextResponse.json({ error: 'You did not claim this bounty' }, { status: 403 });
        }
        
        // Update to submitted
        updateBounty(id, {
          status: 'submitted',
          submission,
          submittedAt: new Date().toISOString(),
        });
        
        // AI verification
        const result = await verifySubmission(
          bounty.title,
          bounty.description,
          bounty.requirements,
          submission
        );
        
        if (result.approved) {
          // Transfer USDC to worker
          try {
            await transferUSDC(
              bounty.creatorWalletId,
              address, // worker's address
              bounty.reward
            );
            
            const completed = updateBounty(id, {
              status: 'completed',
              verificationResult: {
                approved: true,
                reason: result.reason,
                feedback: result.feedback,
              },
              completedAt: new Date().toISOString(),
            });
            
            return NextResponse.json({ 
              bounty: completed, 
              verification: result,
              message: 'Work approved! Payment sent.' 
            });
          } catch (transferError) {
            console.error('Transfer error:', transferError);
            return NextResponse.json({ 
              error: 'Work approved but payment failed',
              verification: result 
            }, { status: 500 });
          }
        } else {
          // Rejected - back to claimed so they can try again
          const rejected = updateBounty(id, {
            status: 'claimed',
            verificationResult: {
              approved: false,
              reason: result.reason,
              feedback: result.feedback,
            },
          });
          
          return NextResponse.json({ 
            bounty: rejected, 
            verification: result,
            message: 'Work not approved. Please review feedback and try again.' 
          });
        }
      }
      
      case 'cancel': {
        if (bounty.creator !== address) {
          return NextResponse.json({ error: 'Only creator can cancel' }, { status: 403 });
        }
        
        if (bounty.status !== 'open') {
          return NextResponse.json({ error: 'Can only cancel open bounties' }, { status: 400 });
        }
        
        const cancelled = updateBounty(id, {
          status: 'refunded',
        });
        
        return NextResponse.json({ bounty: cancelled });
      }
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Bounty action error:', error);
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}
