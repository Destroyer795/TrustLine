import secrets
from decimal import Decimal
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from backend.common.money import quantize_money
from backend.common.errors import APIError
from backend.apps.identity.models import Principal, PrincipalVerification, LinkedAccount, Agent, CapabilityManifest, Mandate
from backend.apps.identity.services import generate_agent_api_key, create_and_sign_mandate, verify_mandate_integrity
from backend.apps.risk.models import TrustedReceiptIssuer, Task, TaskReceipt, RiskProfileSnapshot, RiskComponentEvidence
from backend.apps.risk.services import calculate_and_save_risk_profile, verify_task_receipt
from backend.apps.credit.models import CreditAccount, CreditLimitChange
from backend.apps.credit.services import update_credit_limit
from backend.apps.gateway.models import DrawRequest, DrawReservation, LedgerEntry
from backend.apps.gateway.services import process_draw_request, advance_draw_settlement
from backend.apps.repayment.models import RepaymentSchedule, RepaymentAttempt
from backend.apps.repayment.services import process_repayment_attempt
from backend.apps.monitoring.models import AuthorityStateTransition, Escalation
from backend.apps.monitoring.services import transition_authority_state
from backend.apps.audit.models import AuditEvent
from backend.apps.audit.services import verify_audit_chain, tamper_audit_log_for_demo, append_audit_event
from backend.apps.demo.llm_explainer import generate_risk_explanation_narrative

@api_view(['GET'])
def health_check(request):
    return Response({"status": "ok", "service": "TrustLine Infrastructure", "version": "v1.0", "timestamp": timezone.now().isoformat()})

# --- Principals & Identity ---

@api_view(['POST', 'GET'])
def principals_list_create(request):
    if request.method == 'GET':
        principals = Principal.objects.all()
        data = [{
            "id": str(p.id),
            "name": p.name,
            "email": p.email,
            "verification": getattr(p, 'verification', None) and {
                "level": p.verification.verification_level,
                "status": p.verification.status
            }
        } for p in principals]
        return Response(data)
    
    elif request.method == 'POST':
        name = request.data.get("name")
        email = request.data.get("email")
        if not name or not email:
            raise APIError("VALIDATION_ERROR", "Name and email are required fields.")
        
        principal, _ = Principal.objects.get_or_create(
            email=email,
            defaults={
                "name": name,
                "credit_pool_ceiling": quantize_money(request.data.get("credit_pool_ceiling", 30000)),
            },
        )
        PrincipalVerification.objects.get_or_create(
            principal=principal,
            defaults={"provider": "MOCK_OAUTH", "provider_subject_id": f"sub_{secrets.token_hex(8)}", "verification_level": "VERIFIED_HIGH", "status": "VERIFIED"}
        )
        LinkedAccount.objects.get_or_create(
            principal=principal,
            defaults={"account_reference": f"ACCT-{secrets.token_hex(4).upper()}", "mock_balance": Decimal('50000.00')}
        )
        return Response({"id": str(principal.id), "name": principal.name, "email": principal.email}, status=status.HTTP_201_CREATED)

@api_view(['GET'])
def principal_detail(request, pk):
    try:
        p = Principal.objects.get(id=pk)
    except Principal.DoesNotExist:
        raise APIError("NOT_FOUND", "Principal not found.", status_code=404)
        
    accounts = p.linked_accounts.all()
    agents = p.agents.all()
    return Response({
        "id": str(p.id),
        "name": p.name,
        "email": p.email,
        "credit_pool_ceiling": str(p.credit_pool_ceiling),
        "verification": getattr(p, 'verification', None) and {
            "level": p.verification.verification_level,
            "status": p.verification.status
        },
        "linked_accounts": [{"id": str(a.id), "account_reference": a.account_reference, "status": a.status, "balance": str(a.mock_balance)} for a in accounts],
        "agents": [{"id": str(ag.id), "display_name": ag.display_name, "status": ag.status} for ag in agents]
    })

@api_view(['POST'])
def principal_linked_accounts(request, pk):
    try:
        p = Principal.objects.get(id=pk)
    except Principal.DoesNotExist:
        raise APIError("NOT_FOUND", "Principal not found.", status_code=404)
        
    acc_ref = request.data.get("account_reference", f"ACCT-{secrets.token_hex(4).upper()}")
    balance = request.data.get("mock_balance", 50000.0)
    acct = LinkedAccount.objects.create(principal=p, account_reference=acc_ref, mock_balance=quantize_money(balance))
    return Response({"id": str(acct.id), "account_reference": acct.account_reference, "mock_balance": str(acct.mock_balance)}, status=status.HTTP_201_CREATED)

# --- Agents & Authority ---

