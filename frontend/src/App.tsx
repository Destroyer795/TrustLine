import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
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
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:bg-teal focus:text-surface focus:px-4 focus:py-2 focus:font-medium focus:rounded-[2px]"
      >
        Skip to main content
      </a>
      <div className="min-h-screen flex flex-col bg-canvas text-ink">
        <Navbar />
        <main id="main-content" tabIndex={-1} className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-10">
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
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;
