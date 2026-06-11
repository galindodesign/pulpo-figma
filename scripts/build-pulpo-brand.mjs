#!/usr/bin/env node
/**
 * Builds pulpo-brand.ts from Figma pulpo-icon-x (1592:2800) SVG export.
 * Place export at /tmp/pulpo-icon-x.svg before running.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'pulpo-brand.ts');
const SRC = '/tmp/pulpo-icon-x.svg';

const raw = fs.readFileSync(SRC, 'utf8');
const pulpoMatch = raw.match(/<path id="Union" d="([^"]+)"/);
const nameMatch = raw.match(/<path id="Union_2" d="([^"]+)"/);
if (!pulpoMatch || !nameMatch) {
  console.error('Missing Union paths in pulpo-icon-x.svg');
  process.exit(1);
}

const pulpo = pulpoMatch[1];
const name = nameMatch[1];
const w = 46;
const h = 68;

const logoSvg = `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none"><g class="pulpo-brand-logo"><g class="pulpo-brand-logo__mark"><path d="${pulpo}" fill="currentColor"/><path d="${name}" fill="currentColor"/></g></g></svg>`;

const iconSvg = `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none"><g class="pulpo-brand-icon"><path d="${pulpo}" fill="currentColor"/></g></svg>`;

const content = `/**
 * Pulpo product logo and icon — sourced from Figma pulpo-icon-x (1592:2800).
 * Do not edit ui.html logo markup by hand; run npm run generate:brand-logo
 */

/** Intro screen logo — pulpo mascot + wordmark, 46×68 */
export const PULPO_LOGO_SVG = \`${logoSvg}\`;

/** Pulpo mascot mark only, 46×68 */
export const PULPO_ICON_SVG = \`${iconSvg}\`;
`;

fs.writeFileSync(OUT, content);
console.log('Wrote', OUT);
