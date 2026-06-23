#!/usr/bin/env node
/**
 * Ensures the repo contains only the Pulpo for Figma plugin (no sync/connect UI).
 * Run before publish: npm run verify:plugin
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const errors = [];

const FORBIDDEN_PATHS = [
  'ui.dev.html',
  'sync-to-pulpo.js',
  'sync-config.js',
  'manifest.sync.json',
  'scripts/build-dev.mjs',
  'scripts/generate-dev-manifest.mjs',
  'scripts/inject-sync-config.mjs',
  'scripts/ensure-dev-branch.mjs',
  'scripts/clean-dev-artifacts.mjs',
  'build-dev',
];

const FORBIDDEN_UI_MARKERS = [
  'Connect to Pulpo',
  'btnPulpoConnect',
  'btnPulpoConnectIntro',
  'btnPulpoConnectFooter',
  'pulpoSyncPanel',
  'pulpoSyncBadge',
  'intro-screen__sync-badge',
  'PulpoSync',
  'sync-to-pulpo',
  'syncToPulpo',
  'Web sync enabled',
  '__PULPO_PLUGIN_BUILD__',
];

function checkFile(relativePath, forbiddenMarkers = FORBIDDEN_UI_MARKERS) {
  const full = path.join(ROOT, relativePath);
  if (!fs.existsSync(full)) return;
  const content = fs.readFileSync(full, 'utf8');
  for (const marker of forbiddenMarkers) {
    if (content.includes(marker)) {
      errors.push(`${relativePath} must not contain "${marker}"`);
    }
  }
}

for (const relativePath of FORBIDDEN_PATHS) {
  if (fs.existsSync(path.join(ROOT, relativePath))) {
    errors.push(`${relativePath} must not exist`);
  }
}

checkFile('ui.html');
checkFile('build/ui.html');

const manifestPath = path.join(ROOT, 'manifest.json');
if (fs.existsSync(manifestPath)) {
  const manifest = fs.readFileSync(manifestPath, 'utf8');
  if (/ui\.dev\.html/i.test(manifest)) {
    errors.push('manifest.json must not reference ui.dev.html');
  }
  if (/supabase\.co/i.test(manifest)) {
    errors.push('manifest.json must not allow supabase.co');
  }
}

const packagePath = path.join(ROOT, 'package.json');
if (fs.existsSync(packagePath)) {
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  if (pkg.scripts?.['build:dev'] || pkg.scripts?.['clean:dev']) {
    errors.push('package.json must not define build:dev or clean:dev scripts');
  }
}

if (errors.length) {
  console.error('Plugin verification failed:\n');
  for (const err of errors) {
    console.error(`  • ${err}`);
  }
  process.exit(1);
}

console.log('Plugin verification passed.');
