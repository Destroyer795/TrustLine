import json
import base64
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization

def generate_ed25519_keypair():
    """Generates a private and public Ed25519 keypair encoded in base64."""
    private_key = ed25519.Ed25519PrivateKey.generate()
    public_key = private_key.public_key()
    
    priv_bytes = private_key.private_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PrivateFormat.Raw,
        encryption_algorithm=serialization.NoEncryption()
    )
    pub_bytes = public_key.public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw
    )
    
    return {
        "private_key_b64": base64.b64encode(priv_bytes).decode('utf-8'),
        "public_key_b64": base64.b64encode(pub_bytes).decode('utf-8')
    }

def canonicalize_payload(payload: dict) -> bytes:
    """Produces deterministic canonical JSON byte representation for signing."""
    return json.dumps(payload, sort_keys=True, separators=(',', ':')).encode('utf-8')

def sign_payload(payload: dict, private_key_b64: str) -> str:
    """Signs a dict payload using base64-encoded Ed25519 private key."""
    priv_bytes = base64.b64decode(private_key_b64)
    private_key = ed25519.Ed25519PrivateKey.from_private_bytes(priv_bytes)
    data = canonicalize_payload(payload)
    signature = private_key.sign(data)
    return base64.b64encode(signature).decode('utf-8')

def verify_signature(payload: dict, signature_b64: str, public_key_b64: str) -> bool:
    """Verifies Ed25519 signature over canonicalized payload using public key."""
    try:
        pub_bytes = base64.b64decode(public_key_b64)
        public_key = ed25519.Ed25519PublicKey.from_public_bytes(pub_bytes)
        signature = base64.b64decode(signature_b64)
        data = canonicalize_payload(payload)
        public_key.verify(signature, data)
        return True
    except Exception:
        return False
