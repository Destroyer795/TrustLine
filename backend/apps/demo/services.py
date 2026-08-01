from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from backend.apps.audit.models import AuditEvent
from backend.apps.audit.services import append_audit_event, verify_audit_chain
from backend.apps.credit.models import CreditLimitChange
from backend.apps.demo.models import DemoSession, DemoStepResult
from backend.apps.gateway.models import DrawRequest
from backend.apps.gateway.services import advance_draw_settlement, process_draw_request
from backend.apps.identity.models import Agent
from backend.apps.identity.services import verify_mandate_integrity
from backend.apps.monitoring.services import transition_authority_state
from backend.apps.repayment.models import RepaymentSchedule
from backend.apps.repayment.services import process_repayment_attempt
from backend.apps.risk.services import calculate_and_save_risk_profile
from backend.common.errors import APIError


SCENARIOS = {
    "success_cycle": {
        "title": "Complete success cycle",
        "agent": "Atlas Procurement Bot",
        "lesson": "A trustworthy bot can fund work, settle it, repay, and earn trust gradually.",
        "steps": [
            ("PRINCIPAL", "Verify signed mandate", "READ", "Authority exists before credit."),
            ("RISK_ENGINE", "Underwrite verified behavior", "RISK", "Five deterministic components set the bounded line."),
            ("ATLAS", "Request ₹900 for cloud infrastructure", "DRAW", "The bot asks; the gateway decides."),
            ("GATEWAY", "Settle the reserved purchase", "SETTLE", "The vendor is paid only after authority is checked again."),
            ("BANK_RAIL", "Pull repayment successfully", "REPAY_SUCCESS", "Repayment happens outside the bot's control."),
            ("CREDIT_ENGINE", "Recalculate the limit", "RECALCULATE", "Positive history raises trust slowly."),
        ],
    },
    "cold_start": {
        "title": "Cold-start boundary",
        "agent": "Scout Research Bot",
        "lesson": "A new bot receives useful but strictly bounded capital.",
        "steps": [
            ("PRINCIPAL", "Inspect cold-start authority", "READ", "The principal defines a floor and ceiling."),
            ("SCOUT", "Request ₹1 above available credit", "OVER_LIMIT", "The bot cannot spend beyond available credit."),
            ("AUDITOR", "Verify no exposure was created", "VERIFY", "A rejected request leaves balances unchanged."),
        ],
    },
    "capability_restriction": {
        "title": "Capability restriction",
        "agent": "Vector Arbitrage Bot",
        "lesson": "Credit authority is scoped to approved merchant categories.",
        "steps": [
            ("PRINCIPAL", "Inspect the capability manifest", "READ", "The signed mandate carries explicit category rules."),
            ("VECTOR", "Request a denied crypto exchange purchase", "DENIED_CATEGORY", "Possessing credit does not grant unrestricted spending."),
            ("MONITOR", "Restrict future authority", "RESTRICT", "Repeated policy pressure triggers proportionate containment."),
        ],
    },
    "inflight_freeze": {
        "title": "In-flight principal freeze",
        "agent": "Atlas Procurement Bot",
        "lesson": "The principal can stop reserved funds before settlement.",
        "steps": [
            ("ATLAS", "Reserve ₹700 for an API vendor", "DRAW", "The reservation is held, not yet settled."),
            ("PRINCIPAL", "Freeze authority immediately", "FREEZE", "Control remains with the accountable principal."),
            ("GATEWAY", "Attempt settlement after freeze", "SETTLE", "The in-flight reservation is revoked."),
        ],
    },
    "failed_repayment": {
        "title": "Failed repayment",
        "agent": "Vector Arbitrage Bot",
        "lesson": "A failed mandate pull freezes the line before debt can compound.",
        "steps": [
            ("VECTOR", "Reserve ₹500 for an approved API", "DRAW", "The request passes current authority checks."),
            ("GATEWAY", "Settle the approved purchase", "SETTLE", "The reservation becomes principal exposure."),
            ("BANK_RAIL", "Return insufficient funds", "REPAY_FAIL", "Repayment failure is explicit and immediate."),
            ("MONITOR", "Confirm frozen authority", "VERIFY", "The bot cannot create more exposure."),
        ],
    },
}

GATEWAY_CHECKS = [
    "Authority state", "Principal binding", "Mandate signature", "Manifest hash",
    "Validity window", "Merchant category", "Transaction cap", "Daily velocity",
    "Available credit", "Principal-wide exposure", "Atomic reservation",
]


def scenario_catalog():
    return [{"key": key, "title": value["title"], "agent_name": value["agent"], "lesson": value["lesson"], "step_count": len(value["steps"])} for key, value in SCENARIOS.items()]


