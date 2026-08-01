from decimal import Decimal

from django.db.models import Count, Sum
from django.utils import timezone

from backend.apps.audit.models import AuditEvent
from backend.apps.gateway.models import DrawRequest, LedgerEntry
from backend.apps.identity.models import Agent
from backend.apps.monitoring.models import AuthorityStateTransition
from backend.apps.repayment.models import RepaymentAttempt
from backend.common.money import quantize_money


def _money(value):
    return str(quantize_money(value or Decimal("0.00")))


def portfolio_analytics():
    agents = Agent.objects.select_related("principal", "credit_account").all()
    rows = []
    totals = {"authorized": Decimal("0"), "limit": Decimal("0"), "reserved": Decimal("0"), "outstanding": Decimal("0")}
    authority_counts = {}
    for agent in agents:
        account = getattr(agent, "credit_account", None)
        if not account:
            continue
        totals["authorized"] += account.principal_authorized_ceiling
        totals["limit"] += account.current_credit_limit
        totals["reserved"] += account.reserved_amount
        totals["outstanding"] += account.outstanding_principal
        authority_counts[agent.status] = authority_counts.get(agent.status, 0) + 1
        rows.append({
            "agent_id": str(agent.id), "agent_name": agent.display_name,
            "principal_name": agent.principal.name, "authority": agent.status,
            "limit": _money(account.current_credit_limit), "available": _money(account.available_credit),
            "reserved": _money(account.reserved_amount), "outstanding": _money(account.outstanding_principal),
            "utilization_pct": str(round(((account.reserved_amount + account.outstanding_principal) / account.current_credit_limit * 100) if account.current_credit_limit else 0, 2)),
        })
    used = totals["reserved"] + totals["outstanding"]
    categories = list(DrawRequest.objects.values("merchant_category").annotate(amount=Sum("amount"), count=Count("id")).order_by("-amount"))
    recent_events = AuditEvent.objects.order_by("-sequence")[:12]
    return {
        "seeded_demo": True, "as_of": timezone.now().isoformat(),
        "summary": {
            "authorized_capital": _money(totals["authorized"]), "current_limits": _money(totals["limit"]),
            "available_credit": _money(totals["limit"] - used), "reserved_exposure": _money(totals["reserved"]),
            "outstanding_principal": _money(totals["outstanding"]),
            "utilization_pct": str(round((used / totals["limit"] * 100) if totals["limit"] else 0, 2)),
        },
        "authority_states": [{"state": key, "count": value} for key, value in sorted(authority_counts.items())],
        "exposure_by_bot": rows,
        "merchant_categories": [{"category": item["merchant_category"], "amount": _money(item["amount"]), "count": item["count"]} for item in categories],
        "recent_events": [{"sequence": event.sequence, "type": event.event_type, "entity": event.entity_type, "created_at": event.created_at.isoformat()} for event in recent_events],
    }


