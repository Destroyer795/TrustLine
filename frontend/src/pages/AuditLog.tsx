import React, { useEffect, useState } from 'react';
import { ShieldCheck, ShieldWarning, ArrowsClockwise, Warning } from '@phosphor-icons/react';
import { AuditEvent } from '../types';
import { api } from '../services/api';

export const AuditLog: React.FC = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [chainStatus, setChainStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadAuditData = async () => {
    try {
      setLoading(true);
      const [evList, statusRes] = await Promise.all([
        api.getAuditEvents(),
        api.verifyAuditChain()
      ]);
      setEvents(evList);
      setChainStatus(statusRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditData();
  }, []);

  const handleTamperTest = async () => {
    await api.tamperAuditLog();
    await loadAuditData();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-ink">Tamper-Evident Audit Ledger</h1>
          <p className="text-sm text-muted-ink mt-1">SHA-256 hash-chained event history verifying immutable sequence integrity.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleTamperTest}
            className="px-3 py-2 bg-canvas border border-warning/40 text-warning text-xs font-medium rounded hover:bg-surface transition-colors"
          >
            Simulate Payload Tamper
          </button>
          <button
            onClick={loadAuditData}
            className="px-4 py-2 bg-teal text-surface text-sm font-medium rounded hover:bg-teal-dark transition-colors flex items-center space-x-2 shadow-sm"
          >
            <ArrowsClockwise className="w-4 h-4" />
            <span>Verify Audit Chain</span>
          </button>
        </div>
      </div>

      {/* Verification Status Card */}
      <div className={`card-editorial p-6 rounded-lg border-2 ${
        chainStatus?.status === 'VALID' ? 'border-teal bg-teal/5' : 'border-danger bg-danger-light'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {chainStatus?.status === 'VALID' ? (
              <ShieldCheck className="w-8 h-8 text-teal" />
            ) : (
              <ShieldWarning className="w-8 h-8 text-danger" />
            )}
            <div>
              <h2 className="text-xl font-serif font-bold text-ink">
                Audit Chain Integrity: {chainStatus?.status === 'VALID' ? 'VALID & VERIFIED' : 'CORRUPTED RECORD DETECTED'}
              </h2>
              <p className="text-xs font-mono text-muted-ink">
                {chainStatus?.status === 'VALID'
                  ? `All ${chainStatus?.verified_events} events verified against SHA-256 previous hash link.`
                  : `Tamper detected at event #${chainStatus?.corrupted_sequence}! Reason: ${chainStatus?.reason}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card-editorial rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-12  text-muted-ink font-mono text-sm">Verifying audit chain...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse font-mono">
              <thead>
                <tr className="bg-canvas border-b border-border text-muted-ink text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-semibold">Seq #</th>
                  <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                  <th className="py-3.5 px-4 font-semibold">Event Type</th>
                  <th className="py-3.5 px-4 font-semibold">Actor / Entity</th>
                  <th className="py-3.5 px-4 font-semibold">Current Hash (SHA-256)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {events.map((ev) => (
                  <tr key={ev.sequence} className="hover:bg-canvas/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-ink">#{ev.sequence}</td>
                    <td className="py-3 px-4 text-muted-ink">{new Date(ev.created_at).toLocaleTimeString()}</td>
                    <td className="py-3 px-4 font-bold text-teal-dark">{ev.event_type}</td>
                    <td className="py-3 px-4 text-muted-ink">{ev.actor}</td>
                    <td className="py-3 px-4 font-mono text-ink text-[11px] truncate max-w-xs">{ev.current_hash}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