@api_view(['POST', 'GET'])
def agents_list_create(request):
    if request.method == 'GET':
        agents = Agent.objects.all()
        res = []
        for ag in agents:
            ca = getattr(ag, 'credit_account', None)
            res.append({
                "id": str(ag.id),
                "principal_id": str(ag.principal.id),
                "principal_name": ag.principal.name,
                "display_name": ag.display_name,
                "purpose": ag.purpose,
                "status": ag.status,
                "created_at": ag.created_at.isoformat(),
                "current_limit": str(ca.current_credit_limit) if ca else "0.00",
                "available_credit": str(ca.available_credit) if ca else "0.00",
                "reserved_amount": str(ca.reserved_amount) if ca else "0.00",
                "outstanding_principal": str(ca.outstanding_principal) if ca else "0.00"
            })
        return Response(res)

    elif request.method == 'POST':
        principal_id = request.data.get("principal_id")
        display_name = request.data.get("display_name")
        purpose = request.data.get("purpose", "")
        ceiling = request.data.get("authorized_ceiling", 15000.0)
        floor = request.data.get("cold_start_floor", 2000.0)

        ceiling = quantize_money(ceiling)
        floor = quantize_money(floor)
        if not display_name:
            raise APIError("VALIDATION_ERROR", "display_name is required.")
        if floor <= 0 or ceiling <= 0 or floor > ceiling:
            raise APIError("VALIDATION_ERROR", "Credit floor and ceiling must be positive, and floor cannot exceed ceiling.")
        
        try:
            p = Principal.objects.get(id=principal_id)
        except Principal.DoesNotExist:
            raise APIError("NOT_FOUND", "Principal not found.", status_code=404)
            
        raw_key, hashed_key = generate_agent_api_key()
        agent = Agent.objects.create(principal=p, display_name=display_name, purpose=purpose, api_key_hash=hashed_key, status="NORMAL")
        
        acct = LinkedAccount.objects.filter(principal=p).first()
        if not acct:
            acct = LinkedAccount.objects.create(principal=p, account_reference=f"ACCT-{secrets.token_hex(4).upper()}")

        now = timezone.now()
        manifest = CapabilityManifest.objects.create(
            agent=agent,
            allowed_categories=request.data.get("allowed_categories", ["CLOUD_SERVICES", "API_SERVICES"]),
            denied_categories=request.data.get("denied_categories", ["P2P_TRANSFER", "CRYPTO_EXCHANGE"]),
            max_per_transaction=quantize_money(request.data.get("max_per_transaction", 5000.0)),
            max_per_day=quantize_money(request.data.get("max_per_day", 20000.0)),
            valid_from=now,
            valid_until=now + timezone.timedelta(days=30)
        )

        mandate = create_and_sign_mandate(p, agent, acct, manifest, authorized_ceiling=ceiling)
        credit_acct = CreditAccount.objects.create(
            agent=agent,
            current_credit_limit=floor,
            target_credit_limit=floor,
            cold_start_floor=floor,
            principal_authorized_ceiling=ceiling
        )

        calculate_and_save_risk_profile(agent)
        
        append_audit_event(
            event_type="AGENT_REGISTERED",
            actor_type="PRINCIPAL",
            actor_id=str(p.id),
            entity_type="AGENT",
            entity_id=str(agent.id),
            payload={"agent_id": str(agent.id), "display_name": display_name, "mandate_id": str(mandate.id)}
        )

        return Response({
            "id": str(agent.id),
            "display_name": agent.display_name,
            "status": agent.status,
            "raw_api_key": raw_key, # Returned ONCE on creation
            "mandate_id": str(mandate.id),
            "credit_limit": str(credit_acct.current_credit_limit)
        }, status=status.HTTP_201_CREATED)

@api_view(['GET'])
def agent_detail(request, pk):
    try:
        ag = Agent.objects.get(id=pk)
    except Agent.DoesNotExist:
        raise APIError("NOT_FOUND", "Agent not found.", status_code=404)
        
    ca = getattr(ag, 'credit_account', None)
    mandate = ag.current_mandate
    snapshot = ag.risk_snapshots.order_by('-created_at').first()

    return Response({
        "id": str(ag.id),
        "principal": {"id": str(ag.principal.id), "name": ag.principal.name},
        "display_name": ag.display_name,
        "purpose": ag.purpose,
        "status": ag.status,
        "credit_account": ca and {
            "current_limit": str(ca.current_credit_limit),
            "target_limit": str(ca.target_credit_limit),
            "cold_start_floor": str(ca.cold_start_floor),
            "authorized_ceiling": str(ca.principal_authorized_ceiling),
            "reserved_amount": str(ca.reserved_amount),
            "outstanding_principal": str(ca.outstanding_principal),
            "available_credit": str(ca.available_credit)
        },
        "mandate": mandate and {
            "id": str(mandate.id),
            "version": mandate.version,
            "authorized_ceiling": str(mandate.authorized_ceiling),
            "expires_at": mandate.expires_at.isoformat(),
            "is_valid": verify_mandate_integrity(mandate)
        },
        "latest_risk_score": str(snapshot.weighted_risk_score) if snapshot else "0.00"
    })

