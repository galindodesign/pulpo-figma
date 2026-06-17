# A/B test example

## Context

Test whether a violet CTA button increases homepage conversion vs. the current neutral button.

## Inputs

**Experiment**
- Name: Homepage CTA: Button color test
- Status: Running
- Hypothesis: A higher-contrast CTA will increase click-through to signup

**Goals**
1. Primary: Conversion rate (CVR) — increase, target +5%
2. Guardrail: Bounce rate — decrease

**Journey**
- Entry → Landing page → **Experiment step** (CTA button) → Signup page → Exit

**Variants**
- Control: Neutral gray button (50%)
- Variant A: Violet brand button (50%)

## Expected output

Pulpo generates an experiment info card, journey spine with the experiment step highlighted, and two variant outcome cards with traffic splits.

## Related

- [Variants guide](/guide/variants) · [Journey mapping](/guide/journey)
- [Quick start](/GETTING_STARTED) — use **Load example** in the plugin
