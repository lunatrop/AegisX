import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Lock,
  ArrowRight,
  Clock,
  UserCheck,
  FileCheck,
  Send,
  AlertOctagon,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import { SuspendedExecution } from '../types';

interface HITLQueueProps {
  queue: SuspendedExecution[];
  onRefresh: () => void;
}

export const HITLQueue: React.FC<HITLQueueProps> = ({ queue, onRefresh }) => {
  const [selectedItem, setSelectedItem] = useState<SuspendedExecution | null>(
    queue.length > 0 ? queue[0] : null
  );
  const [reviewerId, setReviewerId] = useState('OFFICER_L2_SAR_409');
  const [reviewNotes, setReviewNotes] = useState(
    'Enhanced Due Diligence (EDD) completed. Cross-checked with FinCEN CTR database and customs documentation. Approved for settlement.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionResult, setActionResult] = useState<{
    status: 'SUCCESS' | 'REJECTED' | 'ERROR';
    message: string;
  } | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  // Sync selectedItem if queue updates
  React.useEffect(() => {
    if (selectedItem) {
      const refreshed = queue.find((q) => q.id === selectedItem.id);
      if (refreshed) {
        setSelectedItem(refreshed);
      }
    } else if (queue.length > 0) {
      setSelectedItem(queue[0]);
    }
  }, [queue]);

  const handleWebhookDecision = async (decision: 'APPROVE' | 'REJECT') => {
    if (!selectedItem) return;
    setIsSubmitting(true);
    setActionResult(null);

    try {
      const endpoint = decision === 'APPROVE' ? '/api/webhook/approve' : '/api/webhook/reject';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          executionId: selectedItem.id,
          token: selectedItem.approvalToken,
          reviewerId,
          notes: reviewNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Webhook resumption failed');
      }

      setActionResult({
        status: decision === 'APPROVE' ? 'SUCCESS' : 'REJECTED',
        message: data.message || `Execution successfully ${decision.toLowerCase()}d and resumed.`,
      });
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Resumption webhook failure';
      setActionResult({
        status: 'ERROR',
        message: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const activeSuspended = queue.filter((item) => item.state === 'SUSPENDED');
  const resolvedItems = queue.filter((item) => item.state !== 'SUSPENDED');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-semibold text-white">
              Human-in-the-Loop (HITL) Suspended Execution Queue
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic suspended execution state triggered when model confidence &lt; 0.85 or transaction &ge; $100,000 threshold. Resumption requires authenticated cryptographic HMAC webhook.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition-all cursor-pointer font-mono shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Queue ({activeSuspended.length} Pending)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Suspended Items List */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
            Active Suspended Executions ({activeSuspended.length})
          </h3>

          {activeSuspended.length === 0 ? (
            <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-xl text-center text-xs text-slate-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
              <p className="font-medium text-slate-300">All Executions Cleared</p>
              <p className="text-[11px] text-slate-500 mt-1">
                No suspended transactions awaiting compliance signoff. Run a high-value or low-confidence scenario to trigger.
              </p>
            </div>
          ) : (
            activeSuspended.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedItem(item);
                    setActionResult(null);
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/90 border-amber-500/60 shadow-md ring-1 ring-amber-500/20'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-semibold text-slate-200">
                      {item.transactionId}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      {item.currency} ${item.amount.toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-medium mb-1 line-clamp-1">
                    {item.sender} &rarr; {item.beneficiary}
                  </p>

                  <p className="text-[11px] text-amber-300/90 line-clamp-2 mb-2 leading-relaxed">
                    {item.suspendedReason}
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>Confidence: {(item.confidenceScore * 100).toFixed(0)}%</span>
                    <span>{new Date(item.createdAt).toLocaleTimeString()}</span>
                  </div>
                </button>
              );
            })
          )}

          {/* Historical Resumed Executions List */}
          {resolvedItems.length > 0 && (
            <div className="pt-4 space-y-2">
              <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-1">
                Resolved & Resumed History ({resolvedItems.length})
              </h4>
              {resolvedItems.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-lg text-xs cursor-pointer hover:border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-slate-400">{item.transactionId}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        item.state === 'RESUMED_APPROVED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {item.state}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Webhook Resumption Panel */}
        <div className="lg:col-span-7">
          {selectedItem ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-5">
              {/* Header Details */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">
                      Suspended Execution Details
                    </h3>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                      ID: {selectedItem.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Transaction: <strong className="text-slate-200 font-mono">{selectedItem.transactionId}</strong>
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-base font-bold font-mono text-white block">
                    {selectedItem.currency} ${selectedItem.amount.toLocaleString()}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border inline-block mt-0.5 ${
                      selectedItem.state === 'SUSPENDED'
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        : selectedItem.state === 'RESUMED_APPROVED'
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                    }`}
                  >
                    STATUS: {selectedItem.state}
                  </span>
                </div>
              </div>

              {/* Suspension Reason Callout */}
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                  <AlertOctagon className="w-4 h-4" />
                  <span>Suspension Trigger: {selectedItem.triggerType}</span>
                </div>
                <p className="text-amber-200/90 leading-relaxed">
                  {selectedItem.suspendedReason}
                </p>
                <div className="text-[11px] text-amber-400/80 pt-1 font-mono">
                  Confidence Score: <strong>{(selectedItem.confidenceScore * 100).toFixed(1)}%</strong> (Threshold Floor: 85%)
                </div>
              </div>

              {/* Cryptographic Authorization Token Box */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    Cryptographic Approval Webhook Token (HMAC-SHA256)
                  </span>
                  <button
                    onClick={() => copyToken(selectedItem.approvalToken)}
                    className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer font-mono"
                  >
                    {copiedToken ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedToken ? 'Token Copied' : 'Copy Token'}
                  </button>
                </div>
                <div className="p-2 bg-slate-900 rounded font-mono text-[11px] text-emerald-300/90 break-all select-all">
                  {selectedItem.approvalToken}
                </div>
              </div>

              {/* Action Form or Resolved Stamp */}
              {selectedItem.state === 'SUSPENDED' ? (
                <div className="space-y-4 pt-2">
                  <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-blue-400" />
                    Compliance Officer Webhook Resumption
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        Authorized Reviewer ID
                      </label>
                      <input
                        type="text"
                        value={reviewerId}
                        onChange={(e) => setReviewerId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono text-xs focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        Webhook Target Route
                      </label>
                      <input
                        type="text"
                        disabled
                        value="/api/webhook/approve (or /reject)"
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-500 font-mono text-xs cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Mandatory Audit Trail Rationale & Notes
                    </label>
                    <textarea
                      rows={3}
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 text-xs focus:border-emerald-500 outline-none resize-none font-mono"
                    />
                  </div>

                  {actionResult && (
                    <div
                      className={`p-3 rounded-lg text-xs font-medium ${
                        actionResult.status === 'SUCCESS'
                          ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                          : actionResult.status === 'REJECTED'
                          ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                          : 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                      }`}
                    >
                      {actionResult.message}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => handleWebhookDecision('APPROVE')}
                      disabled={isSubmitting}
                      className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isSubmitting ? 'Authenticating...' : 'Sign HMAC & Authorize Resumption'}</span>
                    </button>

                    <button
                      onClick={() => handleWebhookDecision('REJECT')}
                      disabled={isSubmitting}
                      className="px-5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Formal SAR Rejection</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Execution Resolved: {selectedItem.state}</span>
                  </div>
                  <p className="text-slate-300">
                    <strong>Reviewer:</strong> {selectedItem.reviewedBy}
                  </p>
                  <p className="text-slate-300">
                    <strong>Auditor Notes:</strong> {selectedItem.reviewNotes}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Resumed At: {selectedItem.resumedAt ? new Date(selectedItem.resumedAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center text-xs text-slate-400">
              Select an execution ticket from the left to review and sign the HMAC approval webhook.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
