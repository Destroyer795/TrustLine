import pytest
from backend.apps.audit.services import append_audit_event, verify_audit_chain, tamper_audit_log_for_demo

@pytest.mark.django_db
def test_hash_chained_audit_log_verification():
    append_audit_event("TEST_EVENT_1", "SYSTEM", "SYS", "AGENT", "123", {"data": "A"})
    append_audit_event("TEST_EVENT_2", "SYSTEM", "SYS", "AGENT", "123", {"data": "B"})
    
    res = verify_audit_chain()
    assert res["status"] == "VALID"
    assert res["total_events"] == 2

@pytest.mark.django_db
def test_audit_log_tamper_detection():
    append_audit_event("TEST_EVENT_1", "SYSTEM", "SYS", "AGENT", "123", {"data": "A"})
    append_audit_event("TEST_EVENT_2", "SYSTEM", "SYS", "AGENT", "123", {"data": "B"})
    
    # Tamper payload of event #1
    tamper_res = tamper_audit_log_for_demo(target_sequence=1)
    assert tamper_res["success"] == True
    
    verify_res = verify_audit_chain()
    assert verify_res["status"] == "CORRUPTED"
    assert verify_res["corrupted_sequence"] == 1