@api_view(['POST'])
def agent_freeze(request, pk):
    try:
        ag = Agent.objects.get(id=pk)
    except Agent.DoesNotExist:
        raise APIError("NOT_FOUND", "Agent not found.", status_code=404)
        
    reason = request.data.get("reason", "Manual freeze invoked by principal.")
    transition = transition_authority_state(ag, next_state="FROZEN", trigger_code="MANUAL_FREEZE", reason=reason, actor_type="PRINCIPAL", actor_id=str(ag.principal.id))
    return Response({"agent_id": str(ag.id), "status": ag.status, "reason": reason})

@api_view(['POST'])
def agent_unfreeze(request, pk):
    try:
        ag = Agent.objects.get(id=pk)
    except Agent.DoesNotExist:
        raise APIError("NOT_FOUND", "Agent not found.", status_code=404)
        
    reason = request.data.get("reason", "Manual unfreeze override approved.")
    transition = transition_authority_state(ag, next_state="NORMAL", trigger_code="MANUAL_UNFREEZE", reason=reason, actor_type="PRINCIPAL", actor_id=str(ag.principal.id))
    return Response({"agent_id": str(ag.id), "status": ag.status, "reason": reason})

@api_view(['POST'])
def agent_restrict(request, pk):
    try:
        ag = Agent.objects.get(id=pk)
    except Agent.DoesNotExist:
        raise APIError("NOT_FOUND", "Agent not found.", status_code=404)
    reason = request.data.get("reason", "Irregular spend pattern crossed the restriction threshold.")
    transition_authority_state(ag, next_state="RESTRICTED", trigger_code="SPEND_ANOMALY", reason=reason, actor_type="SYSTEM")
    return Response({"agent_id": str(ag.id), "status": ag.status, "reason": reason})

# --- Risk & Credit ---

@api_view(['GET'])
def agent_risk_profile(request, pk):
    try:
        ag = Agent.objects.get(id=pk)
    except Agent.DoesNotExist:
        raise APIError("NOT_FOUND", "Agent not found.", status_code=404)
        
    snapshot = ag.risk_snapshots.order_by('-created_at').first()
    if not snapshot:
        snapshot = calculate_and_save_risk_profile(ag)
        
    evidence_items = snapshot.evidence_items.all()
    narrative_obj = generate_risk_explanation_narrative(ag, snapshot)

    return Response({
        "agent_id": str(ag.id),
        "weighted_risk_score": str(snapshot.weighted_risk_score),
        "components": {
            "identity_confidence": {"score": str(snapshot.identity_confidence), "is_imputed": False},
            "task_reliability": {"score": str(snapshot.task_reliability), "is_imputed": False},
            "repayment_reliability": {"score": str(snapshot.repayment_reliability), "is_imputed": snapshot.repayment_imputed},
            "spending_regularity": {"score": str(snapshot.spending_regularity), "is_imputed": snapshot.spending_imputed},
            "current_exposure": {"amount": str(snapshot.current_exposure_amount), "utilization_pct": str(snapshot.current_exposure_utilization)}
        },
        "evidence": [{
            "component": ev.component,
            "score": str(ev.score),
            "evidence_count": ev.evidence_count,
            "source": ev.source,
            "is_imputed": ev.is_imputed,
            "reason": ev.reason
        } for ev in evidence_items],
        "explanation": narrative_obj
    })

@api_view(['POST'])
def agent_recalculate_risk(request, pk):
    try:
        ag = Agent.objects.get(id=pk)
    except Agent.DoesNotExist:
        raise APIError("NOT_FOUND", "Agent not found.", status_code=404)
        
    ca = getattr(ag, 'credit_account', None)
    if ca:
        change = update_credit_limit(ca, trigger="MANUAL_RECALCULATION", reason="Manual risk recalculation trigger")
        return Response({"agent_id": str(ag.id), "new_limit": str(ca.current_credit_limit), "target_limit": str(ca.target_credit_limit)})
    else:
        snapshot = calculate_and_save_risk_profile(ag)
        return Response({"agent_id": str(ag.id), "score": str(snapshot.weighted_risk_score)})

# --- Gateway & Draws ---

