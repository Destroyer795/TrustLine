# TrustLine Next Plan of Action

## Current decision

The hackathon implementation is complete enough for a judged demo. The next work should reduce presentation and deployment risk, not add more scoring features.

## Before submission

1. Deploy the existing Docker stack to the chosen judge-accessible host.
2. Run the 21-test backend suite against the release commit.
3. Run `scripts/demo_smoke.py` against the deployed URL.
4. Run `scripts/demo_concurrency.py` against PostgreSQL and save the terminal result for the demo.
5. Rehearse the three-minute flow twice, including the direct over-limit API rejection.
6. Record a fallback screen capture in case venue networking fails.
7. Add the required external collaborator to GitHub. This is a human repository-admin task.
8. Stop all commits and merges before 2 Aug 2026 at 6:00 PM IST.

## First production-hardening sprint

1. Replace mock principal identity with real OAuth plus a regulated identity provider. Keep the disclosure that this is not full KYC until that integration is complete.
2. Require agent API-key authentication on the external draw endpoint and principal session authorization on dashboard mutations.
3. Move repayment scheduling to a durable worker and replace the simulated bank adapter with a sandbox mandate rail.
4. Put secrets in a managed secret store, disable debug mode, restrict CORS and hosts, and add request throttling.
5. Run the atomic double-draw proof on PostgreSQL in CI, since SQLite cannot prove row-lock behavior.
6. Add metrics and alerts for draw rejection rates, repayment failures, authority transitions, worker lag, and audit-chain verification.

## Model recalibration phase

Do not fit weights to invented data. Log real signals and repayment outcomes until the minimum outcome threshold is met, then evaluate a transparent logistic-regression challenger quarterly or after every agreed draw-volume threshold. Keep AHP as the documented prior until the challenger is demonstrably better calibrated.
