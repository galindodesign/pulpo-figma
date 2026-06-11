# GitBook Content Design — Pulpo

## Purpose
Provide a clear, task‑first documentation experience for Pulpo users (product, growth, and design teams) and plugin maintainers.

## Goals
- Help new users create their first experiment flow in minutes.
- Make feature discovery simple and visual.
- Reduce support questions with concise troubleshooting.
- Provide a clean dev reference for maintainers.

## Audience
- **Primary:** Growth/product teams documenting experiments in Figma.
- **Secondary:** Designers and researchers who need experiment diagrams.
- **Tertiary:** Developers maintaining the plugin.

## Information Architecture (GitBook Navigation)
### 1) Welcome
- **Overview**
- **What’s New**
- **Glossary**

### 2) Get Started
- **Install & Run**
- **Quick Start (5 min)**
- **First Experiment Flow (guided example)**

### 3) Use the Plugin
- **Experiment Details**
- **Goals & Metrics**
- **Journey Mapping**
- **Variants & Traffic Splits**
- **Resources & Links**
- **Outcomes & Rollouts**
- **Refresh vs Create**

### 4) Examples & Templates
- **A/B Test Example**
- **Multivariate Example**
- **Lifecycle/Retention Example**

### 5) Best Practices
- **Naming & Structure**
- **Metrics Quality**
- **Collaboration Tips**
- **Design & Layout Tips**

### 6) Troubleshooting
- **Common Issues**
- **Font Issues (Figtree)**
- **Links/Icons**
- **Performance**

### 7) FAQ
- **General**
- **Data & Privacy**
- **Compatibility**

### 8) Developer Docs
- **Architecture**
- **Plugin Messaging**
- **Manifest**
- **Release Checklist**

## Page Templates (Content Design)
### Overview (Welcome)
**Goal:** Introduce the plugin, who it’s for, and what it creates.
- **Hero statement:** “Create clean, structured experiment flow diagrams in Figma.”
- **Value bullets:** fast setup, consistent layout, shareable artifacts.
- **CTA links:** Quick Start, User Guide, Features.

### Quick Start
**Goal:** Get a flow on the canvas in under 5 minutes.
- **Steps:** Install → Open plugin → Fill basics → Add variants → Create flow.
- **Output preview:** “You’ll get: Experiment card, journey, variants, metrics.”
- **Tip box:** “Start with just the experiment name.”

### Feature Pages (Experiment / Metrics / Journey / Variants / Resources)
**Goal:** Explain one feature at a time with minimal friction.
- **What it does** (1–2 lines)
- **Where it lives in UI** (section name)
- **How to use** (3–5 bullets)
- **Examples** (short, realistic)
- **Best‑practice callout**

### Examples & Templates
**Goal:** Provide copy‑ready examples with realistic values.
- **Context** (what’s being tested)
- **Inputs** (pre‑filled values)
- **Expected output** (description of generated diagram)

### Troubleshooting
**Goal:** One issue per section with quick resolution.
- **Problem → Cause → Fix** format
- 3–5 bullet checks per issue

### Developer Docs
**Goal:** Keep maintenance and release steps easy to follow.
- Build/watch/lint commands
- UI ↔ plugin message contracts
- Release checklist

## User Documentation Content Design
This section defines what the user‑facing documentation should cover, how it should be structured, and the UX/usability guidance to include.

### Core User Outcomes
- Create a complete experiment flow in one pass.
- Understand where to add experiment details, metrics, journey steps, and variants.
- Refresh an existing flow without duplicating.
- Share a readable, consistent artifact with teammates.

### Plugin Functionality Coverage (User‑Facing)
Each topic should answer **What it is**, **Why it matters**, **How to use it**, and **Example input**.

1. **Experiment Details**
	- Name, description, status, rolled‑out variant (for concluded), hypothesis, dates, audience, sample size, owner.
	- Explain required vs optional fields and the impact on the generated card.

2. **Goals & Metrics**
	- Primary metric, direction (increase/decrease), thresholds, reorder.
	- Emphasize the “Primary” marker and decision focus.

3. **Journey Mapping**
	- Entry → touchpoints → experiment step → exit.
	- Clarify that only the experiment step can host variants.

