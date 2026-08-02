from __future__ import annotations

import os
from typing import Any
import requests

from backend.apps.demo.lyzr_client import generate_lyzr_explanation

_EXPLANATION_CACHE: dict[str, dict[str, Any]] = {}


def build_allowlisted_facts(agent: Any, snapshot: Any) -> dict[str, Any]:
    """
    Builds a minimal, allowlisted facts dictionary from deterministic models.
    No sensitive keys, mandates, credentials, or stack traces are included.
    """
    agent_id = str(getattr(agent, "id", "unknown-agent"))
    status = str(getattr(agent, "status", "NORMAL"))
    risk_score = str(getattr(snapshot, "weighted_risk_score", "0.00"))

    credit_account = getattr(agent, "credit_account", None)
    if credit_account:
        effective_limit = f"INR {getattr(credit_account, 'current_credit_limit', '10000.00')}"
        available_credit = f"INR {getattr(credit_account, 'available_credit', '7500.00')}"
    else:
        effective_limit = f"INR {getattr(snapshot, 'effective_limit', '10000.00')}"
        available_credit = f"INR {getattr(snapshot, 'available_credit', '7500.00')}"

    if status == "FROZEN":
        decision = "REJECTED"
        decision_code = "AGENT_FROZEN"
        review_required = False
    elif status == "HUMAN_REVIEW":
        decision = "HUMAN_REVIEW"
        decision_code = "PENDING_REVIEW"
        review_required = True
    elif status == "RESTRICTED":
        decision = "REJECTED"
        decision_code = "CREDIT_LIMIT_EXCEEDED"
        review_required = False
    else:
        decision = "APPROVED"
        decision_code = "DRAW_RESERVED"
        review_required = False

    task_rel = float(getattr(snapshot, "task_reliability", 0))
    repay_rel = float(getattr(snapshot, "repayment_reliability", 0))
    spend_reg = float(getattr(snapshot, "spending_regularity", 0))

    if task_rel >= repay_rel and task_rel >= spend_reg:
        strongest = "Task Reliability"
    elif repay_rel >= spend_reg:
        strongest = "Repayment Reliability"
    else:
        strongest = "Spending Regularity"

    return {
        "agent_id": agent_id,
        "authority": status,
        "risk_score": risk_score,
        "effective_limit": effective_limit,
        "available_credit": available_credit,
        "strongest_factor": strongest,
        "decision": decision,
        "decision_code": decision_code,
        "review_required": review_required,
    }


def generate_risk_explanation_narrative(agent: Any, snapshot: Any) -> dict[str, Any]:
    """
    Generates a human-readable risk narrative using a 3-tier provider chain:
    1. Lyzr AI (Structured narrator with semantic boundary validation & credit caching)
    2. Gemini AI (Secondary LLM narrator)
    3. Deterministic Fallback (Rule-based static narrative template)
    """
    display_name = getattr(agent, "display_name", "Agent")
    weighted_score = getattr(snapshot, "weighted_risk_score", "0.00")
    task_rel = float(getattr(snapshot, "task_reliability", 0)) * 100
    repay_rel = float(getattr(snapshot, "repayment_reliability", 0)) * 100
    spend_reg = float(getattr(snapshot, "spending_regularity", 0)) * 100
    utilization = float(getattr(snapshot, "current_exposure_utilization", 0))
    repay_imputed = getattr(snapshot, "repayment_imputed", True)
    spend_imputed = getattr(snapshot, "spending_imputed", True)

    fallback_text = (
        f"Agent '{display_name}' has a Weighted Risk Score of {weighted_score}/100. "
        f"Task Reliability is {task_rel:.0f}% (Earned), "
        f"Repayment Reliability is {repay_rel:.0f}% ({'Provisional' if repay_imputed else 'Earned'}), "
        f"and Spending Regularity is {spend_reg:.0f}% ({'Provisional' if spend_imputed else 'Earned'}). "
        f"Current exposure utilization is {utilization:.1f}%."
    )

    facts = build_allowlisted_facts(agent, snapshot)
    agent_id = facts["agent_id"]
    status = facts["authority"]
    decision_code = facts["decision_code"]

    # ----------------------------------------------------
    # Tier 1: Lyzr AI Narrator (with Cache Protection)
    # ----------------------------------------------------
    lyzr_api_key = os.getenv("LYZR_API_KEY", "").strip()
    lyzr_agent_id = os.getenv("LYZR_AGENT_ID", "").strip()

    if lyzr_api_key and lyzr_agent_id:
        cache_key = f"lyzr-risk:{agent_id}:{facts['risk_score']}:{status}:{decision_code}"
        if cache_key in _EXPLANATION_CACHE:
            return _EXPLANATION_CACHE[cache_key]

        lyzr_payload = generate_lyzr_explanation(facts)
        if lyzr_payload is not None:
            result = {
                "narrative": lyzr_payload["summary"],
                "evidence": lyzr_payload["evidence"],
                "outcome": lyzr_payload["outcome"],
                "review": lyzr_payload["review"],
                "source": "LYZR:v3",
                "is_llm_generated": True,
            }
            _EXPLANATION_CACHE[cache_key] = result
            return result

    # ----------------------------------------------------
    # Tier 2: Gemini AI Narrator
    # ----------------------------------------------------
    gemini_api_key = os.getenv("GEMINI_API_KEY", "").strip()
    gemini_model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()

    if gemini_api_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{gemini_model}:generateContent"
            prompt = (
                "You are a Fintech Credit Risk Analyst explaining an autonomous agent's credit profile to a human supervisor.\n"
                "Summarize these pre-calculated deterministic facts in 2 concise sentences:\n"
                f"Agent: {display_name}\n"
                f"Weighted Score: {weighted_score}/100\n"
                f"Task Reliability: {getattr(snapshot, 'task_reliability', 0)} (Earned)\n"
                f"Repayment Reliability: {getattr(snapshot, 'repayment_reliability', 0)} (Imputed={repay_imputed})\n"
                f"Spending Regularity: {getattr(snapshot, 'spending_regularity', 0)} (Imputed={spend_imputed})\n"
                f"Utilization: {utilization}%\n"
                "Do not invent new numbers or alter decisions."
            )
            payload = {"contents": [{"parts": [{"text": prompt}]}]}
            resp = requests.post(url, json=payload, headers={"X-goog-api-key": gemini_api_key}, timeout=2.5)
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                return {
                    "narrative": text,
                    "source": f"GEMINI:{gemini_model}",
                    "is_llm_generated": True,
                }
        except Exception:
            pass

    # ----------------------------------------------------
    # Tier 3: Deterministic Rule Engine Fallback
    # ----------------------------------------------------
    return {
        "narrative": fallback_text,
        "source": "DETERMINISTIC_FALLBACK",
        "is_llm_generated": False,
    }
