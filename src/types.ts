export interface RedactedEntity {
  type: string;
  originalPlaceholder: string;
  start: number;
  end: number;
  confidence: number;
}

export interface PIISanitizationResult {
  sanitizedText: string;
  redactedEntities: RedactedEntity[];
  piiDetectedCount: number;
  processingTimeMs: number;
}

export interface SuspendedExecution {
  id: string;
  transactionId: string;
  amount: number;
  currency: string;
  sender: string;
  beneficiary: string;
  jurisdiction: string;
  suspendedReason: string;
  confidenceScore: number;
  triggerType: 'THRESHOLD_EXCEEDED' | 'LOW_CONFIDENCE' | 'SANCTION_RISK' | 'STRUCTURING_ANOMALY';
  approvalToken: string;
  createdAt: string;
  state: 'SUSPENDED' | 'RESUMED_APPROVED' | 'RESUMED_REJECTED';
  metadata: Record<string, any>;
  resumedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface PipelineStepEvent {
  step: string;
  message?: string;
  timestamp?: string;
  progress: number;
  detectedEntities?: RedactedEntity[];
  sanitizedText?: string;
  durationMs?: number;
  tier?: string;
  analysis?: {
    riskScore: number;
    anomalyFlags: string[];
    jurisdictionRisk: string;
    confidenceScore: number;
    structuringDetected: boolean;
    requiresTier2Synthesis: boolean;
  };
  latencyMs?: number;
  tokensUsed?: number;
  costUsd?: number;
  reason?: string;
  executionId?: string;
  approvalToken?: string;
  triggerType?: string;
  webhookUrl?: string;
  escalationTier?: string;
  status?: string;
  transactionId?: string;
  synthesis?: string;
  confidenceScore?: number;
  riskScore?: number;
  totalLatencyMs?: number;
  clearedAt?: string;
  error?: string;
}

export interface TelemetrySummary {
  totalAudits: number;
  autoApproved: number;
  suspendedCount: number;
  resumedApprovedCount: number;
  rejectedCount: number;
  totalTokensUsed: number;
  estimatedCostUsd: number;
  avgLatencyMs: number;
  piiRedactedTotal: number;
  autonomousClearanceRate: number;
  hitlEscalationRate: number;
  slaComplianceRate: number;
  piiZeroLeakScore: number;
}

export interface EvalTestResult {
  name: string;
  suite: string;
  threshold: number;
  score: number;
  passed: boolean;
  latencyMs: number;
  details: string;
}

export interface EvalReport {
  status: 'PASSED' | 'FAILED';
  evalSuite: string;
  evaluatedAt: string;
  overallScore: number;
  testsTotal: number;
  testsPassed: number;
  totalDurationMs: number;
  results: EvalTestResult[];
}
