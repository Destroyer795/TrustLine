# Analytic Hierarchy Process (AHP) & Risk Methodology

## 1. Underwriting Principles

Autonomous AI agents lack traditional credit bureau history (FICO, CIBIL), tax filings, or legal personal liability. TrustLine underwrites credit using four behavioral and structural factors evaluated through an **Analytic Hierarchy Process (AHP)** policy prior model:

1. **Identity Confidence ($C_I$):** Derived from principal verification anchor strength and mandate cryptographic validity.
2. **Task Reliability ($C_T$):** Earned task execution success ratio derived exclusively from Ed25519-signed task receipts issued by trusted external verifiers.
3. **Repayment Reliability ($C_R$):** Earned repayment track record (successful vs. late/failed automated mandate pulls).
4. **Spending Regularity ($C_S$):** Draw pattern consistency relative to the agent's historical spend velocity.

> [!IMPORTANT]
> **Current Exposure ($E$) is explicitly EXCLUDED from the AHP risk score.** Live balance utilization is enforced separately as a dynamic hard ceiling in the Transaction Gateway.

---

## 2. AHP Pairwise Matrix & Derivation

The policy prior matrix ranks underwriting importance in the following hierarchy:
$$\text{Task Reliability} > \text{Repayment Reliability} > \text{Spending Regularity} > \text{Identity Confidence}$$

### Pairwise Comparison Matrix ($A$)

$$
A = \begin{pmatrix}
1.00 & 0.33 & 0.25 & 0.20 \\
3.00 & 1.00 & 0.50 & 0.33 \\
4.00 & 2.00 & 1.00 & 0.50 \\
5.00 & 3.00 & 2.00 & 1.00 
\end{pmatrix}
$$

Rows / Columns order: $[C_I, C_S, C_R, C_T]$

### Derived Priority Vector ($W$)

Normalized Principal Eigenvector ($W = [w_{\text{identity}}, w_{\text{spending}}, w_{\text{repayment}}, w_{\text{task}}]$):

- $w_{\text{identity}} = 0.071$ (7.1%)
- $w_{\text{spending}} = 0.188$ (18.8%)
- $w_{\text{repayment}} = 0.312$ (31.2%)
- $w_{\text{task}} = 0.429$ (42.9%)

### Mathematical Consistency Check

- Maximum Eigenvalue ($\lambda_{\text{max}}$) $\approx 4.092$
- Matrix Dimension ($n$) = 4
- Consistency Index ($CI = \frac{\lambda_{\text{max}} - n}{n - 1}$) = $\frac{4.092 - 4}{3} \approx 0.0307$
- Random Index for $n=4$ ($RI$) = 0.90
- Consistency Ratio ($CR = \frac{CI}{RI}$) = $\frac{0.0307}{0.90} \approx 0.0341$

Since $CR = 0.0341 \le 0.10$, the matrix satisfies AHP consistency criteria.

---

## 3. Weighted Risk Score Calculation

The overall Weighted Risk Score ($S \in [0, 100]$) is calculated as:

$$S = 100 \times \sum_{k \in \{I, T, R, S\}} w_k \cdot C_k$$

Where each component score $C_k \in [0.0, 1.0]$.

### Imputed vs. Earned Cold-Start Rules

- **Task Reliability ($C_T$):** Starts strictly at `0.0` with `is_imputed = false` until the first signed task receipt is verified.
- **Repayment Reliability ($C_R$):** Initialized from Identity Confidence prior ($C_I$) with `is_imputed = true`. Replaced by earned history after the first repayment pull.
- **Spending Regularity ($C_S$):** Initialized from Identity Confidence prior ($C_I$) with `is_imputed = true`. Replaced by historical standard deviation score after 5 valid draws.

---

## 4. Bounded Credit Limit & Asymmetric EMA

### Target Credit Limit Formula

$$\text{TargetCreditLimit} = \text{ColdStartFloor} + \left(\frac{S}{100}\right) \times (\text{PrincipalCeiling} - \text{ColdStartFloor})$$

### Asymmetric Exponential Moving Average (EMA)

To model fast trust erosion and slow trust accumulation:

$$\text{NextLimit} = \text{CurrentLimit} + \alpha \times (\text{TargetLimit} - \text{CurrentLimit})$$

Where:
- $\alpha = \alpha_{\text{up}} = 0.15$ if $\text{TargetLimit} \ge \text{CurrentLimit}$
- $\alpha = \alpha_{\text{down}} = 0.65$ if $\text{TargetLimit} < \text{CurrentLimit}$
