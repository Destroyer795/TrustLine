import React, { useState, useEffect } from 'react';
import { Zap, ShieldAlert, RefreshCw, Lock, Scale, ChevronDown, Terminal } from 'lucide-react';
import { api } from '../services/api';
import { Agent } from '../types';
import { PageHeader } from '../components/PageHeader';

const inputCls =
  'w-full rounded-[2px] border border-border bg-canvas px-3 py-2.5 text-sm text-ink placeholder:text-muted-ink/60 transition-colors focus:border-teal-dark';

const panelTitleCls = 'font-display text-lg font-semibold text-ink';

export const DemoLab: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [drawAmount, setDrawAmount] = useState('3000');
  const [merchantCategory, setMerchantCategory] = useState('CLOUD_SERVICES');
  const [logOutput, setLogOutput] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshAgents = async () => {
    const data = await api.getAgents();
    setAgents(data);
    // Auto-select first non-frozen agent if current selection is frozen or empty
    const currentAgent = data.find((a: Agent) => a.id === selectedAgentId);
    if (!currentAgent || currentAgent.status === 'FROZEN') {
      const normalAgent = data.find((a: Agent) => a.status === 'NORMAL');
      if (normalAgent) setSelectedAgentId(normalAgent.id);
      else if (data.length > 0) setSelectedAgentId(data[0].id);
    }
    return data;
  };

  useEffect(() => {
    api.getAgents().then((data) => {
      setAgents(data);
      const normalAgent = data.find((a: Agent) => a.status === 'NORMAL');
      if (normalAgent) setSelectedAgentId(normalAgent.id);
      else if (data.length > 0) setSelectedAgentId(data[0].id);
    });
  }, []);

  const addLog = (msg: string) => {
    setLogOutput((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  const handleTestDraw = async () => {
    if (!selectedAgentId) return;
    try {
      setLoading(true);
      addLog(`Initiating Draw Request for ₹${drawAmount} (${merchantCategory})...`);
      const res = await api.createDraw({
        agent_id: selectedAgentId,
        amount: parseFloat(drawAmount),
        merchant_name: 'Demo Vendor API',
        merchant_category: merchantCategory,
        idempotency_key: `demolab_${Date.now()}`
      });
      addLog(`✅ Draw Reserved! Reservation ID: ${res.draw_id}, Reserved: ₹${res.reserved_amount}, Avail: ₹${res.available_credit}`);
      await refreshAgents();
    } catch (e: any) {
      addLog(`❌ Draw Rejected by Gateway: ${e.message}`);
      await refreshAgents();
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateRepaymentFail = async () => {
    if (!selectedAgentId) return;
    try {
      setLoading(true);
      addLog(`Polling repayment schedules for agent ${selectedAgentId}...`);
      const repayments = await api.getRepayments(selectedAgentId);
      if (repayments.length === 0) {
        addLog(`⚠️ No active repayment schedules found. Execute a draw first.`);
        return;
      }
      const targetSched = repayments[0];
      addLog(`Simulating failed mandate pull (INSUFFICIENT_FUNDS) for schedule ${targetSched.id}...`);
      const res = await api.attemptRepayment(targetSched.id, 'INSUFFICIENT_FUNDS');
      addLog(`❌ Bank Debit Failed! Ref: ${res.bank_ref}. Agent Status automatically transitioned to FROZEN!`);
      addLog(`↩️ Auto-unfreezing agent for continued testing...`);
      await api.unfreezeAgent(selectedAgentId, 'Demo Lab auto-recovery after repayment failure scenario');
      addLog(`✅ Agent unfrozen — ready for next test.`);
      await refreshAgents();
    } catch (e: any) {
      addLog(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInFlightRevoke = async () => {
    if (!selectedAgentId) return;
    try {
      setLoading(true);
      addLog(`Executing Draw Request...`);
      const draw = await api.createDraw({
        agent_id: selectedAgentId,
        amount: 1500,
        merchant_name: 'Staged Vendor',
        merchant_category: 'API_SERVICES',
        idempotency_key: `staged_${Date.now()}`
      });
      addLog(`Draw Reserved (ID: ${draw.draw_id}). Now triggering emergency agent freeze before settlement...`);
      await api.freezeAgent(selectedAgentId, 'Principal emergency freeze during staged transaction');
      addLog(`Agent FROZEN! Attempting to settle draw in-flight...`);
      const settled = await api.advanceDraw(draw.draw_id);
      addLog(`🚫 In-flight Revocation Succeeded! Draw status: ${settled.status}. Reason: ${settled.rejection_reason}`);
      addLog(`↩️ Auto-unfreezing agent for continued testing...`);
      await api.unfreezeAgent(selectedAgentId, 'Demo Lab auto-recovery after in-flight revoke scenario');
      addLog(`✅ Agent unfrozen — ready for next test.`);
      await refreshAgents();
    } catch (e: any) {
      addLog(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTamperAudit = async () => {
    try {
      setLoading(true);
      addLog(`Injecting isolated payload modification into audit event #1...`);
      const tamper = await api.tamperAuditLog();
      addLog(`Payload modified: ${tamper.message}`);
      addLog(`Running audit chain integrity verification...`);
      const verify = await api.verifyAuditChain();
      addLog(`🚨 Audit Engine Result: STATUS=${verify.status}. Corrupted Sequence #${(verify as any).corrupted_sequence}!`);
    } catch (e: any) {
      addLog(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetDemo = async () => {
    try {
      setLoading(true);
      addLog(`Resetting and re-seeding database clean state...`);
      const res = await api.resetDemo();
      addLog(`✅ Reset Complete: ${res.message}`);
      const freshAgents = await api.getAgents();
      setAgents(freshAgents);
      if (freshAgents.length > 0) setSelectedAgentId(freshAgents[0].id);
    } catch (e: any) {
      addLog(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const scenarios = [
    { index: '01', label: 'Staged Draw In-Flight Revocation', icon: Lock, iconColor: 'text-warning', onClick: handleInFlightRevoke },
    { index: '02', label: 'Force Repayment Failure & Line Freeze', icon: ShieldAlert, iconColor: 'text-danger', onClick: handleSimulateRepaymentFail },
    { index: '03', label: 'Test Audit Log Tamper Detection', icon: Scale, iconColor: 'text-olive', onClick: handleTamperAudit },
    { index: '04', label: 'Reset & Re-Seed Clean Demo State', icon: RefreshCw, iconColor: 'text-muted-ink', onClick: handleResetDemo },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Enforcement Test Rig"
        title="Judge Interactive Demo Lab"
        description="Deterministic test rig for credit limits, policy enforcement, failure escalation, and audit integrity — a scripted 3-minute scenario, step by step."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Control panel column */}
        <div className="lg:col-span-1 space-y-6">
          <section className="card-editorial rounded-sm overflow-hidden">
            <div className="border-b border-border p-5">
              <h2 className={panelTitleCls}>Target Agent</h2>
              <label htmlFor="target-agent" className="mt-3 block font-mono text-[11px] uppercase tracking-widest text-muted-ink">Select Agent</label>
              <div className="relative mt-1.5">
                <select
                  id="target-agent"
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className={`${inputCls} appearance-none pr-9`}
                >
                  {agents.map((ag) => (
                    <option key={ag.id} value={ag.id}>
                      {ag.display_name} [{ag.status}]
                    </option>
                  ))}
                </select>
                <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-ink" />
              </div>
            </div>

            <div className="border-b border-border p-5">
              <h2 className={panelTitleCls}>Draw Parameters</h2>
              <div className="mt-3 space-y-3">
                <div>
                  <label htmlFor="draw-amount" className="block font-mono text-[11px] uppercase tracking-widest text-muted-ink">Amount (₹)</label>
                  <div className="relative mt-1.5">
                    <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-ink">₹</span>
                    <input
                      id="draw-amount"
                      type="number"
                      value={drawAmount}
                      onChange={(e) => setDrawAmount(e.target.value)}
                      className={`${inputCls} pl-7 font-mono`}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="merchant-category" className="block font-mono text-[11px] uppercase tracking-widest text-muted-ink">Merchant Category</label>
                  <div className="relative mt-1.5">
                    <select
                      id="merchant-category"
                      value={merchantCategory}
                      onChange={(e) => setMerchantCategory(e.target.value)}
                      className={`${inputCls} appearance-none pr-9`}
                    >
                      <option value="CLOUD_SERVICES">CLOUD_SERVICES (Allowed)</option>
                      <option value="API_SERVICES">API_SERVICES (Allowed)</option>
                      <option value="P2P_TRANSFER">P2P_TRANSFER (Denied Category)</option>
                      <option value="CRYPTO_EXCHANGE">CRYPTO_EXCHANGE (Denied Category)</option>
                    </select>
                    <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-ink" />
                  </div>
                </div>
                <button
                  onClick={handleTestDraw}
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[2px] bg-teal px-4 py-2.5 text-sm font-medium text-surface transition-colors hover:bg-teal-dark active:translate-y-px shadow-card disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Zap className="h-4 w-4" aria-hidden="true" />
                  Test Gateway Draw Request
                </button>
              </div>
            </div>

            <div className="p-5">
              <h2 className={panelTitleCls}>Enforcement Scenarios</h2>
              <ol className="mt-3 space-y-2">
                {scenarios.map((s) => (
                  <li key={s.index}>
                    <button
                      onClick={s.onClick}
                      disabled={loading}
                      className="group flex w-full items-center gap-3 rounded-[2px] border border-border bg-canvas px-4 py-3 text-left transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span aria-hidden="true" className="font-mono text-[11px] font-semibold text-accent">{s.index}</span>
                      <s.icon className={`h-4 w-4 shrink-0 ${s.iconColor}`} aria-hidden="true" />
                      <span className="text-xs font-medium text-ink">{s.label}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        </div>

        {/* Live execution console column */}
        <div className="lg:col-span-2">
          <section aria-label="Live gateway execution log" className="card-editorial rounded-sm overflow-hidden h-full flex flex-col">
            <div className="flex items-center justify-between gap-3 border-b border-border bg-canvas px-5 py-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span aria-hidden="true" className="h-2 w-2 shrink-0 animate-pulse bg-teal" />
                <Terminal className="h-4 w-4 shrink-0 text-muted-ink" aria-hidden="true" />
                <h2 className="truncate font-mono text-[11px] font-semibold uppercase tracking-widest text-muted-ink">Live Gateway Execution Log</h2>
              </div>
              <button
                onClick={() => setLogOutput([])}
                className="shrink-0 font-mono text-[11px] uppercase tracking-widest text-muted-ink transition-colors hover:text-ink"
              >
                Clear Log
              </button>
            </div>

            <div className="console-scroll flex-1 space-y-2 overflow-y-auto bg-ink p-5 font-mono text-xs leading-relaxed text-canvas selection:bg-teal selection:text-surface min-h-[400px] max-h-[600px]">
              {logOutput.length === 0 ? (
                <p className="pt-20 text-center text-muted-ink">
                  Ready. Click any enforcement scenario to view real-time gateway events...
                </p>
              ) : (
                logOutput.map((log, i) => (
                  <div key={i} className="border-b border-white/10 pb-1">{log}</div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
