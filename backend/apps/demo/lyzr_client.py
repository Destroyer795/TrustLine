from __future__ import annotations

import json
import os
import uuid
from typing import Any

import requests


class LyzrError(RuntimeError):
    pass


def _compact_message(facts: dict[str, Any]) -> str:
    encoded = json.dumps(
        facts,
        separators=(",", ":"),
        ensure_ascii=True,
    )
    return (
        "Explain these pre-computed TrustLine facts.\n"
        f"FACTS_BEGIN\n{encoded}\nFACTS_END"
    )


def _extract_payload(data: dict[str, Any]) -> dict[str, Any]:
    raw = data.get("response")

    if isinstance(raw, dict):
        parsed = raw
    elif isinstance(raw, str):
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError as exc:
            raise LyzrError("Lyzr returned invalid JSON inside response string") from exc

        if not isinstance(parsed, dict):
            raise LyzrError("Lyzr response string did not parse to a JSON object")
    else:
        raise LyzrError("Lyzr response field is missing or invalid type")

    # Normalize key aliases (e.g. key_evidence -> evidence, deterministic_outcome -> outcome, human_review -> review)
    normalized = {
        "summary": parsed.get("summary"),
        "evidence": parsed.get("evidence") if "evidence" in parsed else parsed.get("key_evidence"),
        "outcome": parsed.get("outcome") if "outcome" in parsed else parsed.get("deterministic_outcome"),
        "review": parsed.get("review") if "review" in parsed else parsed.get("human_review"),
    }

    return normalized


def validate_lyzr_explanation(
    payload: dict[str, Any],
    facts: dict[str, Any],
) -> bool:
    """
    Semantic boundary validation: Ensures Lyzr explanation does not hallucinate
    a conflicting decision or alter the deterministic outcome code.
    """
    outcome = payload.get("outcome")
    if not isinstance(outcome, str):
        return False

    expected_decision = str(facts.get("decision", ""))
    expected_code = str(facts.get("decision_code", ""))

    if expected_decision and expected_decision not in outcome:
        # Also check combined payload in case decision string is elsewhere in payload
        combined = json.dumps(payload, ensure_ascii=False)
        if expected_decision not in combined:
            return False

    if expected_code and expected_code not in outcome:
        combined = json.dumps(payload, ensure_ascii=False)
        if expected_code not in combined:
            return False

    combined_text = json.dumps(payload, ensure_ascii=False)

    forbidden_decisions = {
        "APPROVED",
        "REJECTED",
        "HUMAN_REVIEW",
    } - {expected_decision}

    if any(forbidden in combined_text for forbidden in forbidden_decisions):
        return False

    return True


def generate_lyzr_explanation(
    facts: dict[str, Any],
) -> dict[str, Any] | None:
    """
    Calls Lyzr AI v3 inference API to generate a structured risk explanation.
    Returns normalized payload dict or None if unconfigured/invalid/failed.
    """
    api_key = os.getenv("LYZR_API_KEY", "").strip()
    agent_id = os.getenv("LYZR_AGENT_ID", "").strip()
    api_url = os.getenv(
        "LYZR_API_URL",
        "https://agent-prod.studio.lyzr.ai/v3/inference/chat/",
    ).strip()

    if not api_key or not agent_id:
        return None

    try:
        timeout = float(os.getenv("LYZR_TIMEOUT_SECONDS", "8"))
    except ValueError:
        timeout = 8.0

    try:
        response = requests.post(
            api_url,
            headers={
                "Content-Type": "application/json",
                "x-api-key": api_key,
            },
            json={
                "user_id": "trustline-backend",
                "agent_id": agent_id,
                "session_id": f"trustline-{uuid.uuid4()}",
                "message": _compact_message(facts),
            },
            timeout=timeout,
        )
        response.raise_for_status()
        payload = _extract_payload(response.json())
    except (
        requests.RequestException,
        ValueError,
        TypeError,
        LyzrError,
    ):
        return None

    required_keys = {"summary", "evidence", "outcome", "review"}
    if set(payload.keys()) != required_keys:
        return None

    if not isinstance(payload["summary"], str):
        return None

    if not isinstance(payload["evidence"], list):
        return None

    if not all(isinstance(item, str) for item in payload["evidence"]):
        return None

    if not isinstance(payload["outcome"], str):
        return None

    if not isinstance(payload["review"], str):
        return None

    if not validate_lyzr_explanation(payload, facts):
        return None

    return payload
