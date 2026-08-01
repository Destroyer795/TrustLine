import os
import sys

def run_reset():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.config.settings')
    import django
    django.setup()

    from backend.apps.identity.models import Principal, PrincipalVerification, LinkedAccount, Agent, CapabilityManifest, Mandate
    from backend.apps.risk.models import TrustedReceiptIssuer, Task, TaskReceipt, RiskProfileSnapshot, RiskComponentEvidence
    from backend.apps.credit.models import CreditAccount, CreditLimitChange
    from backend.apps.gateway.models import DrawRequest, DrawReservation, LedgerEntry, IdempotencyRecord
    from backend.apps.repayment.models import RepaymentSchedule, RepaymentAttempt
    from backend.apps.monitoring.models import AuthorityStateTransition, Escalation
    from backend.apps.audit.models import AuditEvent
    from backend.apps.demo.models import DemoSession, DemoStepResult

    # Delete all records
    DemoStepResult.objects.all().delete()
    DemoSession.objects.all().delete()
    RepaymentAttempt.objects.all().delete()
    RepaymentSchedule.objects.all().delete()
    LedgerEntry.objects.all().delete()
    DrawReservation.objects.all().delete()
    DrawRequest.objects.all().delete()
    IdempotencyRecord.objects.all().delete()
    CreditLimitChange.objects.all().delete()
    CreditAccount.objects.all().delete()
    RiskComponentEvidence.objects.all().delete()
    RiskProfileSnapshot.objects.all().delete()
    TaskReceipt.objects.all().delete()
    Task.objects.all().delete()
    TrustedReceiptIssuer.objects.all().delete()
    Escalation.objects.all().delete()
    AuthorityStateTransition.objects.all().delete()
    Mandate.objects.all().delete()
    CapabilityManifest.objects.all().delete()
    Agent.objects.all().delete()
    LinkedAccount.objects.all().delete()
    PrincipalVerification.objects.all().delete()
    Principal.objects.all().delete()
    AuditEvent.objects.all().delete()

    from scripts.seed_demo import run_seed
    return run_seed()

if __name__ == '__main__':
    res = run_reset()
    print("Reset Output:", res)
