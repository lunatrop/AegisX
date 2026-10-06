import React from 'react';
import { ShieldCheck, Activity, Cpu, AlertTriangle, Lock } from 'lucide-react';
import { TelemetrySummary } from '../types';

interface HeaderProps {
  telemetry: TelemetrySummary | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  suspendedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  telemetry,
  activeTab,
  setActiveTab,
  suspendedCount,
}) => {
  return (
    <header className="bg-slate-950 border-b border-slate-800 text-slate-100 sticky top-0 z-50">
      {/* Top Banner: Enterprise System Status */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shadow-inner">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-lg tracking-tight text-white">
                AegisFin AI
              </h1>
              <span className="text-xs px-2 py-0.5 rounded font-mono bg-slate-800 text-emerald-400 border border-slate-700">
                v2.4.0-PROD
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous Financial Audit & Compliance Engine • Presidio PII Guard • Gemini Multi-Tier
            </p>
          </div>
        </div>

        {/* System Badges & Telemetry Quick Stats */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="hidden md:flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
            <Lock className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400">PII Guard:</span>
            <span className="text-blue-300 font-semibold">100% Zero-Leak</span>
          </div>

          <div className="hidden lg:flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-slate-400">Router:</span>
            <span className="text-purple-300 font-semibold">Gemini 3.8 Flash / Pro</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Avg Latency:</span>
            <span className="text-emerald-300 font-semibold">
              {telemetry ? `${telemetry.avgLatencyMs}ms` : '312ms'}
            </span>
          </div>

          {suspendedCount > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-1.5 rounded-lg animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{suspendedCount} HITL Suspended</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Sub-bar */}
      <div className="max-w-7xl mx-auto px-4 flex gap-1 border-t border-slate-900 overflow-x-auto">
        {[
          { id: 'audit', label: 'Audit Execution Console', icon: Activity },
          {
            id: 'hitl',
            label: `HITL Approval Queue ${suspendedCount > 0 ? `(${suspendedCount})` : ''}`,
            icon: AlertTriangle,
            badge: suspendedCount > 0,
          },
          { id: 'sanitizer', label: 'Presidio PII Sandbox', icon: Lock },
          { id: 'llmops', label: 'LLMOps & Eval Harness', icon: Cpu },
          { id: 'codebase', label: 'Production Code & Architecture', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping ml-1" />
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
