import uuid
from django.db import models
from decimal import Decimal
from backend.apps.identity.models import Agent

class CreditAccount(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    agent = models.OneToOneField(Agent, on_delete=models.CASCADE, related_name="credit_account")
    
    current_credit_limit = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('2000.00'))
    target_credit_limit = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('2000.00'))
    cold_start_floor = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('2000.00'))
    principal_authorized_ceiling = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('15000.00'))
    
    reserved_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    outstanding_principal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def available_credit(self) -> Decimal:
        available = self.current_credit_limit - (self.reserved_amount + self.outstanding_principal)
        return max(Decimal('0.00'), available)

    def __str__(self):
        return f"CreditAccount ({self.agent.display_name}) - Limit: ₹{self.current_credit_limit}, Avail: ₹{self.available_credit}"

class CreditLimitChange(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    credit_account = models.ForeignKey(CreditAccount, on_delete=models.CASCADE, related_name="limit_changes")
    previous_limit = models.DecimalField(max_digits=12, decimal_places=2)
    target_limit = models.DecimalField(max_digits=12, decimal_places=2)
    new_limit = models.DecimalField(max_digits=12, decimal_places=2)
    alpha = models.DecimalField(max_digits=4, decimal_places=2)
    trigger = models.CharField(max_length=100) # RISK_RECALCULATION, REPAYMENT_SUCCESS, REPAYMENT_FAILURE, MANDATE_UPDATE
    reason = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
