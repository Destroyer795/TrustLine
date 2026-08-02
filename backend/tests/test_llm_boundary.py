from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from backend.apps.demo.llm_explainer import generate_risk_explanation_narrative


@pytest.mark.django_db
def test_missing_all_keys_uses_deterministic_fallback(monkeypatch):
    monkeypatch.delenv("LYZR_API_KEY", raising=False)
    monkeypatch.delenv("LYZR_AGENT_ID", raising=False)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)

    agent = SimpleNamespace(id="test-agent-id", display_name="Test Agent", status="NORMAL")
    snapshot = SimpleNamespace(
        weighted_risk_score=Decimal("42.00"),
        task_reliability=Decimal("0.50"),
        repayment_reliability=Decimal("0.80"),
        repayment_imputed=True,
        spending_regularity=Decimal("0.70"),
        spending_imputed=True,
        current_exposure_utilization=Decimal("12.00"),
    )

    result = generate_risk_explanation_narrative(agent, snapshot)

    assert result["source"] == "DETERMINISTIC_FALLBACK"
    assert result["is_llm_generated"] is False
    assert "42.00/100" in result["narrative"]


@pytest.mark.django_db
def test_lyzr_provider_primary(monkeypatch):
    monkeypatch.setenv("LYZR_API_KEY", "mock-lyzr-key")
    monkeypatch.setenv("LYZR_AGENT_ID", "mock-lyzr-agent")

    mock_payload = {
        "summary": "Lyzr generated summary",
        "evidence": ["Evidence item 1"],
        "outcome": "APPROVED code DRAW_RESERVED",
        "review": "None",
    }
    monkeypatch.setattr("backend.apps.demo.llm_explainer.generate_lyzr_explanation", lambda facts: mock_payload)

    agent = SimpleNamespace(id="agent-lyzr-test", display_name="Lyzr Agent", status="NORMAL")
    snapshot = SimpleNamespace(
        weighted_risk_score=Decimal("15.00"),
        task_reliability=Decimal("0.90"),
        repayment_reliability=Decimal("0.95"),
        repayment_imputed=False,
        spending_regularity=Decimal("0.85"),
        spending_imputed=False,
        current_exposure_utilization=Decimal("5.00"),
    )

    result = generate_risk_explanation_narrative(agent, snapshot)

    assert result["source"] == "LYZR:v3"
    assert result["is_llm_generated"] is True
    assert result["narrative"] == "Lyzr generated summary"


@pytest.mark.django_db
def test_lyzr_failure_falls_back_to_gemini(monkeypatch):
    monkeypatch.setenv("LYZR_API_KEY", "mock-lyzr-key")
    monkeypatch.setenv("LYZR_AGENT_ID", "mock-lyzr-agent")
    monkeypatch.setenv("GEMINI_API_KEY", "mock-gemini-key")

    # Lyzr returns None (simulating timeout or invalid response)
    monkeypatch.setattr("backend.apps.demo.llm_explainer.generate_lyzr_explanation", lambda facts: None)

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "candidates": [{"content": {"parts": [{"text": "Gemini generated summary"}]}}]
    }
    monkeypatch.setattr("requests.post", lambda *args, **kwargs: mock_resp)

    agent = SimpleNamespace(id="agent-gemini-fallback", display_name="Gemini Fallback Agent", status="NORMAL")
    snapshot = SimpleNamespace(
        weighted_risk_score=Decimal("25.00"),
        task_reliability=Decimal("0.80"),
        repayment_reliability=Decimal("0.85"),
        repayment_imputed=False,
        spending_regularity=Decimal("0.80"),
        spending_imputed=False,
        current_exposure_utilization=Decimal("10.00"),
    )

    result = generate_risk_explanation_narrative(agent, snapshot)

    assert result["source"].startswith("GEMINI:")
    assert result["is_llm_generated"] is True
    assert result["narrative"] == "Gemini generated summary"
