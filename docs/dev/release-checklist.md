# Release Checklist

## Official Docs
- Publish a plugin: https://www.figma.com/plugin-docs/publishing/

## Checklist
- Bump `version` in [package.json](../../package.json) (plugin footer + docs site update automatically)
- Update [What's new](/changelog) with **3–5 user-facing bullets** (what designers will notice — skip refactors, docs-only, and CI work)
- Optionally note details in [CHANGELOG.md](../../CHANGELOG.md) for your own history
- Run `npm run lint`
- Run build
- Smoke test in Figma
- Verify manifest settings
- Publish/update in Figma
- Reuse the same bullets in the Figma Community **What's new** field when you publish

## In this project
- Build: `npm run build`
- Version: [package.json](../package.json)
