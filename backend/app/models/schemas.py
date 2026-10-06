"""
Pydantic v2 Strict Enterprise Data Contracts for AegisFin Compliance System.
Zero placeholders, complete strictly-typed schemas.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator


class ExecutionStatus(str, Enum):
    INITIALIZED = "INITIALIZED"
    SANITIZING_PII = "SANITIZING_PII"
    TIER1_ROUTING = "TIER1_ROUTING"
    SUSPENDED_AWAITING_APPROVAL = "SUSPENDED_AWAITING_APPROVAL"
    RESUMED_APPROVED = "RESUMED_APPROVED"
    RESUMED_REJECTED = "RESUMED_REJECTED"
    COMPLETED_AUTONOMOUS = "COMPLETED_AUTONOMOUS"
    FAILED_ERROR = "FAILED_ERROR"


class SuspensionTrigger(str, Enum):
    THRESHOLD_EXCEEDED = "THRESHOLD_EXCEEDED"
    LOW_CONFIDENCE = "LOW_CONFIDENCE"
    SANCTION_RISK = "SANCTION_RISK"
    STRUCTURING_ANOMALY = "STRUCTURING_ANOMALY"


class JurisdictionRiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class RedactedEntity(BaseModel):
    entity_type: str = Field(description="Category of detected PII (e.g., US_SSN, CREDIT_CARD, IBAN)")
    surrogate_token: str = Field(description="Deterministic cryptographic placeholder used in prompts")
    confidence: float = Field(ge=0.0, le=1.0, description="Detection confidence score")
    character_length: int = Field(gt=0, description="Character count of original raw sensitive token")


class SanitizationResult(BaseModel):
    raw_character_count: int
    sanitized_text: str
    redacted_entities: List[RedactedEntity]
    pii_detected_count: int
    processing_latency_ms: float


class TransactionAuditRequest(BaseModel):
    transaction_id: str = Field(min_length=3, max_length=64, description="Unique transaction reference ID")
    amount: float = Field(gt=0, description="Transaction financial value")
    currency: str = Field(default="USD", min_length=3, max_length=3, description="ISO-4217 Currency Code")
    sender_account: str = Field(min_length=4, description="Originator account number or IBAN")
    sender_name: str = Field(min_length=2, description="Originator entity or individual legal name")
    beneficiary_account: str = Field(min_length=4, description="Beneficiary account number or IBAN")
    beneficiary_name: str = Field(min_length=2, description="Beneficiary entity or individual legal name")
    originating_country: str = Field(default="US", min_length=2, max_length=3)
    destination_country: str = Field(min_length=2, max_length=3)
    memo: Optional[str] = Field(default="", description="Wire transfer narrative or payment memo")
    metadata: Dict[str, Any] = Field(default_factory=dict)

    @field_validator("currency")
    @classmethod
    def validate_currency_uppercase(cls, v: str) -> str:
        return v.upper()


class Tier1ExtractionOutput(BaseModel):
    risk_score: float = Field(ge=0.0, le=1.0, description="Calculated overall compliance risk score")
    confidence_score: float = Field(ge=0.0, le=1.0, description="Model classification certainty score")
    jurisdiction_risk: JurisdictionRiskLevel
    anomaly_flags: List[str]
    structuring_detected: bool
    requires_tier2_synthesis: bool
    latency_ms: float
    token_usage: int


class ApprovalWebhookRequest(BaseModel):
    execution_id: str = Field(description="Suspended execution ticket ID")
    approval_token: str = Field(description="HMAC cryptographic authorization token")
    reviewer_id: str = Field(min_length=3, description="Authorized Compliance Officer Identifier")
    decision: str = Field(pattern="^(APPROVE|REJECT)$", description="Officer decision: APPROVE or REJECT")
    review_notes: str = Field(min_length=5, description="Mandatory rationale for audit trail compliance")


class TelemetryEvent(BaseModel):
    event_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    step_name: str
    latency_ms: float
    token_cost_usd: float
    confidence_score: Optional[float] = None
    state: ExecutionStatus


class AuditLifecycleResponse(BaseModel):
    execution_id: str
    transaction_id: str
    status: ExecutionStatus
    confidence_score: float
    risk_score: float
    sanitization: SanitizationResult
    tier1_analysis: Optional[Tier1ExtractionOutput] = None
    suspension_trigger: Optional[SuspensionTrigger] = None
    suspension_reason: Optional[str] = None
    approval_token: Optional[str] = None
    regulatory_synthesis: Optional[str] = None
    total_latency_ms: float
    audit_trail: List[TelemetryEvent]
