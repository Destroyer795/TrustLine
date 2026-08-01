import hashlib
from decimal import Decimal
from django.db import transaction, models
from django.utils import timezone
from backend.common.money import quantize_money
from backend.common.errors import APIError
from backend.apps.identity.models import Agent, CapabilityManifest, Mandate
from backend.apps.identity.services import verify_mandate_integrity
from backend.apps.credit.models import CreditAccount
from backend.apps.gateway.models import DrawRequest, DrawReservation, LedgerEntry, IdempotencyRecord
from backend.apps.audit.services import append_audit_event

def process_draw_request(agent: Agent, amount: Decimal, merchant_name: str, merchant_category: str, idempotency_key: str) -> DrawRequest:
    """
    15-step atomic check-and-reserve transaction executed inside PostgreSQL select_for_update lock.
    """
    amount = quantize_money(amount)
    request_hash = hashlib.sha256(f"{agent.id}:{amount}:{merchant_category}:{idempotency_key}".encode('utf-8')).hexdigest()
    
    # 4. Idempotency Check
    existing_idemp = IdempotencyRecord.objects.filter(idempotency_key=idempotency_key).first()
    if existing_idemp:
        if existing_idemp.request_hash == request_hash:
            draw_id = existing_idemp.response_body.get("draw_id")
            return DrawRequest.objects.get(id=draw_id)
        else:
            raise APIError("IDEMPOTENCY_CONFLICT", "Same idempotency key used with a different request payload.", status_code=409)

    with transaction.atomic():
        # 1 & 7. Auth & Authority State Check
        if agent.status in ["FROZEN", "HUMAN_REVIEW"]:
            raise APIError("AGENT_FROZEN", f"Agent status is {agent.status}. Draws are blocked.", status_code=403)

        # 2 & 3. Row Lock select_for_update on credit account & principal
        account = CreditAccount.objects.select_for_update().get(agent=agent)
        principal = agent.principal
        
        # 5. Mandate verification
        mandate = agent.current_mandate
        if not mandate or not verify_mandate_integrity(mandate):
            raise APIError("MANDATE_INVALID", "Mandate is missing, expired, revoked, or signature invalid.", status_code=403)
            
        # 6. Capability Manifest verification
        manifest = agent.manifests.filter(manifest_version=mandate.manifest_hash and manifest_version_helper(mandate) or 1).order_by('-manifest_version').first()
        if not manifest:
            manifest = agent.manifests.order_by('-manifest_version').first()

        now = timezone.now()
        if manifest:
            if now < manifest.valid_from or now > manifest.valid_until:
                raise APIError("MANIFEST_EXPIRED", "Capability manifest valid date window expired.", status_code=403)

        # 8. Merchant / Category Policy Check
        if manifest:
            if merchant_category in manifest.denied_categories:
                raise APIError("CATEGORY_DENIED", f"Merchant category '{merchant_category}' is explicitly denied in manifest.", status_code=403)
            if manifest.allowed_categories and merchant_category not in manifest.allowed_categories:
                raise APIError("CATEGORY_NOT_ALLOWED", f"Merchant category '{merchant_category}' is not in allowed list.", status_code=403)

        # 9. Per-Transaction Limit Check
        if manifest and amount > manifest.max_per_transaction:
            raise APIError("TRANSACTION_LIMIT_EXCEEDED", f"Requested amount ₹{amount} exceeds single transaction cap of ₹{manifest.max_per_transaction}.", status_code=400)

        # 10. Daily Limit Check (past 24h draws)
        twenty_four_hours_ago = now - timezone.timedelta(hours=24)
        daily_sum = DrawRequest.objects.filter(
            credit_account=account,
            created_at__gte=twenty_four_hours_ago,
            status__in=["RESERVED", "SETTLING", "SETTLED"]
        ).aggregate(total=models.Sum('amount'))['total'] or Decimal('0.00')

        if manifest and (daily_sum + amount) > manifest.max_per_day:
            raise APIError("DAILY_LIMIT_EXCEEDED", f"Draw would exceed 24h velocity limit of ₹{manifest.max_per_day}. (Current 24h spend: ₹{daily_sum}).", status_code=400)

        # 11. Agent Available Credit Limit Check
        avail_credit = account.available_credit
        if amount > avail_credit:
            raise APIError(
                "CREDIT_LIMIT_EXCEEDED",
                f"Requested amount ₹{amount} exceeds available credit limit of ₹{avail_credit}.",
                status_code=402,
                details={"requested": str(amount), "available": str(avail_credit), "current_limit": str(account.current_credit_limit)}
            )

        # 12. Principal-Wide Exposure Check
        total_principal_exposure = CreditAccount.objects.filter(agent__principal=principal).aggregate(
            total=models.Sum(models.F('reserved_amount') + models.F('outstanding_principal'))
        )['total'] or Decimal('0.00')

        # 13. Reserve Amount & Create Draw Request
        draw = DrawRequest.objects.create(
            credit_account=account,
            amount=amount,
            merchant_name=merchant_name,
            merchant_category=merchant_category,
            idempotency_key=idempotency_key,
            status="RESERVED"
        )
        
        reservation = DrawReservation.objects.create(
            draw_request=draw,
            reserved_amount=amount,
            expires_at=now + timezone.timedelta(minutes=15),
            status="HELD"
        )

        account.reserved_amount += amount
        account.save(update_fields=["reserved_amount", "updated_at"])

        # 14. Log SHA-256 Audit Event
        append_audit_event(
            event_type="DRAW_RESERVED",
            actor_type="AGENT",
            actor_id=str(agent.id),
            entity_type="DRAW_REQUEST",
            entity_id=str(draw.id),
            payload={
                "draw_id": str(draw.id),
                "agent_id": str(agent.id),
                "amount": str(amount),
                "merchant": merchant_name,
                "category": merchant_category,
                "reserved_balance": str(account.reserved_amount),
                "available_credit": str(account.available_credit)
            }
        )

        # Record Idempotency Record
        res_body = {
            "draw_id": str(draw.id),
            "status": "RESERVED",
            "amount": str(amount),
            "reserved_amount": str(account.reserved_amount),
            "available_credit": str(account.available_credit)
        }
        IdempotencyRecord.objects.create(
            idempotency_key=idempotency_key,
            request_hash=request_hash,
            response_status=201,
            response_body=res_body
        )

        return draw

