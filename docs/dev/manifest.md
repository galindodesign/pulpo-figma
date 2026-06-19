# Plugin manifests

Figma only accepts a file named **`manifest.json`** on import.

## Two plugins, two UI files

| Source | Built output | Plugin | Web sync |
|--------|--------------|--------|----------|
| **`ui.html`** | `build/ui.html` | **Pulpo** (Community / `main`) | No |
| **`ui.dev.html`** | `build-dev/ui.dev.html` | **Pulpo Connect (Dev)** | Yes |

**Rule:** All sync/connect UI work goes in **`ui.dev.html` only**. Do not edit `ui.html` until ready to ship sync to Community.

| Manifest template | Import in Figma |
|-------------------|-----------------|
| root `manifest.json` | Community build (`npm run build`) |
| `manifest.sync.json` → `build-dev/manifest.json` | Dev build (`npm run build:dev`) |

## Pulpo Connect (Dev)

```bash
git checkout feature/pulpo-web-sync
npm run build:dev
```

**Plugins → Development → Import** → `build-dev/manifest.json` (uses `build-dev/ui.dev.html`).

## Pulpo (Community)

```bash
git checkout main   # or build without dev steps
npm run build
```

**Plugins → Development → Import** → root `manifest.json` (uses `build/ui.html`).

See [sync-to-pulpo.md](../guide/sync-to-pulpo.md).

## Official reference

- https://www.figma.com/plugin-docs/manifest/
