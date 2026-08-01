from decimal import Decimal, ROUND_HALF_UP

DECIMAL_ZERO = Decimal('0.00')

def quantize_money(amount) -> Decimal:
    """Converts int, float, or string amount to Decimal with 2 decimal places using ROUND_HALF_UP."""
    if amount is None:
        return DECIMAL_ZERO
    if not isinstance(amount, Decimal):
        amount = Decimal(str(amount))
    return amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

def format_currency(amount: Decimal, currency: str = "INR") -> str:
    """Formats decimal money to string representation."""
    d = quantize_money(amount)
    return f"{currency} {d:,.2f}"