def agent_state(agent):
    agent.refresh_from_db()
    account = agent.credit_account
    return {
        "agent_id": str(agent.id),
        "agent_name": agent.display_name,
        "authority": agent.status,
        "current_limit": str(account.current_credit_limit),
        "available_credit": str(account.available_credit),
        "reserved": str(account.reserved_amount),
        "outstanding": str(account.outstanding_principal),
    }


def create_session(scenario_key):
    scenario = SCENARIOS.get(scenario_key)
    if not scenario:
        raise APIError("UNKNOWN_SCENARIO", "Unknown demo scenario.", status_code=404)
    try:
        agent = Agent.objects.get(display_name=scenario["agent"])
    except Agent.DoesNotExist:
        raise APIError("DEMO_RESET_REQUIRED", "Seeded demo bots are missing. Reset the demo first.", status_code=409)
    if agent.status in ["FROZEN", "HUMAN_REVIEW"]:
        raise APIError("DEMO_RESET_REQUIRED", f"{agent.display_name} is {agent.status}. Reset the demo before starting this story.", status_code=409)
    state = agent_state(agent)
    return DemoSession.objects.create(scenario_key=scenario_key, agent=agent, initial_state=state, final_state=state)


def serialize_step(step):
    return {
        "sequence": step.sequence, "actor": step.actor, "action": step.action,
        "endpoint": step.endpoint, "transport_status": step.transport_status,
        "semantic_result": step.semantic_result, "plain_language": step.plain_language,
        "proof": step.proof, "request": step.request_evidence, "response": step.response_evidence,
        "before": step.balance_before, "after": step.balance_after,
        "gateway_checks": step.gateway_checks, "audit_sequence": step.audit_sequence,
        "created_at": step.created_at.isoformat(),
    }


def serialize_session(session):
    scenario = SCENARIOS[session.scenario_key]
    return {
        "id": str(session.id), "scenario_key": session.scenario_key,
        "title": scenario["title"], "lesson": scenario["lesson"],
        "status": session.status, "current_step": session.current_step,
        "total_steps": len(scenario["steps"]), "initial_state": session.initial_state,
        "current_state": session.final_state, "steps": [serialize_step(step) for step in session.steps.all()],
    }


def _latest_audit_sequence():
    event = AuditEvent.objects.order_by("-sequence").first()
    return event.sequence if event else None


def _active_draw(context):
    draw_id = context.get("draw_id")
    return DrawRequest.objects.get(id=draw_id) if draw_id else None


