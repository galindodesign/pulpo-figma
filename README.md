3. To build once:
   npm run build
4. To watch and auto-build on save:
   npm run watch

#### Linting
Run lint checks with:
   npm run lint
Auto-fix lint issues with:
   npm run lint:fix

#### More info
For Figma plugin API docs, see: https://www.figma.com/plugin-docs/
For TypeScript info: https://www.typescriptlang.org/

### Project Maintenance
**Feb 2026 - Code Cleanup & Optimization:**
- ✅ Removed ~1.1 MB of build artifacts from root directory (source maps, compiled JS)
- ✅ Archived 13 historical process documents to `_archive/` folder for cleaner root
## GrowthLab (Figma plugin)

**GrowthLab** is the customer-facing name in Figma (see [`manifest.json`](manifest.json)). The npm package may still be named `growthlab-flow-builder`.

This plugin helps you quickly create clean, Growth Labs–style **experiment flows** on the Figma canvas: journey, goals, and variants in one diagram.

**Font:** This plugin uses the [Figtree](https://fonts.google.com/specimen/Figtree) font for all UI and generated nodes. Make sure Figtree is available in your Figma environment for best results.

### Features

#### Core experiment documentation
- Title, description, status, timeline, audience, sample size, owner
- Status tracking: Draft, Planned, Running, Paused, Concluded
- Collapsible **Details** for status, rolled-out variant (when concluded), owner, and resource links
- Hypothesis is **not** shown in the current plugin form (field is reserved for examples / future use)

#### Goals
- Add multiple goals (each goal is a **metric** in the payload and on the canvas)
- The **first** goal is the primary goal and drives the outcome summary
- Direction and threshold targets per goal
- Drag-and-drop reordering

#### Journey
- Entry/exit nodes and touchpoint steps
- Experiment-step designation for variants
- Auto layout and connected flow spine

#### Variants
- Unlimited variants (A/B, A/B/C, multivariate)
- Control and winner badges
- Traffic splits and color badges
- Drag-and-drop ordering

#### Resources and links
- Smart link detection with service icons (Figma, Jira, Miro, Notion, Asana, Linear, GitHub, Slack, Trello, Confluence, Monday, ClickUp)
- Multiple links per experiment

#### UX and design
- Modern compact UI with Figtree font
- Auto Layout for all generated frames
- **Refresh** (when shown) updates connector lines on an existing flow

### Usage
1. Open your Figma file and run **GrowthLab**
2. Fill in the experiment title and optional fields
3. Add goals and set order (first = primary)
4. Define journey touchpoints and mark the experiment step
5. Configure variants and traffic splits
6. Click **Create flow** to generate the diagram

**Optional workflows**
- Select **Concluded** and choose the rolled-out variant to show the winner
- Add resource links (Figma, Jira, Miro, Notion, etc.)
- Use **Refresh** when the plugin shows it to update connectors without recreating the whole flow

**Note:** A legacy main-thread path exists for **create from selection** (frames as thumbnails), but the current UI does not expose it—build a flow from the form instead.

### Development
This plugin uses TypeScript and NPM for development.

**In-plugin feedback email:** set `FEEDBACK_EMAIL` in [`plugin-constants.ts`](plugin-constants.ts). Leave it empty to hide the mail button until configured.

#### Setup
1. Install Node.js (includes NPM): https://nodejs.org/en/download/
2. Install dependencies:
   npm install
3. To build once:
   npm run build
4. To watch and auto-build on save:
   npm run watch

#### Linting
Run lint checks with:
   npm run lint
Auto-fix lint issues with:
   npm run lint:fix

#### More info
For Figma plugin API docs, see: https://www.figma.com/plugin-docs/
For TypeScript info: https://www.typescriptlang.org/

### Project Maintenance
**Feb 2026 - Code Cleanup & Optimization:**
- ✅ Removed ~1.1 MB of build artifacts from root directory (source maps, compiled JS)
- ✅ Archived 13 historical process documents to `_archive/` folder for cleaner root
- ✅ Removed 52+ debug console.log/warn/error statements throughout codebase
- ✅ Removed QA debug panel from UI (visual debugging helper)
- ✅ Deleted unused `scripts/` and `assets/` folders
- ✅ Reorganized TypeScript imports (all imports now at top of files)
- ✅ Improved type safety (eliminated `any` types, added proper interfaces)
- ✅ Updated `.gitignore` to prevent build artifacts from being tracked
- **Result:** Cleaner codebase, better maintainability, zero TypeScript errors

### Docs
**For users**
- [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md)
- [docs/USER_GUIDE.md](docs/USER_GUIDE.md)
- [docs/FAQ.md](docs/FAQ.md)
- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

**For developers**
- [docs/FIGMA_PLUGIN_API.md](docs/FIGMA_PLUGIN_API.md)
- [docs/PLUGIN_MESSAGING.md](docs/PLUGIN_MESSAGING.md)
- [docs/PLUGIN_MANIFEST.md](docs/PLUGIN_MANIFEST.md)
- [docs/PLUGIN_UX_GUIDELINES.md](docs/PLUGIN_UX_GUIDELINES.md)
- [docs/RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md)
