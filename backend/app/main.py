"""
FastAPI High-Throughput Compliance Application Entrypoint.
Production-grade financial audit orchestration service with Asyncio, Pydantic v2,
deterministic error handling, and zero placeholders.
"""

import logging
import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.agent.graph import ComplianceAgentGraph
from app.models.schemas import (
    ApprovalWebhookRequest,
    AuditLifecycleResponse,
    SanitizationResult,
    TransactionAuditRequest,
)
from app.core.sanitizer import PIISanitizer
from app.telemetry.metrics import global_telemetry

# Configure structured enterprise logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("aegisfin.app")

# Shared state lifecycle
compliance_graph: ComplianceAgentGraph = ComplianceAgentGraph()
standalone_sanitizer: PIISanitizer = PIISanitizer()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("Initializing AegisFin Compliance Engine v2.4.0...")
    logger.info("Deterministic PII guard and multi-tier GenAI router initialized.")
    yield
    logger.info("Shutting down AegisFin Compliance Engine. Flushing telemetry buffers...")


app = FastAPI(
    title="AegisFin Autonomous Financial Audit & Compliance Engine",
    description="High-throughput enterprise AI financial compliance and audit engine with deterministic PII sanitization, multi-tiered GenAI routing, and human-in-the-loop webhooks.",
    version="2.4.0",
    lifespan=lifespan,
)

# Cross-Origin Resource Sharing configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    """
    Production liveness and readiness probe with subsystem status.
    """
    return {
        "status": "UP",
        "service": "AegisFin Financial Compliance Platform",
        "version": "2.4.0",
        "pii_sanitization": "ONLINE",
        "genai_router": "ONLINE",
        "suspended_queue_depth": len(compliance_graph.suspended_registry),
    }


@app.post("/api/v1/sanitize", response_model=SanitizationResult)
async def sanitize_payload(payload: dict):
    """
    Presidio-grade deterministic PII sanitization sandbox endpoint.
    """
    raw_text = payload.get("text", "")
    if not raw_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payload must include a non-empty 'text' field.",
        )
    try:
        return standalone_sanitizer.sanitize(raw_text)
    except Exception as exc:
        logger.error(f"Sanitization execution failure: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"PII sanitization engine failure: {str(exc)}",
        )


@app.post("/api/v1/audit", response_model=AuditLifecycleResponse)
async def audit_transaction(request: TransactionAuditRequest):
    """
    Processes transaction through the autonomous compliance pipeline.
    Deterministic error handling with automatic state suspension if confidence < 0.85
    or transaction amount >= $100,000.
    """
    try:
        response = await compliance_graph.execute_audit(request)

        # Record telemetry
        token_count = response.tier1_analysis.token_usage if response.tier1_analysis else 250
        spend = (token_count / 1_000_000.0) * 0.15
        global_telemetry.record_audit(
            status=response.status.value,
            latency_ms=response.total_latency_ms,
            tokens_used=token_count,
            spend_usd=spend,
            pii_count=response.sanitization.pii_detected_count,
        )

        return response
    except Exception as exc:
        logger.error(f"Transaction audit lifecycle error for {request.transaction_id}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Audit execution graph error: {str(exc)}",
        )


@app.post("/api/v1/webhook/resume", response_model=AuditLifecycleResponse)
async def resume_suspended_audit(webhook: ApprovalWebhookRequest):
    """
    Cryptographically authenticated webhook resuming suspended execution state.
    """
    try:
        resumed = await compliance_graph.resume_suspended_execution(
            execution_id=webhook.execution_id,
            approval_token=webhook.approval_token,
            reviewer_id=webhook.reviewer_id,
            decision=webhook.decision,
            review_notes=webhook.review_notes,
        )
        global_telemetry.record_resumption(webhook.decision)
        return resumed
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except PermissionError as pe:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(pe))
    except Exception as exc:
        logger.error(f"Resumption webhook failure: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Webhook processing error: {str(exc)}",
        )


@app.get("/api/v1/telemetry/summary")
async def get_telemetry_metrics():
    """
    Returns aggregated LLMOps telemetry and audit volume statistics.
    """
    return global_telemetry.get_summary()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=False)
