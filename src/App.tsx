import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AuditConsole } from './components/AuditConsole';
import { HITLQueue } from './components/HITLQueue';
import { PIISanitizerLab } from './components/PIISanitizerLab';
import { LLMOpsDashboard } from './components/LLMOpsDashboard';
import { CodebaseExplorer } from './components/CodebaseExplorer';
import { SuspendedExecution, TelemetrySummary } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState('audit');
  const [telemetry, setTelemetry] = useState<TelemetrySummary | null>(null);
  const [hitlQueue, setHitlQueue] = useState<SuspendedExecution[]>([]);

  const fetchTelemetry = async () => {
    try {
      const res = await fetch('/api/telemetry/summary');
      if (res.ok) {
        const data = await res.json();
        setTelemetry(data);
      }
    } catch (err) {
      console.warn('Telemetry fetch error:', err);
    }
  };

  const fetchHITLQueue = async () => {
    try {
      const res = await fetch('/api/hitl/queue');
      if (res.ok) {
        const data = await res.json();
        setHitlQueue(data.queue || []);
      }
    } catch (err) {
      console.warn('HITL queue fetch error:', err);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    fetchHITLQueue();
    const interval = setInterval(() => {
      fetchTelemetry();
      fetchHITLQueue();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const suspendedCount = hitlQueue.filter((item) => item.state === 'SUSPENDED').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      <Header
        telemetry={telemetry}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        suspendedCount={suspendedCount}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {activeTab === 'audit' && (
          <AuditConsole
            onRefreshHITL={() => {
              fetchHITLQueue();
              fetchTelemetry();
            }}
            onSelectHITLTab={() => setActiveTab('hitl')}
          />
        )}

        {activeTab === 'hitl' && (
          <HITLQueue
            queue={hitlQueue}
            onRefresh={() => {
              fetchHITLQueue();
              fetchTelemetry();
            }}
          />
        )}

        {activeTab === 'sanitizer' && <PIISanitizerLab />}

        {activeTab === 'llmops' && <LLMOpsDashboard telemetry={telemetry} />}

        {activeTab === 'codebase' && <CodebaseExplorer />}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500 font-mono">
        AegisFin AI • Enterprise Autonomous Financial Audit & Compliance Engine • Python 3.11+ / FastAPI / LangGraph / Google GenAI SDK / Presidio
      </footer>
    </div>
  );
}
