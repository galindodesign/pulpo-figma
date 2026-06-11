#!/usr/bin/env node
/**
 * Injects Pulpo product logo markup from pulpo-brand.ts into ui.html.
 * Run: npm run generate:brand-logo
 */

import esbuild from 'esbuild';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const UI_PATH = path.join(ROOT, 'ui.html');
const START = '<!-- @generated-brand-logo:start -->';
const END = '<!-- @generated-brand-logo:end -->';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brand-logo-'));
const outFile = path.join(tmpDir, 'pulpo-brand.cjs');

await esbuild.build({
  entryPoints: [path.join(ROOT, 'pulpo-brand.ts')],
  outfile: outFile,
  bundle: true,
  format: 'cjs',
  platform: 'node',
  logLevel: 'silent',
});

const { PULPO_LOGO_SVG } = await import(outFile);

const generated = `${START}
          <div class="intro-screen__logo" role="img" aria-label="Pulpo logo">
${PULPO_LOGO_SVG}
          </div>
${END}`;

const html = fs.readFileSync(UI_PATH, 'utf8');
if (!html.includes(START) || !html.includes(END)) {
  console.error('ui.html is missing brand logo generation markers.');
  process.exit(1);
}

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const pattern = new RegExp(`${escapeRegExp(START)}[\\s\\S]*?${escapeRegExp(END)}`);
const next = html.replace(pattern, generated);
fs.writeFileSync(UI_PATH, next);
console.log('Updated Pulpo brand logo in ui.html');
