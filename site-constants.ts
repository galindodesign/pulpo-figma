/**
 * Shared Pulpo site + plugin URLs (edit before release).
 * Used by the Figma plugin, VitePress docs site, and build scripts.
 */

import pkg from './package.json';

/**
 * Plugin + docs site version. Bump in package.json only — shown in the
 * plugin footer (ui.html) and on the docs site.
 */
export const PLUGIN_VERSION = pkg.version;

/** Figma Community plugin page — update when published. */
export const FIGMA_COMMUNITY_URL =
  'https://www.figma.com/community/search?resource_type=plugins&q=Pulpo';

/** Public docs site (GitHub Pages). Update base when adding a custom domain. */
export const DOCS_SITE_URL = 'https://galindodesign.github.io/pulpo-figma/';

/** VitePress `base` — derived from {@link DOCS_SITE_URL}. */
export const DOCS_SITE_BASE_PATH = (() => {
  const path = DOCS_SITE_URL.replace(/^https?:\/\/[^/?#]+/, '') || '/';
  return path.endsWith('/') ? path : `${path}/`;
})();

/** GitHub repository for issues and feature requests. */
export const GITHUB_REPO_URL = 'https://github.com/galindodesign/pulpo-figma';

/**
 * Optional demo video URL (YouTube, Loom, Vimeo embed URL).
 * Leave empty to show a static preview on the homepage instead.
 */
export const DEMO_VIDEO_URL = '';

/** Inbox for in-plugin feedback mailto. Leave empty to hide the feedback button. */
export const FEEDBACK_EMAIL = 'galindo.designer@gmail.com';

export const GITHUB_ISSUES_URL = `${GITHUB_REPO_URL}/issues`;

export const GITHUB_NEW_BUG_URL =
  `${GITHUB_REPO_URL}/issues/new?template=bug_report.yml`;

export const GITHUB_NEW_FEATURE_URL =
  `${GITHUB_REPO_URL}/issues/new?template=feature_request.yml`;

export const CHANGELOG_URL = `${GITHUB_REPO_URL}/blob/main/CHANGELOG.md`;

export const DOCS_GETTING_STARTED_URL = `${DOCS_SITE_URL}GETTING_STARTED`;
export const DOCS_FAQ_URL = `${DOCS_SITE_URL}FAQ`;
export const DOCS_TROUBLESHOOTING_URL = `${DOCS_SITE_URL}TROUBLESHOOTING`;
export const DOCS_CONTACT_URL = `${DOCS_SITE_URL}contact`;
export const DOCS_FEATURE_REQUEST_URL = `${DOCS_SITE_URL}contact#feature-request`;
