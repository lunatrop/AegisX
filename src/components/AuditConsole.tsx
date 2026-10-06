import React, { useState } from 'react';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  AlertOctagon,
  ShieldAlert,
  ArrowRight,
  Database,
  Cpu,
  Clock,
  Coins,
  Copy,
  Check,
  FileText,
  Eye,
  EyeOff,
} from 'lucide-react';
import { PipelineStepEvent } from '../types';

interface AuditConsoleProps {
  onRefreshHITL: () => void;
  onSelectHITLTab: () => void;
}

const PRESET_SCENARIOS = [
  {
    name: 'High-Value Wire ($250k) - HITL Threshold Trigger',
    desc: 'Exceeds $100,000 threshold. Triggers FinCEN CTR review and suspends state.',
    data: {
      transactionId: 'TX-HIGH-2026-9901',
      amount: 250000,
      currency: 'USD',
      senderName: 'Apex Capital Holdings LLC',
      senderAccount: 'US89370400440532013000',
      beneficiaryName: 'BVI Maritime Ventures Ltd',
      beneficiaryAccount: 'GB29XAAA14128800984128',
      jurisdiction: 'United States -> British Virgin Islands',
      memo: 'Offshore corporate restructuring distribution tranche A.',
    },
  },
  {
    name: 'BSA Smurfing ($9,800) - Low Confidence HITL Trigger',
    desc: 'Sub-CTR structuring signature ($9k-$9.99k). Model confidence drops under 0.85.',
    data: {
      transactionId: 'TX-SMURF-2026-4412',
      amount: 9800,
      currency: 'USD',
      senderName: 'David K. Miller (SSN: 312-54-9912)',
      senderAccount: 'US4411992200331144',
      beneficiaryName: 'Express Cash Exchange Corp',
      beneficiaryAccount: 'US9900223344115566',
      jurisdiction: 'United States -> United States',
      memo: 'Personal remittance installment 4 of 6.',
    },
  },
  {
    name: 'Routine Commercial Invoice ($4,200) - Autonomous Clearance',
    desc: 'Low risk, standard trade counterparty. Clears autonomously under 400ms.',
    data: {
      transactionId: 'TX-ROUTINE-2026-1044',
      amount: 4200,
      currency: 'USD',
      senderName: 'BioHealth Labs Inc',
      senderAccount: 'US1234567890123456',
      beneficiaryName: 'Precision Equipment Direct Corp',
      beneficiaryAccount: 'US9876543210987654',
      jurisdiction: 'United States -> United States',
      memo: 'Batch laboratory supplies invoice #8841-B.',
    },
  },
  {
    name: 'Embedded High-Sensitivity PII (Zero-Leak Test)',
    desc: 'Contains live SSN, credit card, and IBAN numbers. Verifies 100% Presidio redaction.',
    data: {
      transactionId: 'TX-PII-2026-7733',
      amount: 68500,
      currency: 'EUR',
      senderName: 'Dr. Gregory House (SSN: 045-88-1290, Card: 4111 2222 3333 4444)',
      senderAccount: 'DE89370400440532013000',
      beneficiaryName: 'Zurich Swiss MedTech AG',
      beneficiaryAccount: 'CH9300000000000000000',
      jurisdiction: 'Germany -> Switzerland',
      memo: 'Direct patient research grant authorization. Authorized by: Dr Gregory House.',
    },
  },
];

