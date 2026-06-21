# Branch workflow: main vs dev-work

| | **main** (live) | **dev-work** (sandbox) |
|---|-----------------|------------------------|
| **Purpose** | Customer-facing, publish to Community | Web sync experiments, not published |
| **Build** | `npm run build` | `npm run build:dev` |
| **Figma import** | Root **`manifest.json`** | **`build-dev/manifest.json`** |
| **Plugin name** | **Pulpo** | **Pulpo Connect (Dev)** |

## main — live (this branch)

```bash
git checkout main
npm run build
npm run verify:main
```

Import root **`manifest.json`**. Publish to Community **only** from this branch.

Sandbox work lives on **`dev-work`** — never merge dev files into `main` until ready to ship sync.
