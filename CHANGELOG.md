# Changelog

All notable changes to **Pulpo** (this Figma plugin) are documented here. Bump the version in [package.json](package.json) only — it flows to the plugin footer, docs site, and [site-constants.ts](site-constants.ts). Match what you publish in **Figma Community** (or your org’s distribution).

The format is inspired by [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Maintenance
- Add your changes under **Unreleased** during development, then move them under a dated heading when you cut a release.

---

## [1.0.0] — 2026-05-13

### Summary
Initial documented release baseline for this repo: Pulpo-branded UI, structured validation, tabbed form (Experiment / Goals / Journey), goals and journey UX cleanup, thumbnails via variant Figma links, removal of legacy “create from selection” path.

### For maintainers
When you publish a new plugin version:

1. Bump `version` in [package.json](package.json) (and the in-plugin footer if wired separately).
2. Rename `[Unreleased]` to `[x.y.z] — YYYY-MM-DD` and start a fresh `[Unreleased]` section at the top.
3. Paste the same bullets into **GitHub Releases** (if you use them) and/or the **What’s new** text in the Figma plugin publish dialog so updates stay discoverable for designers.

If the repo is on GitHub, add compare links at the bottom of this file (see [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)) so `Unreleased` diffs are one click away.
