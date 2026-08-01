import uuid
from django.db import models
from decimal import Decimal

class Principal(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.email})"

class PrincipalVerification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    principal = models.OneToOneField(Principal, on_delete=models.CASCADE, related_name="verification")
    provider = models.CharField(max_length=100, default="MOCK_OAUTH")
    provider_subject_id = models.CharField(max_length=255)
    verification_level = models.CharField(max_length=50, default="VERIFIED_HIGH")
    status = models.CharField(max_length=50, default="VERIFIED")
    verified_at = models.DateTimeField(auto_now_add=True)

class LinkedAccount(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    principal = models.ForeignKey(Principal, on_delete=models.CASCADE, related_name="linked_accounts")
    account_reference = models.CharField(max_length=100, unique=True)
    bank_name = models.CharField(max_length=100, default="TrustLine Simulated Bank")
    status = models.CharField(max_length=50, default="ACTIVE") # ACTIVE, BLOCKED, CHANGED
    mock_balance = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('50000.00'))
    created_at = models.DateTimeField(auto_now_add=True)

class Agent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    principal = models.ForeignKey(Principal, on_delete=models.CASCADE, related_name="agents")
    display_name = models.CharField(max_length=255)
    purpose = models.TextField(blank=True, default="")
    api_key_hash = models.CharField(max_length=64, db_index=True)
    status = models.CharField(max_length=50, default="NORMAL", db_index=True) # NORMAL, RESTRICTED, FROZEN, HUMAN_REVIEW
    current_mandate = models.ForeignKey('Mandate', on_delete=models.SET_NULL, null=True, blank=True, related_name="active_agents")
    created_at = models.DateTimeField(auto_now_add=True)
    revoked_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.display_name} [{self.status}]"

class CapabilityManifest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    agent = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name="manifests")
    allowed_categories = models.JSONField(default=list)
    denied_categories = models.JSONField(default=list)
    max_per_transaction = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('5000.00'))
    max_per_day = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('20000.00'))
    currency = models.CharField(max_length=10, default="INR")
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField()
    manifest_version = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

class Mandate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    principal = models.ForeignKey(Principal, on_delete=models.CASCADE, related_name="mandates")
    agent = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name="mandates")
    linked_account = models.ForeignKey(LinkedAccount, on_delete=models.CASCADE, related_name="mandates")
    manifest_hash = models.CharField(max_length=64)
    authorized_ceiling = models.DecimalField(max_digits=12, decimal_places=2)
    ed25519_signature = models.CharField(max_length=255)
    public_key_b64 = models.CharField(max_length=255)
    issued_at = models.DateTimeField()
    not_before = models.DateTimeField()
    expires_at = models.DateTimeField()
    nonce = models.CharField(max_length=64, unique=True)
    version = models.IntegerField(default=1)
    is_revoked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
