#!/usr/bin/env node
/**
 * Capture Pulpo plugin screenshots for docs (Figma-framed, 500px wide).
 * Prereq: npm run build && serve build/ (e.g. python3 -m http.server 8766)
 *
 * Usage: node scripts/capture-plugin-screenshots.mjs [baseUrl]
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const IMAGES = path.join(ROOT, 'docs/public/images');
const FRAME_SRC = path.join(__dirname, 'plugin-intro-frame.html');
const FRAME_DST = path.join(ROOT, 'build/plugin-intro-frame.html');
const BASE = (process.argv[2] || 'http://127.0.0.1:8766').replace(/\/$/, '');

fs.copyFileSync(FRAME_SRC, FRAME_DST);

async function capturePluginWindow(page, outPath) {
  await page.locator('#pluginWindow').screenshot({ path: outPath, type: 'png' });
}

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 580, height: 900 },
  deviceScaleFactor: 2,
});
await page.goto(`${BASE}/plugin-intro-frame.html`, { waitUntil: 'networkidle' });
const frame = page.frameLocator('iframe.plugin-content');

// Intro screen
await frame.locator('#introScreen').waitFor({ state: 'visible' });
await page.waitForTimeout(400);
await capturePluginWindow(page, path.join(IMAGES, 'plugin-intro.png'));
console.log('Wrote plugin-intro.png');

// Load example → form ready for Create flow
await frame.locator('#btnLoadExample').click();
await frame.locator('#exp-form').waitFor({ state: 'visible' });
await frame.locator('#experimentName').waitFor({ state: 'visible' });
await frame.locator('#experimentName').waitFor({ hasText: 'Pricing Page Button Color Experiment' });
await frame.locator('body').evaluate(() => {
  const versionEl = document.getElementById('pluginVersion');
  if (versionEl) versionEl.textContent = 'v1.0.0';
  const formContent = document.querySelector('.form-content');
  if (formContent) formContent.scrollTop = 0;
  return document.fonts.ready;
});
await page.waitForTimeout(500);
await capturePluginWindow(page, path.join(IMAGES, 'plugin-form-ready.png'));
console.log('Wrote plugin-form-ready.png');

await browser.close();
