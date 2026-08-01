# TrustLine hackathon release handoff

Last verified: 2026-08-01

## Three-minute judge sequence

1. **0:00–0:30 — The working-capital gap.** Open `/presentation`. State: “An agent can create value, but it cannot fund the work.” Use the ₹10,000 API bill and ₹15,000 client payment timing gap to establish why bounded working capital matters.
2. **0:30–1:05 — Trust construction and cold start.** Advance once. Explain that the accountable principal signs the capability mandate, five deterministic risk components support the limit, and the principal-wide ceiling bounds exposure while outcome history is still sparse.
3. **1:05–1:35 — Good agent versus bad agent.** Advance to the comparison scene, then open `/agents` if a judge wants detail. Point to slow-earned trust for ProcurementBot-Good and the frozen line for ArbitrageBot-Bad. Say: “Trust rises slowly and drops quickly.”
4. **1:35–2:35 — Enforcement proof.** Open `/demo-lab`. Run over-limit rejection first, then in-flight principal freeze. If time allows, run failed repayment. Leave each failure visible, identify the structured API error, and open `/audit` to verify the appended evidence. Reset only after inspection.
5. **2:35–3:00 — Plausibility and boundary.** Return to the final presentation scene or `/system`. Connect the design to signed mandate patterns and infrastructure-level payment controls without claiming protocol equivalence. Close with: “The model can narrate a decision. It cannot make one.”

## Required environment variables

### Render backend

```env
SECRET_KEY=
DEBUG=false
DATABASE_URL=
ALLOWED_HOSTS=<render-hostname>
CORS_ALLOWED_ORIGINS=<vercel-production-origin>,<vercel-preview-origin-if-needed>
CSRF_TRUSTED_ORIGINS=<vercel-production-origin>
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
```

### Vercel frontend

```env
VITE_API_BASE_URL=https://<render-service>/api/v1
```

Never place `SECRET_KEY`, `DATABASE_URL`, or `GEMINI_API_KEY` in Vercel.

## Verified release evidence

- Backend: 12 tests passed. Gemini missing/error behavior resolves to a deterministic explanation.
- Frontend: TypeScript and Vite production build passed.
- Local lifecycle: all eight smoke checks passed against SQLite and Docker/PostgreSQL.
- Atomicity: two simultaneous ₹7,000 requests produced one HTTP 201 reservation and one HTTP 402 `CREDIT_LIMIT_EXCEEDED` rejection.
- Gemini: `gemini-2.5-flash` was returned by the configured key's models endpoint.
- Visual QA: all eight major routes inspected at 1440×900, 1024×768, and 390×844.

## Known limitations

- The bank rail, task receipt issuer, and identity/KYC provider are explicit simulations.
- Principal authentication is not production-ready; the hackathon API permits demo actions without an authenticated principal session.
- Gemini is narration-only and optional. Offline mode uses the deterministic explanation.
- Production still needs rate limiting, managed worker scheduling, observability, secret rotation procedures, and independent security review.
- Public Render and Vercel URLs require deployment from the owner's accounts and must be verified after their environment variables are set.

## Submission checklist

- [ ] Rotate the Gemini key and place the replacement only in Render and the local `.env`.
- [ ] Create the Render PostgreSQL database and backend from `render.yaml`.
- [ ] Run migrations, then run the seed command once as an explicit release action.
- [ ] Confirm `GET /api/v1/health` returns HTTP 200 on Render.
- [ ] Deploy the repository to Vercel and set only `VITE_API_BASE_URL`.
- [ ] Confirm direct navigation to all eight routes on Vercel.
- [ ] Run `scripts/demo_smoke.py` and `scripts/demo_concurrency.py` against Render.
- [ ] Perform the three-minute sequence once on the public URLs, then reset the demo.
- [ ] Add the public frontend URL, health URL, repository URL, and 30-second architecture statement to the submission.
