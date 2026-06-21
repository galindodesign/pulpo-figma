#!/usr/bin/env node
/**
 * Dev watch: rebuild plugin code and sync UI assets into build/ (manifest paths).
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: ROOT, stdio: 'inherit', shell: true });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(' ')} exited with ${code}`));
    });
  });
}

let uiTimer;
function scheduleUiSync() {
  clearTimeout(uiTimer);
  uiTimer = setTimeout(() => {
    run('npm', ['run', 'postbuild']).catch((err) => console.error(err.message));
  }, 150);
}

await run('npm', ['run', 'build']);

spawn('node', ['esbuild.config.js', '--watch'], { cwd: ROOT, stdio: 'inherit' });

const watchTargets = ['ui.html', 'ui.css', 'design-tokens.css', 'fonts', 'assets'];
for (const rel of watchTargets) {
  const target = path.join(ROOT, rel);
  if (!fs.existsSync(target)) continue;
  fs.watch(target, { recursive: true }, scheduleUiSync);
}

console.log('Watching code.ts and UI assets → build/');
