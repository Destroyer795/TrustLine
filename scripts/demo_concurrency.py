import os
import sys
import threading
import time
import requests
from decimal import Decimal

def test_concurrency_race(base_url: str = "http://localhost:8000"):
    """
    Fires two simultaneous draw requests of ₹6,000 each against a ₹10,000 credit limit.
    Verifies that PostgreSQL select_for_update prevents double reservation.
    """
    print("=== STARTING CONCURRENCY RACE CONDITION PROOF ===")
    
    # 1. Reset/Seed demo
    reset_resp = requests.post(f"{base_url}/api/v1/demo/reset")
    if reset_resp.status_code != 200:
        print("Failed to reset database:", reset_resp.text)
        return False
        
    seed_data = reset_resp.json()
    new_agent_id = seed_data["new_agent_id"]

    # Increase new agent limit to ₹6,000 for test (single tx cap is ₹5,000)
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.config.settings')
    import django
    django.setup()
    from backend.apps.credit.models import CreditAccount
    acct = CreditAccount.objects.get(agent_id=new_agent_id)
    acct.current_credit_limit = Decimal('6000.00')
    acct.save()

    results = []

    def make_draw(draw_index: int):
        payload = {
            "agent_id": new_agent_id,
            "amount": 4000.0,
            "merchant_name": f"Concurrent Vendor #{draw_index}",
            "merchant_category": "CLOUD_SERVICES",
            "idempotency_key": f"race_key_thread_{draw_index}_{time.time()}"
        }
        try:
            resp = requests.post(f"{base_url}/api/v1/draws", json=payload, timeout=5)
            results.append({"thread": draw_index, "status_code": resp.status_code, "body": resp.json()})
        except Exception as e:
            results.append({"thread": draw_index, "error": str(e)})

    # Spawn 2 concurrent threads
    t1 = threading.Thread(target=make_draw, args=(1,))
    t2 = threading.Thread(target=make_draw, args=(2,))

    t1.start()
    t2.start()

    t1.join()
    t2.join()

    print("\nResults from Parallel Requests:")
    success_count = 0
    rejected_count = 0

    for r in results:
        code = r.get("status_code")
        body_str = str(r.get('body')).encode('ascii', 'ignore').decode('ascii')
        print(f"Thread {r['thread']}: HTTP {code} -> {body_str}")
        if code == 201:
            success_count += 1
        elif code in [400, 402, 403]:
            rejected_count += 1

    print(f"\nSummary: Successes={success_count}, Rejections={rejected_count}")
    if success_count == 1 and rejected_count == 1:
        print("[SUCCESS] CONCURRENCY PROOF PASSED: Exactly 1 reservation succeeded, preventing overspend!")
        return True
    else:
        print("[FAILURE] CONCURRENCY PROOF FAILED: Overspend race condition detected or invalid response structure.")
        return False

if __name__ == '__main__':
    url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
    success = test_concurrency_race(url)
    sys.exit(0 if success else 1)
