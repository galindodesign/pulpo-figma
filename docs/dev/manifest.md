# Plugin Manifest (manifest.json)

## Official Docs
- Manifest reference: https://www.figma.com/plugin-docs/manifest/

## What to check
- `name`, `id`, `api`
- `main` (plugin code bundle)
- `ui` (UI HTML)
- `editorType`
- `networkAccess`

## In this project
- Manifest file: [manifest.json](../../manifest.json)
- `editorType` is `["figma"]` only — Pulpo targets Figma Design files and must not claim FigJam, Slides, or Buzz until those editors are supported.
