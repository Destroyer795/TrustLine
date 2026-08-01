import os
import sys
import requests

def run_smoke_test(base_url: str = "http://localhost:8000"):
    print("=== STARTING TRUSTLINE END-TO-END SMOKE TEST ===")

    # 1. Health Check
    res = requests.get(f"{base_url}/api/v1/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("1. Health Check PASSED")

    # 2. Reset & Seed
    res = requests.post(f"{base_url}/api/v1/demo/reset")
    assert res.status_code == 200, f"Reset failed: {res.text}"
    seed = res.json()
    new_agent_id = seed["new_agent_id"]
    good_agent_id = seed["good_agent_id"]
    print("2. Demo Seed & Reset PASSED")

    # 3. Verify Cold Start New Agent Profile
    res = requests.get(f"{base_url}/api/v1/agents/{new_agent_id}/risk-profile")
    assert res.status_code == 200
    rp = res.json()
    assert float(rp["components"]["task_reliability"]["score"]) == 0.0, "Cold start task reliability must be 0.0"
    assert rp["components"]["repayment_reliability"]["is_imputed"] == True, "Repayment reliability must be imputed initially"
    print("3. Cold Start Agent Verification PASSED")

    # 4. Process Draw Request within Limit
    draw_payload = {
        "agent_id": new_agent_id,
        "amount": 1000.0,
        "merchant_name": "Cloud Host Provider",
        "merchant_category": "CLOUD_SERVICES",
        "idempotency_key": "smoke_idemp_001"
    }
    res = requests.post(f"{base_url}/api/v1/draws", json=draw_payload)
    assert res.status_code == 201, f"Draw request failed: {res.text}"
    draw_data = res.json()
    draw_id = draw_data["draw_id"]
    print("4. Gateway Draw Reservation PASSED")

    # 5. Advance Draw Settlement
    res = requests.post(f"{base_url}/api/v1/draws/{draw_id}/advance")
    assert res.status_code == 200, f"Draw advance failed: {res.text}"
    print("5. Draw Settlement PASSED")

    # 6. Verify Repayment Schedule & Trigger Failed Repayment
    res = requests.get(f"{base_url}/api/v1/agents/{new_agent_id}/repayments")
    assert res.status_code == 200
    repayments = res.json()
    assert len(repayments) > 0, "Repayment schedule should be generated"
    sched_id = repayments[0]["id"]

    res = requests.post(f"{base_url}/api/v1/repayments/{sched_id}/attempt", json={"force_status": "INSUFFICIENT_FUNDS"})
    assert res.status_code == 200
    print("6. Simulated Repayment Failure PASSED")

    # 7. Assert Agent Authority State is now FROZEN
    res = requests.get(f"{base_url}/api/v1/agents/{new_agent_id}")
    assert res.status_code == 200
    ag_data = res.json()
    assert ag_data["status"] == "FROZEN", f"Agent state should be FROZEN on repayment failure, found {ag_data['status']}"
    print("7. Instant Line Freeze Verification PASSED")

    # 8. Verify Audit Log Chain Integrity
    res = requests.get(f"{base_url}/api/v1/audit/verify")
    assert res.status_code == 200
    audit_res = res.json()
    assert audit_res["status"] == "VALID", f"Audit chain verification failed: {audit_res}"
    print("8. Hash-Chained Audit Chain Verification PASSED")

    print("\n[SUCCESS] ALL SMOKE TESTS PASSED SUCCESSFULLY!")
    return True

if __name__ == '__main__':
    url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
    success = run_smoke_test(url)
    sys.exit(0 if success else 1)
