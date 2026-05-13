# User Guide — Petri

## Overview
Petri creates professional **experiment flow** diagrams on the Figma canvas: experiment metadata, **goals** (each goal is a metric you measure), journey steps, variants, and outcomes.

## Experiment section
Fields include:
- **Title** (required)
- Description
- Audience, sample size, dates
- **Details** (collapsible): status (Draft, Planned, Running, Paused, Concluded), rolled-out variant when Concluded, owner, resource links

Hypothesis is **not** shown as a field in the current plugin UI (the load-example script may still set it for demos).

## Goals
- Add multiple goals; each goal corresponds to a **metric** in the generated flow
- The **first** goal is **primary** and guides the outcome summary
- Set increase/decrease direction and thresholds
- Reorder via drag-and-drop

## Journey
- Add touchpoints for the user flow
- Mark the **Experiment Step** (only this step can have variants)
- Entry/Exit nodes are created automatically

## Variants
- Add unlimited variants
- Choose **Control** variant
- Set traffic splits
- Set **Winner** for concluded experiments
- Drag-and-drop to reorder

## Resources
Paste links to tools like Figma, Jira, Miro, Notion, Asana, Linear, GitHub, Slack, Trello, Confluence, Monday, and ClickUp. Icons are detected automatically.

## Refresh vs Create
- **Create flow**: Generates a new diagram (and replaces existing frames with the same names for this experiment, per plugin behavior)
- **Refresh**: When visible, updates connector lines on the current flow

## Validation
If something is wrong before the flow can be built, Petri shows a **toast in the plugin** with up to five issues grouped under **Experiment**, **Goals**, or **Journey**. Figma may also show a short notification.
