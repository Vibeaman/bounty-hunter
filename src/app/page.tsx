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

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'claimed': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'submitted': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'completed': return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
      case 'refunded': return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
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
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-4">
          <div className="glass rounded-2xl p-5 text-center hover:border-[var(--border-hover)] transition-all group">
            <div className="text-3xl font-bold text-green-400 group-hover:scale-110 transition-transform">
              {bounties.filter(b => b.status === 'open').length}
            </div>
            <div className="text-sm text-[var(--text-muted)] mt-1">Open Bounties</div>
          </div>
          <div className="glass rounded-2xl p-5 text-center hover:border-[var(--border-hover)] transition-all group">
            <div className="text-3xl font-bold text-purple-400 group-hover:scale-110 transition-transform">
              {bounties.filter(b => b.status === 'completed').length}
            </div>
            <div className="text-sm text-[var(--text-muted)] mt-1">Completed</div>
          </div>
          <div className="glass rounded-2xl p-5 text-center hover:border-[var(--border-hover)] transition-all group">
            <div className="text-3xl font-bold text-[var(--accent-cyan)] group-hover:scale-110 transition-transform">
              ${bounties.reduce((sum, b) => sum + parseFloat(b.reward || '0'), 0).toFixed(0)}
            </div>
            <div className="text-sm text-[var(--text-muted)] mt-1">Total USDC</div>
          </div>
        </div>
      </div>

      {/* Bounty List */}
      <div className="max-w-6xl mx-auto px-6 pb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Available Bounties</h2>
          <div className="text-sm text-[var(--text-muted)]">{bounties.length} total</div>
        </div>
        
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block w-10 h-10 border-2 border-[var(--bg-card)] border-t-[var(--accent-blue)] rounded-full animate-spin mb-4"></div>
            <p className="text-[var(--text-muted)]">Loading bounties...</p>
          </div>
        ) : bounties.length === 0 ? (
          <div className="glass rounded-2xl text-center py-20 animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-purple)] flex items-center justify-center text-3xl">
              🎯
            </div>
            <p className="text-[var(--text-primary)] font-medium mb-2">No bounties yet</p>
            <p className="text-[var(--text-muted)] text-sm">Be the first to post one!</p>
          </div>
        ) : (
          <div className="grid gap-5">
            {bounties.map((bounty, index) => (
              <div 
                key={bounty.id} 
                className="glass rounded-2xl p-6 hover:border-[var(--border-hover)] transition-all animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Card Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-[var(--text-primary)]">{bounty.title}</h3>
                      <span className={`text-xs px-2.5 py-1 rounded-full ${getStatusStyle(bounty.status)}`}>
                        {bounty.status.charAt(0).toUpperCase() + bounty.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-[var(--text-muted)] text-xs font-mono">
                      Posted by {bounty.creator.slice(0, 6)}...{bounty.creator.slice(-4)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold gradient-text">
                      ${bounty.reward}
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">USDC</div>
                  </div>
                </div>
                
                {/* Description */}
                <p className="text-[var(--text-secondary)] mb-4 leading-relaxed">{bounty.description}</p>
                
                {/* Requirements Box */}
                <div className="bg-[var(--bg-primary)]/50 border border-[var(--border-color)] p-4 rounded-xl mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">📋</span>
                    <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Requirements (AI-verified)</span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">{bounty.requirements}</p>
                </div>
                
                {/* Verification Result */}
                {bounty.verificationResult && (
                  <div className={`p-4 rounded-xl mb-5 ${bounty.verificationResult.approved ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                    <p className="text-sm font-medium flex items-center gap-2">
                      {bounty.verificationResult.approved ? (
                        <><span className="text-green-400">✓</span> <span className="text-green-400">Approved</span></>
                      ) : (
                        <><span className="text-red-400">✗</span> <span className="text-red-400">Not Approved</span></>
                      )}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)] mt-2">{bounty.verificationResult.feedback}</p>
                  </div>
                )}
                
                {/* Actions */}
                {bounty.status === 'open' && bounty.creator !== userAddress && (
                  <button
                    onClick={() => claimBounty(bounty.id)}
                    className="px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-purple)] hover:opacity-90 transition-all shadow-lg shadow-blue-500/20"
                  >
                    ⚡ Claim Bounty
                  </button>
                )}
                
                {bounty.status === 'claimed' && bounty.claimedBy === userAddress && (
                  <div>
                    {submitting === bounty.id ? (
                      <div className="space-y-4">
                        <textarea
                          placeholder="Paste your work submission here... (AI will verify against requirements)"
                          value={submission}
                          onChange={(e) => setSubmission(e.target.value)}
                          className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] p-4 rounded-xl h-32 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-purple)] transition-colors"
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={() => submitWork(bounty.id)}
                            disabled={verifying}
                            className="px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-[var(--accent-purple)] to-pink-500 hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-purple-500/20"
                          >
                            {verifying ? '🤖 AI Verifying...' : '🚀 Submit for Review'}
                          </button>
                          <button
                            onClick={() => { setSubmitting(null); setSubmission(''); }}
                            className="px-5 py-2.5 rounded-xl font-medium bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSubmitting(bounty.id)}
                        className="px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-[var(--accent-purple)] to-pink-500 hover:opacity-90 transition-all shadow-lg shadow-purple-500/20"
                      >
                        📝 Submit Work
                      </button>
                    )}
                  </div>
                )}
                
                {bounty.status === 'completed' && (
                  <div className="flex items-center gap-3 text-green-400">
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                      <span className="text-xs">✓</span>
                    </div>
                    <span className="font-medium">Completed</span>
                    <span className="text-[var(--text-muted)]">•</span>
                    <span className="text-[var(--text-secondary)] text-sm">Payment sent!</span>
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
