import numpy as np
from decimal import Decimal
from django.utils import timezone
from backend.common.crypto import verify_signature, canonicalize_payload
from backend.common.money import quantize_money
from backend.common.errors import APIError
from backend.apps.identity.models import Agent
from backend.apps.risk.models import TrustedReceiptIssuer, TaskReceipt, RiskProfileSnapshot, RiskComponentEvidence

# Pairwise comparison matrix for factors: [Identity, Spending, Repayment, Task]
AHP_MATRIX = np.array([
    [1.00, 0.33, 0.25, 0.20],
    [3.00, 1.00, 0.50, 0.33],
    [4.00, 2.00, 1.00, 0.50],
    [5.00, 3.00, 2.00, 1.00]
])

RANDOM_INDEX = {1: 0.0, 2: 0.0, 3: 0.58, 4: 0.90, 5: 1.12}

def compute_ahp_weights(matrix: np.ndarray = AHP_MATRIX) -> dict:
    """Calculates normalized priority vector and asserts Consistency Ratio CR <= 0.10."""
    n = matrix.shape[0]
    eigenvalues, eigenvectors = np.linalg.eig(matrix)
    max_idx = np.argmax(np.real(eigenvalues))
    max_eigenvalue = np.real(eigenvalues[max_idx])
    
    weights = np.real(eigenvectors[:, max_idx])
    weights = weights / np.sum(weights)
    
    ci = (max_eigenvalue - n) / (n - 1)
    ri = RANDOM_INDEX.get(n, 0.90)
    cr = ci / ri if ri > 0 else 0.0
    
    if cr > 0.10:
        raise ValueError(f"Inconsistent AHP Matrix! CR={cr:.4f} > 0.10")
        
    return {
        "w_identity": float(weights[0]),
        "w_spending": float(weights[1]),
        "w_repayment": float(weights[2]),
        "w_task": float(weights[3]),
        "consistency_ratio": float(cr),
        "max_eigenvalue": float(max_eigenvalue)
    }

def verify_task_receipt(receipt_data: dict, issuer: TrustedReceiptIssuer) -> bool:
    """Verifies Ed25519 signature over task receipt payload."""
    payload = {
        "receipt_id": str(receipt_data["receipt_id"]),
        "task_id": str(receipt_data["task_id"]),
        "agent_id": str(receipt_data["agent_id"]),
        "outcome": receipt_data["outcome"],
        "value": str(quantize_money(receipt_data.get("value", 0))),
        "issued_at": receipt_data["issued_at"],
        "nonce": receipt_data["nonce"]
    }
    canonical = canonicalize_payload(payload)
    return verify_signature(payload, receipt_data["signature"], issuer.public_key_b64)

def calculate_identity_confidence(agent: Agent) -> tuple[float, int, str]:
    """Identity confidence derived from principal verification level."""
    verification = getattr(agent.principal, 'verification', None)
    if not verification:
        return 0.50, 0, "Unverified principal fallback prior"
    
    level_map = {
        "VERIFIED_HIGH": (0.95, 1, "Principal verified via enterprise OAuth & linked bank anchor"),
        "VERIFIED_MEDIUM": (0.80, 1, "Principal verified via standard OAuth anchor"),
        "PENDING": (0.50, 0, "Principal verification pending")
    }
    return level_map.get(verification.verification_level, (0.50, 0, "Default identity prior"))

def calculate_task_reliability(agent: Agent) -> tuple[float, int, bool, str]:
    """
    Task reliability score.
    Before any verified task receipt, task reliability is STRICTLY 0.0 with is_imputed=False.
    """
    receipts = agent.receipts.all()
    count = receipts.count()
    if count == 0:
        return 0.0, 0, False, "Cold start: No verified task receipts present. Task reliability starts at zero."
    
    successful = receipts.filter(outcome="SUCCESS").count()
    ratio = successful / count
    return float(ratio), count, False, f"Earned task success ratio: {successful}/{count} verified receipts."

def calculate_repayment_reliability(agent: Agent, identity_confidence: float) -> tuple[float, int, bool, str]:
    """
    Repayment reliability score.
    Before the first repayment outcome, initializes from identity confidence prior with is_imputed=True.
    """
    from backend.apps.repayment.models import RepaymentAttempt
    attempts = RepaymentAttempt.objects.filter(schedule__draw__credit_account__agent=agent)
    count = attempts.count()
    
    if count == 0:
        return identity_confidence, 0, True, "Provisional prior: No repayment history yet. Initialized from identity confidence."
    
    successful = attempts.filter(status="SUCCESS").count()
    ratio = successful / count
    return float(ratio), count, False, f"Earned repayment reliability: {successful}/{count} successful mandate pulls."

