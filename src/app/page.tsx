'use client';

import { useState, useEffect } from 'react';
import { Bounty } from '@/lib/types';

export default function Home() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const [walletId, setWalletId] = useState('');
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [reward, setReward] = useState('');
  
  // Submission state
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [submission, setSubmission] = useState('');

  useEffect(() => {
    fetchBounties();
  }, []);

  const fetchBounties = async () => {
    try {
      const res = await fetch('/api/bounties');
      const data = await res.json();
      setBounties(data.bounties || []);
    } catch (error) {
      console.error('Failed to fetch bounties:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async () => {
    // For demo, generate a random address
    const addr = '0x' + Math.random().toString(16).slice(2, 42);
    
    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addr }),
      });
      
      const data = await res.json();
      if (data.user) {
        setUserAddress(data.user.address);
        setWalletId(data.user.walletId);
      }
    } catch (error) {
      console.error('Wallet error:', error);
    }
  };

  const createBounty = async () => {
    if (!userAddress || !walletId) {
      alert('Please connect wallet first');
      return;
    }
    
    try {
      const res = await fetch('/api/bounties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          requirements,
          reward,
          creator: userAddress,
          creatorWalletId: walletId,
        }),
      });
      
      if (res.ok) {
        setShowCreate(false);
        setTitle('');
        setDescription('');
        setRequirements('');
        setReward('');
        fetchBounties();
      }
    } catch (error) {
      console.error('Create bounty error:', error);
    }
  };

  const claimBounty = async (bountyId: string) => {
    if (!userAddress) {
      alert('Please connect wallet first');
      return;
    }
    
    try {
      const res = await fetch(`/api/bounties/${bountyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'claim',
          address: userAddress,
        }),
      });
      
      if (res.ok) {
        fetchBounties();
      }
    } catch (error) {
      console.error('Claim error:', error);
    }
  };

  const submitWork = async (bountyId: string) => {
    if (!submission.trim()) {
      alert('Please enter your submission');
      return;
    }
    
    try {
      const res = await fetch(`/api/bounties/${bountyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit',
          address: userAddress,
          submission,
        }),
      });
      
      const data = await res.json();
      
      if (data.verification) {
        alert(data.message);
      }
      
      setSubmitting(null);
      setSubmission('');
      fetchBounties();
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-500';
      case 'claimed': return 'bg-yellow-500';
      case 'submitted': return 'bg-blue-500';
      case 'completed': return 'bg-purple-500';
      case 'refunded': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 p-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">🎯 Bounty Hunter</h1>
            <p className="text-gray-400 text-sm">AI-Verified Bounties • USDC on Arc</p>
          </div>
          <div className="flex gap-4">
            {userAddress ? (
              <div className="text-sm">
                <span className="text-gray-400">Connected:</span>{' '}
                <span className="text-green-400">{userAddress.slice(0, 6)}...{userAddress.slice(-4)}</span>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
              >
                Connect Wallet
              </button>
            )}
            {userAddress && (
              <button
                onClick={() => setShowCreate(true)}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg"
              >
                + Post Bounty
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Post a Bounty</h2>
            
            <input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-700 p-3 rounded-lg mb-3"
            />
            
            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gray-700 p-3 rounded-lg mb-3 h-24"
            />
            
            <textarea
              placeholder="Requirements (AI will verify against these)"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              className="w-full bg-gray-700 p-3 rounded-lg mb-3 h-24"
            />
            
            <input
              placeholder="Reward (USDC)"
              type="number"
              value={reward}
              onChange={(e) => setReward(e.target.value)}
              className="w-full bg-gray-700 p-3 rounded-lg mb-4"
            />
            
            <div className="flex gap-3">
              <button
                onClick={createBounty}
                className="flex-1 bg-green-600 hover:bg-green-700 py-3 rounded-lg"
              >
                Post Bounty
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 py-3 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bounty List */}
      <div className="max-w-6xl mx-auto p-6">
        <h2 className="text-xl font-bold mb-4">Available Bounties</h2>
        
        {loading ? (
          <p className="text-gray-400">Loading bounties...</p>
        ) : bounties.length === 0 ? (
          <p className="text-gray-400">No bounties yet. Be the first to post one!</p>
        ) : (
          <div className="grid gap-4">
            {bounties.map((bounty) => (
              <div key={bounty.id} className="bg-gray-800 p-6 rounded-xl">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold">{bounty.title}</h3>
                    <p className="text-gray-400 text-sm">
                      by {bounty.creator.slice(0, 6)}...{bounty.creator.slice(-4)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-400">
                      ${bounty.reward} USDC
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(bounty.status)}`}>
                      {bounty.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-300 mb-3">{bounty.description}</p>
                
                <div className="bg-gray-700/50 p-3 rounded-lg mb-4">
                  <p className="text-sm text-gray-400 font-medium">Requirements:</p>
                  <p className="text-sm">{bounty.requirements}</p>
                </div>
                
                {bounty.verificationResult && (
                  <div className={`p-3 rounded-lg mb-4 ${bounty.verificationResult.approved ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
                    <p className="text-sm font-medium">
                      {bounty.verificationResult.approved ? '✅ Approved' : '❌ Not Approved'}
                    </p>
                    <p className="text-sm text-gray-300">{bounty.verificationResult.feedback}</p>
                  </div>
                )}
                
                {/* Actions */}
                {bounty.status === 'open' && userAddress && bounty.creator !== userAddress && (
                  <button
                    onClick={() => claimBounty(bounty.id)}
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
                  >
                    Claim Bounty
                  </button>
                )}
                
                {bounty.status === 'claimed' && bounty.claimedBy === userAddress && (
                  <div>
                    {submitting === bounty.id ? (
                      <div className="space-y-3">
                        <textarea
                          placeholder="Paste your work submission here..."
                          value={submission}
                          onChange={(e) => setSubmission(e.target.value)}
                          className="w-full bg-gray-700 p-3 rounded-lg h-32"
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={() => submitWork(bounty.id)}
                            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg"
                          >
                            Submit for AI Review
                          </button>
                          <button
                            onClick={() => { setSubmitting(null); setSubmission(''); }}
                            className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSubmitting(bounty.id)}
                        className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg"
                      >
                        Submit Work
                      </button>
                    )}
                  </div>
                )}
                
                {bounty.status === 'completed' && (
                  <div className="text-green-400 font-medium">
                    ✅ Completed - Payment sent!
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
