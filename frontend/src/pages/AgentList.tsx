import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ArrowRight, RefreshCw, AlertTriangle } from 'lucide-react';
import { Agent } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-ink">Agents Inventory</h1>
          <p className="text-sm text-muted-ink mt-1">Monitored autonomous agent accounts under principal authority.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadAgents}
            className="px-3 py-2 bg-canvas border border-border text-sm font-medium rounded hover:bg-surface transition-colors flex items-center space-x-1"
          >
            <RefreshCw className="w-4 h-4 text-muted-ink" />
            <span>Refresh</span>
          </button>
          <Link
            to="/agents/new"
            className="px-4 py-2 bg-teal text-surface text-sm font-medium rounded hover:bg-teal-dark transition-colors flex items-center space-x-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Register Agent</span>
          </Link>
        </div>
      </div>

      <div className="card-editorial rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-ink font-mono text-sm">Loading agents inventory...</div>
        ) : agents.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-warning mx-auto" />
            <p className="text-ink font-medium">No agents found in inventory.</p>
            <p className="text-xs text-muted-ink">Seed demo data or register a new agent to begin.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-canvas border-b border-border text-muted-ink font-mono text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-semibold">Agent Name</th>
                  <th className="py-3.5 px-4 font-semibold">Principal</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Credit Limit</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Available</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Outstanding</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {agents.map((ag) => (
                  <tr key={ag.id} className="hover:bg-canvas/50 transition-colors">
                    <td className="py-4 px-4 font-medium text-ink">
                      <div>
                        <Link to={`/agents/${ag.id}`} className="hover:underline font-serif text-base text-ink font-bold">
                          {ag.display_name}
                        </Link>
                        <span className="block text-xs font-mono text-muted-ink truncate max-w-xs">{ag.purpose || 'No purpose specified'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-muted-ink font-medium">{ag.principal_name || 'Acme Corp'}</td>
                    <td className="py-4 px-4">
                      <StatusBadge status={ag.status} />
                    </td>
                    <td className="py-4 px-4 font-mono text-right font-medium text-ink">₹{parseFloat(ag.current_limit || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-4 px-4 font-mono text-right font-semibold text-teal-dark">₹{parseFloat(ag.available_credit || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-4 px-4 font-mono text-right text-muted-ink">₹{parseFloat(ag.outstanding_principal || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-4 px-4 text-center">
                      <Link
                        to={`/agents/${ag.id}`}
                        className="px-3 py-1.5 bg-canvas border border-border text-xs font-medium rounded hover:bg-surface transition-colors inline-flex items-center space-x-1 text-ink"
                      >
                        <span>Manage</span>
                        <ArrowRight className="w-3 h-3" />
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
