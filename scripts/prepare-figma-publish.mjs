#!/usr/bin/env node
/**
 * Build and verify the live plugin, then print Figma Desktop publish steps.
 * Run: npm run prepare:publish
 */

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const manifestPath = path.join(ROOT, 'manifest.json');

function run(label, cmd, args) {
  const result = spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit', shell: true });
  if (result.status !== 0) {
    console.error(`\n${label} failed.`);
    process.exit(result.status || 1);
  }
}

run('Build', 'npm', ['run', 'build']);
run('Verify', 'npm', ['run', 'verify:main']);

const buildUi = fs.readFileSync(path.join(ROOT, 'build', 'ui.html'), 'utf8');
if (!buildUi.includes("window.__PULPO_PLUGIN_BUILD__ = 'live-main'")) {
  console.error('build/ui.html is missing live build marker.');
  process.exit(1);
}

console.log('\nLive plugin is ready to import in Figma Desktop.\n');
console.log(`Manifest: ${manifestPath}`);
console.log('\nIn Figma Desktop:');
console.log('  1. Plugins → Development → Remove "Pulpo Connect (Dev)" and any duplicate Pulpo imports');
console.log('  2. Plugins → Development → Import plugin from manifest…');
console.log(`     → ${manifestPath}`);
console.log('  3. Run the plugin — console should show: [Pulpo] build live-main — no sync UI');
console.log('  4. Intro should have New experiment / Load example only (no Connect to Pulpo)');
console.log('  5. Plugins → Development → Publish → Publish update to Community');
console.log('\nFigma web (figma.com) uses the last Community publish, not local files.');
console.log('After step 5, hard-refresh Figma in the browser to pick up the update.\n');
