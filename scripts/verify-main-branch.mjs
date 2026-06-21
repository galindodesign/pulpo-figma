#!/usr/bin/env node
/**
 * Ensures the repo matches main-branch (live / customer-facing) requirements.
 * Run on main before publish: npm run verify:main
 *
 * With --if-main: no-op when not on main (used by npm run build on main).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getGitBranchName } from './git-branch-name.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ifMainOnly = process.argv.includes('--if-main');
const branch = getGitBranchName();

if (ifMainOnly && branch !== 'main') {
  process.exit(0);
}

const errors = [];

const DEV_ONLY_PATHS = [
  'ui.dev.html',
  'sync-to-pulpo.js',
  'sync-config.js',
  'manifest.sync.json',
  'scripts/build-dev.mjs',
  'scripts/generate-dev-manifest.mjs',
  'scripts/inject-sync-config.mjs',
  'scripts/ensure-dev-branch.mjs',
];

const FORBIDDEN_UI_MARKERS = [
  'Connect to Pulpo',
  'btnPulpoConnect',
  'PulpoSync',
  'sync-to-pulpo',
  'pulpoSyncPanel',
  'syncToPulpo',
];

function checkFile(relativePath, forbiddenMarkers = FORBIDDEN_UI_MARKERS) {
  const full = path.join(ROOT, relativePath);
  if (!fs.existsSync(full)) return;
  const content = fs.readFileSync(full, 'utf8');
  for (const marker of forbiddenMarkers) {
    if (content.includes(marker)) {
      errors.push(`${relativePath} must not contain "${marker}" on main`);
    }
  }
}

for (const relativePath of DEV_ONLY_PATHS) {
  if (fs.existsSync(path.join(ROOT, relativePath))) {
    errors.push(`${relativePath} must not exist on main (dev-work only)`);
  }
}

checkFile('ui.html');
checkFile('build/ui.html');

const manifestPath = path.join(ROOT, 'manifest.json');
if (fs.existsSync(manifestPath)) {
  const manifest = fs.readFileSync(manifestPath, 'utf8');
  if (/ui\.dev\.html/i.test(manifest)) {
    errors.push('manifest.json must not reference ui.dev.html on main');
  }
  if (/supabase\.co/i.test(manifest)) {
    errors.push('manifest.json must not allow supabase.co on main');
  }
}

const packagePath = path.join(ROOT, 'package.json');
if (fs.existsSync(packagePath)) {
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  if (pkg.scripts?.['build:dev']) {
    errors.push('package.json must not define build:dev on main');
  }
}

if (branch && branch !== 'main' && !ifMainOnly) {
  console.warn(`Note: current branch is "${branch}" — verify:main checks live (main) requirements.`);
}

if (errors.length) {
  console.error('Main branch verification failed:\n');
  for (const err of errors) {
    console.error(`  • ${err}`);
  }
  console.error('\nLive plugin work belongs on main only. Sync sandbox belongs on dev-work.');
  process.exit(1);
}

if (!ifMainOnly) {
  console.log('Main branch verification passed.');
}
