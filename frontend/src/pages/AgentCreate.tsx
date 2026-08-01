import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, CheckCircle, Key, ChevronDown, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { Principal } from '../types';
import { Sunburst } from '../components/Geometrics';

const inputCls =
  'w-full rounded-[2px] border border-border bg-canvas px-3 py-2.5 text-sm text-ink placeholder:text-muted-ink/60 transition-colors focus:border-teal-dark';

const labelCls = 'block font-mono text-[11px] uppercase tracking-widest text-muted-ink mb-1.5';

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
    <div className="max-w-5xl mx-auto">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-10">
        {/* Editorial intro column */}
        <aside className="relative">
          <p className="flex items-center gap-3">
            <span aria-hidden="true" className="h-px w-8 bg-accent" />
            <span className="kicker text-muted-ink">Registration</span>
          </p>
          <h1 className="mt-3 font-display text-3xl md:text-4xl font-semibold tracking-tight leading-tight text-ink">
            Register Autonomous Agent
          </h1>
          <p className="mt-3 text-sm text-muted-ink leading-relaxed">
            Bind an agent capability manifest &amp; sign an Ed25519 mandate under principal authority.
          </p>

          <ul className="mt-8 space-y-4 border-l border-border pl-5">
            {[
              'An Ed25519 keypair is generated and the capability mandate is signed at registration.',
              'Credit begins at the cold-start floor and grows as verified evidence accrues.',
              'A scoped API key is shown once — copy it now; the backend stores only its SHA-256 hash.',
            ].map((note, i) => (
              <li key={note} className="flex items-start gap-3 text-xs text-muted-ink leading-relaxed">
                <span aria-hidden="true" className="mt-0.5 font-mono text-[10px] font-semibold text-accent">{String(i + 1).padStart(2, '0')}</span>
                {note}
              </li>
            ))}
          </ul>

          <Sunburst className="pointer-events-none absolute -bottom-4 -right-2 h-28 w-28 text-teal/15" />
        </aside>

        {/* Form / success panel */}
        {createdKey ? (
          <div className="card-editorial rounded-sm p-8 space-y-6 border-teal/40">
            <div className="flex items-center gap-3 text-teal">
              <CheckCircle className="h-8 w-8 shrink-0" aria-hidden="true" />
              <div>
                <h2 className="font-display text-xl font-semibold text-ink">Agent Registered Successfully</h2>
                <p className="mt-0.5 font-mono text-[11px] uppercase tracking-widest text-muted-ink">Mandate &amp; capability manifest signed</p>
              </div>
            </div>

            <div className="rounded-[2px] border border-border bg-canvas p-4">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted-ink">
                Scoped Agent API Credential — save now
              </p>
              <div className="mt-3 flex items-center gap-2.5 select-all rounded-[2px] border border-border bg-surface p-3 font-mono text-sm text-ink">
                <Key className="h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
                <span className="break-all">{createdKey}</span>
              </div>
              <p className="mt-3 text-[11px] text-muted-ink leading-normal">
                This raw key is displayed once. TrustLine stores only its SHA-256 hash — it cannot be recovered later.
              </p>
            </div>

            <button
              onClick={() => navigate('/agents')}
              className="inline-flex items-center gap-2 rounded-[2px] bg-teal px-5 py-2.5 text-sm font-medium text-surface transition-colors hover:bg-teal-dark active:translate-y-px shadow-card"
            >
              Go to Agents Inventory
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card-editorial rounded-sm p-6 md:p-8 space-y-8">
            {error && (
              <div role="alert" className="rounded-[2px] border border-danger/30 bg-danger-light p-3 text-sm font-medium text-danger">
                {error}
              </div>
            )}

            <fieldset className="space-y-4">
              <legend className="sr-only">Principal and identity binding</legend>
              <div className="flex items-baseline gap-3 pb-2 border-b border-border">
                <span aria-hidden="true" className="font-mono text-xs font-semibold text-accent">01</span>
                <h2 className="font-display text-lg font-semibold text-ink">Principal &amp; Identity Binding</h2>
              </div>

              <div>
                <label htmlFor="principal" className={labelCls}>Select Principal Account</label>
                <div className="relative">
                  <select
                    id="principal"
                    value={selectedPrincipal}
                    onChange={(e) => setSelectedPrincipal(e.target.value)}
                    className={`${inputCls} appearance-none pr-9`}
                  >
                    {principals.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.email})
                      </option>
                    ))}
                  </select>
                  <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-ink" />
                </div>
              </div>

              <div>
                <label htmlFor="displayName" className={labelCls}>Agent Display Name</label>
                <input
                  id="displayName"
                  type="text"
                  placeholder="e.g. ProcurementBot-001"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label htmlFor="purpose" className={labelCls}>Agent Task Purpose</label>
                <textarea
                  id="purpose"
                  rows={2}
                  placeholder="Describe what tasks this agent is authorized to execute..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className={inputCls}
                />
              </div>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="sr-only">Capability manifest and credit controls</legend>
              <div className="flex items-baseline gap-3 pb-2 border-b border-border">
                <span aria-hidden="true" className="font-mono text-xs font-semibold text-accent">02</span>
                <h2 className="font-display text-lg font-semibold text-ink">Capability Manifest &amp; Credit Controls</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="authorizedCeiling" className={labelCls}>Authorized Ceiling (₹)</label>
                  <div className="relative">
                    <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-ink">₹</span>
                    <input
                      id="authorizedCeiling"
                      type="number"
                      value={authorizedCeiling}
                      onChange={(e) => setAuthorizedCeiling(e.target.value)}
                      className={`${inputCls} pl-7 font-mono`}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="coldStartFloor" className={labelCls}>Cold-Start Floor (₹)</label>
                  <div className="relative">
                    <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-ink">₹</span>
                    <input
                      id="coldStartFloor"
                      type="number"
                      value={coldStartFloor}
                      onChange={(e) => setColdStartFloor(e.target.value)}
                      className={`${inputCls} pl-7 font-mono`}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="maxPerTx" className={labelCls}>Max Per Transaction (₹)</label>
                  <div className="relative">
                    <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-ink">₹</span>
                    <input
                      id="maxPerTx"
                      type="number"
                      value={maxPerTx}
                      onChange={(e) => setMaxPerTx(e.target.value)}
                      className={`${inputCls} pl-7 font-mono`}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="maxPerDay" className={labelCls}>Max 24h Daily Limit (₹)</label>
                  <div className="relative">
                    <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-ink">₹</span>
                    <input
                      id="maxPerDay"
                      type="number"
                      value={maxPerDay}
                      onChange={(e) => setMaxPerDay(e.target.value)}
                      className={`${inputCls} pl-7 font-mono`}
                    />
                  </div>
                </div>
              </div>
            </fieldset>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-[2px] bg-teal px-5 py-3 text-sm font-medium text-surface transition-colors hover:bg-teal-dark active:translate-y-px shadow-card disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              {loading ? 'Signing Mandate…' : 'Sign Ed25519 Mandate & Register'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