def calculate_spending_regularity(agent: Agent, identity_confidence: float) -> tuple[float, int, bool, str]:
    """
    Spending regularity score based on draw variance.
    Before 5 valid draws, uses provisional identity confidence prior with is_imputed=True.
    """
    from backend.apps.gateway.models import DrawRequest
    draws = DrawRequest.objects.filter(credit_account__agent=agent, status="SETTLED")
    count = draws.count()
    
    if count < 5:
        return identity_confidence, count, True, f"Provisional prior: Insufficient spend history ({count}/5 draws needed)."
    
    amounts = [float(d.amount) for d in draws]
    std = np.std(amounts)
    mean = np.mean(amounts)
    cv = (std / mean) if mean > 0 else 0.0
    
    # Lower coefficient of variation means higher regularity
    score = max(0.0, min(1.0, 1.0 - (cv / 2.0)))
    return float(score), count, False, f"Earned spend regularity score: {score:.2f} (Coefficient of Variation = {cv:.2f})."

def calculate_and_save_risk_profile(agent: Agent) -> RiskProfileSnapshot:
    """Calculates Risk Profile snapshot using AHP policy prior and 5 component breakdown."""
    ahp = compute_ahp_weights()
    
    id_score, id_cnt, id_reason = calculate_identity_confidence(agent)
    task_score, task_cnt, task_imp, task_reason = calculate_task_reliability(agent)
    repay_score, repay_cnt, repay_imp, repay_reason = calculate_repayment_reliability(agent, id_score)
    spend_score, spend_cnt, spend_imp, spend_reason = calculate_spending_regularity(agent, id_score)
    
    # Weighted Risk Score (0-100)
    weighted_score = 100.0 * (
        ahp["w_identity"] * id_score +
        ahp["w_spending"] * spend_score +
        ahp["w_repayment"] * repay_score +
        ahp["w_task"] * task_score
    )
    weighted_score_dec = quantize_money(weighted_score)
    
    credit_account = getattr(agent, 'credit_account', None)
    if credit_account:
        curr_exp = credit_account.outstanding_principal + credit_account.reserved_amount
        limit = credit_account.current_credit_limit
        util_pct = (curr_exp / limit * 100) if limit > 0 else Decimal('0.00')
    else:
        curr_exp = Decimal('0.00')
        util_pct = Decimal('0.00')
        
    snapshot = RiskProfileSnapshot.objects.create(
        agent=agent,
        weighted_risk_score=weighted_score_dec,
        identity_confidence=quantize_money(id_score),
        task_reliability=quantize_money(task_score),
        repayment_reliability=quantize_money(repay_score),
        spending_regularity=quantize_money(spend_score),
        current_exposure_amount=quantize_money(curr_exp),
        current_exposure_utilization=quantize_money(util_pct),
        repayment_imputed=repay_imp,
        spending_imputed=spend_imp,
        ahp_version="v1.0"
    )
    
    # Create evidence breakdown entries
    RiskComponentEvidence.objects.create(snapshot=snapshot, component="IDENTITY", score=quantize_money(id_score), evidence_count=id_cnt, source="Principal Trust Anchor", is_imputed=False, reason=id_reason)
    RiskComponentEvidence.objects.create(snapshot=snapshot, component="TASK", score=quantize_money(task_score), evidence_count=task_cnt, source="Ed25519 Signed Task Receipts", is_imputed=task_imp, reason=task_reason)
    RiskComponentEvidence.objects.create(snapshot=snapshot, component="REPAYMENT", score=quantize_money(repay_score), evidence_count=repay_cnt, source="Automated Mandate Debits", is_imputed=repay_imp, reason=repay_reason)
    RiskComponentEvidence.objects.create(snapshot=snapshot, component="SPENDING", score=quantize_money(spend_score), evidence_count=spend_cnt, source="Transaction Gateway Log", is_imputed=spend_imp, reason=spend_reason)
    RiskComponentEvidence.objects.create(snapshot=snapshot, component="EXPOSURE", score=quantize_money(util_pct / 100), evidence_count=1, source="Live Balance Utilization", is_imputed=False, reason=f"Current Utilization: {util_pct:.1f}% (Excluded from AHP Score)")
    
    return snapshot
