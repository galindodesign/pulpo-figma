#!/usr/bin/env node
/**
 * Builds pulpo-brand.ts from Figma pulpo-icon-name (1538:2740) SVG export.
 * Place export at /tmp/pulpo-icon-name.svg before running.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'pulpo-brand.ts');
const SRC = '/tmp/pulpo-icon-name.svg';

const raw = fs.readFileSync(SRC, 'utf8');
const pulpoMatch = raw.match(/<path id="Union" d="([^"]+)"/);
const nameMatch = raw.match(/<path id="Union_2" d="([^"]+)"/);
if (!pulpoMatch || !nameMatch) {
  console.error('Missing Union paths in pulpo-icon-name.svg');
  process.exit(1);
}

const pulpo = pulpoMatch[1];
const name = nameMatch[1];

const logoSvg = `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="74" height="74" viewBox="0 0 74 74" fill="none"><g class="pulpo-brand-logo"><g class="pulpo-brand-logo__mark"><path d="${pulpo}" fill="currentColor"/><path d="${name}" fill="currentColor"/></g></g></svg>`;

const iconSvg = `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="74" height="74" viewBox="0 0 74 74" fill="none"><g class="pulpo-brand-icon"><path d="${pulpo}" fill="currentColor"/></g></svg>`;

const content = `/**
 * Pulpo product logo and icon — sourced from Figma pulpo-icon-name (1538:2740).
 * Do not edit ui.html logo markup by hand; run npm run generate:brand-logo
 */

/** Intro screen logo — pulpo mascot + wordmark, 74×74 */
export const PULPO_LOGO_SVG = \`${logoSvg}\`;

/** Pulpo mascot mark only, 74×74 */
export const PULPO_ICON_SVG = \`${iconSvg}\`;
`;

fs.writeFileSync(OUT, content);
console.log('Wrote', OUT);
