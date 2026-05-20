'use client';

import { useState, useEffect } from 'react';
import { Bounty } from '@/lib/types';

const CATEGORIES = ['All', 'Design', 'Writing', 'Development', 'Marketing', 'Research'];

const AVATAR_COLORS = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#c77dff', '#f77f00'];

function getAvatarColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function Home() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('reward');

  const [showCreate, setShowCreate] = useState(false);
  const [showConnect, setShowConnect] = useState(false);
  const [showBounty, setShowBounty] = useState<Bounty | null>(null);

  const [userAddress, setUserAddress] = useState('');
  const [walletId, setWalletId] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [connecting, setConnecting] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [reward, setReward] = useState('');
  const [category, setCategory] = useState('Development');

  const [submission, setSubmission] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetchBounties();
    const saved = localStorage.getItem('bountyHunterWallet');
    if (saved) {
      const data = JSON.parse(saved);
      setUserAddress(data.address);
      setWalletId(data.walletId);
    }
  }, []);

  const fetchBounties = async () => {
    try {
      const res = await fetch('/api/bounties');
      const data = await res.json();
      setBounties(data.bounties || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async () => {
    if (!addressInput.trim() || !addressInput.startsWith('0x')) {
      alert('Enter a valid wallet address (0x...)');
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
    } catch (e) {
      console.error(e);
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
        body: JSON.stringify({
          title, description, requirements, reward, category,
          creator: userAddress, creatorWalletId: walletId,
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setTitle(''); setDescription(''); setRequirements(''); setReward('');
        fetchBounties();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const claimBounty = async (bountyId: string) => {
    if (!userAddress) { setShowConnect(true); return; }
    try {
      await fetch(`/api/bounties/${bountyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'claim', address: userAddress }),
      });
      fetchBounties();
      setShowBounty(null);
    } catch (e) {
      console.error(e);
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
      setSubmission('');
      fetchBounties();
      setShowBounty(null);
    } catch (e) {
      console.error(e);
    } finally {
      setVerifying(false);
    }
  };

  const filtered = bounties
    .filter(b =>
      (activeCategory === 'All' || b.category === activeCategory) &&
      (b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.description?.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'reward') return parseFloat(b.reward) - parseFloat(a.reward);
      if (sortBy === 'newest') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      return 0;
    });

  const totalRewards = bounties.reduce((sum, b) => sum + parseFloat(b.reward || '0'), 0);

  return (
    <main>
      <div className="noise" />

      {/* Header */}
      <header className="header">
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="logo-icon">◈</div>
            <span style={{ fontSize: 18, fontWeight: 700 }}>Bounty<span style={{ fontWeight: 400 }}>Hub</span></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {userAddress ? (
              <>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                </span>
                <button onClick={disconnect} className="btn-outline" style={{ padding: '8px 16px' }}>
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

      {/* Hero */}
      <section className="hero">
        <div className="hero-accent hero-accent-1" />
        <div className="hero-accent hero-accent-2" />

        <div className="hero-eyebrow">
          💰 ${totalRewards.toLocaleString()} in active bounties
        </div>

        <h1 className="hero-title">
          Hunt Bounties.<br />
          <span className="hero-highlight">Get Paid.</span>
        </h1>

        <p className="hero-sub">
          Complete tasks, get verified by AI, and receive instant USDC payments on Arc Network. No middlemen.
        </p>

        <div className="search-box">
          <input
            className="search-input"
            placeholder="Search bounties, skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="search-btn">Search</button>
        </div>

        <div className="stats">
          <div className="stat-item">
            <span className="stat-val">${totalRewards.toLocaleString()}</span>
            <span className="stat-label">Total Rewards</span>
          </div>
          <div className="stat-item">
            <span className="stat-val">{bounties.length}</span>
            <span className="stat-label">Active Bounties</span>
          </div>
          <div className="stat-item">
            <span className="stat-val">{bounties.filter(b => b.status === 'completed').length}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="categories">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`cat-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {userAddress && (
            <button onClick={() => setShowCreate(true)} className="btn-primary" style={{ padding: '10px 18px' }}>
              + Post Bounty
            </button>
          )}
          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="reward">Highest Reward</option>
            <option value="newest">Newest First</option>
          </select>
        </div>
      </div>

      {/* Bounty Grid */}
      {loading ? (
        <div className="loading">
          <div className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🎯</div>
          <h3>No bounties found</h3>
          <p>Be the first to post one!</p>
        </div>
      ) : (
        <div className="bounty-grid">
          {filtered.map((bounty) => (
            <div
              key={bounty.id}
              className="bounty-card"
              onClick={() => setShowBounty(bounty)}
            >
              <div className="card-header">
                <div className="poster">
                  <div
                    className="poster-avatar"
                    style={{ background: getAvatarColor(bounty.creator) }}
                  >
                    {bounty.creator.slice(2, 4).toUpperCase()}
                  </div>
                  <span className="poster-name">
                    {bounty.creator.slice(0, 6)}...{bounty.creator.slice(-4)}
                  </span>
                </div>
                <span className={`status-badge status-${bounty.status}`}>
                  {bounty.status}
                </span>
              </div>

              <h3 className="card-title">{bounty.title}</h3>

              <div className="tags">
                {bounty.category && <span className="tag">{bounty.category}</span>}
                <span className="tag">AI Verified</span>
              </div>

              <div className="card-footer">
                <div className="reward">
                  ${bounty.reward} <span>USDC</span>
                </div>
                <div className="meta">
                  Arc Network
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-links">
            <a href="https://faucet.circle.com" target="_blank">Get Testnet USDC</a>
            <a href="https://arc.network" target="_blank">Arc Docs</a>
          </div>
          <div className="footer-copy">
            Built for Agora Hackathon 2026 • Powered by Circle
          </div>
        </div>
      </footer>

      {/* Connect Modal */}
      {showConnect && (
        <div className="modal-overlay" onClick={() => setShowConnect(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <h2>Connect Wallet</h2>
            <p>Enter your Arc wallet address to start hunting bounties.</p>

            <div className="form-group">
              <label className="form-label">Wallet Address</label>
              <input
                type="text"
                className="form-input"
                placeholder="0x..."
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                style={{ fontFamily: 'monospace' }}
              />
            </div>

            <div style={{ background: 'rgba(99, 102, 241, 0.1)', borderRadius: 10, padding: 12, marginBottom: 8 }}>
              <p style={{ margin: 0, fontSize: 13 }}>
                💡 Get testnet USDC at <a href="https://faucet.circle.com" target="_blank" style={{ color: 'var(--primary)' }}>faucet.circle.com</a>
              </p>
            </div>

            <div className="modal-actions">
              <button onClick={connectWallet} disabled={connecting} className="btn-primary">
                {connecting ? 'Connecting...' : 'Connect'}
              </button>
              <button onClick={() => setShowConnect(false)} className="btn-outline">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <h2>Post a Bounty</h2>
            <p>Create a task with AI verification and USDC rewards.</p>

            <div className="form-group">
              <label className="form-label">Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Design a landing page"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.slice(1).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                placeholder="What do you need done?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Requirements (AI verifies these)</label>
              <textarea
                className="form-input"
                placeholder="List specific requirements..."
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                rows={2}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Reward (USDC)</label>
              <input
                type="number"
                className="form-input"
                placeholder="50"
                value={reward}
                onChange={(e) => setReward(e.target.value)}
              />
            </div>

            <div className="modal-actions">
              <button onClick={createBounty} className="btn-primary">
                Post Bounty
              </button>
              <button onClick={() => setShowCreate(false)} className="btn-outline">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bounty Detail Modal */}
      {showBounty && (
        <div className="modal-overlay" onClick={() => setShowBounty(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <span className={`status-badge status-${showBounty.status}`}>
                {showBounty.status}
              </span>
              <div className="reward" style={{ fontSize: 28 }}>
                ${showBounty.reward} <span>USDC</span>
              </div>
            </div>

            <h2 style={{ marginBottom: 16 }}>{showBounty.title}</h2>

            <div style={{ marginBottom: 16 }}>
              <div className="form-label" style={{ marginBottom: 4 }}>Posted by</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  className="poster-avatar"
                  style={{ background: getAvatarColor(showBounty.creator), width: 32, height: 32, fontSize: 12 }}
                >
                  {showBounty.creator.slice(2, 4).toUpperCase()}
                </div>
                <span style={{ fontFamily: 'monospace', fontSize: 14, color: 'var(--text-muted)' }}>
                  {showBounty.creator}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div className="form-label" style={{ marginBottom: 4 }}>Description</div>
              <p style={{ margin: 0 }}>{showBounty.description}</p>
            </div>

            <div style={{ background: 'var(--bg)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <div className="form-label" style={{ marginBottom: 8, color: 'var(--accent)' }}>
                📋 Requirements (AI-verified)
              </div>
              <p style={{ margin: 0, fontSize: 14 }}>{showBounty.requirements}</p>
            </div>

            {showBounty.verificationResult && (
              <div style={{
                background: showBounty.verificationResult.approved ? 'var(--green-bg)' : 'rgba(239, 68, 68, 0.15)',
                borderRadius: 12,
                padding: 16,
                marginBottom: 20
              }}>
                <div style={{
                  fontWeight: 600,
                  color: showBounty.verificationResult.approved ? 'var(--green)' : '#ef4444',
                  marginBottom: 4
                }}>
                  {showBounty.verificationResult.approved ? '✓ Approved' : '✗ Not Approved'}
                </div>
                <p style={{ margin: 0, fontSize: 14 }}>{showBounty.verificationResult.feedback}</p>
              </div>
            )}

            {showBounty.status === 'open' && showBounty.creator !== userAddress && (
              <button onClick={() => claimBounty(showBounty.id)} className="btn-primary" style={{ width: '100%' }}>
                ⚡ Claim This Bounty
              </button>
            )}

            {showBounty.status === 'claimed' && showBounty.claimedBy === userAddress && (
              <div>
                <div className="form-group">
                  <label className="form-label">Submit Your Work</label>
                  <textarea
                    className="form-input"
                    placeholder="Paste your submission here..."
                    value={submission}
                    onChange={(e) => setSubmission(e.target.value)}
                    rows={4}
                  />
                </div>
                <button
                  onClick={() => submitWork(showBounty.id)}
                  disabled={verifying}
                  className="btn-primary"
                  style={{ width: '100%' }}
                >
                  {verifying ? '🤖 AI Verifying...' : '🚀 Submit for Review'}
                </button>
              </div>
            )}

            {showBounty.status === 'completed' && (
              <div style={{ textAlign: 'center', padding: 20, background: 'var(--green-bg)', borderRadius: 12 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                <div style={{ fontWeight: 600, color: 'var(--green)' }}>Bounty Completed!</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Payment has been sent</div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
