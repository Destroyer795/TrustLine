import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ArrowRight, RefreshCw, Inbox } from 'lucide-react';
import { Agent } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { formatINR } from '../lib/format';

export const AgentList: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const data = await api.getAgents();
      setAgents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Inventory"
        title="Agents Inventory"
        description="Monitored autonomous agent accounts under principal authority."
        actions={
          <>
            <button
              onClick={loadAgents}
              className="inline-flex items-center gap-2 rounded-[2px] bg-canvas border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface active:translate-y-px"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Refresh
            </button>
            <Link
              to="/agents/new"
              className="inline-flex items-center gap-2 rounded-[2px] bg-teal px-4 py-2 text-sm font-medium text-surface transition-colors hover:bg-teal-dark active:translate-y-px shadow-card"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Register Agent
            </Link>
          </>
        }
      />

      <div className="card-editorial rounded-sm overflow-hidden">
        {loading ? (
          <LoadingState label="Loading agents inventory…" />
        ) : agents.length === 0 ? (
          <EmptyState
            icon={<Inbox className="h-6 w-6" aria-hidden="true" />}
            title="No agents found in inventory."
            description="Seed demo data or register a new agent to begin."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <caption className="sr-only">Registered autonomous agents and their credit positions</caption>
              <thead>
                <tr className="bg-canvas border-b border-border">
                  <th scope="col" className="py-3.5 px-4 kicker text-muted-ink font-semibold">Agent Name</th>
                  <th scope="col" className="py-3.5 px-4 kicker text-muted-ink font-semibold">Principal</th>
                  <th scope="col" className="py-3.5 px-4 kicker text-muted-ink font-semibold">Status</th>
                  <th scope="col" className="py-3.5 px-4 kicker text-muted-ink font-semibold text-right">Credit Limit</th>
                  <th scope="col" className="py-3.5 px-4 kicker text-muted-ink font-semibold text-right">Available</th>
                  <th scope="col" className="py-3.5 px-4 kicker text-muted-ink font-semibold text-right">Outstanding</th>
                  <th scope="col" className="py-3.5 px-4 kicker text-muted-ink font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {agents.map((ag) => (
                  <tr key={ag.id} className="transition-colors hover:bg-canvas/60">
                    <td className="py-4 px-4 align-top">
                      <Link to={`/agents/${ag.id}`} className="font-display text-base font-semibold text-ink hover:text-teal-dark transition-colors">
                        {ag.display_name}
                      </Link>
                      <span className="mt-0.5 block max-w-xs truncate font-mono text-xs text-muted-ink">{ag.purpose || 'No purpose specified'}</span>
                    </td>
                    <td className="py-4 px-4 text-sm font-medium text-muted-ink">{ag.principal_name || 'Unassigned Principal'}</td>
                    <td className="py-4 px-4">
                      <StatusBadge status={ag.status} />
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-sm font-medium text-ink">{formatINR(ag.current_limit)}</td>
                    <td className="py-4 px-4 text-right font-mono text-sm font-semibold text-teal-dark">{formatINR(ag.available_credit)}</td>
                    <td className="py-4 px-4 text-right font-mono text-sm text-muted-ink">{formatINR(ag.outstanding_principal)}</td>
                    <td className="py-4 px-4 text-center">
                      <Link
                        to={`/agents/${ag.id}`}
                        className="inline-flex items-center gap-1.5 rounded-[2px] bg-canvas border border-border px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-surface"
                      >
                        Manage
                        <ArrowRight className="h-3 w-3" aria-hidden="true" />
                      </Link>
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
