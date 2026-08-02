import pytest
from unittest.mock import MagicMock

from backend.apps.demo.lyzr_client import (
    LyzrError,
    _extract_payload,
    generate_lyzr_explanation,
    validate_lyzr_explanation,
)


def test_extract_payload_dict():
    raw_data = {
        "response": {
            "summary": "Agent is active",
            "evidence": ["Active status"],
            "outcome": "Decision APPROVED code DRAW_RESERVED",
            "review": "Not required",
        }
    }
    extracted = _extract_payload(raw_data)
    assert extracted["summary"] == "Agent is active"
    assert extracted["evidence"] == ["Active status"]


def test_extract_payload_json_string():
    raw_data = {
        "response": '{"summary":"Agent active","key_evidence":["Active status"],"deterministic_outcome":"APPROVED code DRAW_RESERVED","human_review":"Not required"}'
    }
    extracted = _extract_payload(raw_data)
    assert extracted["summary"] == "Agent active"
    assert extracted["evidence"] == ["Active status"]
    assert extracted["outcome"] == "APPROVED code DRAW_RESERVED"
    assert extracted["review"] == "Not required"


def test_extract_payload_invalid_json():
    raw_data = {"response": "invalid json string {"}
    with pytest.raises(LyzrError):
        _extract_payload(raw_data)


def test_validate_lyzr_explanation_valid():
    facts = {
        "decision": "APPROVED",
        "decision_code": "DRAW_RESERVED",
    }
    payload = {
        "summary": "Agent active",
        "evidence": ["Active status"],
        "outcome": "The decision is APPROVED under code DRAW_RESERVED.",
        "review": "None",
    }
    assert validate_lyzr_explanation(payload, facts) is True


def test_validate_lyzr_explanation_forbidden_decision_hallucination():
    facts = {
        "decision": "APPROVED",
        "decision_code": "DRAW_RESERVED",
    }
    payload = {
        "summary": "Agent active",
        "evidence": ["Active status"],
        "outcome": "The decision was REJECTED because limits were exceeded.",
        "review": "None",
    }
    # Should fail validation because forbidden decision "REJECTED" appears
    assert validate_lyzr_explanation(payload, facts) is False


def test_generate_lyzr_explanation_missing_keys(monkeypatch):
    monkeypatch.delenv("LYZR_API_KEY", raising=False)
    monkeypatch.delenv("LYZR_AGENT_ID", raising=False)

    facts = {"decision": "APPROVED", "decision_code": "DRAW_RESERVED"}
    assert generate_lyzr_explanation(facts) is None


def test_generate_lyzr_explanation_success(monkeypatch):
    monkeypatch.setenv("LYZR_API_KEY", "test-key")
    monkeypatch.setenv("LYZR_AGENT_ID", "test-agent-id")

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "response": {
            "summary": "Agent is in good standing.",
            "evidence": ["Reliability high"],
            "outcome": "The decision is APPROVED under code DRAW_RESERVED.",
            "review": "Not required.",
        }
    }
    mock_resp.raise_for_status.return_value = None

    monkeypatch.setattr("requests.post", lambda *args, **kwargs: mock_resp)

    facts = {"decision": "APPROVED", "decision_code": "DRAW_RESERVED"}
    result = generate_lyzr_explanation(facts)

    assert result is not None
    assert result["summary"] == "Agent is in good standing."
    assert result["outcome"] == "The decision is APPROVED under code DRAW_RESERVED."
