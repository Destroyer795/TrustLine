import uuid
from django.db import models
from decimal import Decimal
from backend.apps.gateway.models import DrawRequest
from backend.apps.identity.models import LinkedAccount

class RepaymentSchedule(models.Model):
    STATUS_CHOICES = [
        ("SCHEDULED", "Scheduled"),
        ("PROCESSING", "Processing"),
        ("SETTLED", "Settled"),
        ("FAILED", "Failed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    draw = models.ForeignKey(DrawRequest, on_delete=models.CASCADE, related_name="repayment_schedules")
    linked_account = models.ForeignKey(LinkedAccount, on_delete=models.CASCADE, related_name="repayment_schedules")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    due_date = models.DateTimeField()
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="SCHEDULED", db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class RepaymentAttempt(models.Model):
    STATUS_CHOICES = [
        ("SUCCESS", "Success"),
        ("INSUFFICIENT_FUNDS", "Insufficient Funds"),
        ("ACCOUNT_BLOCKED", "Account Blocked"),
        ("MANDATE_INVALID", "Mandate Invalid"),
        ("PROVIDER_ERROR", "Provider Error")
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    schedule = models.ForeignKey(RepaymentSchedule, on_delete=models.CASCADE, related_name="attempts")
    amount_pulled = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES)
    bank_transaction_ref = models.CharField(max_length=100)
    failure_reason = models.TextField(blank=True, default="")
    attempted_at = models.DateTimeField(auto_now_add=True)
