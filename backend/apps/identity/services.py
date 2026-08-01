import hashlib
import secrets
import base64
from django.utils import timezone
from backend.common.crypto import generate_ed25519_keypair, sign_payload, verify_signature, canonicalize_payload
from backend.common.money import quantize_money
from backend.common.errors import APIError
from backend.apps.identity.models import Principal, Agent, CapabilityManifest, Mandate, LinkedAccount

def hash_api_key(raw_key: str) -> str:
    """Generates SHA-256 hash of API key."""
    return hashlib.sha256(raw_key.encode('utf-8')).hexdigest()

def generate_agent_api_key() -> tuple[str, str]:
    """Generates a raw API key and its SHA-256 hash."""
    raw_key = f"tl_agent_{secrets.token_hex(24)}"
    hashed = hash_api_key(raw_key)
    return raw_key, hashed

def compute_manifest_hash(manifest: CapabilityManifest) -> str:
    """Computes SHA-256 hash over canonical manifest data."""
    payload = {
        "allowed_categories": sorted(manifest.allowed_categories),
        "denied_categories": sorted(manifest.denied_categories),
        "max_per_transaction": str(quantize_money(manifest.max_per_transaction)),
        "max_per_day": str(quantize_money(manifest.max_per_day)),
        "currency": manifest.currency,
        "valid_from": manifest.valid_from.isoformat(),
        "valid_until": manifest.valid_until.isoformat(),
        "manifest_version": manifest.manifest_version
    }
    canonical_bytes = canonicalize_payload(payload)
    return hashlib.sha256(canonical_bytes).hexdigest()

def build_mandate_canonical_payload(mandate_data: dict) -> dict:
    """Returns canonical dict representation of a mandate payload for signing."""
    return {
        "mandate_id": str(mandate_data["id"]),
        "principal_id": str(mandate_data["principal_id"]),
        "agent_id": str(mandate_data["agent_id"]),
        "linked_account_ref": mandate_data["linked_account_ref"],
        "manifest_hash": mandate_data["manifest_hash"],
        "authorized_ceiling": str(quantize_money(mandate_data["authorized_ceiling"])),
        "issued_at": mandate_data["issued_at"],
        "not_before": mandate_data["not_before"],
        "expires_at": mandate_data["expires_at"],
        "nonce": mandate_data["nonce"],
        "version": mandate_data["version"]
    }

def create_and_sign_mandate(principal: Principal, agent: Agent, linked_account: LinkedAccount, manifest: CapabilityManifest, authorized_ceiling, valid_days: int = 30, signing_keys: dict = None) -> Mandate:
    """Creates an Ed25519 signed mandate for an agent."""
    if not signing_keys:
        signing_keys = generate_ed25519_keypair()
        
    now = timezone.now()
    expires_at = now + timezone.timedelta(days=valid_days)
    nonce = secrets.token_hex(16)
    import uuid
    mandate_id = str(uuid.uuid4())
    manifest_hash = compute_manifest_hash(manifest)
    
    mandate_version = (agent.current_mandate.version + 1) if agent.current_mandate else 1

    payload_data = {
        "id": mandate_id,
        "principal_id": str(principal.id),
        "agent_id": str(agent.id),
        "linked_account_ref": linked_account.account_reference,
        "manifest_hash": manifest_hash,
        "authorized_ceiling": authorized_ceiling,
        "issued_at": now.isoformat(),
        "not_before": now.isoformat(),
        "expires_at": expires_at.isoformat(),
        "nonce": nonce,
        "version": mandate_version
    }
    
    canonical_payload = build_mandate_canonical_payload(payload_data)
    sig_b64 = sign_payload(canonical_payload, signing_keys["private_key_b64"])
    
    mandate = Mandate.objects.create(
        id=mandate_id,
        principal=principal,
        agent=agent,
        linked_account=linked_account,
        manifest_hash=manifest_hash,
        authorized_ceiling=quantize_money(authorized_ceiling),
        ed25519_signature=sig_b64,
        public_key_b64=signing_keys["public_key_b64"],
        issued_at=now,
        not_before=now,
        expires_at=expires_at,
        nonce=nonce,
        version=mandate_version
    )
    
    agent.current_mandate = mandate
    agent.save(update_fields=["current_mandate"])
    return mandate

def verify_mandate_integrity(mandate: Mandate) -> bool:
    """Verifies cryptographic signature, expiry, and revocation state of a mandate."""
    if mandate.is_revoked:
        return False
    
    now = timezone.now()
    if now < mandate.not_before or now > mandate.expires_at:
        return False
    
    if mandate.linked_account.status != "ACTIVE":
        return False
        
    payload_data = {
        "id": str(mandate.id),
        "principal_id": str(mandate.principal.id),
        "agent_id": str(mandate.agent.id),
        "linked_account_ref": mandate.linked_account.account_reference,
        "manifest_hash": mandate.manifest_hash,
        "authorized_ceiling": mandate.authorized_ceiling,
        "issued_at": mandate.issued_at.isoformat(),
        "not_before": mandate.not_before.isoformat(),
        "expires_at": mandate.expires_at.isoformat(),
        "nonce": mandate.nonce,
        "version": mandate.version
    }
    canonical = build_mandate_canonical_payload(payload_data)
    return verify_signature(canonical, mandate.ed25519_signature, mandate.public_key_b64)