4. **Variants & Traffic Splits**
	- Control variant, traffic split, winner (for concluded).
	- Create from selection (up to 3 frames) and how it maps into cards.

5. **Resources & Links**
	- Auto‑detect services and icons; show supported links list.
	- Show how links appear in the experiment card.

6. **Outcomes & Rollouts**
	- How “Concluded” unlocks the winner/rolled‑out variant fields.
	- Explain how this affects the diagram visually.

7. **Refresh vs Create**
	- Create a new diagram vs update an existing one.
	- Explain safe usage to avoid duplicates.

### UX Guidance for Users (Usability)
Include small, practical guidance blocks throughout the docs. Use these in sidebars or callouts.

- **Start simple:** only the experiment name is required to generate a flow.
- **Use descriptive variant names:** “Green button” beats “Variant A.”
- **Mark a primary metric:** keeps decisions focused.
- **Keep journeys short:** 3–6 touchpoints are easier to read.
- **Use the experiment step intentionally:** only this step holds variants.
- **Refresh over recreate:** prevents duplicate flows.
- **Link early:** add Figma/Jira/Miro links for fast context sharing.

### Usability Patterns (Documentation Requirements)
Each user page should include:
- **Task‑first headings** (e.g., “Add a primary metric”).
- **Short steps** (no more than 5 per task).
- **Expected result** section (what appears in Figma).
- **Common mistakes** callout.
- **Keyboard shortcuts** where relevant.

### Suggested Page Content (User Guide Expansion)
#### Understanding the Interface
- Intro screen, experiment section, goals section, journey builder, variants list, resources, action buttons.
- Include a “Where to find it” map of sections.

#### Create Your First Flow (Guided)
- Provide a complete, copy‑ready example.
- Show expected output: experiment card, journey spine, variants.

#### Advanced Settings
- Hypothesis, dates, audience, sample size, owner, resources.
- Explain how each appears on the experiment info card.

#### Working With Variants
- Control badge, winner badge, traffic split validation.
- Creating variants from selected frames.

#### Goals & Metrics
- Primary metric selection.
- Increase/decrease direction.
- Thresholds and guardrails.

#### Journey Mapping
- Define entry/exit and experiment step.
- What happens if the experiment step changes.

#### Resources & Links
- Supported services list and icon mapping.
- Tips for clean links and naming.

#### Refresh Flow
- When to refresh.
- How to avoid duplicate flows.

### Content Quality Checklist
- Every page includes at least one real example.
- Use consistent field names from the UI.
- Avoid jargon without definitions.
- Keep paragraphs under 3 lines when possible.
- Provide a “What you’ll get” summary on task pages.

## Voice & Tone
- **Clear and concise** (short sentences, action verbs)
- **Productive and helpful** (tips over warnings)
- **Non‑technical by default** (explain terms)

## UI Writing Standards
- Use “Create flow” and “Refresh flow” consistently.
- Name fields exactly as seen in the UI.
- Prefer examples using growth metrics (CTR, conversion rate, revenue per user).

## Reusable Content Blocks
### “You’ll get” block
- Experiment info card
- Journey touchpoints (entry, experiment step, exit)
- Variant cards with traffic splits
- Metrics chips with primary metric

### “Pro tip” block
- “Mark a primary metric to keep the team focused.”

### “Common mistake” block
- “Avoid generic variant names like ‘A/B’. Use descriptive labels.”

## Content Inventory Mapping (Existing Docs)
- **Getting Started:** docs/GETTING_STARTED.md
- **User Guide:** docs/USER_GUIDE.md
- **Features:** docs/features.md
- **Best Practices:** docs/best-practices.md
- **FAQ:** docs/FAQ.md
- **Troubleshooting:** docs/TROUBLESHOOTING.md
- **Dev Docs:** docs/FIGMA_PLUGIN_API.md, docs/PLUGIN_MESSAGING.md, docs/PLUGIN_MANIFEST.md, docs/PLUGIN_UX_GUIDELINES.md, docs/RELEASE_CHECKLIST.md

## Next Content Tasks
1. Add “What’s New” page with release highlights.
2. Expand examples with 3 full workflows.
3. Add glossary for experiment terminology.
4. Add troubleshooting screenshots (optional).
