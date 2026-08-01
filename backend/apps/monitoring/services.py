from django.db import transaction
from backend.common.errors import APIError
from backend.apps.identity.models import Agent
from backend.apps.monitoring.models import AuthorityStateTransition, Escalation
from backend.apps.audit.services import append_audit_event

VALID_STATES = ["NORMAL", "RESTRICTED", "FROZEN", "HUMAN_REVIEW"]

def transition_authority_state(agent: Agent, next_state: str, trigger_code: str, reason: str, actor_type: str = "SYSTEM", actor_id: str = "SYSTEM") -> AuthorityStateTransition:
    """Executes state transition for an agent's authority level."""
    if next_state not in VALID_STATES:
        raise APIError("INVALID_STATE", f"Target state '{next_state}' is invalid.", status_code=400)

    with transaction.atomic():
        prev_state = agent.status
        if prev_state == next_state:
            return None # No-op if already in state

        agent.status = next_state
        if next_state == "FROZEN":
            # Release any active uncommitted reservations
            from backend.apps.gateway.models import DrawReservation, DrawRequest
            from backend.apps.credit.models import CreditAccount
            from decimal import Decimal

            reservations = DrawReservation.objects.filter(draw_request__credit_account__agent=agent, status="HELD")
            for res in reservations:
                res.status = "RELEASED"
                res.save(update_fields=["status"])
                draw = res.draw_request
                draw.status = "REVOKED"
                draw.rejection_reason = f"Revoked due to agent authority state freeze ({trigger_code})"
                draw.save(update_fields=["status", "rejection_reason", "updated_at"])

            credit_acct = getattr(agent, 'credit_account', None)
            if credit_acct:
                credit_acct.reserved_amount = Decimal('0.00')
                credit_acct.save(update_fields=["reserved_amount", "updated_at"])

        agent.save(update_fields=["status"])

        transition = AuthorityStateTransition.objects.create(
            agent=agent,
            previous_state=prev_state,
            next_state=next_state,
            trigger_code=trigger_code,
            reason=reason,
            actor_type=actor_type,
            actor_id=actor_id
        )

        if next_state in ["FROZEN", "HUMAN_REVIEW"]:
            Escalation.objects.create(
                agent=agent,
                trigger_code=trigger_code,
                severity="HIGH" if next_state == "FROZEN" else "MEDIUM",
                description=f"State transitioned from {prev_state} to {next_state}: {reason}",
                status="OPEN"
            )

        append_audit_event(
            event_type="AUTHORITY_STATE_TRANSITION",
            actor_type=actor_type,
            actor_id=actor_id,
            entity_type="AGENT",
            entity_id=str(agent.id),
            payload={
                "agent_id": str(agent.id),
                "previous_state": prev_state,
                "next_state": next_state,
                "trigger_code": trigger_code,
                "reason": reason
            }
        )

        return transition
