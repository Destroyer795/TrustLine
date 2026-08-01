from decimal import Decimal
from django.utils import timezone
from backend.common.money import quantize_money
from backend.apps.credit.models import CreditAccount, CreditLimitChange
from backend.apps.risk.services import calculate_and_save_risk_profile

ALPHA_UP = Decimal('0.15')
ALPHA_DOWN = Decimal('0.65')

def calculate_target_credit_limit(weighted_risk_score: Decimal, cold_start_floor: Decimal, authorized_ceiling: Decimal) -> Decimal:
    """
    Bounded Target Credit Limit formula:
    TargetCreditLimit = ColdStartFloor + (WeightedRiskScore / 100) * (AuthorizedCeiling - ColdStartFloor)
    Enforced: 0 <= ColdStartFloor <= TargetCreditLimit <= AuthorizedCeiling
    """
    score_ratio = quantize_money(weighted_risk_score) / Decimal('100.00')
    spread = authorized_ceiling - cold_start_floor
    if spread <= Decimal('0.00'):
        return quantize_money(authorized_ceiling)
    
    target = cold_start_floor + (score_ratio * spread)
    clamped = max(cold_start_floor, min(authorized_ceiling, target))
    return quantize_money(clamped)

def update_credit_limit(account: CreditAccount, trigger: str, reason: str = "") -> CreditLimitChange:
    """
    Recalculates risk profile, calculates target limit, applies asymmetric EMA, and saves change.
    EMA: alpha_up = 0.15, alpha_down = 0.65.
    """
    snapshot = calculate_and_save_risk_profile(account.agent)
    weighted_score = snapshot.weighted_risk_score
    
    mandate = account.agent.current_mandate
    ceiling = mandate.authorized_ceiling if mandate else account.principal_authorized_ceiling
    floor = account.cold_start_floor
    
    target_limit = calculate_target_credit_limit(weighted_score, floor, ceiling)
    prev_limit = account.current_credit_limit
    
    if target_limit >= prev_limit:
        alpha = ALPHA_UP
    else:
        alpha = ALPHA_DOWN
        
    next_limit_raw = prev_limit + (alpha * (target_limit - prev_limit))
    next_limit = quantize_money(next_limit_raw)
    
    # Enforce bounds
    next_limit = max(floor, min(ceiling, next_limit))
    
    # Outstanding obligation floor protection
    min_required_limit = account.outstanding_principal + account.reserved_amount
    if next_limit < min_required_limit:
        next_limit = min_required_limit
        
    account.target_credit_limit = target_limit
    account.current_credit_limit = next_limit
    account.save(update_fields=["target_credit_limit", "current_credit_limit", "updated_at"])
    
    change = CreditLimitChange.objects.create(
        credit_account=account,
        previous_limit=prev_limit,
        target_limit=target_limit,
        new_limit=next_limit,
        alpha=alpha,
        trigger=trigger,
        reason=reason or f"Risk Score = {weighted_score:.2f}, Target Limit = ₹{target_limit:.2f}, Alpha = {alpha}"
    )
    return change
