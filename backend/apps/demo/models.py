import uuid

from django.db import models


class DemoSession(models.Model):
    STATUS_CHOICES = [
        ("READY", "Ready"),
        ("RUNNING", "Running"),
        ("COMPLETED", "Completed"),
        ("FAILED", "Failed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    scenario_key = models.CharField(max_length=64, db_index=True)
    agent = models.ForeignKey("identity.Agent", on_delete=models.CASCADE, related_name="demo_sessions")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="READY")
    current_step = models.PositiveIntegerField(default=0)
    initial_state = models.JSONField(default=dict)
    final_state = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)


class DemoStepResult(models.Model):
    session = models.ForeignKey(DemoSession, on_delete=models.CASCADE, related_name="steps")
    sequence = models.PositiveIntegerField()
    actor = models.CharField(max_length=50)
    action = models.CharField(max_length=120)
    endpoint = models.CharField(max_length=255, blank=True, default="")
    transport_status = models.PositiveIntegerField(default=200)
    semantic_result = models.CharField(max_length=40)
    plain_language = models.TextField()
    proof = models.TextField()
    request_evidence = models.JSONField(default=dict)
    response_evidence = models.JSONField(default=dict)
    balance_before = models.JSONField(default=dict)
    balance_after = models.JSONField(default=dict)
    gateway_checks = models.JSONField(default=list)
    audit_sequence = models.BigIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["sequence"]
        constraints = [
            models.UniqueConstraint(fields=["session", "sequence"], name="unique_demo_session_step")
        ]
