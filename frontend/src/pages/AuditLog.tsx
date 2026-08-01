import React, { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, RefreshCw, FileWarning } from 'lucide-react';
import { AuditEvent } from '../types';
import { api } from '../services/api';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { AuditTimeline } from '../components/charts/AuditTimeline';
import { cn } from '../lib/cn';

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

  const valid = chainStatus?.status === 'VALID';
  const corrupt = chainStatus != null && !valid;

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Tamper-Evident Ledger"
        title="Tamper-Evident Audit Ledger"
        description="Every event is chained to the one before it by its SHA-256 hash — edit one record and the link breaks, and the verifier catches it instantly."
        actions={
          <>
            <button
              onClick={handleTamperTest}
              className="inline-flex items-center gap-2 rounded-[2px] bg-canvas border border-danger/40 px-4 py-2 text-sm font-medium text-danger transition-colors hover:bg-surface active:translate-y-px"
            >
              <FileWarning className="h-4 w-4" aria-hidden="true" />
              Simulate Payload Tamper
            </button>
            <button
              onClick={loadAuditData}
              className="inline-flex items-center gap-2 rounded-[2px] bg-teal px-4 py-2 text-sm font-medium text-surface transition-colors hover:bg-teal-dark active:translate-y-px shadow-card"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Verify Audit Chain
            </button>
          </>
        }
      />

      {/* Integrity status band */}
      <div
        className={cn(
          'card-editorial rounded-sm overflow-hidden',
          valid && 'border-teal/40',
          corrupt && 'border-danger/40',
        )}
      >
        <div className="flex items-start gap-4 p-6 md:p-7">
          <span
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border',
              valid && 'border-teal/30 bg-teal-light text-teal',
              corrupt && 'border-danger/30 bg-danger-light text-danger',
              !valid && !corrupt && 'border-border bg-canvas text-muted-ink',
            )}
          >
            {valid ? (
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            ) : corrupt ? (
              <ShieldAlert className="h-6 w-6" aria-hidden="true" />
            ) : (
              <RefreshCw className="h-5 w-5 animate-spin" aria-hidden="true" />
            )}
          </span>
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">
              Audit Chain Integrity:{' '}
              <span className={valid ? 'text-teal-dark' : corrupt ? 'text-danger' : 'text-muted-ink'}>
                {valid ? 'Valid & Verified' : corrupt ? 'Corrupted Record Detected' : 'Verifying'}
              </span>
            </h2>
            <p className="mt-1 font-mono text-xs text-muted-ink">
              {valid
                ? `All ${chainStatus?.verified_events} events verified against SHA-256 previous hash link.`
                : corrupt
                  ? `Tamper detected at event #${chainStatus?.corrupted_sequence}! Reason: ${chainStatus?.reason}`
                  : 'Running SHA-256 hash-chain verification…'}
            </p>
          </div>
        </div>
      </div>

      {/* Sequence timeline — the "one edit breaks the chain" story */}
      {events.length > 0 && (
        <div className="card-editorial rounded-sm">
          <AuditTimeline events={events} corruptedSequence={chainStatus?.corrupted_sequence} />
        </div>
      )}

      {/* Ledger table */}
      <div className="card-editorial rounded-sm overflow-hidden">
        {loading ? (
          <LoadingState label="Verifying audit chain…" />
        ) : events.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck className="h-6 w-6" aria-hidden="true" />}
            title="No audit events recorded."
            description="Seed demo data or perform an agent action to append events to the chain."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse font-mono">
              <caption className="sr-only">Chronological hash-chained audit events</caption>
              <thead>
                <tr className="bg-canvas border-b border-border">
                  <th scope="col" className="py-3.5 px-4 kicker text-muted-ink font-semibold">Seq #</th>
                  <th scope="col" className="py-3.5 px-4 kicker text-muted-ink font-semibold">Timestamp</th>
                  <th scope="col" className="py-3.5 px-4 kicker text-muted-ink font-semibold">Event Type</th>
                  <th scope="col" className="py-3.5 px-4 kicker text-muted-ink font-semibold">Actor / Entity</th>
                  <th scope="col" className="py-3.5 px-4 kicker text-muted-ink font-semibold">Current Hash (SHA-256)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {events.map((ev) => (
                  <tr key={ev.sequence} className="transition-colors hover:bg-canvas/60">
                    <td className="py-3 px-4">
                      <span className="inline-flex min-w-[2.25rem] items-center justify-center rounded-[2px] border border-border bg-canvas px-1.5 py-0.5 font-bold text-ink">
                        #{ev.sequence}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-ink">{new Date(ev.created_at).toLocaleTimeString()}</td>
                    <td className="py-3 px-4 font-semibold text-teal-dark">{ev.event_type}</td>
                    <td className="py-3 px-4 text-muted-ink">{ev.actor}</td>
                    <td className="max-w-xs truncate py-3 px-4 text-[11px] text-ink" title={ev.current_hash}>
                      {ev.current_hash}
                    </td>
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