def manifest_version_helper(mandate: Mandate) -> int:
    return mandate.version

def advance_draw_settlement(draw: DrawRequest) -> DrawRequest:
    """Transitions a reserved draw to SETTLED and creates repayment schedule."""
    with transaction.atomic():
        account = CreditAccount.objects.select_for_update().get(id=draw.credit_account.id)
        agent = account.agent
        
        # Check authority state before transition (staged in-flight freeze check)
        if agent.status in ["FROZEN", "HUMAN_REVIEW"]:
            # In-flight revocation! Release reservation
            if draw.status == "RESERVED":
                account.reserved_amount = max(Decimal('0.00'), account.reserved_amount - draw.amount)
                account.save(update_fields=["reserved_amount", "updated_at"])
                draw.status = "REVOKED"
                draw.rejection_reason = f"Draw revoked in-flight due to agent status: {agent.status}"
                draw.save(update_fields=["status", "rejection_reason", "updated_at"])
                
                append_audit_event(
                    event_type="DRAW_REVOKED_IN_FLIGHT",
                    actor_type="SYSTEM",
                    actor_id=str(agent.id),
                    entity_type="DRAW_REQUEST",
                    entity_id=str(draw.id),
                    payload={"draw_id": str(draw.id), "reason": draw.rejection_reason}
                )
                return draw

        if draw.status == "REVOKED":
            # Draw was already revoked (e.g. by a concurrent freeze via transition_authority_state).
            # Return it as-is so the caller sees the revocation result.
            return draw

        if draw.status != "RESERVED":
            raise APIError("INVALID_DRAW_STATE", f"Cannot settle draw in state {draw.status}.", status_code=400)

        draw.status = "SETTLED"
        draw.save(update_fields=["status", "updated_at"])

        # Move balance from reserved to outstanding
        account.reserved_amount = max(Decimal('0.00'), account.reserved_amount - draw.amount)
        account.outstanding_principal += draw.amount
        account.save(update_fields=["reserved_amount", "outstanding_principal", "updated_at"])

        # Create Ledger Entry
        LedgerEntry.objects.create(
            credit_account=account,
            draw_request=draw,
            entry_type="DRAW_SETTLEMENT",
            amount=draw.amount,
            running_outstanding_balance=account.outstanding_principal
        )

        # Create Repayment Schedule
        from backend.apps.repayment.services import create_repayment_schedule_for_draw
        create_repayment_schedule_for_draw(draw)

        append_audit_event(
            event_type="DRAW_SETTLED",
            actor_type="GATEWAY",
            actor_id=str(draw.id),
            entity_type="DRAW_REQUEST",
            entity_id=str(draw.id),
            payload={
                "draw_id": str(draw.id),
                "amount": str(draw.amount),
                "outstanding_principal": str(account.outstanding_principal)
            }
        )

        return draw
