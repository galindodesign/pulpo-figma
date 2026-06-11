# Getting Started with Pulpo

This guide will walk you through creating your first experiment flow diagram in just a few minutes.

## Prerequisites

Before you begin:
- ✅ Figma Desktop or Figma in browser
- ✅ [Figtree font](https://fonts.google.com/specimen/Figtree) installed (recommended)
- ✅ Pulpo plugin installed

---

## Step 1: Open the Plugin

1. Open your Figma file
2. Press **Shift + I** or go to **Plugins** menu
3. Search for **"Pulpo"**
4. Click **Run**

You'll see the intro screen with a welcome message.

---

## Step 2: Start Creating

Click **"Get Started"** to open the experiment form.

---

## Step 3: Fill in Basic Information

### Required Field
**Experiment name**: Give your experiment a clear, descriptive name.
```
Example: "Homepage hero CTA: Button color test"
```

### Recommended Fields
**Description**: Explain what you're testing.
```
Example: "Testing green vs blue button to increase sign-ups"
```

**Status**: Select the current state.
- For a new experiment, use **"Planned"** or **"Draft"**
- For a live experiment, use **"Running"**

---

## Step 4: Add Goals (Optional)

Scroll down to the **Goals** section.

By default, you'll see one goal metric. You can:
- Edit the name (click the text to edit)
- Add more goals (click the + button)
- Mark one as primary (click the star icon)
- Remove goals (click the trash icon)

```
Example goals:
- Sign-up conversion rate (⭐ primary)
- Click-through rate
- Time on page
```

---

## Step 5: Define the Journey

Scroll to the **Journey** section.

By default, you'll see:
- Entry touchpoint
- Experiment Step (with variants)
- Exit touchpoint

### Working with Touchpoints
- Click the touchpoint name to edit it
- Use the beaker icon to mark which step is the experiment
- Add more touchpoints with the + button

### Working with Variants
The "Experiment Step" touchpoint shows variants:
- **Control**: The baseline version (already created)
- **Variant A**: First test variation (already created)

To add more variants:
1. Find the "Experiment Step" touchpoint
2. Click **"+ Add variant"**
3. Name it (e.g., "Variant B")
4. Set traffic split % (e.g., 33%)

```
Example setup:
- Control: "Blue button" (50%)
- Variant A: "Green button" (50%)
```

---

## Step 6: Create the Flow

1. Review your information
2. Click **"Create flow"** at the bottom
3. The plugin will close and your experiment diagram appears on the canvas!

---

## What You'll See

Your generated flow includes:

### 1. Experiment Info Card (top)
- Experiment name and description
- Status badge
- Timeline, owner, sample size
- Resource links
- Goals/metrics

### 2. Journey Flow (below)
- Entry node (circle)
- Touchpoint cards
- Experiment step with variants
- Traffic split indicators
- Exit node (circle)

### 3. Outcome Cards (right side)
- Shows results for each variant
- Winner badge (for concluded experiments)

---

## Example: Complete A/B Test

Here's a complete example setup:

### Experiment Section
- **Name**: "Product page: Add to cart button position"
- **Description**: "Testing button position to increase add-to-cart rate"
- **Status**: Running
- **Hypothesis**: "If we move the add-to-cart button above the fold, then add-to-cart rate will increase by 10%, because users won't need to scroll"
- **Start Date**: 2026-02-01
- **End Date**: 2026-02-14
- **Audience**: "US desktop users"
- **Sample Size**: 5000
- **Owner**: "Growth Team"

### Goals
1. ⭐ Add-to-cart rate (primary)
2. Revenue per user
3. Bounce rate

### Journey
1. **Entry**: "Product list page"
2. **Experiment Step**: "Product detail page"
   - Control: "Button below fold" (50%)
   - Variant A: "Button above fold" (50%)
3. **Exit**: "Shopping cart"

### Resources
- Figma: https://figma.com/file/xyz...
- Jira: https://yourcompany.atlassian.net/browse/GROW-123

Click **"Create flow"** and you're done! 🎉

---

## Next Steps

### Customize Your Flow
- Drag elements to rearrange
- Resize cards using Auto Layout handles
- Change colors to match your brand

### Update an Existing Flow
- Make changes in the plugin form
- Click **"Refresh"** instead of "Create flow"
- Your existing diagram updates

### Advanced Features
Check out the [User Guide](USER_GUIDE.md) for:
- Creating flows from selected frames
- Advanced settings
- Link management
- Best practices

---

## Quick Tips for New Users

💡 **Start simple**: Don't worry about filling every field. Experiment name is all you need to start.

💡 **Use templates**: Create one complete flow, then duplicate and modify it for similar experiments.

💡 **Mark primary metrics**: Helps you stay focused on what matters most.

💡 **Add resources early**: Include Figma, Jira, or Miro links so your team can find everything.

💡 **Use meaningful variant names**: Instead of "Variant A", use "Green button" or "Short copy".

---

## Troubleshooting

**Plugin won't open?**
- Check Plugins menu in Figma
- Try restarting Figma

**Flow looks odd?**
- Make sure Figtree font is installed
- Check that you have edit access to the file

**Can't add variants?**
- Make sure one touchpoint is marked as "Experiment Step" (beaker icon)
- Only experiment steps can have variants

---

## Need More Help?

- [User Guide](USER_GUIDE.md) - Complete feature reference
- [FAQ](FAQ.md) - Common questions
- [Troubleshooting](TROUBLESHOOTING.md) - Detailed troubleshooting

Happy experimenting! 🚀
