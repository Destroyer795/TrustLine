import uuid
from django.db import models
from decimal import Decimal
from backend.apps.credit.models import CreditAccount

class IdempotencyRecord(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    idempotency_key = models.CharField(max_length=255, unique=True, db_index=True)
    request_hash = models.CharField(max_length=64)
    response_status = models.IntegerField()
    response_body = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

class DrawRequest(models.Model):
    STATUS_CHOICES = [
        ("REQUESTED", "Requested"),
        ("RESERVED", "Reserved"),
        ("SETTLING", "Settling"),
        ("SETTLED", "Settled"),
        ("REJECTED", "Rejected"),
        ("REVOKED", "Revoked"),
        ("FAILED", "Failed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    credit_account = models.ForeignKey(CreditAccount, on_delete=models.CASCADE, related_name="draw_requests")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    merchant_name = models.CharField(max_length=255)
    merchant_category = models.CharField(max_length=100) # e.g. CLOUD_SERVICES, API_SERVICES, P2P_TRANSFER
    idempotency_key = models.CharField(max_length=255, db_index=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="REQUESTED", db_index=True)
    rejection_reason = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class DrawReservation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    draw_request = models.OneToOneField(DrawRequest, on_delete=models.CASCADE, related_name="reservation")
    reserved_amount = models.DecimalField(max_digits=12, decimal_places=2)
    expires_at = models.DateTimeField()
    status = models.CharField(max_length=50, default="HELD") # HELD, RELEASED, SETTLED
    created_at = models.DateTimeField(auto_now_add=True)

class LedgerEntry(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    credit_account = models.ForeignKey(CreditAccount, on_delete=models.CASCADE, related_name="ledger_entries")
    draw_request = models.ForeignKey(DrawRequest, on_delete=models.CASCADE, null=True, blank=True, related_name="ledger_entries")
    entry_type = models.CharField(max_length=50) # DRAW_SETTLEMENT, REPAYMENT_CREDIT, ADJUSTMENT
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    running_outstanding_balance = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
