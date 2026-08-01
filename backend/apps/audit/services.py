import hashlib
import uuid
from django.db import transaction
from backend.common.crypto import canonicalize_payload
from backend.apps.audit.models import AuditEvent

GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

def compute_payload_hash(payload: dict) -> str:
    """Computes SHA-256 digest of canonical JSON payload."""
    canonical_bytes = canonicalize_payload(payload)
    return hashlib.sha256(canonical_bytes).hexdigest()

def compute_event_hash(sequence: int, event_id: str, event_type: str, payload_hash: str, previous_hash: str) -> str:
    """Computes SHA-256 digest linking current event data with previous event hash."""
    raw = f"{sequence}:{event_id}:{event_type}:{payload_hash}:{previous_hash}"
    return hashlib.sha256(raw.encode('utf-8')).hexdigest()

def append_audit_event(event_type: str, actor_type: str, actor_id: str, entity_type: str, entity_id: str, payload: dict) -> AuditEvent:
    """Appends an event to the hash-chained audit log inside an atomic transaction."""
    with transaction.atomic():
        last_event = AuditEvent.objects.select_for_update().order_by('-sequence').first()
        if last_event:
            prev_hash = last_event.current_hash
            next_seq = last_event.sequence + 1
        else:
            prev_hash = GENESIS_HASH
            next_seq = 1

        ev_id = str(uuid.uuid4())
        p_hash = compute_payload_hash(payload)
        c_hash = compute_event_hash(next_seq, ev_id, event_type, p_hash, prev_hash)

        event = AuditEvent.objects.create(
            sequence=next_seq,
            event_id=ev_id,
            event_type=event_type,
            actor_type=actor_type,
            actor_id=actor_id,
            entity_type=entity_type,
            entity_id=entity_id,
            payload=payload,
            payload_hash=p_hash,
            previous_hash=prev_hash,
            current_hash=c_hash
        )
        return event

def verify_audit_chain() -> dict:
    """
    Verifies full SHA-256 hash-chain integrity.
    Returns dict with status ("VALID" / "CORRUPTED"), total_events, and failure_details if tampered.
    """
    events = AuditEvent.objects.order_by('sequence')
    total = events.count()
    if total == 0:
        return {"status": "VALID", "total_events": 0, "verified_events": 0}

    expected_prev = GENESIS_HASH
    for ev in events:
        # Check payload hash
        calc_payload_hash = compute_payload_hash(ev.payload)
        if calc_payload_hash != ev.payload_hash:
            return {
                "status": "CORRUPTED",
                "corrupted_sequence": ev.sequence,
                "reason": f"Payload hash mismatch at sequence {ev.sequence}.",
                "expected": calc_payload_hash,
                "found": ev.payload_hash
            }

        # Check prev_hash link
        if ev.previous_hash != expected_prev:
            return {
                "status": "CORRUPTED",
                "corrupted_sequence": ev.sequence,
                "reason": f"Previous hash link broken at sequence {ev.sequence}.",
                "expected_prev": expected_prev,
                "found_prev": ev.previous_hash
            }

        # Check current_hash formula
        calc_curr_hash = compute_event_hash(ev.sequence, str(ev.event_id), ev.event_type, ev.payload_hash, ev.previous_hash)
        if calc_curr_hash != ev.current_hash:
            return {
                "status": "CORRUPTED",
                "corrupted_sequence": ev.sequence,
                "reason": f"Event hash mismatch at sequence {ev.sequence}.",
                "expected_curr": calc_curr_hash,
                "found_curr": ev.current_hash
            }

        expected_prev = ev.current_hash

    return {"status": "VALID", "total_events": total, "verified_events": total}

def tamper_audit_log_for_demo(target_sequence: int = None) -> dict:
    """Demo helper: Corrupts an audit record payload to prove verification engine detects tampering."""
    with transaction.atomic():
        if target_sequence:
            event = AuditEvent.objects.filter(sequence=target_sequence).first()
        else:
            event = AuditEvent.objects.order_by('sequence').first()
            
        if not event:
            return {"success": False, "message": "No audit events found to tamper."}
            
        event.payload["tampered_by_demo"] = True
        event.save(update_fields=["payload"])
        return {
            "success": True,
            "tampered_sequence": event.sequence,
            "message": f"Successfully tampered payload of audit event #{event.sequence} for verification demo."
        }
