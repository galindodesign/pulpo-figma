# Lifecycle / retention example

## Context

Re-engage users who haven't opened the app in 14 days with a personalized email and in-app prompt.

## Inputs

**Experiment**
- Name: Dormant user re-engagement
- Status: Concluded
- Rolled-out variant: Variant B (winner)

**Goals**
1. Primary: 7-day return rate — increase, target +8%
2. Guardrail: Unsubscribe rate — decrease
3. Guardrail: Support contact rate — decrease

**Journey**
- Entry → Email sent → **Experiment step** (in-app prompt) → App open → Exit

**Variants**
- Control: Generic "We miss you" (50%)
- Variant B: Personalized activity summary (50%) — **winner**

## Expected output

Concluded status with winner badge on Variant B, three goals on the experiment card, and a journey showing the email → in-app touchpoints.

## Related

- [Goals & metrics](/guide/goals) · [Journey mapping](/guide/journey)
- [Quick start](/GETTING_STARTED) — use **Load example** in the plugin
