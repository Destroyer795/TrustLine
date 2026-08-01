import os
import sys
import secrets
from decimal import Decimal
from django.utils import timezone

def run_seed():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.config.settings')
    import django
    django.setup()

    from backend.common.money import quantize_money
    from backend.apps.identity.models import Principal, PrincipalVerification, LinkedAccount, Agent, CapabilityManifest, Mandate
    from backend.apps.identity.services import generate_agent_api_key, create_and_sign_mandate
    from backend.apps.risk.models import TrustedReceiptIssuer, Task, TaskReceipt, RiskProfileSnapshot, RiskComponentEvidence
    from backend.apps.risk.services import calculate_and_save_risk_profile
    from backend.apps.credit.models import CreditAccount, CreditLimitChange
    from backend.apps.credit.services import update_credit_limit
    from backend.apps.gateway.models import DrawRequest, DrawReservation, LedgerEntry, IdempotencyRecord
    from backend.apps.gateway.services import process_draw_request, advance_draw_settlement
    from backend.apps.repayment.models import RepaymentSchedule, RepaymentAttempt
    from backend.apps.repayment.services import process_repayment_attempt
    from backend.apps.monitoring.models import AuthorityStateTransition, Escalation
    from backend.apps.monitoring.services import transition_authority_state
    from backend.apps.audit.models import AuditEvent

    # Clear existing demo objects if present
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

    # 1. Create Principal
    principal, _ = Principal.objects.get_or_create(
        email="credit.ops@northstar.example",
        defaults={"name": "Northstar Commerce Group"}
    )
    PrincipalVerification.objects.get_or_create(
        principal=principal,
        defaults={"provider": "MOCK_ENTERPRISE_OAUTH", "provider_subject_id": "acme_ent_sub_9988", "verification_level": "VERIFIED_HIGH", "status": "VERIFIED"}
    )
    linked_account, _ = LinkedAccount.objects.get_or_create(
        principal=principal,
        account_reference="BANK-NORTHSTAR-PRIMARY-9021",
        defaults={"bank_name": "TrustLine Simulated Reserve Bank", "mock_balance": Decimal('100000.00'), "status": "ACTIVE"}
    )

    # 2. Trusted Receipt Issuer
    from backend.common.crypto import generate_ed25519_keypair
    issuer_keys = generate_ed25519_keypair()
    issuer, _ = TrustedReceiptIssuer.objects.get_or_create(
        name="TrustLine Verified Task Attestation Service",
        defaults={"public_key_b64": issuer_keys["public_key_b64"]}
    )

    now = timezone.now()

    # -------------------------------------------------------------
    # AGENT 1: GOOD AGENT (ProcurementBot-Good)
    # -------------------------------------------------------------
    _, raw_good_key = generate_agent_api_key()
    good_agent, _ = Agent.objects.get_or_create(
        principal=principal,
        display_name="ProcurementBot-Good",
        defaults={"purpose": "Automated SaaS license and cloud API procurement agent", "api_key_hash": raw_good_key, "status": "NORMAL"}
    )
    manifest_good, _ = CapabilityManifest.objects.get_or_create(
        agent=good_agent,
        defaults={
            "allowed_categories": ["CLOUD_SERVICES", "API_SERVICES", "HOSTING"],
            "denied_categories": ["P2P_TRANSFER", "CRYPTO_EXCHANGE"],
            "max_per_transaction": Decimal('8000.00'),
            "max_per_day": Decimal('30000.00'),
            "valid_from": now - timezone.timedelta(days=5),
            "valid_until": now + timezone.timedelta(days=25)
        }
    )
    mandate_good = create_and_sign_mandate(principal, good_agent, linked_account, manifest_good, authorized_ceiling=Decimal('25000.00'))
    
    credit_good, _ = CreditAccount.objects.get_or_create(
        agent=good_agent,
        defaults={
            "current_credit_limit": Decimal('10000.00'),
            "target_credit_limit": Decimal('10000.00'),
            "cold_start_floor": Decimal('2000.00'),
            "principal_authorized_ceiling": Decimal('25000.00')
        }
    )

    # Seed verified tasks for Good Agent
    for i in range(1, 4):
        t = Task.objects.create(agent=good_agent, description=f"Verified procurement task #{i}", expected_value=Decimal('5000.00'))
        TaskReceipt.objects.create(
            issuer=issuer,
            task=t,
            agent=good_agent,
            outcome="SUCCESS",
            value=Decimal('5000.00'),
            issued_at=now - timezone.timedelta(days=i),
            nonce=secrets.token_hex(16),
            ed25519_signature="demo_sig_valid"
        )

    # Process successful draw & repayment for Good Agent
    draw_good = process_draw_request(good_agent, Decimal('4000.00'), "AWS Infrastructure", "CLOUD_SERVICES", f"seed_idemp_good_{secrets.token_hex(4)}")
    advance_draw_settlement(draw_good)
    sched_good = RepaymentSchedule.objects.filter(draw=draw_good).first()
    if sched_good:
        process_repayment_attempt(sched_good, force_status="SUCCESS")

    update_credit_limit(credit_good, trigger="SEED_DATA", reason="Initial good agent seeding")

    # -------------------------------------------------------------
    # AGENT 2: BAD AGENT (ArbitrageBot-Bad)
    # -------------------------------------------------------------
    _, raw_bad_key = generate_agent_api_key()
    bad_agent, _ = Agent.objects.get_or_create(
        principal=principal,
        display_name="ArbitrageBot-Bad",
        defaults={"purpose": "High-frequency task execution agent with irregular behavior", "api_key_hash": raw_bad_key, "status": "NORMAL"}
    )
    manifest_bad, _ = CapabilityManifest.objects.get_or_create(
        agent=bad_agent,
        defaults={
            "allowed_categories": ["API_SERVICES"],
            "denied_categories": ["CRYPTO_EXCHANGE", "P2P_TRANSFER"],
            "max_per_transaction": Decimal('3000.00'),
            "max_per_day": Decimal('10000.00'),
            "valid_from": now - timezone.timedelta(days=2),
            "valid_until": now + timezone.timedelta(days=28)
        }
    )
    mandate_bad = create_and_sign_mandate(principal, bad_agent, linked_account, manifest_bad, authorized_ceiling=Decimal('10000.00'))
    
    credit_bad, _ = CreditAccount.objects.get_or_create(
        agent=bad_agent,
        defaults={
            "current_credit_limit": Decimal('2000.00'),
            "target_credit_limit": Decimal('2000.00'),
            "cold_start_floor": Decimal('2000.00'),
            "principal_authorized_ceiling": Decimal('10000.00')
        }
    )

    # Process failed repayment for Bad Agent to freeze line
    draw_bad = process_draw_request(bad_agent, Decimal('2000.00'), "Unverified Vendor", "API_SERVICES", f"seed_idemp_bad_{secrets.token_hex(4)}")
    advance_draw_settlement(draw_bad)
    sched_bad = RepaymentSchedule.objects.filter(draw=draw_bad).first()
    if sched_bad:
        process_repayment_attempt(sched_bad, force_status="INSUFFICIENT_FUNDS")

    # -------------------------------------------------------------
    # AGENT 3: NEW AGENT (DataScraper-New)
    # -------------------------------------------------------------
    _, raw_new_key = generate_agent_api_key()
    new_agent, _ = Agent.objects.get_or_create(
        principal=principal,
        display_name="DataScraper-New",
        defaults={"purpose": "Newly registered web scraping agent under cold-start policy", "api_key_hash": raw_new_key, "status": "NORMAL"}
    )
    manifest_new, _ = CapabilityManifest.objects.get_or_create(
        agent=new_agent,
        defaults={
            "allowed_categories": ["CLOUD_SERVICES", "API_SERVICES"],
            "denied_categories": ["P2P_TRANSFER"],
            "max_per_transaction": Decimal('5000.00'),
            "max_per_day": Decimal('20000.00'),
            "valid_from": now,
            "valid_until": now + timezone.timedelta(days=30)
        }
    )
    create_and_sign_mandate(principal, new_agent, linked_account, manifest_new, authorized_ceiling=Decimal('15000.00'))
    
    CreditAccount.objects.get_or_create(
        agent=new_agent,
        defaults={
            "current_credit_limit": Decimal('2000.00'),
            "target_credit_limit": Decimal('2000.00'),
            "cold_start_floor": Decimal('2000.00'),
            "principal_authorized_ceiling": Decimal('15000.00')
        }
    )
    calculate_and_save_risk_profile(new_agent)

    return {
        "status": "SUCCESS",
        "message": "Seeded 1 Verified Principal, 1 Good Agent, 1 Bad Agent (Frozen), and 1 Cold-Start New Agent.",
        "good_agent_id": str(good_agent.id),
        "bad_agent_id": str(bad_agent.id),
        "new_agent_id": str(new_agent.id)
    }

if __name__ == '__main__':
    res = run_seed()
    print("Seed Output:", res)