export const AuditConsole: React.FC<AuditConsoleProps> = ({
  onRefreshHITL,
  onSelectHITLTab,
}) => {
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [txForm, setTxForm] = useState(PRESET_SCENARIOS[0].data);
  const [isAuditing, setIsAuditing] = useState(false);
  const [events, setEvents] = useState<PipelineStepEvent[]>([]);
  const [activeStep, setActiveStep] = useState<string>('IDLE');
  const [progress, setProgress] = useState<number>(0);
  const [showSanitizedDiff, setShowSanitizedDiff] = useState(true);
  const [copiedToken, setCopiedToken] = useState(false);

  const handleSelectPreset = (idx: number) => {
    setSelectedPreset(idx);
    setTxForm(PRESET_SCENARIOS[idx].data);
    setEvents([]);
    setActiveStep('IDLE');
    setProgress(0);
  };

  const runAuditStream = () => {
    setIsAuditing(true);
    setEvents([]);
    setActiveStep('INITIALIZING');
    setProgress(10);

    const query = encodeURIComponent(JSON.stringify(txForm));
    const eventSource = new EventSource(`/api/audit/stream?payload=${query}`);

    eventSource.addEventListener('pipeline_step', (e) => {
      const data: PipelineStepEvent = JSON.parse(e.data);
      setActiveStep(data.step);
      setProgress(data.progress);
      setEvents((prev) => [...prev, data]);
    });

    eventSource.addEventListener('pii_sanitized', (e) => {
      const data: PipelineStepEvent = JSON.parse(e.data);
      setActiveStep('PII_COMPLETE');
      setProgress(data.progress);
      setEvents((prev) => [...prev, data]);
    });

    eventSource.addEventListener('tier1_result', (e) => {
      const data: PipelineStepEvent = JSON.parse(e.data);
      setActiveStep('TIER1_COMPLETE');
      setProgress(data.progress);
      setEvents((prev) => [...prev, data]);
    });

    eventSource.addEventListener('pipeline_suspended', (e) => {
      const data: PipelineStepEvent = JSON.parse(e.data);
      setActiveStep('SUSPENDED_AWAITING_APPROVAL');
      setProgress(100);
      setEvents((prev) => [...prev, data]);
      setIsAuditing(false);
      eventSource.close();
      onRefreshHITL();
    });

    eventSource.addEventListener('pipeline_completed', (e) => {
      const data: PipelineStepEvent = JSON.parse(e.data);
      setActiveStep('COMPLETED_AUTONOMOUS');
      setProgress(100);
      setEvents((prev) => [...prev, data]);
      setIsAuditing(false);
      eventSource.close();
      onRefreshHITL();
    });

    eventSource.addEventListener('pipeline_error', (e) => {
      const data: PipelineStepEvent = JSON.parse(e.data);
      setActiveStep('ERROR');
      setEvents((prev) => [...prev, data]);
      setIsAuditing(false);
      eventSource.close();
    });

    eventSource.onerror = () => {
      setIsAuditing(false);
      eventSource.close();
    };
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  // Find key event milestones
  const piiEvent = events.find((e) => e.step === 'PII_COMPLETE');
  const tier1Event = events.find((e) => e.step === 'TIER1_COMPLETE');
  const suspendedEvent = events.find((e) => e.step === 'SUSPENDED_AWAITING_APPROVAL');
  const completedEvent = events.find((e) => e.step === 'COMPLETED_AUTONOMOUS');

  return (
    <div className="space-y-6">
      {/* Top Banner / Scenario Selector */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              High-Throughput Audit Execution Console
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate high-volume enterprise financial wire instructions through the multi-tier GenAI & privacy pipeline.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={runAuditStream}
              disabled={isAuditing}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer ${
                isAuditing
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isAuditing ? 'Processing Pipeline...' : 'Execute Live Audit Stream'}
            </button>
          </div>
        </div>

        {/* Preset Selector Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESET_SCENARIOS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectPreset(idx)}
              className={`p-3 text-left rounded-lg border transition-all cursor-pointer ${
                selectedPreset === idx
                  ? 'bg-slate-800 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-200">
                  {preset.name.split('-')[0]}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                  {preset.data.currency} ${preset.data.amount.toLocaleString()}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                {preset.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Transaction Details & Live Pipeline Trace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Transaction Inspector & Raw Payload */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                Transaction Parameters
              </h3>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {txForm.transactionId}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Amount ({txForm.currency})</label>
                  <input
                    type="number"
                    value={txForm.amount}
                    onChange={(e) => setTxForm({ ...txForm, amount: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Currency</label>
                  <input
                    type="text"
                    value={txForm.currency}
                    onChange={(e) => setTxForm({ ...txForm, currency: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Sender Entity / Name (with PII)</label>
                <input
                  type="text"
                  value={txForm.senderName}
                  onChange={(e) => setTxForm({ ...txForm, senderName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 text-xs focus:border-emerald-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Beneficiary Entity / Account</label>
                <input
                  type="text"
                  value={txForm.beneficiaryName}
                  onChange={(e) => setTxForm({ ...txForm, beneficiaryName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 text-xs focus:border-emerald-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Jurisdiction Route</label>
                <input
                  type="text"
                  value={txForm.jurisdiction}
                  onChange={(e) => setTxForm({ ...txForm, jurisdiction: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 text-xs focus:border-emerald-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Wire Narrative / Memo</label>
                <textarea
                  rows={2}
                  value={txForm.memo}
                  onChange={(e) => setTxForm({ ...txForm, memo: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 text-xs focus:border-emerald-500 outline-none font-mono resize-none"
                />
              </div>
            </div>

            {/* Threshold & Rule Checklist Indicators */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className={`w-2 h-2 rounded-full ${txForm.amount >= 100000 ? 'bg-amber-400' : 'bg-slate-600'}`} />
                <span>$100k Threshold: {txForm.amount >= 100000 ? 'Triggered' : 'Normal'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className={`w-2 h-2 rounded-full ${txForm.amount >= 9000 && txForm.amount < 10000 ? 'bg-amber-400' : 'bg-slate-600'}`} />
                <span>Anti-Smurfing: {txForm.amount >= 9000 && txForm.amount < 10000 ? 'Flagged' : 'Clean'}</span>
              </div>
            </div>
          </div>

          {/* Presidio Redaction Preview Card */}
          {piiEvent && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-semibold text-slate-300">
                    Sanitized Payload Sent to Model
                  </span>
                </div>
                <button
                  onClick={() => setShowSanitizedDiff(!showSanitizedDiff)}
                  className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                >
                  {showSanitizedDiff ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {showSanitizedDiff ? 'Collapse' : 'Inspect'}
                </button>
              </div>

              {showSanitizedDiff && (
                <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48 whitespace-pre-wrap leading-relaxed">
                  {piiEvent.sanitizedText}
                </div>
              )}

              <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                <span>Redacted Entities: <strong className="text-blue-300">{piiEvent.detectedEntities?.length || 0}</strong></span>
                <span>Latency: <strong className="text-emerald-300">{piiEvent.durationMs}ms</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Real-time Live Execution Stream & Pipeline State */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Live Agent Execution Stream (SSE)
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                State: <span className="text-emerald-400 font-semibold">{activeStep}</span>
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800 mb-5">
              <div
                className={`h-full transition-all duration-300 ${
                  activeStep === 'SUSPENDED_AWAITING_APPROVAL'
                    ? 'bg-amber-400'
                    : activeStep === 'COMPLETED_AUTONOMOUS'
                    ? 'bg-emerald-400'
                    : 'bg-gradient-to-r from-blue-500 to-emerald-400'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Live Step-by-Step Execution Feed */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {events.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs font-mono">
                  Ready. Click &quot;Execute Live Audit Stream&quot; to begin processing.
                </div>
              ) : (
                events.map((evt, idx) => {
                  const isSuspended = evt.step === 'SUSPENDED_AWAITING_APPROVAL';
                  const isCompleted = evt.step === 'COMPLETED_AUTONOMOUS';
                  const isPII = evt.step === 'PII_COMPLETE';
                  const isTier1 = evt.step === 'TIER1_COMPLETE';

                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-lg border text-xs transition-all ${
                        isSuspended
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                          : isCompleted
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
                          : 'bg-slate-950/80 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-xs flex items-center gap-1.5">
                          {isSuspended ? (
                            <AlertOctagon className="w-4 h-4 text-amber-400" />
                          ) : isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Cpu className="w-3.5 h-3.5 text-blue-400" />
                          )}
                          {evt.step}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : ''}
                        </span>
                      </div>

                      {evt.message && <p className="text-slate-300 text-xs mb-1">{evt.message}</p>}

                      {/* Tier 1 Output Box */}
                      {isTier1 && evt.analysis && (
                        <div className="mt-2 p-2.5 rounded bg-slate-900 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                          <div>
                            <span className="text-slate-400 block">Risk Score</span>
                            <span className={`font-bold ${evt.analysis.riskScore > 0.7 ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {evt.analysis.riskScore.toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Confidence</span>
                            <span className={`font-bold ${evt.analysis.confidenceScore < 0.85 ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {(evt.analysis.confidenceScore * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Latency</span>
                            <span className="text-slate-200 font-bold">{evt.latencyMs}ms</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Model Tier</span>
                            <span className="text-purple-300 font-bold">{evt.tier}</span>
                          </div>
                        </div>
                      )}

                      {/* Suspended HITL Execution Alert */}
                      {isSuspended && (
                        <div className="mt-2 space-y-2 text-xs">
                          <p className="font-medium text-amber-300">
                            <strong>Reason:</strong> {evt.reason}
                          </p>
                          <div className="bg-slate-950 p-2.5 rounded border border-amber-500/30 flex items-center justify-between">
                            <div className="overflow-hidden mr-2">
                              <span className="text-[10px] text-slate-400 block">Cryptographic Approval Token:</span>
                              <span className="font-mono text-[11px] text-amber-200 truncate block">
                                {evt.approvalToken}
                              </span>
                            </div>
                            <button
                              onClick={() => copyToClipboard(evt.approvalToken || '')}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 cursor-pointer shrink-0"
                            >
                              {copiedToken ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              {copiedToken ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <button
                            onClick={onSelectHITLTab}
                            className="w-full mt-2 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>Open In Human-In-The-Loop Approval Queue</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Autonomous Clearance Card */}
                      {isCompleted && (
                        <div className="mt-2 p-2.5 rounded bg-emerald-500/5 border border-emerald-500/20 text-xs">
                          <p className="text-emerald-300 font-medium">{evt.synthesis}</p>
                          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                            <span>Total Latency: <strong className="text-slate-200">{evt.totalLatencyMs}ms</strong></span>
                            <span>Status: <strong className="text-emerald-400 font-bold">{evt.status}</strong></span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
