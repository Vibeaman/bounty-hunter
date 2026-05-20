'use client';

import { useState, useEffect } from 'react';
import { Bounty } from '@/lib/types';

export default function Home() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showConnect, setShowConnect] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const [walletId, setWalletId] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [connecting, setConnecting] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [reward, setReward] = useState('');
  
  // Submission state
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [submission, setSubmission] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetchBounties();
    // Check localStorage for saved wallet
    const saved = localStorage.getItem('bountyHunterWallet');
    if (saved) {
      const { address, walletId } = JSON.parse(saved);
      setUserAddress(address);
      setWalletId(walletId);
    }
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
    if (!addressInput.trim() || !addressInput.startsWith('0x')) {
      alert('Please enter a valid wallet address (0x...)');
      return;
    }
    
    setConnecting(true);
    
    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addressInput.trim() }),
      });
      
      const data = await res.json();
      if (data.user) {
        setUserAddress(data.user.address);
        setWalletId(data.user.walletId);
        localStorage.setItem('bountyHunterWallet', JSON.stringify({
          address: data.user.address,
          walletId: data.user.walletId,
        }));
        setShowConnect(false);
        setAddressInput('');
      } else {
        alert(data.error || 'Failed to connect');
      }
    } catch (error) {
      console.error('Wallet error:', error);
      alert('Connection failed');
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = () => {
    setUserAddress('');
    setWalletId('');
    localStorage.removeItem('bountyHunterWallet');
  };

  const createBounty = async () => {
    if (!userAddress || !walletId) {
      alert('Please connect wallet first');
      return;
    }
    
    if (!title || !description || !requirements || !reward) {
      alert('Please fill all fields');
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
      setShowConnect(true);
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
    
    setVerifying(true);
    
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
        if (data.verification.approved) {
          alert('✅ ' + data.message);
        } else {
          alert('❌ ' + data.message + '\n\nFeedback: ' + data.verification.feedback);
        }
      }
      
      setSubmitting(null);
      setSubmission('');
      fetchBounties();
    } catch (error) {
      console.error('Submit error:', error);
      alert('Submission failed');
    } finally {
      setVerifying(false);
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
    <main className="min-h-screen text-white">
      {/* Header */}
      <header className="glass sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-purple)] flex items-center justify-center text-xl">
              🎯
            </div>
            <div>
              <h1 className="text-xl font-semibold gradient-text">
                Bounty Hunter
              </h1>
              <p className="text-[var(--text-muted)] text-xs">AI-Verified • USDC on Arc</p>
            </div>
          </div>
          
          {/* Nav + Wallet */}
          <div className="flex items-center gap-4">
            {userAddress ? (
              <>
                {/* Wallet Badge */}
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-sm font-mono text-[var(--text-secondary)]">
                    {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                  </span>
                </div>
                
                {/* Post Bounty Button */}
                <button
                  onClick={() => setShowCreate(true)}
                  className="px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-purple)] hover:opacity-90 transition-all shadow-lg shadow-purple-500/20"
                >
                  + Post Bounty
                </button>
                
                {/* Disconnect */}
                <button
                  onClick={disconnect}
                  className="text-[var(--text-muted)] hover:text-white text-sm transition-colors"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowConnect(true)}
                className="px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-purple)] hover:opacity-90 transition-all shadow-lg shadow-purple-500/20"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Connect Modal */}
      {showConnect && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-2">Connect Wallet</h2>
            <p className="text-gray-400 text-sm mb-4">
              Enter your Arc wallet address to get started
            </p>
            
            <input
              placeholder="0x..."
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600 p-3 rounded-xl mb-4 font-mono text-sm focus:outline-none focus:border-blue-500"
            />
            
            <p className="text-xs text-gray-500 mb-4">
              💡 Get testnet USDC at{' '}
              <a href="https://faucet.circle.com" target="_blank" className="text-blue-400 hover:underline">
                faucet.circle.com
              </a>
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={connectWallet}
                disabled={connecting}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 py-3 rounded-xl font-medium disabled:opacity-50"
              >
                {connecting ? 'Connecting...' : 'Connect'}
              </button>
              <button
                onClick={() => setShowConnect(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Post a Bounty</h2>
            
            <input
              placeholder="Title (e.g., Design a logo)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600 p-3 rounded-xl mb-3 focus:outline-none focus:border-green-500"
            />
            
            <textarea
              placeholder="Description - What do you need done?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600 p-3 rounded-xl mb-3 h-24 focus:outline-none focus:border-green-500"
            />
            
            <textarea
              placeholder="Requirements - AI will verify submissions against these criteria"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600 p-3 rounded-xl mb-3 h-24 focus:outline-none focus:border-green-500"
            />
            
            <div className="relative mb-4">
              <input
                placeholder="10"
                type="number"
                value={reward}
                onChange={(e) => setReward(e.target.value)}
                className="w-full bg-gray-700/50 border border-gray-600 p-3 rounded-xl pr-20 focus:outline-none focus:border-green-500"
              />
              <span className="absolute right-3 top-3 text-gray-400 font-medium">USDC</span>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={createBounty}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 py-3 rounded-xl font-medium"
              >
                Post Bounty
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Banner */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{bounties.filter(b => b.status === 'open').length}</div>
            <div className="text-xs text-gray-400">Open Bounties</div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">{bounties.filter(b => b.status === 'completed').length}</div>
            <div className="text-xs text-gray-400">Completed</div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">
              ${bounties.reduce((sum, b) => sum + parseFloat(b.reward || '0'), 0).toFixed(0)}
            </div>
            <div className="text-xs text-gray-400">Total USDC</div>
          </div>
        </div>
      </div>

      {/* Bounty List */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        <h2 className="text-lg font-bold mb-4 text-gray-300">Available Bounties</h2>
        
        {loading ? (
          <div className="text-center py-12 text-gray-400">
            <div className="animate-spin inline-block w-8 h-8 border-2 border-gray-600 border-t-green-400 rounded-full mb-2"></div>
            <p>Loading bounties...</p>
          </div>
        ) : bounties.length === 0 ? (
          <div className="text-center py-16 bg-gray-800/30 rounded-2xl border border-gray-700/50">
            <div className="text-4xl mb-4">🎯</div>
            <p className="text-gray-400 mb-2">No bounties yet</p>
            <p className="text-gray-500 text-sm">Be the first to post one!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {bounties.map((bounty) => (
              <div key={bounty.id} className="bg-gray-800/50 border border-gray-700/50 p-6 rounded-2xl hover:border-gray-600 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">{bounty.title}</h3>
                    <p className="text-gray-500 text-xs font-mono">
                      by {bounty.creator.slice(0, 6)}...{bounty.creator.slice(-4)}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-xl font-bold text-green-400">
                      ${bounty.reward}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(bounty.status)} text-white`}>
                      {bounty.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-300 mb-3 text-sm">{bounty.description}</p>
                
                <div className="bg-gray-900/50 border border-gray-700/50 p-3 rounded-xl mb-4">
                  <p className="text-xs text-gray-500 font-medium mb-1">📋 Requirements (AI-verified)</p>
                  <p className="text-sm text-gray-300">{bounty.requirements}</p>
                </div>
                
                {bounty.verificationResult && (
                  <div className={`p-3 rounded-xl mb-4 ${bounty.verificationResult.approved ? 'bg-green-900/20 border border-green-800/50' : 'bg-red-900/20 border border-red-800/50'}`}>
                    <p className="text-sm font-medium">
                      {bounty.verificationResult.approved ? '✅ Approved' : '❌ Not Approved'}
                    </p>
                    <p className="text-sm text-gray-300 mt-1">{bounty.verificationResult.feedback}</p>
                  </div>
                )}
                
                {/* Actions */}
                {bounty.status === 'open' && bounty.creator !== userAddress && (
                  <button
                    onClick={() => claimBounty(bounty.id)}
                    className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 px-4 py-2 rounded-xl font-medium transition-all"
                  >
                    ⚡ Claim Bounty
                  </button>
                )}
                
                {bounty.status === 'claimed' && bounty.claimedBy === userAddress && (
                  <div>
                    {submitting === bounty.id ? (
                      <div className="space-y-3">
                        <textarea
                          placeholder="Paste your work submission here... (AI will verify this against requirements)"
                          value={submission}
                          onChange={(e) => setSubmission(e.target.value)}
                          className="w-full bg-gray-700/50 border border-gray-600 p-3 rounded-xl h-32 focus:outline-none focus:border-purple-500"
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={() => submitWork(bounty.id)}
                            disabled={verifying}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-4 py-2 rounded-xl font-medium disabled:opacity-50"
                          >
                            {verifying ? '🤖 AI Verifying...' : '🚀 Submit for Review'}
                          </button>
                          <button
                            onClick={() => { setSubmitting(null); setSubmission(''); }}
                            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-xl"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSubmitting(bounty.id)}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-4 py-2 rounded-xl font-medium"
                      >
                        📝 Submit Work
                      </button>
                    )}
                  </div>
                )}
                
                {bounty.status === 'completed' && (
                  <div className="flex items-center gap-2 text-green-400 font-medium">
                    <span>✅ Completed</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-400 text-sm">Payment sent!</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <footer className="border-t border-gray-800 py-6 text-center text-gray-500 text-xs">
        Built on Arc • Powered by Circle • AI Verified by GPT-4o
      </footer>
    </main>
  );
}
