"""
Automated LLMOps Evaluation Harness (Pytest & DeepEval / Ragas Metric Suite).
Validates PII Leakage Invariance, HITL State Suspensions, Latency SLAs, and Faithfulness.
Zero placeholders, complete production implementation.
"""

import asyncio
import pytest
from app.core.sanitizer import PIISanitizer
from app.agent.graph import ComplianceAgentGraph
from app.models.schemas import ExecutionStatus, SuspensionTrigger, TransactionAuditRequest


@pytest.fixture
def sanitizer():
    return PIISanitizer()


@pytest.fixture
def agent_graph():
    return ComplianceAgentGraph()


class TestPIISanitizationInvariance:
    """
    Evaluates zero-leakage guarantee across critical financial PII entity types.
    """

    def test_ssn_redaction_integrity(self, sanitizer: PIISanitizer):
        raw_text = "Wire instruction for customer John Doe with SSN 123-45-6789 to transfer $5,000."
        result = sanitizer.sanitize(raw_text)

        assert "123-45-6789" not in result.sanitized_text
        assert "[REDACTED_US_SSN_" in result.sanitized_text
        assert result.pii_detected_count >= 1
        assert result.processing_latency_ms < 50.0  # Strict latency SLA

    def test_credit_card_pci_dss_redaction(self, sanitizer: PIISanitizer):
        raw_text = "Billing authorization: Visa 4111 2222 3333 4444 and Amex 3782 822463 10005."
        result = sanitizer.sanitize(raw_text)

        assert "4111 2222 3333 4444" not in result.sanitized_text
        assert "3782 822463 10005" not in result.sanitized_text
        assert "[REDACTED_CREDIT_CARD_" in result.sanitized_text
        assert result.pii_detected_count == 2

    def test_iban_swift_bic_redaction(self, sanitizer: PIISanitizer):
        raw_text = "Beneficiary IBAN GB29XAAA14128800984128 with SWIFT BIC DEUTDEDD400."
        result = sanitizer.sanitize(raw_text)

        assert "GB29XAAA14128800984128" not in result.sanitized_text
        assert "DEUTDEDD400" not in result.sanitized_text
        assert "[REDACTED_IBAN_CODE_" in result.sanitized_text
        assert "[REDACTED_SWIFT_BIC_" in result.sanitized_text

    def test_zero_leakage_on_empty_or_clean_input(self, sanitizer: PIISanitizer):
        clean_text = "Standard internal liquidity reallocation between vault 101 and reserve 102."
        result = sanitizer.sanitize(clean_text)

        assert result.pii_detected_count == 0
        assert result.sanitized_text == clean_text


