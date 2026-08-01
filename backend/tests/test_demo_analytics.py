from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from backend.apps.audit.models import AuditEvent
from backend.apps.demo.models import DemoSession, DemoStepResult
from backend.apps.gateway.models import DrawRequest
from backend.apps.identity.models import Agent
from scripts.demo_reset import run_reset


@pytest.mark.django_db(transaction=True)
@pytest.mark.parametrize("scenario_key,expected", [
    ("success_cycle", "REPAID"),
    ("cold_start", "REJECTED"),
    ("capability_restriction", "RESTRICTED"),
    ("inflight_freeze", "REVOKED"),
    ("failed_repayment", "FAILED_AND_FROZEN"),
])
def test_every_story_records_real_step_evidence(scenario_key, expected):
    run_reset()
    client = APIClient()
    created = client.post("/api/v1/demo/sessions", {"scenario_key": scenario_key}, format="json", secure=True)
    assert created.status_code == 201
    session = created.json()
    for _ in range(session["total_steps"]):
        advanced = client.post(f"/api/v1/demo/sessions/{session['id']}/advance", {}, format="json", secure=True)
        assert advanced.status_code == 200
        session = advanced.json()
    assert session["status"] == "COMPLETED"
    assert expected in [step["semantic_result"] for step in session["steps"]]
    assert DemoSession.objects.filter(id=session["id"]).exists()
    assert DemoStepResult.objects.filter(session_id=session["id"]).count() == session["total_steps"]


@pytest.mark.django_db(transaction=True)
def test_cold_start_rejection_preserves_balances_and_transport_status():
    run_reset()
    client = APIClient()
    scout = Agent.objects.get(display_name="Scout Research Bot")
    account = scout.credit_account
    before = (account.reserved_amount, account.outstanding_principal, DrawRequest.objects.filter(credit_account=account).count())
    session = client.post("/api/v1/demo/sessions", {"scenario_key": "cold_start"}, format="json", secure=True).json()
    client.post(f"/api/v1/demo/sessions/{session['id']}/advance", {}, format="json", secure=True)
    result = client.post(f"/api/v1/demo/sessions/{session['id']}/advance", {}, format="json", secure=True).json()
    rejected = result["steps"][-1]
    account.refresh_from_db()
    after = (account.reserved_amount, account.outstanding_principal, DrawRequest.objects.filter(credit_account=account).count())
    assert rejected["transport_status"] == 402
    assert rejected["response"]["error"]["code"] == "CREDIT_LIMIT_EXCEEDED"
    assert before == after


@pytest.mark.django_db(transaction=True)
def test_portfolio_totals_and_simulator_are_non_mutating():
    run_reset()
    client = APIClient()
    response = client.get("/api/v1/analytics/portfolio", secure=True)
    assert response.status_code == 200
    payload = response.json()
    accounts = [agent.credit_account for agent in Agent.objects.all()]
    assert Decimal(payload["summary"]["current_limits"]) == sum((account.current_credit_limit for account in accounts), Decimal("0"))
    scout = Agent.objects.get(display_name="Scout Research Bot")
    before = (scout.status, scout.credit_account.reserved_amount, DrawRequest.objects.count(), AuditEvent.objects.count())
    simulation = client.post(f"/api/v1/agents/{scout.id}/simulate", {"amount": "100.00", "merchant_category": "API_SERVICES", "repayment_outcome": "FAIL"}, format="json", secure=True)
    assert simulation.status_code == 200
    assert simulation.json()["mutated"] is False
    scout.refresh_from_db()
    scout.credit_account.refresh_from_db()
    after = (scout.status, scout.credit_account.reserved_amount, DrawRequest.objects.count(), AuditEvent.objects.count())
    assert before == after


@pytest.mark.django_db(transaction=True)
def test_seed_is_deterministic_in_shape_and_provides_30_day_history():
    run_reset()
    first = [(agent.display_name, agent.risk_snapshots.count(), agent.credit_account.limit_changes.count()) for agent in Agent.objects.order_by("display_name")]
    run_reset()
    second = [(agent.display_name, agent.risk_snapshots.count(), agent.credit_account.limit_changes.count()) for agent in Agent.objects.order_by("display_name")]
    assert first == second
    assert {name for name, _, _ in first} == {"Atlas Procurement Bot", "Scout Research Bot", "Vector Arbitrage Bot"}
    assert all(risk_points >= 4 for _, risk_points, _ in first)
