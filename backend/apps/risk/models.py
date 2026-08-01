import uuid
from django.db import models
from backend.apps.identity.models import Agent

class TrustedReceiptIssuer(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    public_key_b64 = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Issuer: {self.name}"

class Task(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    agent = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name="tasks")
    description = models.TextField()
    expected_value = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class TaskReceipt(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    issuer = models.ForeignKey(TrustedReceiptIssuer, on_delete=models.CASCADE, related_name="receipts")
    task = models.OneToOneField(Task, on_delete=models.CASCADE, related_name="receipt")
    agent = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name="receipts")
    outcome = models.CharField(max_length=50) # SUCCESS, FAILED
    value = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    issued_at = models.DateTimeField()
    nonce = models.CharField(max_length=64, unique=True)
    ed25519_signature = models.CharField(max_length=255)
    consumed_at = models.DateTimeField(auto_now_add=True)

class RiskProfileSnapshot(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    agent = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name="risk_snapshots")
    weighted_risk_score = models.DecimalField(max_digits=5, decimal_places=2) # 0.00 to 100.00
    
    identity_confidence = models.DecimalField(max_digits=5, decimal_places=4) # 0.0 to 1.0
    task_reliability = models.DecimalField(max_digits=5, decimal_places=4) # 0.0 to 1.0
    repayment_reliability = models.DecimalField(max_digits=5, decimal_places=4) # 0.0 to 1.0
    spending_regularity = models.DecimalField(max_digits=5, decimal_places=4) # 0.0 to 1.0
    
    current_exposure_amount = models.DecimalField(max_digits=12, decimal_places=2)
    current_exposure_utilization = models.DecimalField(max_digits=5, decimal_places=2) # percentage
    
    repayment_imputed = models.BooleanField(default=True)
    spending_imputed = models.BooleanField(default=True)
    
    ahp_version = models.CharField(max_length=20, default="v1.0")
    created_at = models.DateTimeField(auto_now_add=True)

class RiskComponentEvidence(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    snapshot = models.ForeignKey(RiskProfileSnapshot, on_delete=models.CASCADE, related_name="evidence_items")
    component = models.CharField(max_length=50) # IDENTITY, TASK, REPAYMENT, SPENDING, EXPOSURE
    score = models.DecimalField(max_digits=5, decimal_places=4)
    evidence_count = models.IntegerField(default=0)
    source = models.CharField(max_length=255)
    is_imputed = models.BooleanField(default=False)
    reason = models.TextField()
    updated_at = models.DateTimeField(auto_now_add=True)
