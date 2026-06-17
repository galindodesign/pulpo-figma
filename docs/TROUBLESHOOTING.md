# Troubleshooting

## I can't find Pulpo in Figma

Install it from [Figma Community](https://www.figma.com/community/search?resource_type=plugins&q=Pulpo), then run **Plugins → Pulpo**.

For local development builds, use **Plugins → Development → Import plugin from manifest…**

## The plugin opens but doesn't create a flow

- Ensure **Experiment name** is filled in
- Check the toast message for validation issues under **Experiment**, **Goals**, or **Journey**
- If a flow already exists, edit the form and click **Create flow** again — Pulpo replaces the previous diagram

## Fonts look wrong

Install the **Figtree** font in Figma and restart the app. Pulpo uses Figtree in the plugin UI and on generated canvas frames.

## Winner badge not showing

- Set status to **Concluded**
- Select a **rolled-out** variant
- Mark the winner in the variants list

## Can't add variants

Only the **Experiment step** touchpoint can hold variants. Mark that step on the **Journey** tab first.

## Variant thumbnails are missing

Add a full **figma.com** link on each variant card in the plugin form — use **Copy link to selection** on the frame you want to show.

## Links show a generic icon

Use full URLs including `https://`. Unsupported domains fall back to a generic link icon.

## Still stuck?

[FAQ](/FAQ) · [Contact](/contact) · [GitHub issues](https://github.com/galindodesign/pulpo-figma/issues)
