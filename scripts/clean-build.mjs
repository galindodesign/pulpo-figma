#!/usr/bin/env node
/**
 * Remove generated build artifacts so postbuild always writes fresh files.
 * Figma imports from manifest.json → build/; stale copies cause old UI to load.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const BUILD = path.join(ROOT, 'build');

const LEGACY_DIRS = ['build-dev'];
for (const dir of LEGACY_DIRS) {
  const target = path.join(ROOT, dir);
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
  }
}

const FILES = [
  'code.js',
  'code.js.map',
  'ui.html',
  'ui.css',
  'design-tokens.css',
];

for (const file of FILES) {
  const target = path.join(BUILD, file);
  if (fs.existsSync(target)) {
    fs.unlinkSync(target);
  }
}

for (const dir of ['fonts', 'assets']) {
  const targetDir = path.join(BUILD, dir);
  if (!fs.existsSync(targetDir)) continue;
  for (const entry of fs.readdirSync(targetDir)) {
    fs.unlinkSync(path.join(targetDir, entry));
  }
}

console.log('Cleaned build artifacts');
