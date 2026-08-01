import pytest
from django.test import Client
from scripts.seed_demo import run_seed

pytestmark = pytest.mark.django_db


@pytest.fixture
def demo():
    return run_seed()


def test_agent_limit_history_returns_seeded_changes(demo):
    client = Client()
    res = client.get(f"/api/v1/agents/{demo['good_agent_id']}/limit-history")
    assert res.status_code == 200
    changes = res.json()
    assert len(changes) >= 1
    # Ascending chronological order
    assert changes == sorted(changes, key=lambda c: c["created_at"])
    assert all("previous_limit" in c and "new_limit" in c and "trigger" in c for c in changes)


def test_agent_receipts_returns_three_for_good_agent(demo):
    client = Client()
    res = client.get(f"/api/v1/agents/{demo['good_agent_id']}/receipts")
    assert res.status_code == 200
    receipts = res.json()
    assert len(receipts) == 3
    assert all(r["issuer"] and r["outcome"] in ("SUCCESS", "FAILED") for r in receipts)
    # Signatures are truncated with an ellipsis, never the full key
    assert all(r["signature_short"].endswith("…") for r in receipts)
