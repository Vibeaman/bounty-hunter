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
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [reward, setReward] = useState('');
  
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [submission, setSubmission] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetchBounties();
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
      }
    } catch (error) {
      console.error('Wallet error:', error);
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
    if (!userAddress || !walletId) return;
    if (!title || !description || !requirements || !reward) {
      alert('Please fill all fields');
      return;
    }
    try {
      const res = await fetch('/api/bounties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, requirements, reward, creator: userAddress, creatorWalletId: walletId }),
      });
      if (res.ok) {
        setShowCreate(false);
        setTitle(''); setDescription(''); setRequirements(''); setReward('');
        fetchBounties();
      }
    } catch (error) {
      console.error('Create bounty error:', error);
    }
  };

  const claimBounty = async (bountyId: string) => {
    if (!userAddress) { setShowConnect(true); return; }
    try {
      const res = await fetch(`/api/bounties/${bountyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'claim', address: userAddress }),
      });
      if (res.ok) fetchBounties();
    } catch (error) {
      console.error('Claim error:', error);
    }
  };

  const submitWork = async (bountyId: string) => {
    if (!submission.trim()) return;
    setVerifying(true);
    try {
      const res = await fetch(`/api/bounties/${bountyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit', address: userAddress, submission }),
      });
      const data = await res.json();
      if (data.verification) {
        alert(data.verification.approved ? '✅ ' + data.message : '❌ ' + data.message);
      }
      setSubmitting(null);
      setSubmission('');
      fetchBounties();
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="header-glass sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-lg">
              🎯
            </div>
            <div>
              <h1 className="text-lg font-semibold">Bounty Hunter</h1>
              <p className="text-xs text-[var(--text-muted)]">AI-Verified • USDC on Arc</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {userAddress ? (
              <>
                <div className="pill flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="font-mono text-sm">{userAddress.slice(0, 6)}...{userAddress.slice(-4)}</span>
                </div>
                <button onClick={() => setShowCreate(true)} className="btn-primary">
                  + Post Bounty
                </button>
                <button onClick={disconnect} className="text-[var(--text-muted)] text-sm hover:text-[var(--text-primary)]">
                  Disconnect
                </button>
              </>
            ) : (
              <button onClick={() => setShowConnect(true)} className="btn-primary">
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-[var(--accent-purple)]">Hunt Bounties,</span> Get Paid
          </h1>
          <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">
            Complete tasks, get verified by AI, and receive instant USDC payments on Arc Network
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          <div className="card p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center text-2xl mx-auto mb-3">
              📋
            </div>
            <div className="text-3xl font-bold text-[var(--text-primary)]">{bounties.filter(b => b.status === 'open').length}</div>
            <div className="text-sm text-[var(--text-muted)]">Open Bounties</div>
          </div>
          <div className="card p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-2xl mx-auto mb-3">
              ✅
            </div>
            <div className="text-3xl font-bold text-[var(--text-primary)]">{bounties.filter(b => b.status === 'completed').length}</div>
            <div className="text-sm text-[var(--text-muted)]">Completed</div>
          </div>
          <div className="card p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-2xl mx-auto mb-3">
              💰
            </div>
            <div className="text-3xl font-bold text-[var(--text-primary)]">${bounties.reduce((sum, b) => sum + parseFloat(b.reward || '0'), 0).toFixed(0)}</div>
            <div className="text-sm text-[var(--text-muted)]">Total USDC</div>
          </div>
        </div>

        {/* Bounty List */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Available Bounties</h2>
            <span className="text-sm text-[var(--text-muted)]">{bounties.length} total</span>
          </div>

          {loading ? (
            <div className="card p-12 text-center">
              <div className="w-8 h-8 border-2 border-[var(--accent-purple)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[var(--text-muted)]">Loading bounties...</p>
            </div>
          ) : bounties.length === 0 ? (
            <div className="card p-12 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-3xl mx-auto mb-4">
                🎯
              </div>
              <h3 className="text-lg font-semibold mb-2">No bounties yet</h3>
              <p className="text-[var(--text-muted)]">Be the first to post one!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bounties.map((bounty, i) => (
                <div key={bounty.id} className="card p-6 animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold">{bounty.title}</h3>
                        <span className={`badge ${bounty.status === 'open' ? 'badge-open' : bounty.status === 'completed' ? 'badge-completed' : 'badge-claimed'}`}>
                          {bounty.status.charAt(0).toUpperCase() + bounty.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--text-muted)]">by {bounty.creator.slice(0, 6)}...{bounty.creator.slice(-4)}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[var(--accent-purple)]">${bounty.reward}</div>
                      <div className="text-xs text-[var(--text-muted)]">USDC</div>
                    </div>
                  </div>
                  
                  <p className="text-[var(--text-secondary)] mb-4">{bounty.description}</p>
                  
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span>📋</span>
                      <span className="text-xs font-medium text-[var(--text-muted)] uppercase">Requirements (AI-verified)</span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">{bounty.requirements}</p>
                  </div>

                  {bounty.verificationResult && (
                    <div className={`rounded-xl p-4 mb-4 ${bounty.verificationResult.approved ? 'bg-green-50' : 'bg-red-50'}`}>
                      <p className={`text-sm font-medium ${bounty.verificationResult.approved ? 'text-green-600' : 'text-red-600'}`}>
                        {bounty.verificationResult.approved ? '✓ Approved' : '✗ Not Approved'}
                      </p>
                      <p className="text-sm text-[var(--text-secondary)] mt-1">{bounty.verificationResult.feedback}</p>
                    </div>
                  )}

                  {bounty.status === 'open' && bounty.creator !== userAddress && (
                    <button onClick={() => claimBounty(bounty.id)} className="btn-primary">
                      ⚡ Claim Bounty
                    </button>
                  )}

                  {bounty.status === 'claimed' && bounty.claimedBy === userAddress && (
                    submitting === bounty.id ? (
                      <div className="space-y-3">
                        <textarea
                          placeholder="Paste your work submission..."
                          value={submission}
                          onChange={(e) => setSubmission(e.target.value)}
                          className="h-28"
                        />
                        <div className="flex gap-3">
                          <button onClick={() => submitWork(bounty.id)} disabled={verifying} className="btn-primary">
                            {verifying ? '🤖 Verifying...' : '🚀 Submit'}
                          </button>
                          <button onClick={() => { setSubmitting(null); setSubmission(''); }} className="btn-secondary">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setSubmitting(bounty.id)} className="btn-primary">
                        📝 Submit Work
                      </button>
                    )
                  )}

                  {bounty.status === 'completed' && (
                    <div className="flex items-center gap-2 text-green-600 font-medium">
                      <span>✅</span> Completed - Payment sent!
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[var(--border-color)] bg-white/50">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎯</span>
              <span className="font-medium">Bounty Hunter</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-[var(--text-muted)]">
              <span>Built on Arc</span>
              <span>•</span>
              <span>Powered by Circle</span>
              <span>•</span>
              <span>AI Verified</span>
            </div>
          </div>
          <div className="text-center text-xs text-[var(--text-muted)] mt-6">
            Built for Agora Hackathon 2026
          </div>
        </div>
      </footer>

      {/* Connect Modal */}
      {showConnect && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card p-8 w-full max-w-md animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-2xl mb-6 mx-auto">
              👛
            </div>
            <h2 className="text-2xl font-semibold text-center mb-2">Connect Wallet</h2>
            <p className="text-[var(--text-muted)] text-center mb-6">Enter your Arc wallet address</p>
            
            <input
              placeholder="0x..."
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              className="font-mono mb-4"
            />
            
            <div className="bg-blue-50 rounded-xl p-3 mb-6">
              <p className="text-xs text-[var(--text-secondary)]">
                💡 Get testnet USDC at <a href="https://faucet.circle.com" target="_blank" className="text-[var(--accent-blue)] hover:underline">faucet.circle.com</a>
              </p>
            </div>
            
            <div className="flex gap-3">
              <button onClick={connectWallet} disabled={connecting} className="btn-primary flex-1">
                {connecting ? 'Connecting...' : 'Connect'}
              </button>
              <button onClick={() => setShowConnect(false)} className="btn-secondary flex-1">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card p-8 w-full max-w-lg animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-2xl mb-6 mx-auto">
              🎯
            </div>
            <h2 className="text-2xl font-semibold text-center mb-2">Post a Bounty</h2>
            <p className="text-[var(--text-muted)] text-center mb-6">Create a task with AI verification</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Title</label>
                <input placeholder="e.g., Design a logo" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Description</label>
                <textarea placeholder="What do you need done?" value={description} onChange={(e) => setDescription(e.target.value)} className="h-24" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Requirements <span className="text-[var(--accent-purple)]">(AI will verify)</span></label>
                <textarea placeholder="List specific requirements..." value={requirements} onChange={(e) => setRequirements(e.target.value)} className="h-24" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Reward (USDC)</label>
                <input type="number" placeholder="10" value={reward} onChange={(e) => setReward(e.target.value)} />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button onClick={createBounty} className="btn-primary flex-1">
                🚀 Post Bounty
              </button>
              <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
