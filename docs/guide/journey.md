# Journey mapping

The journey shows **where the experiment runs** in the user path — entry, touchpoints, the experiment step, and exit.

## Where to find it

**Journey** tab in the plugin.

## How to use it

1. Review the default **Entry** and **Exit** nodes
2. Add **touchpoints** for each step in the user path
3. Mark exactly one step as the **Experiment step** — only this step holds variants
4. Entry and exit are created automatically

Pulpo infers experiment type from variant count: **2 variants = A/B**, **3+ = multivariate**.

## Expected result

A horizontal journey spine on the canvas with touchpoint cards, connector lines, and variant branches at the experiment step.

## Tips

- Keep journeys to **3–6 touchpoints** for readability.
- Name touchpoints after user actions — "Pricing page," not "Step 2."

## Common mistakes

- Adding variants before marking the **experiment step** — variants only attach to that step.
- Too many touchpoints — focus on the path that matters for the test.

## Next

- [Variants](/guide/variants)
- [Updating your flow](/guide/refresh)
