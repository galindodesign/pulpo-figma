#!/usr/bin/env node
/**
 * Injects Supabase backend URL + publishable key into sync-config.js and build/ui.html.
 * Reads PULPO_SYNC_* env vars, or ../pulpo/.env when present.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

function loadPulpoEnv() {
  const envPath = path.join(ROOT, '..', 'pulpo', '.env');
  const out = {};
  if (!fs.existsSync(envPath)) return out;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

const pulpoEnv = loadPulpoEnv();
const supabaseUrl = (
  process.env.PULPO_SYNC_SUPABASE_URL ||
  pulpoEnv.VITE_SUPABASE_URL ||
  ''
).replace(/\/$/, '');
const publishableKey =
  process.env.PULPO_SYNC_PUBLISHABLE_KEY || pulpoEnv.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const backendUrl = supabaseUrl ? `${supabaseUrl}/functions/v1/figma-sync` : '';

if (!backendUrl || !publishableKey) {
  console.warn(
    'Warning: PULPO_SYNC backend URL or publishable key missing — set ../pulpo/.env or PULPO_SYNC_* env vars',
  );
}

const replacements = new Map([
  ['@PULPO_SYNC_BACKEND_URL@', backendUrl],
  ['@PULPO_SYNC_PUBLISHABLE_KEY@', publishableKey],
]);

function injectFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`Missing ${filePath}`);
    process.exit(1);
  }
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [token, value] of replacements) {
    if (!content.includes(token)) {
      console.error(`${path.basename(filePath)} is missing placeholder: ${token}`);
      process.exit(1);
    }
    content = content.replaceAll(token, value);
  }
  fs.writeFileSync(filePath, content);
  console.log('Injected sync config into', path.relative(ROOT, filePath));
}

const syncConfigOut = path.join(ROOT, 'build-dev', 'sync-config.js');
fs.mkdirSync(path.dirname(syncConfigOut), { recursive: true });
fs.copyFileSync(path.join(ROOT, 'sync-config.js'), syncConfigOut);
injectFile(syncConfigOut);
