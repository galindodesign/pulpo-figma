# Plugin manifest (live)

Figma only accepts a file named **`manifest.json`** on import.

**Branch workflow:** [BRANCHES.md](./BRANCHES.md)

## Pulpo (live) — main branch

```bash
git checkout main
npm run build
npm run verify:main
```

**Plugins → Development → Import** → root **`manifest.json`** (uses `build/ui.html`).

Web sync sandbox is on the **`dev-work`** branch only.

## Official reference

- https://www.figma.com/plugin-docs/manifest/
