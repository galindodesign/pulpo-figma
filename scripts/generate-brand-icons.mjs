#!/usr/bin/env node
/**
 * Injects brand icon definitions from brand-icons.ts into ui.html.
 * Run: npm run generate:brand-icons
 */

import esbuild from 'esbuild';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const UI_PATH = path.join(ROOT, 'ui.html');
const START = '/* @generated-brand-icons:start */';
const END = '/* @generated-brand-icons:end */';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brand-icons-'));
const outFile = path.join(tmpDir, 'brand-icons.cjs');

await esbuild.build({
  entryPoints: [path.join(ROOT, 'brand-icons.ts')],
  outfile: outFile,
  bundle: true,
  format: 'cjs',
  platform: 'node',
  logLevel: 'silent',
});

const { BRAND_SVGS } = await import(outFile);

const iconEntries = Object.entries(BRAND_SVGS)
  .map(([key, svg]) => `      '${key}': ${JSON.stringify(svg)},`)
  .join('\n');

const generated = `${START}
    /**
     * Brand Icons — generated from brand-icons.ts (Figma icon-brands/*).
     * Do not edit by hand; run npm run generate:brand-icons
     */
    const brandIcons = {
${iconEntries}
    };

    function getBrandIcon(name, options = {}) {
      const { size = 20, className = '' } = options;
      const brand = String(name || '').toLowerCase();
      const svg = brandIcons[brand] || brandIcons.generic;
      const cls = 'brand-icon brand-icon-' + brand + (className ? ' ' + className : '');
      return svg
        .replace('<svg', '<svg class="' + cls + '"')
        .replace(/\\bwidth="[^"]*"/, 'width="' + size + '"')
        .replace(/\\bheight="[^"]*"/, 'height="' + size + '"');
    }
${END}`;

const html = fs.readFileSync(UI_PATH, 'utf8');
if (!html.includes(START) || !html.includes(END)) {
  console.error('ui.html is missing brand icon generation markers.');
  process.exit(1);
}

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const pattern = new RegExp(`${escapeRegExp(START)}[\\s\\S]*?${escapeRegExp(END)}`);
const next = html.replace(pattern, generated);
fs.writeFileSync(UI_PATH, next);
console.log('Updated brand icons in ui.html');
