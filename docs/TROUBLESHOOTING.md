# Troubleshooting

## I can't find Pulpo in Figma

Install it from [Figma Community](https://www.figma.com/community/plugin/1579196395853602242/pulpo-for-figma), then run **Plugins → Pulpo** in a **Figma Design** file.

For local development builds, use **Plugins → Development → Import plugin from manifest…**

## The plugin opens but doesn't create a flow

- Ensure **Experiment name** is filled in
- Check the toast message for validation issues under **Experiment**, **Goals**, or **Journey**
- If a flow already exists, edit the form and click **Create flow** again — Pulpo replaces the previous diagram

## Fonts look wrong

Install the **Figtree** font in Figma and restart the app. Pulpo uses Figtree in the plugin UI and on generated canvas frames.

## Rolled-out variant not highlighted on canvas

- Set status to **Concluded**
- Choose the shipped variant in the **Rolled out** dropdown on the experiment row
- Click **Create flow** again if you changed status or rollout after the last build

## Can't add variants

Open the **Journey** section, pick the touchpoint where the test runs, and click **Add design variant**. Variants attach to individual touchpoints — there is no separate "mark experiment step" control.

## Variant thumbnails are missing

Open the variant menu (⋮) and paste a full **figma.com** link — use **Copy link to selection** on the frame you want to show. Links must be in the same file.

## Links show a generic icon

Use full URLs including `https://`. Unsupported domains fall back to a generic link icon.

## Still stuck?

Open **Contact** from the plugin (intro or form footer), or visit [Contact](/contact) for FAQ, optional email, and GitHub options.

[FAQ](/FAQ) · [GitHub issues](https://github.com/galindodesign/pulpo-figma/issues)