@api_view(['POST'])
def draws_create(request):
    agent_id = request.data.get("agent_id")
    amount = request.data.get("amount")
    merchant_name = request.data.get("merchant_name", "Vendor API")
    merchant_category = request.data.get("merchant_category", "API_SERVICES")
    idempotency_key = request.headers.get("Idempotency-Key") or request.data.get("idempotency_key")
    
    if not agent_id or not amount or not idempotency_key:
        raise APIError("VALIDATION_ERROR", "agent_id, amount, and Idempotency-Key header are required.")
        
    try:
        ag = Agent.objects.get(id=agent_id)
    except Agent.DoesNotExist:
        raise APIError("NOT_FOUND", "Agent not found.", status_code=404)
        
    draw = process_draw_request(ag, Decimal(str(amount)), merchant_name, merchant_category, idempotency_key)
    acct = draw.credit_account

    return Response({
        "draw_id": str(draw.id),
        "status": draw.status,
        "amount": str(draw.amount),
        "merchant_name": draw.merchant_name,
        "merchant_category": draw.merchant_category,
        "reserved_amount": str(acct.reserved_amount),
        "available_credit": str(acct.available_credit)
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
def draw_advance(request, pk):
    try:
        draw = DrawRequest.objects.get(id=pk)
    except DrawRequest.DoesNotExist:
        raise APIError("NOT_FOUND", "Draw request not found.", status_code=404)
        
    settled_draw = advance_draw_settlement(draw)
    return Response({"draw_id": str(settled_draw.id), "status": settled_draw.status, "rejection_reason": settled_draw.rejection_reason})

# --- Repayment ---

@api_view(['GET'])
def agent_repayments(request, pk):
    try:
        ag = Agent.objects.get(id=pk)
    except Agent.DoesNotExist:
        raise APIError("NOT_FOUND", "Agent not found.", status_code=404)
        
    schedules = RepaymentSchedule.objects.filter(draw__credit_account__agent=ag)
    data = []
    for s in schedules:
        attempts = s.attempts.all()
        data.append({
            "id": str(s.id),
            "draw_id": str(s.draw.id),
            "amount": str(s.amount),
            "due_date": s.due_date.isoformat(),
            "status": s.status,
            "attempts": [{"id": str(at.id), "status": at.status, "ref": at.bank_transaction_ref, "reason": at.failure_reason} for at in attempts]
        })
    return Response(data)

@api_view(['POST'])
def repayment_attempt(request, pk):
    try:
        schedule = RepaymentSchedule.objects.get(id=pk)
    except RepaymentSchedule.DoesNotExist:
        raise APIError("NOT_FOUND", "Repayment schedule not found.", status_code=404)
        
    force_status = request.data.get("force_status") # e.g. INSUFFICIENT_FUNDS, SUCCESS
    attempt = process_repayment_attempt(schedule, force_status=force_status)
    return Response({"attempt_id": str(attempt.id), "status": attempt.status, "bank_ref": attempt.bank_transaction_ref, "reason": attempt.failure_reason})

@api_view(['POST'])
def demo_set_account_state(request, pk):
    try:
        la = LinkedAccount.objects.get(id=pk)
    except LinkedAccount.DoesNotExist:
        raise APIError("NOT_FOUND", "Linked account not found.", status_code=404)
        
    new_status = request.data.get("status") # ACTIVE, BLOCKED, CHANGED
    new_balance = request.data.get("mock_balance")
    if new_status:
        la.status = new_status
    if new_balance is not None:
        la.mock_balance = quantize_money(new_balance)
    la.save()
    return Response({"id": str(la.id), "status": la.status, "mock_balance": str(la.mock_balance)})

# --- Audit & System ---

@api_view(['GET'])
def audit_events_list(request):
    events = AuditEvent.objects.order_by('-sequence')[:100]
    data = [{
        "sequence": ev.sequence,
        "event_id": str(ev.event_id),
        "event_type": ev.event_type,
        "actor": f"{ev.actor_type}:{ev.actor_id}",
        "entity": f"{ev.entity_type}:{ev.entity_id}",
        "previous_hash": ev.previous_hash,
        "current_hash": ev.current_hash,
        "created_at": ev.created_at.isoformat(),
        "payload": ev.payload
    } for ev in events]
    return Response(data)

@api_view(['GET'])
def audit_verify(request):
    res = verify_audit_chain()
    return Response(res)

@api_view(['POST'])
def demo_audit_tamper(request):
    res = tamper_audit_log_for_demo()
    return Response(res)

# --- Demo Control ---

@api_view(['POST'])
def demo_seed(request):
    from scripts.seed_demo import run_seed
    res = run_seed()
    return Response(res)

@api_view(['POST'])
def demo_reset(request):
    from scripts.demo_reset import run_reset
    res = run_reset()
    return Response(res)

@api_view(['GET'])
def demo_status(request):
    return Response({
        "principals": Principal.objects.count(),
        "agents": Agent.objects.count(),
        "draws": DrawRequest.objects.count(),
        "repayments": RepaymentSchedule.objects.count(),
        "audit_events": AuditEvent.objects.count(),
        "audit_chain_valid": verify_audit_chain()["status"] == "VALID"
    })
