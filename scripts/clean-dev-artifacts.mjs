#!/usr/bin/env node
/**
 * Remove local Pulpo Connect (Dev) plugin output. Live plugin uses build/ only.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUILD_DEV = path.join(ROOT, 'build-dev');

if (fs.existsSync(BUILD_DEV)) {
  fs.rmSync(BUILD_DEV, { recursive: true, force: true });
  console.log('Removed build-dev/');
}
