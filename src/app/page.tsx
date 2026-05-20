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
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-[var(--border)]">
        <div className="max-w-3xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="16" fill="#0052FF"/>
              <path d="M16 8L20 16L16 24L12 16L16 8Z" fill="white"/>
            </svg>
            <span className="font-semibold text-lg">Bounty Hunter</span>
          </div>
          
          {userAddress ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-[var(--text-muted)] font-mono">
                {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
              </span>
              <button onClick={disconnect} className="text-sm text-[var(--blue)]">
                Disconnect
              </button>
            </div>
          ) : (
            <button onClick={() => setShowConnect(true)} className="text-[var(--blue)] font-medium text-sm border border-[var(--blue)] px-4 py-2 rounded-lg hover:bg-[var(--blue-light)]">
              Connect Wallet
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="mb-8">
          <h1 className="mb-2">Bounty Board</h1>
          <p>Complete tasks, get verified by AI, and receive USDC payments.</p>
        </div>

        {/* Action */}
        {userAddress && (
          <button onClick={() => setShowCreate(true)} className="btn-blue mb-8" style={{ width: 'auto', padding: '12px 24px' }}>
            + Post a Bounty
          </button>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card text-center">
            <div className="text-3xl font-bold mb-1">{bounties.filter(b => b.status === 'open').length}</div>
            <div className="text-sm text-[var(--text-muted)]">Open</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold mb-1">{bounties.filter(b => b.status === 'completed').length}</div>
            <div className="text-sm text-[var(--text-muted)]">Completed</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold mb-1">${bounties.reduce((sum, b) => sum + parseFloat(b.reward || '0'), 0)}</div>
            <div className="text-sm text-[var(--text-muted)]">Total USDC</div>
          </div>
        </div>

        <div className="divider"></div>

        {/* Bounty List */}
        <h2 className="mb-6">Available Bounties</h2>

        {loading ? (
          <div className="text-center py-12 text-[var(--text-muted)]">
            Loading...
          </div>
        ) : bounties.length === 0 ? (
          <div className="card text-center py-12 animate-in">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="mb-2">No bounties yet</h3>
            <p className="text-sm">Be the first to post one!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bounties.map((bounty) => (
              <div key={bounty.id} className="card animate-in">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3>{bounty.title}</h3>
                      <span className={`badge ${bounty.status === 'open' ? 'badge-open' : bounty.status === 'completed' ? 'badge-completed' : 'badge-claimed'}`}>
                        {bounty.status.charAt(0).toUpperCase() + bounty.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-muted)]">
                      by {bounty.creator.slice(0, 6)}...{bounty.creator.slice(-4)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[var(--blue)]">${bounty.reward}</div>
                    <div className="text-xs text-[var(--text-muted)]">USDC</div>
                  </div>
                </div>

                {/* Description */}
                <p className="mb-4">{bounty.description}</p>

                {/* Requirements */}
                <div className="bg-[var(--bg-gray)] rounded-lg p-4 mb-4">
                  <div className="text-xs font-medium text-[var(--text-muted)] uppercase mb-2">Requirements (AI-verified)</div>
                  <p className="text-sm">{bounty.requirements}</p>
                </div>

                {/* Verification Result */}
                {bounty.verificationResult && (
                  <div className={`rounded-lg p-4 mb-4 ${bounty.verificationResult.approved ? 'bg-[#E6F7ED]' : 'bg-[#FFEBEE]'}`}>
                    <div className={`text-sm font-medium ${bounty.verificationResult.approved ? 'text-[#1B873F]' : 'text-[#D32F2F]'}`}>
                      {bounty.verificationResult.approved ? '✓ Approved' : '✗ Not Approved'}
                    </div>
                    <p className="text-sm mt-1">{bounty.verificationResult.feedback}</p>
                  </div>
                )}

                {/* Actions */}
                {bounty.status === 'open' && bounty.creator !== userAddress && (
                  <button onClick={() => claimBounty(bounty.id)} className="btn-blue" style={{ width: 'auto' }}>
                    Claim Bounty
                  </button>
                )}

                {bounty.status === 'claimed' && bounty.claimedBy === userAddress && (
                  submitting === bounty.id ? (
                    <div className="space-y-4">
                      <div>
                        <label className="input-label">Your Submission</label>
                        <textarea
                          placeholder="Paste your work here..."
                          value={submission}
                          onChange={(e) => setSubmission(e.target.value)}
                          className="input-field"
                          rows={4}
                        />
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => submitWork(bounty.id)} disabled={verifying} className="btn-blue" style={{ width: 'auto' }}>
                          {verifying ? 'Verifying...' : 'Submit for Review'}
                        </button>
                        <button onClick={() => { setSubmitting(null); setSubmission(''); }} className="btn-outline" style={{ width: 'auto' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setSubmitting(bounty.id)} className="btn-blue" style={{ width: 'auto' }}>
                      Submit Work
                    </button>
                  )
                )}

                {bounty.status === 'completed' && (
                  <div className="text-[#1B873F] font-medium">
                    ✓ Completed - Payment sent
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] mt-12">
        <div className="max-w-3xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[var(--text-muted)]">
          <div>Built on Arc • Powered by Circle • AI Verified</div>
          <div className="flex gap-4">
            <a href="https://faucet.circle.com" target="_blank">Get Testnet USDC</a>
            <a href="https://arc.network" target="_blank">Arc Docs</a>
          </div>
        </div>
      </footer>

      {/* Connect Modal */}
      {showConnect && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 w-full max-w-md animate-in">
            <h2 className="mb-2">Connect Wallet</h2>
            <p className="mb-6">Enter your Arc wallet address to get started.</p>
            
            <div className="mb-4">
              <label className="input-label">Wallet Address</label>
              <input
                type="text"
                placeholder="0x..."
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                className="input-field font-mono"
              />
            </div>
            
            <p className="text-xs text-[var(--text-muted)] mb-6">
              Get testnet USDC at <a href="https://faucet.circle.com" target="_blank">faucet.circle.com</a>
            </p>
            
            <div className="flex gap-3">
              <button onClick={connectWallet} disabled={connecting} className="btn-blue flex-1">
                {connecting ? 'Connecting...' : 'Connect'}
              </button>
              <button onClick={() => setShowConnect(false)} className="btn-outline flex-1">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 w-full max-w-lg animate-in max-h-[90vh] overflow-y-auto">
            <h2 className="mb-2">Post a Bounty</h2>
            <p className="mb-6">Create a task with AI verification.</p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="input-label">Title</label>
                <input
                  type="text"
                  placeholder="e.g., Design a logo"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="input-label">Description</label>
                <textarea
                  placeholder="What do you need done?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="input-label">Requirements (AI will verify against these)</label>
                <textarea
                  placeholder="List specific requirements..."
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  className="input-field"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="input-label">Reward (USDC)</label>
                <input
                  type="number"
                  placeholder="10"
                  value={reward}
                  onChange={(e) => setReward(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button onClick={createBounty} className="btn-blue flex-1">
                Post Bounty
              </button>
              <button onClick={() => setShowCreate(false)} className="btn-outline flex-1">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