def agent_analytics(agent, window="30d"):
    days = {"7d": 7, "30d": 30}.get(window)
    since = timezone.now() - timezone.timedelta(days=days) if days else None
    snapshots = agent.risk_snapshots.order_by("created_at")
    changes = agent.credit_account.limit_changes.order_by("created_at")
    ledger = agent.credit_account.ledger_entries.order_by("created_at")
    draws = agent.credit_account.draw_requests.order_by("created_at")
    transitions = agent.state_transitions.order_by("created_at")
    if since:
        snapshots, changes, ledger, draws, transitions = (
            snapshots.filter(created_at__gte=since), changes.filter(created_at__gte=since),
            ledger.filter(created_at__gte=since), draws.filter(created_at__gte=since), transitions.filter(created_at__gte=since),
        )
    categories = list(draws.values("merchant_category").annotate(amount=Sum("amount"), count=Count("id")).order_by("-amount"))
    outcomes = list(draws.values("status").annotate(count=Count("id"), amount=Sum("amount")).order_by("status"))
    attempts = RepaymentAttempt.objects.filter(schedule__draw__credit_account__agent=agent)
    if since:
        attempts = attempts.filter(attempted_at__gte=since)
    repayment_outcomes = list(attempts.values("status").annotate(count=Count("id"), amount=Sum("amount_pulled")).order_by("status"))
    account = agent.credit_account
    return {
        "seeded_demo": True, "agent_id": str(agent.id), "agent_name": agent.display_name,
        "principal_name": agent.principal.name, "window": window, "as_of": timezone.now().isoformat(),
        "summary": {
            "authority": agent.status, "limit": _money(account.current_credit_limit), "available": _money(account.available_credit),
            "reserved": _money(account.reserved_amount), "outstanding": _money(account.outstanding_principal),
            "floor": _money(account.cold_start_floor), "ceiling": _money(account.principal_authorized_ceiling),
        },
        "risk_history": [{
            "at": item.created_at.isoformat(), "score": str(item.weighted_risk_score),
            "identity": str(item.identity_confidence), "task": str(item.task_reliability),
            "repayment": str(item.repayment_reliability), "spending": str(item.spending_regularity),
            "exposure_utilization": str(item.current_exposure_utilization),
        } for item in snapshots],
        "limit_history": [{"at": item.created_at.isoformat(), "previous": _money(item.previous_limit), "target": _money(item.target_limit), "limit": _money(item.new_limit), "trigger": item.trigger} for item in changes],
        "exposure_history": [{"at": item.created_at.isoformat(), "balance": _money(item.running_outstanding_balance), "amount": _money(item.amount), "type": item.entry_type} for item in ledger],
        "merchant_categories": [{"category": item["merchant_category"], "amount": _money(item["amount"]), "count": item["count"]} for item in categories],
        "draw_outcomes": [{"status": item["status"], "count": item["count"], "amount": _money(item["amount"])} for item in outcomes],
        "repayment_outcomes": [{"status": item["status"], "count": item["count"], "amount": _money(item["amount"])} for item in repayment_outcomes],
        "authority_transitions": [{"at": item.created_at.isoformat(), "from": item.previous_state, "to": item.next_state, "trigger": item.trigger_code, "reason": item.reason} for item in transitions],
        "transactions": [{"id": str(item.id), "at": item.created_at.isoformat(), "merchant": item.merchant_name, "category": item.merchant_category, "amount": _money(item.amount), "status": item.status, "reason": item.rejection_reason} for item in draws.order_by("-created_at")[:50]],
    }


def simulate_draw(agent, amount, merchant_category, repayment_outcome="SUCCESS"):
    amount = quantize_money(amount)
    if amount <= 0:
        return {"decision": "REJECTED", "code": "INVALID_AMOUNT", "checks": [], "projected": {}}
    account = agent.credit_account
    mandate = agent.current_mandate
    manifest = agent.manifests.order_by("-manifest_version").first()
    today = timezone.now().date()
    daily_total = agent.credit_account.draw_requests.filter(created_at__date=today, status__in=["RESERVED", "SETTLED", "SETTLING"]).aggregate(total=Sum("amount"))["total"] or Decimal("0")
    principal_exposure = sum((item.reserved_amount + item.outstanding_principal for item in type(account).objects.filter(agent__principal=agent.principal)), Decimal("0"))
    checks = [
        ("Authority state", agent.status in ["NORMAL", "RESTRICTED"], agent.status),
        ("Principal binding", bool(mandate and mandate.principal_id == agent.principal_id), "Signed mandate bound to principal"),
        ("Validity window", bool(mandate and mandate.not_before <= timezone.now() <= mandate.expires_at and not mandate.is_revoked), "Mandate active"),
        ("Merchant category", bool(manifest and merchant_category in manifest.allowed_categories and merchant_category not in manifest.denied_categories), merchant_category),
        ("Transaction cap", bool(manifest and amount <= manifest.max_per_transaction), _money(manifest.max_per_transaction if manifest else 0)),
        ("Daily velocity", bool(manifest and daily_total + amount <= manifest.max_per_day), _money(daily_total)),
        ("Available credit", amount <= account.available_credit, _money(account.available_credit)),
        ("Principal-wide exposure", principal_exposure + amount <= agent.principal.credit_pool_ceiling, _money(agent.principal.credit_pool_ceiling)),
    ]
    first_failure = next((name for name, passed, _ in checks if not passed), None)
    accepted = first_failure is None
    projected_authority = "FROZEN" if accepted and repayment_outcome == "FAIL" else agent.status
    return {
        "decision": "ACCEPTED" if accepted else "REJECTED",
        "code": "WOULD_ACCEPT" if accepted else first_failure.upper().replace(" ", "_") + "_FAILED",
        "checks": [{"name": name, "passed": passed, "detail": detail} for name, passed, detail in checks],
        "projected": {
            "authority": projected_authority,
            "available_after_reservation": _money(account.available_credit - amount if accepted else account.available_credit),
            "outstanding_after_settlement": _money(account.outstanding_principal + amount if accepted else account.outstanding_principal),
            "limit_effect": "slow_upward_recalculation" if repayment_outcome == "SUCCESS" else "fast_downward_recalculation",
        },
        "mutated": False,
    }
