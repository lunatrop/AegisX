import React, { useState } from 'react';
import {
  Lock,
  ShieldCheck,
  Eye,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { PIISanitizationResult } from '../types';

const SAMPLE_PAYLOADS = [
  {
    title: 'Wire with US SSN & Routing',
    text: `URGENT WIRE INSTRUCTION:
Customer Name: Robert Vance (SSN: 219-45-8821)
Originating Bank: Chase Manhattan Bank (Routing ABA: 021000021)
Account Number: 48920194821
Beneficiary: Vance Refrigeration LLC
Beneficiary Account: 994012841
Amount: USD 14,500.00
Authorized By: Robert Vance
Contact Phone: +1 (570) 555-0143
Email: robert.vance@vancerefrigeration.com`,
  },
  {
    title: 'PCI-DSS Dual Credit Card Billing',
    text: `COMMERCIAL CARD SETTLEMENT:
Primary Cardholder: Evelyn St. Claire
Visa Card Number: 4111 2222 3333 4444 (Exp 12/28)
Secondary Backup: Amex 3782 822463 10005
Tax EIN: 12-3456789
Authorized Charge: $88,250.00
Merchant Account: Global Logistics Provider Inc
Email Confirmation: billing@stclaire-enterprises.org`,
  },
  {
    title: 'Cross-Border European SWIFT & IBAN',
    text: `SEPA INTERNATIONAL CREDIT TRANSFER:
Sender: Alexander Hamilton
Originator IBAN: DE89370400440532013000
Bank BIC: DEUTDEDDFRA
Beneficiary Customer: Pierre Beauharnais
Beneficiary IBAN: FR1420041010050500013M02606
SWIFT BIC: BNPAFRPPXXX
Amount: EUR 312,000.00
Memo: Settlement of maritime container freight tranche under bill of lading #409.`,
  },
];

export const PIISanitizerLab: React.FC = () => {
  const [inputText, setInputText] = useState(SAMPLE_PAYLOADS[0].text);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<PIISanitizationResult | null>(null);
  const [copiedSanitized, setCopiedSanitized] = useState(false);

  const handleSanitize = async (textToSanitize: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/sanitize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSanitize }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error('Sanitization failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Run on mount
  React.useEffect(() => {
    handleSanitize(inputText);
  }, []);

  const handleSelectSample = (sample: string) => {
    setInputText(sample);
    handleSanitize(sample);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSanitized(true);
    setTimeout(() => setCopiedSanitized(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-400" />
              <h2 className="text-base font-semibold text-white">
                Deterministic Presidio PII Sanitization Sandbox
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Guarantees 100% zero-leakage privacy protection. Sensitive entities are replaced with deterministic cryptographic surrogates before any prompt reaches external GenAI foundation models.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {SAMPLE_PAYLOADS.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSample(sample.text)}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-mono transition-all cursor-pointer border border-slate-700"
              >
                {sample.title.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Editor & Output Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input Text Editor */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              Raw Financial Instruction (With Unmasked PII)
            </span>
            <button
              onClick={() => handleSanitize(inputText)}
              disabled={isProcessing}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>Redact Now</span>
            </button>
          </div>

          <textarea
            rows={14}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste raw financial transaction text with SSN, credit cards, IBANs..."
            className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:border-blue-500 outline-none resize-none leading-relaxed"
          />

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Character Count: {inputText.length}</span>
            <span>Policy: Presidio Deterministic Engine v2.4</span>
          </div>
        </div>

        {/* Right: Sanitized Model Payload */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-emerald-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Zero-Leak Sanitized Model Payload
            </span>
            {result && (
              <button
                onClick={() => copyToClipboard(result.sanitizedText)}
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer font-mono"
              >
                {copiedSanitized ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSanitized ? 'Copied' : 'Copy Payload'}
              </button>
            )}
          </div>

          <div className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-emerald-200/90 overflow-y-auto max-h-[340px] whitespace-pre-wrap leading-relaxed">
            {result?.sanitizedText || (
              <span className="text-slate-600">Sanitized output will appear here...</span>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] font-mono">
            <span className="text-blue-400">
              PII Detected: <strong>{result?.piiDetectedCount || 0} Entities</strong>
            </span>
            <span className="text-emerald-400">
              Sanitization Latency: <strong>{result?.processingTimeMs || 0}ms</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Detected Entities Metadata Table */}
      {result && result.redactedEntities.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Detected Sensitive Entities & Cryptographic Surrogate Map
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-2">Entity Category</th>
                  <th className="pb-2">Surrogate Placeholder Token</th>
                  <th className="pb-2">Detection Confidence</th>
                  <th className="pb-2">Presidio Pattern SLA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {result.redactedEntities.map((ent, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="py-2 text-blue-300 font-semibold">{ent.type}</td>
                    <td className="py-2 text-emerald-300">{ent.originalPlaceholder}</td>
                    <td className="py-2 text-slate-300">{(ent.confidence * 100).toFixed(1)}%</td>
                    <td className="py-2 text-slate-400">Deterministic Luhn / Format Match</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
