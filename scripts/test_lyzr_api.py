#!/usr/bin/env python3
import json
import os
import sys
import uuid
import requests

# Try loading .env if python-dotenv or manual reading is needed
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
if os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                if k.strip() not in os.environ:
                    os.environ[k.strip()] = v.strip()

url = os.environ.get("LYZR_API_URL", "https://agent-prod.studio.lyzr.ai/v3/inference/chat/")
api_key = os.environ.get("LYZR_API_KEY")
agent_id = os.environ.get("LYZR_AGENT_ID")

if not api_key or not agent_id:
    print("Error: LYZR_API_KEY or LYZR_AGENT_ID not set in environment or .env file.")
    sys.exit(1)

facts = {
    "authority": "ACTIVE",
    "risk_score": "0.72",
    "effective_limit": "INR 12400",
    "available_credit": "INR 7400",
    "strongest_factor": "Task Reliability",
    "decision": "APPROVED",
    "decision_code": "DRAW_RESERVED",
    "review_required": False,
}

message = (
    "Explain these pre-computed TrustLine facts.\n\n"
    f"FACTS_BEGIN\n{json.dumps(facts, separators=(',', ':'))}\nFACTS_END"
)

print(f"Sending request to Lyzr API ({url}) for Agent ID: {agent_id}...")

try:
    response = requests.post(
        url,
        headers={
            "Content-Type": "application/json",
            "x-api-key": api_key,
        },
        json={
            "user_id": "trustline-backend",
            "agent_id": agent_id,
            "session_id": f"trustline-{uuid.uuid4()}",
            "message": message,
        },
        timeout=10,
    )
    print(f"HTTP Status: {response.status_code}")
    response.raise_for_status()
    res_json = response.json()
    print("Response JSON:")
    print(json.dumps(res_json, indent=2))
except Exception as e:
    print(f"Error calling Lyzr API: {e}")
    sys.exit(1)
