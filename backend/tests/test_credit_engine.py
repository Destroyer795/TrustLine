import pytest
from decimal import Decimal
from backend.apps.credit.services import calculate_target_credit_limit, ALPHA_UP, ALPHA_DOWN

def test_bounded_credit_limit_formula():
    floor = Decimal('2000.00')
    ceiling = Decimal('15000.00')
    
    # Score = 0 -> Returns floor
    target_0 = calculate_target_credit_limit(Decimal('0.00'), floor, ceiling)
    assert target_0 == Decimal('2000.00')
    
    # Score = 100 -> Returns authorized ceiling
    target_100 = calculate_target_credit_limit(Decimal('100.00'), floor, ceiling)
    assert target_100 == Decimal('15000.00')
    
    # Score = 50 -> Returns midpoint
    target_50 = calculate_target_credit_limit(Decimal('50.00'), floor, ceiling)
    assert target_50 == Decimal('8500.00')
    
    # Clamped bounds check
    assert floor <= target_50 <= ceiling

def test_asymmetric_ema_constants():
    assert ALPHA_UP == Decimal('0.15')
    assert ALPHA_DOWN == Decimal('0.65')
    assert ALPHA_DOWN > ALPHA_UP, "Trust drop must be significantly faster than trust growth"
