# Pulpo

**Experiment flows for Figma** — journey, goals, and variants in one diagram on the canvas.

Pulpo helps growth teams, designers, and PMs document what they're testing without leaving Figma. Fill in a short form, click **Create flow**, and get a readable experiment diagram your team can align on.

**Docs:** [galindodesign.github.io/pulpo-figma](https://galindodesign.github.io/pulpo-figma/)  
**Install:** [Pulpo on Figma Community](https://www.figma.com/community/search?resource_type=plugins&q=Pulpo)

Works in **Figma Design**, **FigJam**, **Figma Slides**, and **Buzz**.

---

## Quick start

1. Install Pulpo from [Figma Community](https://www.figma.com/community/search?resource_type=plugins&q=Pulpo)
2. Open any file → **Plugins → Pulpo**
3. Click **Load example** to try a sample, or **New experiment** to start fresh
4. Fill in **Experiment**, **Goals**, and **Journey** → **Create flow**

Full walkthrough: [Quick start guide](https://galindodesign.github.io/pulpo-figma/GETTING_STARTED)

---

## What you can do

- **Experiment details** — name, status, timeline, audience, owner, resource links
- **Goals** — multiple metrics with direction and targets; first goal is primary
- **Journey** — entry, touchpoints, and experiment step on a connected spine
- **Variants** — A/B, multivariate, traffic splits, control/winner badges, Figma frame thumbnails
- **Resource links** — icons for Figma, Jira, Miro, Notion, Linear, GitHub, Slack, and more
- **Create flow** — build or replace the experiment diagram from your form (re-running it updates the canvas)
- **Connector lines** — adjust automatically when you move frames on the canvas

---

## Help & feedback

| | |
|---|---|
| [FAQ](https://galindodesign.github.io/pulpo-figma/FAQ) | Common questions |
| [Troubleshooting](https://galindodesign.github.io/pulpo-figma/TROUBLESHOOTING) | Something not working |
| [Contact](https://galindodesign.github.io/pulpo-figma/contact) | Questions, bugs, feature requests |
| [What's new](https://galindodesign.github.io/pulpo-figma/changelog) | Release highlights |

Bug or idea? [Open an issue](https://github.com/galindodesign/pulpo-figma/issues).

---

## Development

For plugin contributors and maintainers.

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Figma desktop app](https://www.figma.com/downloads/) (for running the plugin locally)

### Setup

```bash
git clone https://github.com/galindodesign/pulpo-figma.git
cd pulpo-figma
npm install
npm run build
```

In Figma: **Plugins → Development → Import plugin from manifest…** → select `manifest.json` in this repo.

Use `npm run watch` to rebuild on save while developing.

### Scripts

| Command | Purpose |
|---|---|
| `npm run build` | Build plugin (`build/code.js`, `build/ui.html`) |
| `npm run watch` | Rebuild on file changes |
| `npm run lint` | ESLint |
| `npm run docs:dev` | Docs site locally → `http://localhost:5173/pulpo-figma/` |
| `npm run docs:build` | Production docs build |

### Configuration

Edit [`site-constants.ts`](site-constants.ts) for docs URL, Figma Community link, and feedback email.

- **Docs deploy:** pushes to `main` deploy via [GitHub Actions](.github/workflows/deploy.yml)
- **Issue email notifications:** [docs/dev/notifications.md](docs/dev/notifications.md)
- **Maintainer docs:** [docs/dev/](docs/dev/)

### Project notes

- Customer-facing name: **Pulpo** ([`manifest.json`](manifest.json))
- Generated flows use the [Figtree](https://fonts.google.com/specimen/Figtree) font — install it in Figma for best results
- npm package name (`growthlab-flow-builder`) is legacy; safe to ignore

---

## License

See repository for license details.
