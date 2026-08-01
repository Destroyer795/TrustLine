import uuid
from django.db import models
from backend.apps.identity.models import Agent

class AuthorityStateTransition(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    agent = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name="state_transitions")
    previous_state = models.CharField(max_length=50)
    next_state = models.CharField(max_length=50) # NORMAL, RESTRICTED, FROZEN, HUMAN_REVIEW
    trigger_code = models.CharField(max_length=100)
    reason = models.TextField()
    actor_type = models.CharField(max_length=50, default="SYSTEM") # SYSTEM, PRINCIPAL, ADMIN
    actor_id = models.CharField(max_length=255, default="SYSTEM")
    created_at = models.DateTimeField(auto_now_add=True)

class Escalation(models.Model):
    STATUS_CHOICES = [
        ("OPEN", "Open"),
        ("IN_REVIEW", "In Review"),
        ("RESOLVED", "Resolved"),
        ("REJECTED", "Rejected")
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    agent = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name="escalations")
    trigger_code = models.CharField(max_length=100)
    severity = models.CharField(max_length=50, default="HIGH") # LOW, MEDIUM, HIGH, CRITICAL
    description = models.TextField()
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="OPEN")
    resolution_notes = models.TextField(blank=True, default="")
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
