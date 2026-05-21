import { NextRequest, NextResponse } from 'next/server';
import { getBounty, updateBounty } from '@/lib/store';
import { verifySubmission } from '@/lib/ai';

// Get single bounty
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bounty = await getBounty(id);
    
    if (!bounty) {
      return NextResponse.json({ error: 'Bounty not found' }, { status: 404 });
    }
    
    return NextResponse.json({ bounty });
  } catch (error) {
    console.error('Get bounty error:', error);
    return NextResponse.json({ error: 'Failed to fetch bounty' }, { status: 500 });
  }
}

// Update bounty (claim, submit, etc.)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action, address, submission } = body;
    
    const bounty = await getBounty(id);
    if (!bounty) {
      return NextResponse.json({ error: 'Bounty not found' }, { status: 404 });
    }
    
    // Claim bounty
    if (action === 'claim') {
      if (bounty.status !== 'open') {
        return NextResponse.json({ error: 'Bounty not available' }, { status: 400 });
      }
      if (bounty.creator.toLowerCase() === address.toLowerCase()) {
        return NextResponse.json({ error: 'Cannot claim your own bounty' }, { status: 400 });
      }
      
      const updated = await updateBounty(id, {
        status: 'claimed',
        claimedBy: address.toLowerCase(),
        claimedAt: new Date().toISOString(),
      });
      
      return NextResponse.json({ bounty: updated, message: 'Bounty claimed!' });
    }
    
    // Submit work
    if (action === 'submit') {
      if (bounty.status !== 'claimed') {
        return NextResponse.json({ error: 'Bounty not in claimed state' }, { status: 400 });
      }
      if (bounty.claimedBy?.toLowerCase() !== address.toLowerCase()) {
        return NextResponse.json({ error: 'Not your bounty to submit' }, { status: 400 });
      }
      
      // Verify with AI
      const verification = await verifySubmission(
        bounty.requirements,
        submission
      );
      
      if (verification.approved) {
        // Mark as completed - payout would happen here in production
        const updated = await updateBounty(id, {
          status: 'completed',
          submission,
          submittedAt: new Date().toISOString(),
          verificationResult: verification,
          completedAt: new Date().toISOString(),
        });
        
        return NextResponse.json({
          bounty: updated,
          verification,
          message: `Approved! $${bounty.reward} USDC will be sent to your wallet.`,
        });
      } else {
        // Rejected - back to claimed state
        const updated = await updateBounty(id, {
          submission,
          submittedAt: new Date().toISOString(),
          verificationResult: verification,
        });
        
        return NextResponse.json({
          bounty: updated,
          verification,
          message: `Not approved: ${verification.feedback}`,
        });
      }
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Update bounty error:', error);
    return NextResponse.json({ error: 'Failed to update bounty' }, { status: 500 });
  }
}
