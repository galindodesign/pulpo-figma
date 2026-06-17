# Best practices

See the [glossary](/glossary) for terms like primary metric and rolled-out variant.

## Name experiments clearly

Use descriptive names like "Homepage CTA: Button color test".

## Define a primary metric

Choose one primary metric and use secondary metrics as guardrails.

## Keep journeys focused

Limit touchpoints to the critical path for readability.

## Use resources

Link to designs, tickets, and briefs to keep context in one place.

## Update status regularly

Set **Draft** → **Running** → **Paused** or **Concluded**, and choose **Rolled out** when the test ships.

## Experiment anti-patterns

Avoid these common documentation mistakes:

| Anti-pattern | Severity | Why it hurts |
| --- | --- | --- |
| No primary metric | High | Team can't agree on what success means |
| Variants without journey context | High | Readers don't know where the test runs |
| Stale status | Medium | Diagram misleads stakeholders about experiment state |
| Metrics without direction | Medium | "Improve conversion" is ambiguous without increase/decrease |
| Stale diagram after form edits | Medium | Run **Create flow** again so the canvas matches the plugin form |
| Too many touchpoints | Low | Diagram becomes unreadable; focus on the critical path |
| Missing resource links | Low | Teammates hunt for designs and tickets elsewhere |
