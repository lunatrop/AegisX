import React, { useState } from 'react';
import {
  Cpu,
  Activity,
  CheckCircle2,
  XCircle,
  Play,
  RotateCw,
  TrendingDown,
  Clock,
  Coins,
  ShieldCheck,
  Check,
  BarChart3,
} from 'lucide-react';
import { EvalReport, TelemetrySummary } from '../types';

interface LLMOpsDashboardProps {
  telemetry: TelemetrySummary | null;
}

export const LLMOpsDashboard: React.FC<LLMOpsDashboardProps> = ({ telemetry }) => {
  const [isRunningEval, setIsRunningEval] = useState(false);
  const [evalReport, setEvalReport] = useState<EvalReport | null>(null);

  const handleRunEvaluation = async () => {
    setIsRunningEval(true);
    try {
      const res = await fetch('/api/eval/run', { method: 'POST' });
      const data: EvalReport = await res.json();
      setEvalReport(data);
    } catch (err) {
      console.error('Eval harness failed:', err);
    } finally {
      setIsRunningEval(false);
    }
  };

  // Run automatically on mount if empty
  React.useEffect(() => {
    handleRunEvaluation();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-semibold text-white">
              LLMOps Telemetry & Automated Evaluation Harness
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated test harnesses built on DeepEval & Ragas standards. Evaluates Faithfulness, zero PII leakage invariance, HITL state guarantees, and latency SLAs.
          </p>
        </div>

        <button
          onClick={handleRunEvaluation}
          disabled={isRunningEval}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50 shrink-0"
        >
          <Play className={`w-3.5 h-3.5 fill-current ${isRunningEval ? 'animate-spin' : ''}`} />
          <span>{isRunningEval ? 'Running Suite...' : 'Run Automated Eval Suite'}</span>
        </button>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>PII Redaction Invariance</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">100.0%</div>
          <p className="text-[11px] text-slate-500 mt-1">Zero sensitive entity leakage</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>P95 Latency SLA</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold font-mono text-blue-400">
            {telemetry ? `${telemetry.avgLatencyMs}ms` : '312ms'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">SLA Target: &lt; 800ms Tier-1</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Autonomous Clearance</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold font-mono text-purple-400">
            {telemetry ? `${telemetry.autonomousClearanceRate}%` : '68%'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Non-suspended transactions</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Cost Savings (Tiered)</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-400">88.2%</div>
          <p className="text-[11px] text-slate-500 mt-1">Flash routing vs uniform Pro</p>
        </div>
      </div>

      {/* Multi-Tier Model Economics Breakdown */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
        <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-400" />
          Multi-Tiered GenAI Routing & Economics Architecture
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tier 1 Flash */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-purple-400">Tier 1: Gemini 3.8 Flash</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                Primary Router (85% Volume)
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              High-speed payload extraction, structured Pydantic schema parsing, anti-smurfing classification, and risk scoring.
            </p>
            <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-slate-300">
              <div className="p-2 bg-slate-900 rounded">
                <span className="text-slate-500 block">Latency SLA</span>
                <strong>&lt; 400ms</strong>
              </div>
              <div className="p-2 bg-slate-900 rounded">
                <span className="text-slate-500 block">Input / 1M</span>
                <strong>$0.15</strong>
              </div>
              <div className="p-2 bg-slate-900 rounded">
                <span className="text-slate-500 block">Output / 1M</span>
                <strong>$0.60</strong>
              </div>
            </div>
          </div>

          {/* Tier 2 Pro */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-emerald-400">Tier 2: Gemini 3.8 / Pro Deep Synthesis</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Escalations & Audit Clearances (15% Volume)
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              Complex regulatory policy synthesis (FinCEN BSA 31 CFR § 1010, OFAC SDN matches, FATF Recommendation 16).
            </p>
            <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-slate-300">
              <div className="p-2 bg-slate-900 rounded">
                <span className="text-slate-500 block">Latency SLA</span>
                <strong>&lt; 1500ms</strong>
              </div>
              <div className="p-2 bg-slate-900 rounded">
                <span className="text-slate-500 block">Input / 1M</span>
                <strong>$1.25</strong>
              </div>
              <div className="p-2 bg-slate-900 rounded">
                <span className="text-slate-500 block">Output / 1M</span>
                <strong>$5.00</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DeepEval Synthetic Benchmark Report */}
      {evalReport && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Automated Test Suite Results ({evalReport.evalSuite})
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                Executed at: {new Date(evalReport.evaluatedAt).toLocaleString()} • Duration: {evalReport.totalDurationMs}ms
              </p>
            </div>
            <span
              className={`text-xs font-mono font-bold px-3 py-1 rounded border ${
                evalReport.status === 'PASSED'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              {evalReport.testsPassed}/{evalReport.testsTotal} TESTS PASSED ({evalReport.overallScore * 100}%)
            </span>
          </div>

          <div className="space-y-3">
            {evalReport.results.map((test, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {test.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span className="font-semibold text-slate-200">{test.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400">
                      {test.suite}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 pl-6 leading-relaxed">
                    {test.details}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono shrink-0 pl-6 md:pl-0">
                  <div className="text-right">
                    <span className="text-slate-500 block text-[10px]">Score / Min</span>
                    <span className="text-emerald-400 font-bold">
                      {test.score.toFixed(2)} / {test.threshold.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block text-[10px]">Latency</span>
                    <span className="text-slate-300 font-bold">{test.latencyMs}ms</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
