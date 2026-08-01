import secrets
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from backend.common.money import quantize_money
from backend.common.errors import APIError
from backend.apps.repayment.models import RepaymentSchedule, RepaymentAttempt
from backend.apps.gateway.models import DrawRequest, LedgerEntry
from backend.apps.credit.models import CreditAccount
from backend.apps.credit.services import update_credit_limit
from backend.apps.monitoring.services import transition_authority_state
from backend.apps.audit.services import append_audit_event

def create_repayment_schedule_for_draw(draw: DrawRequest, due_days: int = 7) -> RepaymentSchedule:
    """Creates a scheduled repayment mandate pull for a settled draw."""
    mandate = draw.credit_account.agent.current_mandate
    if not mandate:
        raise APIError("MANDATE_MISSING", "Agent lacks active mandate for repayment schedule.", status_code=400)

    now = timezone.now()
    due_date = now + timezone.timedelta(days=due_days)

    schedule = RepaymentSchedule.objects.create(
        draw=draw,
        linked_account=mandate.linked_account,
        amount=draw.amount,
        due_date=due_date,
        status="SCHEDULED"
    )
    return schedule

def execute_simulated_bank_pull(linked_account, amount: Decimal) -> tuple[str, str, str]:
    """
    Simulated bank rail execution adapter.
    Controllable states: ACTIVE (Sufficient/Insufficient based on mock_balance), BLOCKED, CHANGED.
    """
    amount = quantize_money(amount)
    ref = f"BANK_TX_{secrets.token_hex(8).upper()}"
    
    if linked_account.status == "BLOCKED":
        return "ACCOUNT_BLOCKED", ref, "Simulated debit failed: Account is blocked by institution."
    if linked_account.status == "CHANGED":
        return "MANDATE_INVALID", ref, "Simulated debit failed: Principal swapped linked account reference."
        
    if linked_account.mock_balance < amount:
        return "INSUFFICIENT_FUNDS", ref, f"Simulated debit failed: Account balance (₹{linked_account.mock_balance}) is less than required ₹{amount}."
        
    # Deduct mock balance
    linked_account.mock_balance -= amount
    linked_account.save(update_fields=["mock_balance"])
    return "SUCCESS", ref, "Simulated bank mandate pull executed successfully."

def process_repayment_attempt(schedule: RepaymentSchedule, force_status: str = None) -> RepaymentAttempt:
    """
    Executes repayment pull, updates credit line, and triggers state transition if failure occurs.
    """
    with transaction.atomic():
        account = CreditAccount.objects.select_for_update().get(id=schedule.draw.credit_account.id)
        agent = account.agent
        linked_acct = schedule.linked_account

        if force_status:
            status_code = force_status
            tx_ref = f"FORCE_TX_{secrets.token_hex(6).upper()}"
            reason = f"Forced demo test outcome: {force_status}"
            if status_code == "SUCCESS" and linked_acct.mock_balance >= schedule.amount:
                linked_acct.mock_balance -= schedule.amount
                linked_acct.save(update_fields=["mock_balance"])
        else:
            status_code, tx_ref, reason = execute_simulated_bank_pull(linked_acct, schedule.amount)

        attempt = RepaymentAttempt.objects.create(
            schedule=schedule,
            amount_pulled=schedule.amount,
            status=status_code,
            bank_transaction_ref=tx_ref,
            failure_reason=reason
        )

        if status_code == "SUCCESS":
            schedule.status = "SETTLED"
            schedule.save(update_fields=["status", "updated_at"])

            # Reduce outstanding principal balance
            account.outstanding_principal = max(Decimal('0.00'), account.outstanding_principal - schedule.amount)
            account.save(update_fields=["outstanding_principal", "updated_at"])

            # Ledger entry
            LedgerEntry.objects.create(
                credit_account=account,
                draw_request=schedule.draw,
                entry_type="REPAYMENT_CREDIT",
                amount=schedule.amount,
                running_outstanding_balance=account.outstanding_principal
            )

            # Update Risk & Credit limit
            update_credit_limit(account, trigger="REPAYMENT_SUCCESS", reason=f"Successful repayment of ₹{schedule.amount}")

            append_audit_event(
                event_type="REPAYMENT_SUCCESS",
                actor_type="BANK_ADAPTER",
                actor_id=tx_ref,
                entity_type="REPAYMENT_SCHEDULE",
                entity_id=str(schedule.id),
                payload={
                    "schedule_id": str(schedule.id),
                    "amount": str(schedule.amount),
                    "outstanding_principal": str(account.outstanding_principal)
                }
            )

        else:
            # Repayment Failure! Instant Line Freeze & Escalation Trigger
            schedule.status = "FAILED"
            schedule.save(update_fields=["status", "updated_at"])

            # Transition Authority State to FROZEN
            transition_authority_state(
                agent=agent,
                next_state="FROZEN",
                trigger_code="REPAYMENT_FAILURE",
                reason=f"Automated mandate debit failed: {reason}",
                actor_type="SYSTEM",
                actor_id="REPAYMENT_WORKER"
            )

            # Recalculate Risk & drop Credit Limit
            update_credit_limit(account, trigger="REPAYMENT_FAILURE", reason=f"Failed repayment of ₹{schedule.amount}: {reason}")

            append_audit_event(
                event_type="REPAYMENT_FAILURE",
                actor_type="BANK_ADAPTER",
                actor_id=tx_ref,
                entity_type="REPAYMENT_SCHEDULE",
                entity_id=str(schedule.id),
                payload={
                    "schedule_id": str(schedule.id),
                    "amount": str(schedule.amount),
                    "failure_reason": reason,
                    "new_agent_status": agent.status
                }
            )

        return attempt
