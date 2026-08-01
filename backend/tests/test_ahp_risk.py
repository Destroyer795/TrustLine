import pytest
import numpy as np
from backend.apps.risk.services import compute_ahp_weights

def test_ahp_weights_consistency():
    ahp = compute_ahp_weights()
    assert ahp["consistency_ratio"] <= 0.10, "AHP Consistency Ratio must be <= 0.10"
    sum_weights = ahp["w_identity"] + ahp["w_spending"] + ahp["w_repayment"] + ahp["w_task"]
    assert pytest.approx(sum_weights, 0.001) == 1.0, "Weights must sum to 1.0"
    
    # Priority order assertion: Task > Repayment > Spending > Identity
    assert ahp["w_task"] > ahp["w_repayment"]
    assert ahp["w_repayment"] > ahp["w_spending"]
    assert ahp["w_spending"] > ahp["w_identity"]

def test_ahp_inconsistent_matrix_rejection():
    # Inconsistent matrix
    bad_matrix = np.array([
        [1.0, 9.0, 0.1, 0.1],
        [0.1, 1.0, 9.0, 0.1],
        [9.0, 0.1, 1.0, 9.0],
        [9.0, 9.0, 0.1, 1.0]
    ])
    with pytest.raises(ValueError, match="Inconsistent AHP Matrix"):
        compute_ahp_weights(bad_matrix)
