import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Overview } from "./pages/Overview";
import { AgentList } from "./pages/AgentList";
import { AgentCreate } from "./pages/AgentCreate";
import { AgentDetail } from "./pages/AgentDetail";
import { DemoLab } from "./pages/DemoLab";
import { AuditLog } from "./pages/AuditLog";
import { SystemHealth } from "./pages/SystemHealth";
import { Presentation } from "./pages/Presentation";
import { NotFound } from "./pages/NotFound";
import { Analytics } from "./pages/Analytics";

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-[100dvh] flex flex-col bg-canvas text-ink">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <Navbar />
        <main
          id="main-content"
          className="mx-auto w-full max-w-7xl flex-1 px-4 pb-20 pt-12 md:px-6 md:pt-20"
        >
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/agents" element={<AgentList />} />
            <Route path="/agents/new" element={<AgentCreate />} />
            <Route path="/agents/:id" element={<AgentDetail />} />
            <Route path="/demo-lab" element={<DemoLab />} />
            <Route path="/audit" element={<AuditLog />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/system" element={<SystemHealth />} />
            <Route path="/presentation" element={<Presentation />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <footer className="mx-auto mb-6 w-[calc(100%-2rem)] max-w-7xl rounded-[1.5rem] bg-ink px-6 py-7 text-xs font-mono text-canvas md:flex md:items-center md:justify-between">
          <span>TrustLine | Autonomous Agent Credit Infrastructure</span>
          <span className="mt-3 block text-canvas/60 md:mt-0">
            Bounded exposure. Enforced outside the agent.
          </span>
        </footer>
      </div>
    </BrowserRouter>
  );
};

export default App;
