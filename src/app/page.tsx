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
    <main className="min-h-screen min-h-[100dvh] bg-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--blue)] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v12M6 12h12"/>
              </svg>
            </div>
            <span className="font-semibold text-base sm:text-lg">Bounty Hunter</span>
          </div>
          
          {userAddress ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-gray)] rounded-full">
                <div className="w-2 h-2 rounded-full bg-[var(--green)]"></div>
                <span className="text-xs font-mono text-[var(--text-muted)]">
                  {userAddress.slice(0, 4)}...{userAddress.slice(-4)}
                </span>
              </div>
              <button onClick={disconnect} className="text-xs text-[var(--text-muted)] hover:text-[var(--blue)] transition-all">
                Disconnect
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowConnect(true)} 
              className="text-[var(--blue)] font-medium text-sm border border-[var(--blue)] px-3 py-1.5 rounded-lg hover:bg-[var(--blue-light)] transition-all"
            >
              Connect
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10">
        {/* Hero */}
        <div className="mb-6 sm:mb-8 animate-in">
          <h1 className="mb-2">Bounty Board</h1>
          <p>Complete tasks, get AI-verified, earn USDC.</p>
        </div>

        {/* Post Button */}
        {userAddress && (
          <button 
            onClick={() => setShowCreate(true)} 
            className="btn-blue mb-6 sm:mb-8 animate-in stagger-1"
            style={{ width: 'auto' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Post a Bounty
          </button>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {[
            { value: bounties.filter(b => b.status === 'open').length, label: 'Open', delay: 'stagger-1' },
            { value: bounties.filter(b => b.status === 'completed').length, label: 'Done', delay: 'stagger-2' },
            { value: `$${bounties.reduce((sum, b) => sum + parseFloat(b.reward || '0'), 0)}`, label: 'USDC', delay: 'stagger-3' },
          ].map((stat, i) => (
            <div key={i} className={`card text-center animate-in ${stat.delay}`}>
              <div className="text-2xl sm:text-3xl font-bold mb-0.5">{stat.value}</div>
              <div className="text-xs sm:text-sm text-[var(--text-muted)]">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="divider"></div>

        {/* Bounty List */}
        <h2 className="mb-4 sm:mb-6 animate-in">Available Bounties</h2>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="card">
                <div className="skeleton h-5 w-2/3 mb-3"></div>
                <div className="skeleton h-4 w-1/3 mb-4"></div>
                <div className="skeleton h-16 w-full"></div>
              </div>
            ))}
          </div>
        ) : bounties.length === 0 ? (
          <div className="card text-center py-10 sm:py-16 animate-in">
            <div className="text-4xl sm:text-5xl mb-4">📋</div>
            <h3 className="mb-2">No bounties yet</h3>
            <p className="text-sm">Be the first to post one!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bounties.map((bounty, i) => (
              <div 
                key={bounty.id} 
                className="card card-interactive animate-in"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                {/* Header */}
                <div className="flex justify-between items-start gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="truncate">{bounty.title}</h3>
                      <span className={`badge ${bounty.status === 'open' ? 'badge-open' : bounty.status === 'completed' ? 'badge-completed' : 'badge-claimed'}`}>
                        {bounty.status.charAt(0).toUpperCase() + bounty.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] font-mono">
                      {bounty.creator.slice(0, 6)}...{bounty.creator.slice(-4)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xl sm:text-2xl font-bold text-[var(--blue)]">${bounty.reward}</div>
                    <div className="text-[10px] sm:text-xs text-[var(--text-muted)]">USDC</div>
                  </div>
                </div>

                {/* Description */}
                <p className="mb-3 text-sm">{bounty.description}</p>

                {/* Requirements */}
                <div className="bg-[var(--bg-gray)] rounded-xl p-3 sm:p-4 mb-4">
                  <div className="text-[10px] sm:text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                    Requirements (AI-verified)
                  </div>
                  <p className="text-xs sm:text-sm">{bounty.requirements}</p>
                </div>

                {/* Verification Result */}
                {bounty.verificationResult && (
                  <div className={`rounded-xl p-3 sm:p-4 mb-4 ${bounty.verificationResult.approved ? 'bg-[var(--green-bg)]' : 'bg-red-50'}`}>
                    <div className={`text-sm font-medium flex items-center gap-1.5 ${bounty.verificationResult.approved ? 'text-[var(--green)]' : 'text-red-600'}`}>
                      {bounty.verificationResult.approved ? (
                        <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg> Approved</>
                      ) : (
                        <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg> Not Approved</>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm mt-1.5">{bounty.verificationResult.feedback}</p>
                  </div>
                )}

                {/* Actions */}
                {bounty.status === 'open' && bounty.creator !== userAddress && (
                  <button onClick={() => claimBounty(bounty.id)} className="btn-blue btn-sm" style={{ width: 'auto' }}>
                    ⚡ Claim Bounty
                  </button>
                )}

                {bounty.status === 'claimed' && bounty.claimedBy === userAddress && (
                  submitting === bounty.id ? (
                    <div className="space-y-3 animate-in">
                      <div>
                        <label className="input-label">Your Submission</label>
                        <textarea
                          placeholder="Paste your work here..."
                          value={submission}
                          onChange={(e) => setSubmission(e.target.value)}
                          className="input-field"
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => submitWork(bounty.id)} disabled={verifying} className="btn-blue btn-sm flex-1">
                          {verifying ? (
                            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Verifying...</>
                          ) : 'Submit'}
                        </button>
                        <button onClick={() => { setSubmitting(null); setSubmission(''); }} className="btn-outline btn-sm flex-1">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setSubmitting(bounty.id)} className="btn-blue btn-sm" style={{ width: 'auto' }}>
                      📝 Submit Work
                    </button>
                  )
                )}

                {bounty.status === 'completed' && (
                  <div className="flex items-center gap-1.5 text-[var(--green)] font-medium text-sm">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    Completed - Payment sent
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--bg-gray)] safe-bottom">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-xs sm:text-sm text-[var(--text-muted)]">
            <div>Built on Arc • Powered by Circle</div>
            <div className="flex gap-4">
              <a href="https://faucet.circle.com" target="_blank">Get USDC</a>
              <a href="https://arc.network" target="_blank">Docs</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Connect Modal */}
      {showConnect && (
        <div className="modal-overlay" onClick={() => setShowConnect(false)}>
          <div className="modal-content p-6 sm:p-8" onClick={e => e.stopPropagation()}>
            {/* Handle bar for mobile */}
            <div className="sm:hidden w-10 h-1 bg-[var(--border)] rounded-full mx-auto mb-6"></div>
            
            <h2 className="mb-2">Connect Wallet</h2>
            <p className="mb-6 text-sm">Enter your Arc wallet address to get started.</p>
            
            <div className="mb-4">
              <label className="input-label">Wallet Address</label>
              <input
                type="text"
                placeholder="0x..."
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                className="input-field font-mono"
                autoFocus
              />
            </div>
            
            <div className="bg-[var(--blue-light)] rounded-xl p-3 mb-6">
              <p className="text-xs text-[var(--text-secondary)]">
                💡 Get testnet USDC at <a href="https://faucet.circle.com" target="_blank" className="font-medium">faucet.circle.com</a>
              </p>
            </div>
            
            <div className="flex gap-3">
              <button onClick={connectWallet} disabled={connecting} className="btn-blue flex-1">
                {connecting ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Connecting...</>
                ) : 'Connect'}
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
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content p-6 sm:p-8" onClick={e => e.stopPropagation()}>
            {/* Handle bar for mobile */}
            <div className="sm:hidden w-10 h-1 bg-[var(--border)] rounded-full mx-auto mb-6"></div>
            
            <h2 className="mb-2">Post a Bounty</h2>
            <p className="mb-6 text-sm">Create a task with AI verification.</p>
            
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
                  rows={2}
                />
              </div>
              
              <div>
                <label className="input-label">Requirements <span className="text-[var(--text-muted)] font-normal">(AI verifies these)</span></label>
                <textarea
                  placeholder="List specific requirements..."
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  className="input-field"
                  rows={2}
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
