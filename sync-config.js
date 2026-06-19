/**
 * Baked Pulpo sync endpoints for the dev connect plugin.
 * Placeholders replaced at build time by scripts/inject-sync-config.mjs
 */
(function (global) {
  global.PULPO_SYNC_CONFIG = {
    backendUrl: '@PULPO_SYNC_BACKEND_URL@',
    publishableKey: '@PULPO_SYNC_PUBLISHABLE_KEY@',
  };
})(window);
