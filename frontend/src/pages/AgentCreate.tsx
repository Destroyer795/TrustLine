import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, CheckCircle, Key } from 'lucide-react';
import { api } from '../services/api';
import { Principal } from '../types';

export const AgentCreate: React.FC = () => {
  const navigate = useNavigate();
  const [principals, setPrincipals] = useState<Principal[]>([]);
  const [selectedPrincipal, setSelectedPrincipal] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [authorizedCeiling, setAuthorizedCeiling] = useState('15000');
  const [coldStartFloor, setColdStartFloor] = useState('2000');
  const [maxPerTx, setMaxPerTx] = useState('5000');
  const [maxPerDay, setMaxPerDay] = useState('20000');

  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getPrincipals().then((data) => {
      setPrincipals(data);
      if (data.length > 0) setSelectedPrincipal(data[0].id);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName) {
      setError('Please provide an agent display name.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await api.createAgent({
        principal_id: selectedPrincipal,
        display_name: displayName,
        purpose: purpose,
        authorized_ceiling: parseFloat(authorizedCeiling),
        cold_start_floor: parseFloat(coldStartFloor),
        max_per_transaction: parseFloat(maxPerTx),
        max_per_day: parseFloat(maxPerDay),
        allowed_categories: ['CLOUD_SERVICES', 'API_SERVICES', 'HOSTING'],
        denied_categories: ['P2P_TRANSFER', 'CRYPTO_EXCHANGE']
      });

      setCreatedKey(res.raw_api_key || 'tl_agent_demo_key');
    } catch (err: any) {
      setError(err.message || 'Failed to create agent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold text-ink">Register Autonomous Agent</h1>
        <p className="text-sm text-muted-ink mt-1">Bind agent capability manifest & sign Ed25519 mandate under principal authority.</p>
      </div>

      {createdKey ? (
        <div className="card-editorial p-8 rounded-lg space-y-6 border-teal border-2">
          <div className="flex items-center space-x-3 text-teal">
            <CheckCircle className="w-8 h-8" />
            <div>
              <h2 className="text-xl font-serif font-bold text-ink">Agent Registered Successfully!</h2>
              <p className="text-xs font-mono text-muted-ink">MANDATE & CAPABILITY MANIFEST SIGNED</p>
            </div>
          </div>

          <div className="p-4 bg-canvas border border-border rounded space-y-2">
            <span className="text-xs font-mono font-semibold text-muted-ink block uppercase">Scoped Agent API Credential (Save Now)</span>
            <div className="flex items-center space-x-2 font-mono text-sm bg-surface p-2 rounded border border-border text-ink select-all">
              <Key className="w-4 h-4 text-warning" />
              <span>{createdKey}</span>
            </div>
            <p className="text-[11px] text-muted-ink leading-normal">
              This raw key is displayed ONCE. TrustLine backend stores only the SHA-256 hash.
            </p>
          </div>

          <button
            onClick={() => navigate('/agents')}
            className="w-full py-2.5 bg-teal text-surface font-medium rounded hover:bg-teal-dark transition-colors"
          >
            Go to Agents Inventory
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card-editorial p-8 rounded-lg space-y-6">
          {error && (
            <div className="p-3 bg-danger-light border border-danger/20 text-danger text-sm font-medium rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-serif font-bold text-lg text-ink border-b border-border pb-2">1. Principal & Identity Binding</h3>
            
            <div>
              <label className="block text-xs font-mono text-muted-ink uppercase mb-1">Select Principal Account</label>
              <select
                value={selectedPrincipal}
                onChange={(e) => setSelectedPrincipal(e.target.value)}
                className="w-full p-2.5 bg-canvas border border-border rounded text-sm text-ink font-medium focus:outline-none focus:border-teal"
              >
                {principals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-muted-ink uppercase mb-1">Agent Display Name</label>
              <input
                type="text"
                placeholder="e.g. ProcurementBot-001"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full p-2.5 bg-canvas border border-border rounded text-sm text-ink focus:outline-none focus:border-teal"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-muted-ink uppercase mb-1">Agent Task Purpose</label>
              <textarea
                rows={2}
                placeholder="Describe what tasks this agent is authorized to execute..."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full p-2.5 bg-canvas border border-border rounded text-sm text-ink focus:outline-none focus:border-teal"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-serif font-bold text-lg text-ink border-b border-border pb-2">2. Capability Manifest & Credit Controls</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-muted-ink uppercase mb-1">Authorized Ceiling (₹)</label>
                <input
                  type="number"
                  value={authorizedCeiling}
                  onChange={(e) => setAuthorizedCeiling(e.target.value)}
                  className="w-full p-2.5 bg-canvas border border-border rounded text-sm text-ink font-mono focus:outline-none focus:border-teal"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-muted-ink uppercase mb-1">Cold-Start Floor (₹)</label>
                <input
                  type="number"
                  value={coldStartFloor}
                  onChange={(e) => setColdStartFloor(e.target.value)}
                  className="w-full p-2.5 bg-canvas border border-border rounded text-sm text-ink font-mono focus:outline-none focus:border-teal"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-muted-ink uppercase mb-1">Max Per Transaction (₹)</label>
                <input
                  type="number"
                  value={maxPerTx}
                  onChange={(e) => setMaxPerTx(e.target.value)}
                  className="w-full p-2.5 bg-canvas border border-border rounded text-sm text-ink font-mono focus:outline-none focus:border-teal"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-muted-ink uppercase mb-1">Max 24h Daily Limit (₹)</label>
                <input
                  type="number"
                  value={maxPerDay}
                  onChange={(e) => setMaxPerDay(e.target.value)}
                  className="w-full p-2.5 bg-canvas border border-border rounded text-sm text-ink font-mono focus:outline-none focus:border-teal"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-teal text-surface font-medium rounded hover:bg-teal-dark transition-colors flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>{loading ? 'Signing Mandate...' : 'Sign Ed25519 Mandate & Register'}</span>
          </button>
        </form>
      )}
    </div>
  );
};
