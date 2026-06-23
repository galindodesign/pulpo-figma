# Plugin manifest (live)

Figma only accepts a file named **`manifest.json`** on import.

## Pulpo for Figma

```bash
npm run build
npm run verify:main
```

**Plugins → Development → Import** → root **`manifest.json`** (uses `build/ui.html`).

Publish to Community from that import only. There is no separate dev/sync plugin in this repo.

## Official reference

- https://www.figma.com/plugin-docs/manifest/
