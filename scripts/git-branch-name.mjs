#!/usr/bin/env node
/**
 * Current git branch name, or GITHUB_REF_NAME in CI.
 */

import { execSync } from 'child_process';

export function getGitBranchName() {
  const fromEnv = (process.env.GITHUB_REF_NAME || '').trim();
  if (fromEnv) return fromEnv;

  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}
