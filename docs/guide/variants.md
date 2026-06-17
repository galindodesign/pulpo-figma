# Variants

Variants are the **things you're comparing** at the experiment step — control, treatments, traffic splits, and (when concluded) the winner.

## Where to find it

**Journey** tab → experiment step → variants list.

## How to use it

1. Add a **control** and one or more **variants**
2. Set **traffic splits** (e.g. 50/50 for A/B)
3. For **Concluded** experiments, mark the **winner** and rolled-out variant
4. Drag to reorder variant cards on the canvas

### Variant thumbnails

Paste a **Figma frame link** on each variant — in Figma, select a frame and use **Copy link to selection**. Pulpo uses it as the variant thumbnail on the canvas.

## Expected result

Variant cards branching from the experiment-step touchpoint, each with traffic %, optional thumbnails, and goal values when concluded.

## Tips

- Use descriptive names — "Green CTA button" beats "Variant B."
- Traffic splits should sum to 100% across variants at the experiment step.

## Common mistakes

- Trying to add variants on a regular touchpoint — only the **experiment step** supports variants.

## Next

- [Goals & metrics](/guide/goals)
- [Examples — A/B test](/examples/ab-test)
