import uuid
from django.db import models

class AuditEvent(models.Model):
    sequence = models.BigAutoField(primary_key=True)
    event_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    event_type = models.CharField(max_length=100, db_index=True)
    actor_type = models.CharField(max_length=50) # SYSTEM, PRINCIPAL, AGENT, GATEWAY, BANK_ADAPTER
    actor_id = models.CharField(max_length=255)
    entity_type = models.CharField(max_length=100) # AGENT, MANDATE, DRAW_REQUEST, REPAYMENT_SCHEDULE
    entity_id = models.CharField(max_length=255)
    payload = models.JSONField()
    payload_hash = models.CharField(max_length=64)
    previous_hash = models.CharField(max_length=64)
    current_hash = models.CharField(max_length=64, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['sequence']

    def __str__(self):
        return f"Audit #{self.sequence}: {self.event_type} ({self.created_at.isoformat()})"
