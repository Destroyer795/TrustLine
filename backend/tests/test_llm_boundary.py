from decimal import Decimal
from types import SimpleNamespace

import pytest

from backend.apps.demo.llm_explainer import generate_risk_explanation_narrative


@pytest.mark.django_db
def test_missing_gemini_key_uses_deterministic_fallback(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    agent = SimpleNamespace(display_name="Test Agent")
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
