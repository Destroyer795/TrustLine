import os
import requests
from backend.apps.identity.models import Agent

def generate_risk_explanation_narrative(agent: Agent, snapshot) -> dict:
    """
    Generates a human-readable risk narrative from pre-calculated deterministic facts.
    Uses Gemini API if key is present; falls back seamlessly to deterministic narrative.
    """
    fallback_text = (
        f"Agent '{agent.display_name}' has a Weighted Risk Score of {snapshot.weighted_risk_score}/100. "
        f"Task Reliability is {float(snapshot.task_reliability)*100:.0f}% (Earned), "
        f"Repayment Reliability is {float(snapshot.repayment_reliability)*100:.0f}% ({'Provisional' if snapshot.repayment_imputed else 'Earned'}), "
        f"and Spending Regularity is {float(snapshot.spending_regularity)*100:.0f}% ({'Provisional' if snapshot.spending_imputed else 'Earned'}). "
        f"Current exposure utilization is {snapshot.current_exposure_utilization:.1f}%."
    )

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {
            "narrative": fallback_text,
            "source": "DETERMINISTIC_FALLBACK",
            "is_llm_generated": False
        }

    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        prompt = (
            "You are a Fintech Credit Risk Analyst explaining an autonomous agent's credit profile to a human supervisor.\n"
            "Summarize these pre-calculated deterministic facts in 2 concise sentences:\n"
            f"Agent: {agent.display_name}\n"
            f"Weighted Score: {snapshot.weighted_risk_score}/100\n"
            f"Task Reliability: {snapshot.task_reliability} (Earned)\n"
            f"Repayment Reliability: {snapshot.repayment_reliability} (Imputed={snapshot.repayment_imputed})\n"
            f"Spending Regularity: {snapshot.spending_regularity} (Imputed={snapshot.spending_imputed})\n"
            f"Utilization: {snapshot.current_exposure_utilization}%\n"
            "Do not invent new numbers or alter decisions."
        )
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        resp = requests.post(url, json=payload, timeout=2.5)
        if resp.status_code == 200:
            data = resp.json()
            text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
            return {
                "narrative": text,
                "source": "GEMINI_1_5_FLASH",
                "is_llm_generated": True
            }
    except Exception:
        pass

    return {
        "narrative": fallback_text,
        "source": "DETERMINISTIC_FALLBACK",
        "is_llm_generated": False
    }