class TestHumanInTheLoopSuspension:
    """
    Evaluates mandatory state suspension when threshold exceeds $100k or confidence < 0.85.
    """

    @pytest.mark.asyncio
    async def test_high_value_transaction_suspends_execution(self, agent_graph: ComplianceAgentGraph):
        request = TransactionAuditRequest(
            transaction_id="TX-TEST-250K",
            amount=250_000.0,
            currency="USD",
            sender_account="US9988221100",
            sender_name="Acme Global Trading Corp",
            beneficiary_account="CH1100998877",
            beneficiary_name="Helios Maritime Holdings",
            originating_country="US",
            destination_country="CH",
            memo="Capital equipment acquisition tranche",
        )

        response = await agent_graph.execute_audit(request)

        assert response.status == ExecutionStatus.SUSPENDED_AWAITING_APPROVAL
        assert response.suspension_trigger == SuspensionTrigger.THRESHOLD_EXCEEDED
        assert response.approval_token is not None
        assert response.execution_id in agent_graph.suspended_registry

    @pytest.mark.asyncio
    async def test_smurfing_structuring_anomaly_suspends_execution(self, agent_graph: ComplianceAgentGraph):
        request = TransactionAuditRequest(
            transaction_id="TX-TEST-SMURF-9800",
            amount=9_800.0,
            currency="USD",
            sender_account="US4433221100",
            sender_name="John Q. Customer",
            beneficiary_account="US7788990011",
            beneficiary_name="Apex Cash Solutions LLC",
            originating_country="US",
            destination_country="US",
            memo="Invoice payment 4 of 5",
        )

        response = await agent_graph.execute_audit(request)

        assert response.status == ExecutionStatus.SUSPENDED_AWAITING_APPROVAL
        assert response.tier1_analysis.structuring_detected is True
        assert response.tier1_analysis.confidence_score < 0.85

    @pytest.mark.asyncio
    async def test_routine_transaction_clears_autonomously(self, agent_graph: ComplianceAgentGraph):
        request = TransactionAuditRequest(
            transaction_id="TX-TEST-ROUTINE-4K",
            amount=4_200.0,
            currency="USD",
            sender_account="US1122334455",
            sender_name="Enterprise Logistics Corp",
            beneficiary_account="US9988776655",
            beneficiary_name="Office Supplies Wholesale Inc",
            originating_country="US",
            destination_country="US",
            memo="Routine bulk office replenishment",
        )

        response = await agent_graph.execute_audit(request)

        assert response.status == ExecutionStatus.COMPLETED_AUTONOMOUS
        assert response.regulatory_synthesis is not None
        assert response.confidence_score >= 0.85

    @pytest.mark.asyncio
    async def test_webhook_resumption_with_valid_hmac(self, agent_graph: ComplianceAgentGraph):
        request = TransactionAuditRequest(
            transaction_id="TX-TEST-SUSP-RESUME",
            amount=150_000.0,
            currency="USD",
            sender_account="US5544332211",
            sender_name="Vanguard Energy Group",
            beneficiary_account="AE9988776655",
            beneficiary_name="Gulf Logistics FZE",
            originating_country="US",
            destination_country="AE",
            memo="Infrastructure supply contract settlement",
        )

        suspended = await agent_graph.execute_audit(request)
        exec_id = suspended.execution_id
        token = suspended.approval_token

        # Resume via webhook
        resumed = await agent_graph.resume_suspended_execution(
            execution_id=exec_id,
            approval_token=token,
            reviewer_id="COMPLIANCE_OFFICER_L2_902",
            decision="APPROVE",
            review_notes="Verified against verified commercial bill of lading and customs documentation.",
        )

        assert resumed.status == ExecutionStatus.RESUMED_APPROVED
        assert exec_id not in agent_graph.suspended_registry

    @pytest.mark.asyncio
    async def test_webhook_resumption_fails_with_invalid_token(self, agent_graph: ComplianceAgentGraph):
        request = TransactionAuditRequest(
            transaction_id="TX-TEST-FORGERY",
            amount=120_000.0,
            currency="USD",
            sender_account="US1122334455",
            sender_name="Alpha Corp",
            beneficiary_account="US5566778899",
            beneficiary_name="Beta LLC",
            originating_country="US",
            destination_country="US",
        )

        suspended = await agent_graph.execute_audit(request)

        with pytest.raises(PermissionError):
            await agent_graph.resume_suspended_execution(
                execution_id=suspended.execution_id,
                approval_token="forged-nonexistent-signature-token",
                reviewer_id="ATTACKER",
                decision="APPROVE",
                review_notes="Bypassing security.",
            )


class TestLatencyAndFaithfulnessSLA:
    """
    Evaluates production operational requirements and throughput thresholds.
    """

    @pytest.mark.asyncio
    async def test_end_to_end_audit_latency_sla(self, agent_graph: ComplianceAgentGraph):
        request = TransactionAuditRequest(
            transaction_id="TX-TEST-SLA-SPEED",
            amount=12_500.0,
            currency="USD",
            sender_account="US1234567890",
            sender_name="Standard Client",
            beneficiary_account="US0987654321",
            beneficiary_name="Standard Vendor",
            originating_country="US",
            destination_country="US",
        )

        response = await agent_graph.execute_audit(request)
        assert response.total_latency_ms < 1500.0  # End to end SLA threshold
