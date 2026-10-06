"""
Enterprise LLMOps Telemetry, Latency & Token Accounting Module.
Zero placeholders, complete production implementation.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional
import threading


@dataclass
class MetricSummary:
    total_audits: int
    autonomous_cleared: int
    hitl_suspended: int
    resumed_approved: int
    resumed_rejected: int
    total_tokens: int
    total_spend_usd: float
    avg_latency_ms: float
    pii_entities_sanitized: int
    sla_compliance_percentage: float


class TelemetryCollector:
    """
    Thread-safe in-memory MLOps telemetry engine.
    """

    def __init__(self):
        self._lock = threading.Lock()
        self.total_audits: int = 0
        self.autonomous_cleared: int = 0
        self.hitl_suspended: int = 0
        self.resumed_approved: int = 0
        self.resumed_rejected: int = 0
        self.total_tokens: int = 0
        self.total_spend_usd: float = 0.0
        self.latency_samples: List[float] = []
        self.pii_redacted_count: int = 0
        self.sla_violations: int = 0

    def record_audit(
        self,
        status: str,
        latency_ms: float,
        tokens_used: int,
        spend_usd: float,
        pii_count: int,
    ) -> None:
        with self._lock:
            self.total_audits += 1
            self.total_tokens += tokens_used
            self.total_spend_usd += spend_usd
            self.pii_redacted_count += pii_count
            self.latency_samples.append(latency_ms)

            # Keep sliding window of 1000 samples
            if len(self.latency_samples) > 1000:
                self.latency_samples.pop(0)

            if latency_ms > 1500.0:
                self.sla_violations += 1

            if status == "COMPLETED_AUTONOMOUS":
                self.autonomous_cleared += 1
            elif status == "SUSPENDED_AWAITING_APPROVAL":
                self.hitl_suspended += 1

    def record_resumption(self, decision: str) -> None:
        with self._lock:
            if decision == "APPROVE":
                self.resumed_approved += 1
            else:
                self.resumed_rejected += 1

    def get_summary(self) -> MetricSummary:
        with self._lock:
            avg_lat = (
                sum(self.latency_samples) / len(self.latency_samples)
                if self.latency_samples
                else 0.0
            )
            sla_pct = (
                max(0.0, 100.0 - (self.sla_violations / max(1, self.total_audits) * 100.0))
                if self.total_audits > 0
                else 100.0
            )

            return MetricSummary(
                total_audits=self.total_audits,
                autonomous_cleared=self.autonomous_cleared,
                hitl_suspended=self.hitl_suspended,
                resumed_approved=self.resumed_approved,
                resumed_rejected=self.resumed_rejected,
                total_tokens=self.total_tokens,
                total_spend_usd=round(self.total_spend_usd, 5),
                avg_latency_ms=round(avg_lat, 2),
                pii_entities_sanitized=self.pii_redacted_count,
                sla_compliance_percentage=round(sla_pct, 2),
            )


# Global singleton instance
global_telemetry = TelemetryCollector()
