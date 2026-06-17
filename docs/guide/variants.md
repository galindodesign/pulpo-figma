# Variants

Variants are the **designs or treatments you're comparing** at a journey touchpoint — linked frames, goal values when concluded, and rollout styling when you ship a winner.

## Where to find it

**Journey** section → open a touchpoint → **Add design variant**.

## How to use it

1. On any touchpoint, click **Add design variant**
2. Name each variant and pick a color (optional)
3. Paste a **Figma frame link** via the variant menu (⋮) for a canvas thumbnail
4. When the experiment is **Concluded**, set **Rolled out** on the experiment row to highlight the shipped variant on the canvas
5. Drag variants in the plugin to reorder them

Pulpo infers experiment type from variant count: **2 variants = A/B**, **3+ = multivariate**.

### Variant thumbnails

In Figma, select a frame and use **Copy link to selection**, then paste the link in the variant menu. Pulpo uses it as the thumbnail on the canvas.

## Expected result

Variant cards branching from the touchpoint where you added them, with optional thumbnails and goal values when concluded. The rolled-out variant is highlighted when status is **Concluded** and a **Rolled out** choice is set.

## Tips

- Use descriptive names — "Green CTA button" beats "Variant B."
- Put variants on the touchpoint where the test actually runs (e.g. pricing page, onboarding checklist).
- **Load example** pre-fills a sample with two variants and metric values — useful as a template.

## Common mistakes

- Forgetting the Figma frame link — thumbnails only appear when each variant has a valid link in the same file.
- Expecting to edit traffic splits in the form — the plugin does not expose traffic % fields today (the sample may show splits on the canvas from **Load example** only).

## Next

- [Goals & metrics](/guide/goals)
- [Examples — A/B test](/examples/ab-test)
