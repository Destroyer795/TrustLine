import React, { useState, useEffect } from 'react';
import { Play, ShieldAlert, Zap, RefreshCw, CheckCircle, AlertTriangle, Scale, Lock } from 'lucide-react';
import { api } from '../services/api';
import { Agent } from '../types';

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold text-ink">Judge Interactive Demo Lab</h1>
        <p className="text-sm text-muted-ink mt-1">Deterministic control panel to test credit limits, policy enforcement, failure escalation, and audit integrity.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card-editorial p-6 rounded-lg space-y-4">
            <h2 className="text-lg font-serif font-bold text-ink border-b border-border pb-2">Target Agent Selection</h2>
            
            <div>
              <label className="block text-xs font-mono text-muted-ink uppercase mb-1">Select Agent</label>
              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="w-full p-2.5 bg-canvas border border-border rounded text-sm text-ink font-medium focus:outline-none focus:border-teal"
              >
                {agents.map((ag) => (
                  <option key={ag.id} value={ag.id}>
                    {ag.display_name} [{ag.status}]
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 pt-2">
              <label className="block text-xs font-mono text-muted-ink uppercase">Draw Parameters</label>
              <input
                type="number"
                value={drawAmount}
                onChange={(e) => setDrawAmount(e.target.value)}
                className="w-full p-2 bg-canvas border border-border rounded text-sm font-mono text-ink"
                placeholder="Amount (₹)"
              />
              <select
                value={merchantCategory}
                onChange={(e) => setMerchantCategory(e.target.value)}
                className="w-full p-2 bg-canvas border border-border rounded text-sm text-ink"
              >
                <option value="CLOUD_SERVICES">CLOUD_SERVICES (Allowed)</option>
                <option value="API_SERVICES">API_SERVICES (Allowed)</option>
                <option value="P2P_TRANSFER">P2P_TRANSFER (Denied Category)</option>
                <option value="CRYPTO_EXCHANGE">CRYPTO_EXCHANGE (Denied Category)</option>
              </select>

              <button
                onClick={handleTestDraw}
                disabled={loading}
                className="w-full py-2 bg-teal text-surface font-medium text-xs rounded hover:bg-teal-dark transition-colors flex items-center justify-center space-x-1"
              >
                <Zap className="w-4 h-4" />
                <span>Test Gateway Draw Request</span>
              </button>
            </div>
          </div>

          <div className="card-editorial p-6 rounded-lg space-y-3">
            <h2 className="text-lg font-serif font-bold text-ink border-b border-border pb-2">Enforcement Scenarios</h2>
            
            <button
              onClick={handleInFlightRevoke}
              disabled={loading}
              className="w-full py-2 bg-canvas border border-border text-ink text-xs font-medium rounded hover:bg-surface transition-colors text-left px-3 flex items-center space-x-2"
            >
              <Lock className="w-4 h-4 text-warning" />
              <span>1. Staged Draw In-Flight Revocation</span>
            </button>

            <button
              onClick={handleSimulateRepaymentFail}
              disabled={loading}
              className="w-full py-2 bg-canvas border border-border text-ink text-xs font-medium rounded hover:bg-surface transition-colors text-left px-3 flex items-center space-x-2"
            >
              <ShieldAlert className="w-4 h-4 text-danger" />
              <span>2. Force Repayment Failure & Line Freeze</span>
            </button>

            <button
              onClick={handleTamperAudit}
              disabled={loading}
              className="w-full py-2 bg-canvas border border-border text-ink text-xs font-medium rounded hover:bg-surface transition-colors text-left px-3 flex items-center space-x-2"
            >
              <Scale className="w-4 h-4 text-olive" />
              <span>3. Test Audit Log Tamper Detection</span>
            </button>

            <button
              onClick={handleResetDemo}
              disabled={loading}
              className="w-full py-2 bg-canvas border border-border text-muted-ink text-xs font-medium rounded hover:bg-surface transition-colors text-left px-3 flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset & Re-Seed Clean Demo State</span>
            </button>
          </div>
        </div>

        {/* Live Execution Console Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card-editorial p-6 rounded-lg h-full flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h2 className="text-lg font-serif font-bold text-ink">Live Gateway Execution Log</h2>
              <button
                onClick={() => setLogOutput([])}
                className="text-xs font-mono text-muted-ink hover:text-ink"
              >
                Clear Log
              </button>
            </div>

            <div className="flex-1 bg-ink text-canvas font-mono text-xs p-4 rounded-md overflow-y-auto space-y-2 min-h-[400px] max-h-[600px] selection:bg-teal selection:text-surface">
              {logOutput.length === 0 ? (
                <div className="text-muted-ink text-center pt-20">
                  Ready. Click any enforcement scenario to view real-time gateway events...
                </div>
              ) : (
                logOutput.map((log, i) => (
                  <div key={i} className="leading-relaxed border-b border-white/10 pb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
