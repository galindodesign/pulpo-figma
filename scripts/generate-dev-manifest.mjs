#!/usr/bin/env node
/**
 * Writes build-dev/manifest.json for Pulpo Connect (Dev).
 * Figma only accepts manifest.json on import — manifest.sync.json is the source template.
 * Uses build-dev/ui.dev.html — NOT build/ui.html (Community plugin).
 * Shares build/code.js with the Community plugin via a relative path.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'manifest.sync.json');
const OUT = path.join(ROOT, 'build-dev', 'manifest.json');

if (!fs.existsSync(SRC)) {
  console.error('Missing manifest.sync.json');
  process.exit(1);
}

const template = JSON.parse(fs.readFileSync(SRC, 'utf8'));

const manifest = {
  ...template,
  main: '../build/code.js',
  ui: 'ui.dev.html',
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, `${JSON.stringify(manifest, null, 2)}\n`);
console.log('Wrote build-dev/manifest.json → Pulpo Connect (Dev), ui: ui.dev.html');
