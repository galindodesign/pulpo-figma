#!/usr/bin/env node
/**
 * Injects site-constants URLs into build/ui.html and syncs GitHub issue templates.
 * Run: npm run generate:site-urls
 */

import esbuild from 'esbuild';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const {
  DOCS_SITE_URL,
  DOCS_GETTING_STARTED_URL,
  DOCS_FAQ_URL,
  DOCS_TROUBLESHOOTING_URL,
  DOCS_CONTACT_URL,
} = await loadSiteConstants();

const srcHtml = path.join(ROOT, 'ui.html');
const outHtml = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(ROOT, 'build', 'ui.html');

if (!fs.existsSync(srcHtml)) {
  console.error('Missing ui.html');
  process.exit(1);
}

const replacements = new Map([
  ['@PULPO_DOCS_SITE_URL@', DOCS_SITE_URL],
  ['@PULPO_DOCS_GETTING_STARTED_URL@', DOCS_GETTING_STARTED_URL],
  ['@PULPO_DOCS_CONTACT_URL@', DOCS_CONTACT_URL],
]);

let html = fs.readFileSync(srcHtml, 'utf8');
for (const [token, value] of replacements) {
  if (!html.includes(token)) {
    console.error(`ui.html is missing placeholder: ${token}`);
    process.exit(1);
  }
  html = html.replaceAll(token, value);
}

fs.mkdirSync(path.dirname(outHtml), { recursive: true });
fs.writeFileSync(outHtml, html);
console.log('Wrote', path.relative(ROOT, outHtml));

syncIssueTemplates({
  faqUrl: DOCS_FAQ_URL,
  troubleshootingUrl: DOCS_TROUBLESHOOTING_URL,
  contactUrl: DOCS_CONTACT_URL,
});

async function loadSiteConstants() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'site-constants-'));
  const outFile = path.join(tmpDir, 'site-constants.cjs');

  await esbuild.build({
    entryPoints: [path.join(ROOT, 'site-constants.ts')],
    outfile: outFile,
    bundle: true,
    format: 'cjs',
    platform: 'node',
    logLevel: 'silent',
  });

  return import(outFile);
}

function syncIssueTemplates({ faqUrl, troubleshootingUrl, contactUrl }) {
  const bugReportPath = path.join(ROOT, '.github/ISSUE_TEMPLATE/bug_report.yml');
  let bugReport = fs.readFileSync(bugReportPath, 'utf8');
  bugReport = bugReport.replace(
    /Thanks for reporting\. Check \[FAQ\]\([^)]+\) and \[Troubleshooting\]\([^)]+\) first\./,
    `Thanks for reporting. Check [FAQ](${faqUrl}) and [Troubleshooting](${troubleshootingUrl}) first.`,
  );
  fs.writeFileSync(bugReportPath, bugReport);

  const configPath = path.join(ROOT, '.github/ISSUE_TEMPLATE/config.yml');
  let config = fs.readFileSync(configPath, 'utf8');
  config = config.replace(
    /(- name: FAQ & docs\n    url: )[^\n]+/,
    `$1${faqUrl}`,
  );
  config = config.replace(
    /(- name: Contact page\n    url: )[^\n]+/,
    `$1${contactUrl}`,
  );
  fs.writeFileSync(configPath, config);

  console.log('Synced .github/ISSUE_TEMPLATE URLs');
}
