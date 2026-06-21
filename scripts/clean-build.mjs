#!/usr/bin/env node
/**
 * Remove generated build artifacts so postbuild always writes fresh files.
 * Figma imports from manifest.json → build/; stale copies cause old UI to load.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUILD = path.join(__dirname, '..', 'build');

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