@transaction.atomic
def advance_session(session):
    session = DemoSession.objects.select_for_update().get(id=session.id)
    scenario = SCENARIOS[session.scenario_key]
    if session.current_step >= len(scenario["steps"]):
        return session
    agent = Agent.objects.select_related("credit_account", "current_mandate").get(id=session.agent_id)
    sequence = session.current_step + 1
    actor, action, operation, proof = scenario["steps"][session.current_step]
    before = agent_state(agent)
    context = dict(session.final_state or {})
    endpoint = ""
    request_data = {}
    response_data = {}
    semantic = "VERIFIED"
    transport = 200
    checks = []
    try:
        if operation == "READ":
            response_data = {"mandate_valid": bool(agent.current_mandate and verify_mandate_integrity(agent.current_mandate))}
        elif operation == "RISK":
            snapshot = calculate_and_save_risk_profile(agent)
            endpoint = f"/api/v1/agents/{agent.id}/risk/recalculate"
            response_data = {"risk_score": str(snapshot.weighted_risk_score), "components": 5}
        elif operation in ["DRAW", "OVER_LIMIT", "DENIED_CATEGORY"]:
            account = agent.credit_account
            amount = Decimal("900.00") if session.scenario_key == "success_cycle" else Decimal("700.00") if session.scenario_key == "inflight_freeze" else Decimal("500.00")
            category = "API_SERVICES"
            if operation == "OVER_LIMIT":
                amount = account.available_credit + Decimal("1.00")
                category = "CLOUD_SERVICES"
            if operation == "DENIED_CATEGORY":
                amount = Decimal("100.00")
                category = "CRYPTO_EXCHANGE"
            endpoint = "/api/v1/draws"
            request_data = {"agent_id": str(agent.id), "amount": str(amount), "merchant_category": category}
            checks = GATEWAY_CHECKS
            draw = process_draw_request(agent, amount, "Bot-led Demo Vendor", category, f"demo-{session.id}-{sequence}")
            context["draw_id"] = str(draw.id)
            response_data = {"draw_id": str(draw.id), "status": draw.status}
            semantic = "ACCEPTED"
            transport = 201
        elif operation == "SETTLE":
            draw = _active_draw(context)
            if not draw:
                raise APIError("DEMO_STATE_INVALID", "No active draw exists for this step.")
            endpoint = f"/api/v1/draws/{draw.id}/advance"
            draw = advance_draw_settlement(draw)
            response_data = {"draw_id": str(draw.id), "status": draw.status, "reason": draw.rejection_reason}
            semantic = "REVOKED" if draw.status == "REVOKED" else "SETTLED"
        elif operation == "FREEZE":
            endpoint = f"/api/v1/agents/{agent.id}/freeze"
            transition_authority_state(agent, "FROZEN", "PRINCIPAL_DEMO_FREEZE", "Northstar froze the line before settlement.", "PRINCIPAL", str(agent.principal_id))
            response_data = {"authority": "FROZEN"}
            semantic = "FROZEN"
        elif operation == "RESTRICT":
            endpoint = f"/api/v1/agents/{agent.id}/restrict"
            transition_authority_state(agent, "RESTRICTED", "DENIED_CATEGORY_PRESSURE", "Denied-category request triggered restriction.", "SYSTEM")
            response_data = {"authority": "RESTRICTED"}
            semantic = "RESTRICTED"
        elif operation in ["REPAY_SUCCESS", "REPAY_FAIL"]:
            draw = _active_draw(context)
            schedule = RepaymentSchedule.objects.filter(draw=draw).first()
            if not schedule:
                raise APIError("DEMO_STATE_INVALID", "No repayment schedule exists for this step.")
            force = "SUCCESS" if operation == "REPAY_SUCCESS" else "INSUFFICIENT_FUNDS"
            endpoint = f"/api/v1/repayments/{schedule.id}/attempt"
            attempt = process_repayment_attempt(schedule, force_status=force)
            response_data = {"attempt_id": str(attempt.id), "status": attempt.status, "reason": attempt.failure_reason}
            semantic = "REPAID" if force == "SUCCESS" else "FAILED_AND_FROZEN"
        elif operation == "RECALCULATE":
            endpoint = f"/api/v1/agents/{agent.id}/risk/recalculate"
            change = CreditLimitChange.objects.filter(credit_account=agent.credit_account).order_by("-created_at").first()
            if not change:
                raise APIError("DEMO_STATE_INVALID", "The repayment did not produce a credit-limit record.")
            response_data = {"previous_limit": str(change.previous_limit), "new_limit": str(change.new_limit), "alpha": str(change.alpha)}
            semantic = "LIMIT_UPDATED"
        elif operation == "VERIFY":
            response_data = {"audit": verify_audit_chain(), "authority": agent.status}
    except APIError as exc:
        transport = exc.status_code
        semantic = "REJECTED"
        response_data = {"error": {"code": exc.code, "message": exc.message, "details": exc.details}}
        if operation not in ["OVER_LIMIT", "DENIED_CATEGORY"]:
            session.status = "FAILED"

    after = agent_state(agent)
    audit_sequence = _latest_audit_sequence()
    plain_language = {
        "ACCEPTED": "The gateway accepted the request and reserved funds atomically.",
        "REJECTED": "The gateway refused the bot's request before exposure changed.",
        "SETTLED": "The reserved purchase settled and became principal exposure.",
        "REVOKED": "The principal freeze stopped settlement and released the reservation.",
        "REPAID": "The mandate pull repaid the balance without relying on the bot.",
        "FAILED_AND_FROZEN": "The bank rail reported failure and TrustLine froze new spending.",
        "LIMIT_UPDATED": "Verified success adjusted the limit using the slow trust-growth rate.",
        "FROZEN": "Northstar removed spending authority immediately.",
        "RESTRICTED": "TrustLine reduced authority after policy pressure.",
        "VERIFIED": "TrustLine verified the evidence required for this stage.",
    }[semantic]
    DemoStepResult.objects.create(
        session=session, sequence=sequence, actor=actor, action=action, endpoint=endpoint,
        transport_status=transport, semantic_result=semantic, plain_language=plain_language,
        proof=proof, request_evidence=request_data, response_evidence=response_data,
        balance_before=before, balance_after=after, gateway_checks=checks,
        audit_sequence=audit_sequence,
    )
    context.update(after)
    session.current_step = sequence
    session.final_state = context
    if sequence == len(scenario["steps"]) and session.status != "FAILED":
        session.status = "COMPLETED"
        session.completed_at = timezone.now()
        append_audit_event("DEMO_SCENARIO_COMPLETED", "SYSTEM", str(session.id), "DEMO_SESSION", str(session.id), {"scenario": session.scenario_key, "agent_id": str(agent.id)})
    elif session.status != "FAILED":
        session.status = "RUNNING"
    session.save(update_fields=["current_step", "final_state", "status", "completed_at", "updated_at"])
    return session


def replay_session(session):
    if session.steps.exists():
        raise APIError("DEMO_RESET_REQUIRED", "Reset the demo before replaying a state-changing scenario.", status_code=409)
    session.current_step = 0
    session.status = "READY"
    session.final_state = session.initial_state
    session.completed_at = None
    session.save()
    return session
