import secrets
from decimal import Decimal

import pytest
from django.utils import timezone

from backend.apps.credit.models import CreditAccount
from backend.apps.gateway.models import DrawReservation
from backend.apps.gateway.services import process_draw_request
from backend.apps.identity.models import (
    Agent,
    CapabilityManifest,
    LinkedAccount,
    Principal,
    PrincipalVerification,
)
from backend.apps.identity.services import create_and_sign_mandate, generate_agent_api_key
from backend.apps.monitoring.services import transition_authority_state
from backend.apps.risk.services import calculate_and_save_risk_profile
from backend.common.errors import APIError


def create_agent(*, pool_ceiling=Decimal("10000.00"), current_limit=Decimal("8000.00")):
    principal = Principal.objects.create(
        name="Northstar Systems",
        email=f"principal-{secrets.token_hex(4)}@example.test",
        credit_pool_ceiling=pool_ceiling,
    )
    PrincipalVerification.objects.create(
        principal=principal,
        provider="MOCK_OAUTH",
        provider_subject_id=secrets.token_hex(8),
        verification_level="VERIFIED_HIGH",
        status="VERIFIED",
    )
    linked_account = LinkedAccount.objects.create(
        principal=principal,
        account_reference=f"TEST-{secrets.token_hex(5)}",
    )
    _, api_key_hash = generate_agent_api_key()
    agent = Agent.objects.create(
        principal=principal,
        display_name="Procurement Agent",
        api_key_hash=api_key_hash,
    )
    now = timezone.now()
    manifest = CapabilityManifest.objects.create(
        agent=agent,
        allowed_categories=["CLOUD_SERVICES"],
        denied_categories=["P2P_TRANSFER"],
        max_per_transaction=Decimal("8000.00"),
        max_per_day=Decimal("10000.00"),
        valid_from=now,
        valid_until=now + timezone.timedelta(days=30),
    )
    create_and_sign_mandate(
        principal,
        agent,
        linked_account,
        manifest,
        authorized_ceiling=Decimal("10000.00"),
    )
    CreditAccount.objects.create(
        agent=agent,
        current_credit_limit=current_limit,
        target_credit_limit=current_limit,
        cold_start_floor=Decimal("2000.00"),
        principal_authorized_ceiling=Decimal("10000.00"),
    )
    return principal, agent, manifest


@pytest.mark.django_db
def test_cold_start_defaults_are_explicit():
    _, agent, _ = create_agent()
    snapshot = calculate_and_save_risk_profile(agent)

    assert snapshot.task_reliability == Decimal("0.0000")
    assert snapshot.repayment_reliability == snapshot.identity_confidence
    assert snapshot.spending_regularity == snapshot.identity_confidence
    assert snapshot.repayment_imputed is True
    assert snapshot.spending_imputed is True


@pytest.mark.django_db
def test_gateway_rejects_non_positive_draw():
    _, agent, _ = create_agent()

    with pytest.raises(APIError, match="greater than zero"):
        process_draw_request(agent, Decimal("-100.00"), "Cloud Vendor", "CLOUD_SERVICES", "negative")


@pytest.mark.django_db
def test_gateway_rejects_manifest_changed_after_signing():
    _, agent, manifest = create_agent()
    manifest.max_per_transaction = Decimal("9000.00")
    manifest.save(update_fields=["max_per_transaction"])

    with pytest.raises(APIError, match="does not match"):
        process_draw_request(agent, Decimal("1000.00"), "Cloud Vendor", "CLOUD_SERVICES", "tampered")


@pytest.mark.django_db
def test_principal_pool_caps_combined_agent_exposure():
    principal, first_agent, _ = create_agent(pool_ceiling=Decimal("5000.00"))
    first_draw = process_draw_request(
        first_agent, Decimal("4000.00"), "Cloud One", "CLOUD_SERVICES", "pool-first"
    )
    assert first_draw.status == "RESERVED"

    linked_account = principal.linked_accounts.first()
    _, api_key_hash = generate_agent_api_key()
    second_agent = Agent.objects.create(
        principal=principal,
        display_name="Second Agent",
        api_key_hash=api_key_hash,
    )
    now = timezone.now()
    second_manifest = CapabilityManifest.objects.create(
        agent=second_agent,
        allowed_categories=["CLOUD_SERVICES"],
        max_per_transaction=Decimal("8000.00"),
        max_per_day=Decimal("10000.00"),
        valid_from=now,
        valid_until=now + timezone.timedelta(days=30),
    )
    create_and_sign_mandate(
        principal,
        second_agent,
        linked_account,
        second_manifest,
        authorized_ceiling=Decimal("10000.00"),
    )
    CreditAccount.objects.create(
        agent=second_agent,
        current_credit_limit=Decimal("8000.00"),
        target_credit_limit=Decimal("8000.00"),
        cold_start_floor=Decimal("2000.00"),
        principal_authorized_ceiling=Decimal("10000.00"),
    )

    with pytest.raises(APIError, match="principal-wide"):
        process_draw_request(
            second_agent, Decimal("2000.00"), "Cloud Two", "CLOUD_SERVICES", "pool-second"
        )


@pytest.mark.django_db
def test_freeze_revokes_in_flight_reservation():
    _, agent, _ = create_agent()
    draw = process_draw_request(
        agent, Decimal("3000.00"), "Cloud Vendor", "CLOUD_SERVICES", "in-flight"
    )

    transition = transition_authority_state(
        agent,
        next_state="FROZEN",
        trigger_code="MANUAL_FREEZE",
        reason="Principal stopped the agent during settlement.",
        actor_type="PRINCIPAL",
        actor_id=str(agent.principal_id),
    )

    draw.refresh_from_db()
    agent.credit_account.refresh_from_db()
    reservation = DrawReservation.objects.get(draw_request=draw)
    assert transition.previous_state == "NORMAL"
    assert draw.status == "REVOKED"
    assert reservation.status == "RELEASED"
    assert agent.credit_account.reserved_amount == Decimal("0.00")
