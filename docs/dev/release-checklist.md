# Release Checklist

## Official Docs
- Publish a plugin: https://www.figma.com/plugin-docs/publishing/

## Checklist
- Bump `version` in [package.json](../../package.json) (plugin footer + docs site update automatically)
- Run `npm run lint`
- Run build
- Smoke test in Figma
- Verify manifest settings
- Publish/update in Figma

## In this project
- Build: `npm run build`
- Version: [package.json](../package.json)
