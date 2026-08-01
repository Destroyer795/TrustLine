import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Overview } from './pages/Overview';
import { AgentList } from './pages/AgentList';
import { AgentCreate } from './pages/AgentCreate';
import { AgentDetail } from './pages/AgentDetail';
import { DemoLab } from './pages/DemoLab';
import { AuditLog } from './pages/AuditLog';
import { SystemHealth } from './pages/SystemHealth';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-canvas text-ink">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/agents" element={<AgentList />} />
            <Route path="/agents/new" element={<AgentCreate />} />
            <Route path="/agents/:id" element={<AgentDetail />} />
            <Route path="/demo-lab" element={<DemoLab />} />
            <Route path="/audit" element={<AuditLog />} />
            <Route path="/system" element={<SystemHealth />} />
          </Routes>
        </main>
        <footer className="bg-surface border-t border-border py-6 mt-12  text-xs font-mono text-muted-ink">
          TrustLine — Autonomous Agent Credit Infrastructure • 31-Hour FinTech Hackathon Build
        </footer>
      </div>
    </BrowserRouter>
  );
};

export default App;
