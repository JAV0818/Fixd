# Delivery Plan (2–3 hrs/day cadence)

Assumptions
- Cadence ~10–15 hrs/week (2–3 hrs/day), single developer.
- Use existing designs; lighter theme updates are mostly styling, not UX rework.
- Messaging stays on current stack (Firestore) unless explicitly changed.
- Current auth, claim/expire scheduler, and basic provider flows are working.
- Backend design and ORDER_CLAIM_FLOW docs are the source of truth for states/roles.

Milestones & Timeline (weeks)
- Week 1: Provider start-order flow (UI + wiring), minor UI polish round 1.
- Week 2: Admin/master screens + logic scaffold (list, detail, actions), continue UI polish.
- Week 3: Payments (Stripe PaymentSheet or chosen flow) end-to-end in sandbox; QA on claims/timers.
- Week 4: Full QA pass (regression + edge cases), accessibility pass, polish; App Store/Play prep assets.
- Week 5: Soft launch/builds, store submissions, fix rejection/feedback items; second QA sweep.
- Week 6: Buffer for store feedback, hotfixes, performance tweaks, error monitoring.

Workstreams & Tasks
- Provider “Start Order” flow (Week 1)
  - Apply lighter theme to start/order screens per designs.
  - Wire backend: status transitions (Claimed → Accepted → InProgress), timestamps, provider actions.
  - Ensure timers/unclaimed logic remains consistent with claimExpiresAt and ORDER_CLAIM_FLOW.
- Minor UI changes (Weeks 1–2)
  - Apply design polish: spacing, typography, colors, icons, card timers (queue vs detail).
  - Audit cross-screen consistency: buttons, empty states, loaders, errors.
- Admin/Master account (Weeks 2–3)
  - Screens: dashboard, queues/requests, user/order detail, moderation/actions.
  - Logic: role-gated access, status transitions aligned to BACKEND_DESIGN, audit logging if needed.
  - Firestore rules updates for admin/master permissions.
- Payments (Week 3)
  - Stripe PaymentSheet (or chosen flow): create customer, ephemeral key, payment intent; handle webhooks or client confirmations.
  - UI: pay/retry states, receipts, error handling; sandbox test cases.
- QA & Testing (Weeks 3–4)
  - Scenarios: auth, claim/release/expire, start/accept/complete order, messaging, payments, admin actions.
  - Devices: iOS/Android, foreground/background notifications, slow network/offline where possible.
  - Fix critical/high issues before store submission.
- App Store/Play readiness (Weeks 4–5)
  - Assets: icons, splash, screenshots, privacy policy, TOS, permission rationales.
  - Build signing, versioning, TestFlight/internal track.
  - Plan for rejection handling: gather store feedback, fast patch/re-submit loop.
- Monitoring & Ops (Weeks 4–6)
  - Enable crash/error reporting (Crashlytics/Sentry) and function log alerts for failures (claim expire, payments).
  - Minimal analytics for key funnel events (claim, start, accept, pay, complete).

Dependencies & Checks
- Firestore indexes: status + claimExpiresAt (done); add more if admin queries need them.
- Firestore rules: update for admin/master roles and new write paths (payments, statuses).
- Stripe credentials and webhook endpoint (if used) configured for the project.
- Push notifications: ensure messaging/payloads for claims, chat, status changes, payments.

Risks & Mitigations
- Store review delays/rejections: budget Week 5–6 buffer; keep a short-release branch for fast fixes.
- Payments complexity: keep scope to PaymentSheet; defer advanced features (saves, refunds) unless required.
- Role/permission gaps: review rules and backend design before admin launch.

Acceptance Criteria (per milestone)
- Week 1: Provider start-order flow themed and wired; timers consistent; basic polish applied.
- Week 2: Admin/master screens present with role gating; key actions functional; UI polish round 2.
- Week 3: Payments work in sandbox; regressions fixed for claims/timers.
- Week 4: QA pass completed; critical/high bugs resolved; store assets ready.
- Week 5: Builds submitted; feedback/rejections (if any) addressed; telemetry in place.
- Week 6: App live or pending; buffers consumed for fixes/perf.

