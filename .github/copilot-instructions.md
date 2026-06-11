# Copilot Instructions for Pulpo

## Project Overview
- **Purpose:** Figma plugin to visually build and manage experiment flows (entry/exit nodes, variants, metrics, integrations).
- **UI:** Vanilla HTML/CSS/JavaScript in `ui.html` with inline scripts, styled with `ui.css` and `design-tokens.css`.
- **Plugin Logic:** Main Figma plugin logic in `code.ts` (bundled to `build/code.js`). Handles Figma API, node creation, and communication with UI.

## Architecture & Data Flow
- **UI ↔ Plugin Communication:**
  - Uses `figma.showUI` and `figma.ui.onmessage` for message passing between UI and plugin logic.
  - UI form submits experiment data via `parent.postMessage`; plugin script generates Figma nodes accordingly.
- **Component Structure:**
  - All UI markup and logic in single `ui.html` file with embedded JavaScript.
  - Variant cards dynamically rendered via `renderVariants()` function.
  - Form data collected on submit and sent to plugin via message passing.
- **Design Tokens:**
  - Centralized in `design-tokens.css` for consistent styling across UI and generated Figma nodes.
- **Font:**
  - Uses [Figtree](https://fonts.google.com/specimen/Figtree) for all UI and generated nodes. Ensure it's available in Figma.

## Developer Workflows
- **Install dependencies:** `npm install`
- **Build plugin:** `npm run build` (bundles TypeScript and copies static files to `build/`)
- **Watch mode:** `npm run watch` (auto-rebuild on save)
- **Lint:** `npm run lint` / `npm run lint:fix`

## Conventions & Patterns
- **TypeScript for plugin logic:** `code.ts` uses TypeScript for type safety.
- **Vanilla JS for UI:** Simple, performant HTML/CSS/JS without framework overhead.
- **Figma API:** All Figma node creation/manipulation in `code.ts`.
- **UI/Plugin contract:** Message types and payloads must be kept in sync between UI and plugin logic.
- **Direct DOM manipulation:** UI uses native DOM APIs (`getElementById`, `addEventListener`, etc.).
- **Auto Layout:** All generated Figma frames/cards use Auto Layout for flexibility.

## Integration Points
- **External links:** UI supports Figma, Jira, and Miro links for experiment context.
- **No backend:** All logic runs client-side in Figma and browser context.

## Key Files
- `code.ts` — Figma plugin entry, node creation, message handling
- `ui.html` — Complete UI with HTML, CSS, and JavaScript
- `ui.css` — Additional UI styles
- `design-tokens.css` — Design tokens for consistent styling
- `esbuild.config.js` — Build config for bundling plugin code
- `manifest.json` — Figma plugin manifest

## Example: UI to Plugin Message
```js
// In ui.html
parent.postMessage({ 
  pluginMessage: { 
    type: 'create-flow', 
    payload: { experimentName, variants, ... } 
  } 
}, '*');

// In code.ts
figma.ui.onmessage = (msg) => {
  if (msg.type === 'create-flow') {
    // handle payload
  }
};
```

## References
- [Figma Plugin API](https://www.figma.com/plugin-docs/)
- [TypeScript](https://www.typescriptlang.org/)

---
_Keep instructions concise and up-to-date. Update this file if project structure or workflows change._
