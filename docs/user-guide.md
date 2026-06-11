# Pulpo - User Guide

Welcome to **Pulpo**, a Figma plugin designed to help you quickly create clean, professional experiment flow diagrams for A/B tests, multivariate tests, and other growth experiments.

## Table of Contents
- [What is Pulpo?](#what-is-pulpo)
- [Getting Started](#getting-started)
- [Creating Your First Experiment Flow](#creating-your-first-experiment-flow)
- [Understanding the Interface](#understanding-the-interface)
- [Features Guide](#features-guide)
- [Tips & Best Practices](#tips--best-practices)

---

## What is Pulpo?

Pulpo is a Figma plugin that generates structured experiment flow diagrams with:
- **Experiment information cards** with all key details
- **Journey touchpoints** showing the user flow
- **Variant cards** for each test variation
- **Metrics/goals chips** to track success
- **Professional styling** using the Figtree font and Growth Labs design system
- **Auto Layout** for easy resizing and alignment

Perfect for product teams, growth teams, UX researchers, and anyone documenting experiments.

---

## Getting Started

### Installation
1. Open your Figma file
2. Go to **Resources** (Shift + I) or **Plugins** menu
3. Search for **"Pulpo"**
4. Click **Run** to start the plugin

### Requirements
- **Figma Desktop or Browser**: Works on both platforms
- **Figtree Font**: The plugin uses [Figtree](https://fonts.google.com/specimen/Figtree) font. Make sure it's installed for best results.

---

## Creating Your First Experiment Flow

### Quick Start (3 steps)
1. **Run the plugin** from the Figma plugins menu
2. **Fill in the experiment details**:
   - Experiment name (required)
   - Description
   - Status (Running, Concluded, Planned, etc.)
3. **Click "Create flow"** - your experiment diagram appears on the canvas!

### Default Behavior
By default, the plugin creates an experiment with:
- 2 variants (Control and Variant A)
- 1 goal metric
- 3 journey touchpoints (Entry, Experiment Step, Exit)

You can customize all of these before creating the flow.

---

## Understanding the Interface

The plugin interface is organized into sections:

### 1. Intro Screen
When you first open the plugin, you'll see a welcome screen with:
- Quick overview of features
- "Get Started" button to begin
- Option to go directly to the form

### 2. Experiment Section
Define your experiment basics:
- **Experiment name** (required): e.g., "Landing page CTA: Primary button copy"
- **Description**: What you're testing and why
- **Status**: Running, Concluded, Planned, Draft, or Paused
- **Rolled out variant**: (appears when status is "Concluded") - select which variant won

**Advanced Settings** (collapsible):
- **Hypothesis**: Your if-then hypothesis statement
- **Timeline**: Start and end dates
- **Audience**: Target user segment (e.g., "US mobile users")
- **Sample Size**: Number of users in experiment
- **Owner**: Person or team responsible
- **Resources**: Add links to Figma, Miro, Jira, Notion, etc.

### 3. Goals Section
Define what success looks like:
- Add metrics you're tracking (e.g., "Click-through rate", "Conversion rate")
- Mark one metric as **primary** using the star icon
- Reorder by dragging
- Delete with trash icon

### 4. Journey Section
Map the user flow through your experiment:
- **Touchpoints**: Steps in the user journey (e.g., "Home page", "Product page", "Checkout")
- **Variants**: Different versions being tested
  - Only the touchpoint marked as **"Experiment Step"** can have variants
  - Control variant is automatically created
  - Add more variants with the "+ Add variant" button
  - Set traffic split percentages for each variant
  - Mark the winning variant (for concluded experiments)

---

## Features Guide

### Status & Experiment States

**Status Options**:
- **Running**: Experiment is live and collecting data
- **Concluded**: Experiment has finished
- **Planned**: Experiment is scheduled but not started
- **Draft**: Work in progress
- **Paused**: Temporarily stopped

When you select "Concluded", you can choose which variant was rolled out (the winner).

### Working with Variants

**Adding Variants**:
1. Scroll to Journey section
2. Find the touchpoint marked as "Experiment Step"
3. Click "+ Add variant"
4. Name it (e.g., "Variant B", "Red button", etc.)

**Traffic Split**:
- Set percentage for each variant (e.g., 50/50 for A/B test)
- Splits are shown in the generated diagram

**Variant Thumbnails**:
Instead of typing variant names:
1. Create frames in Figma for each variant design
2. Select up to 3 frames
3. Click "Create from selection" button
4. Plugin auto-generates variants with thumbnails

**Control Variant**:
- Every experiment has a Control variant (baseline)
- Click the "Control" chip to toggle which variant is the control
- Only one variant can be marked as Control

**Winner Badge**:
- For concluded experiments, mark the winning variant
- Click the trophy icon next to a variant
- Winner gets a special badge in the diagram

### Adding Goals/Metrics

**Primary Metric**:
- Click the star icon to mark a metric as primary
- Only one metric can be primary
- Primary metrics are visually highlighted in the diagram

**Reordering**:
- Drag and drop metrics to reorder them
- Order is reflected in the final diagram

### Journey Touchpoints

**Types of Touchpoints**:
- **Entry**: Where users enter the flow
- **Experiment Step**: Where the test happens (has variants)
- **Regular touchpoint**: Any other step
- **Exit**: Where users exit the flow

**Experiment Step**:
- Only ONE touchpoint can be marked as "Experiment Step"
- This is where variants appear
- Toggle using the beaker/flask icon

### Adding Resources/Links

In the Advanced Settings section, you can add reference links:
1. Click in the "Resources" input field
2. Paste a URL (Figma, Miro, Jira, Notion, GitHub, etc.)
3. Press Enter or click the + button
4. Plugin auto-detects the service and adds appropriate icon
5. Links appear in the experiment info card

**Supported Link Types**:
- Figma files
- Miro boards
- Jira tickets
- Notion pages
- Asana tasks
- Linear issues
- Slack threads
- GitHub repos
- Trello boards
- Monday boards
- ClickUp tasks
- Confluence pages
- And more!

### Refresh Flow

Already created a flow? Click the **"Refresh"** button to update it with new changes instead of creating a duplicate.

---

## Tips & Best Practices

### Naming Conventions
- **Experiment names**: Be specific and descriptive
  - ✅ Good: "Homepage hero CTA: Button color test"
  - ❌ Avoid: "Test 1", "Experiment"
  
- **Variant names**: Clear and distinguishable
  - ✅ Good: "Blue button", "Short copy", "Image left"
  - ❌ Avoid: "Var1", "Option A"

### Organizing Your Canvas
- Create experiment flows in dedicated pages or frames
- Use consistent positioning for easy comparison
- Group related experiments together

### Using Advanced Settings
- **Hypothesis**: Write clear if-then statements
  - Example: "If we change the CTA button color to green, then click-through rate will increase by 15%, because green conveys action more effectively"
  
- **Sample Size**: Include actual numbers for statistical validity tracking

- **Resources**: Add all relevant links upfront for easy reference

### Working with Teams
- Include **Owner** field so everyone knows who's responsible
- Use **Status** field to keep experiment inventory up to date
- Add **Jira/Asana/Linear** links to track implementation

### Experiment Documentation
- Use **Description** to explain what's being changed
- Add **Start/End dates** to track experiment duration
- Document **Audience** to remember targeting

---

## Keyboard Shortcuts
- **Shift + I**: Open Figma Resources (to run plugin)
- **Tab**: Navigate between form fields
- **Enter**: Submit form when focused on text input
- **Esc**: Close plugin panel

---

## Need More Help?

- [Getting Started Guide](GETTING_STARTED.md) - Step-by-step walkthrough
- [FAQ](FAQ.md) - Common questions and answers
- [Troubleshooting](TROUBLESHOOTING.md) - Fix common issues
- [Release Checklist](RELEASE_CHECKLIST.md) - For developers

---

**Plugin Version**: Check the bottom-right of the plugin panel for version number.

**Questions or Feedback?** Contact your Growth Labs team or submit an issue to the development team.
