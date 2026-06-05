#!/usr/bin/env node
/**
 * Generates design-tokens.ts from design-tokens.css (single source of truth).
 * Run: npm run generate:tokens
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const CSS_PATH = path.join(ROOT, 'design-tokens.css');
const OUT_PATH = path.join(ROOT, 'design-tokens.ts');

/** Semantic / component CSS vars → TS key (resolved values). */
const SEMANTIC_EXPORTS = [
  ['fillsBackground', 'fills-background', 'color'],
  ['fillsSurface', 'fills-surface', 'color'],
  ['fillsBrand', 'fills-brand', 'color'],
  ['fillsSuccess', 'fills-success', 'color'],
  ['fillsLinkDefault', 'fills-link-default', 'color'],
  ['textPrimary', 'text-primary-default', 'color'],
  ['textPrimaryInverted', 'text-primary-inverted', 'color'],
  ['textSecondary', 'text-secondary-default', 'color'],
  ['textSecondaryInverted', 'text-secondary-inverted', 'color'],
  ['textTertiary', 'text-tertiary-default', 'color'],
  ['textTertiaryInverted', 'text-tertiary-inverted', 'color'],
  ['textLink', 'text-link-default', 'color'],
  ['textLabel', 'text-label-default', 'color'],
  ['textStatesSuccess', 'text-states-success', 'color'],
  ['textMuted', 'text-muted', 'color'],
  ['border', 'border-border', 'color'],
  ['borderInput', 'border-input-border', 'color'],
  ['borderDark', 'border-dark', 'color'],
  ['borderStrong', 'border-strong', 'color'],
  ['canvasBorderDefault', 'canvas-border-default', 'color'],
  ['canvasBorderEmphasis', 'canvas-border-emphasis', 'color'],
  ['canvasBorderOnDark', 'canvas-border-on-dark', 'color'],
  ['canvasSurface', 'canvas-surface', 'color'],
  ['canvasSectionTint', 'canvas-section-tint', 'color'],
  ['typographyH1Color', 'typography-h1-color', 'color'],
  ['typographyH2Color', 'typography-h2-color', 'color'],
  ['typographyH3Color', 'typography-h3-color', 'color'],
  ['typographyMetaColor', 'typography-meta-color', 'color'],
  ['typographyBodyColor', 'typography-body-color', 'color'],
  ['typographyMutedColor', 'typography-muted-color', 'color'],
  ['typographyLinkColor', 'typography-link-color', 'color'],
  ['pluginCardSurface', 'plugin-card-surface', 'color'],
  ['pluginCardBorder', 'plugin-card-border', 'color'],
  ['pluginCardRadius', 'plugin-card-radius', 'px'],
  ['pluginSectionBorder', 'plugin-section-border', 'color'],
  ['pluginSectionRadius', 'plugin-section-radius', 'px'],
  ['pluginSectionPadding', 'plugin-section-padding', 'px'],
  ['pluginInputBg', 'plugin-input-bg', 'color'],
  ['pluginInputBorderColor', 'plugin-input-border-color', 'color'],
  ['pluginInputRadius', 'plugin-input-radius', 'px'],
  ['pluginChipBg', 'plugin-chip-bg', 'color'],
  ['pluginChipBorder', 'plugin-chip-border', 'color'],
  ['pluginSubtleFill', 'plugin-subtle-fill', 'color'],
  ['badgeRolledOutBg', 'badge-rolled-out-bg', 'color'],
  ['badgeRolledOutBorder', 'badge-rolled-out-border', 'color'],
  ['badgeRolledOutText', 'badge-rolled-out-text', 'color'],
  ['badgeVariantsBg', 'badge-variants-bg', 'color'],
  ['badgeVariantsBorder', 'badge-variants-border', 'color'],
  ['badgeVariantsText', 'badge-variants-text', 'color'],
  ['badgeNeutralBg', 'badge-neutral-bg', 'color'],
  ['badgeNeutralBorder', 'badge-neutral-border', 'color'],
  ['accentSuccess', 'accent-success', 'color'],
  ['accentSuccessLight', 'accent-success-light', 'color'],
  ['accentSuccessBg', 'accent-success-bg', 'color'],
  ['accentError', 'accent-error', 'color'],
  ['accentWarning', 'accent-warning', 'color'],
  ['accentInfo', 'accent-info', 'color'],
  ['accentHighlight', 'accent-highlight', 'color'],
  ['accentPrimary', 'accent-primary', 'color'],
  ['accentPrimaryDark', 'accent-primary-dark', 'color'],
  ['statusVariantA', 'status-variant-a', 'color'],
  ['statusVariantB', 'status-variant-b', 'color'],
  ['statusVariantC', 'status-variant-c', 'color'],
  ['buttonBlackDefault', 'buttons-black-default', 'color'],
  ['buttonBlackHover', 'buttons-black-hover', 'color'],
  ['buttonBlackSelected', 'buttons-black-selected', 'color'],
  ['buttonPurpleDefault', 'buttons-purple-default', 'color'],
  ['buttonPurpleHover', 'buttons-purple-hover', 'color'],
  ['buttonGreenDefault', 'buttons-button-green-default', 'color'],
  ['buttonGreenHover', 'buttons-button-green-hover', 'color'],
  ['sectionPadding', 'section-padding', 'px'],
  ['sectionGap', 'section-gap', 'px'],
  ['variantCardRadius', 'variant-card-radius', 'px'],
];

const SPACING_EXPORTS = [
  ['space0', 'space-0'],
  ['space4', 'space-4'],
  ['space8', 'space-8'],
  ['space12', 'space-12'],
  ['space16', 'space-16'],
  ['space24', 'space-24'],
  ['space32', 'space-32'],
  ['space40', 'space-40'],
];

const BADGE_EXPORTS = [
  ['badgeHeight', 'badge-height'],
  ['badgePaddingX', 'badge-padding-x'],
  ['badgeIconSize', 'badge-icon-size'],
  ['badgeRolledOutIconSize', 'badge-rolled-out-icon-size'],
];

const RADIUS_EXPORTS = [
  ['radiusXS', 'radius-xs'],
  ['radiusSM', 'radius-sm'],
  ['radiusMD', 'radius-md'],
  ['radiusLG', 'radius-lg'],
  ['radiusXL', 'radius-xl'],
];

const TYPOGRAPHY_SIZE_EXPORTS = [
  ['fontSizeH1', 'heading-h1-size'],
  ['fontSizeH2', 'heading-h2-size'],
  ['fontSizeBodyMd', 'body-md-size'],
  ['fontSizeBodyLg', 'body-lg-size'],
  ['fontSizeBodySm', 'body-sm-size'],
  ['fontSizeLabel', 'label-size'],
  ['fontSizeInput', 'input-text-size'],
];

const TYPOGRAPHY_WEIGHT_EXPORTS = [
  ['fontWeightH1', 'heading-h1-weight'],
  ['fontWeightH2', 'heading-h2-weight'],
  ['fontWeightBodyMd', 'body-md-weight'],
  ['fontWeightBodyLg', 'body-lg-weight'],
  ['fontWeightBodySm', 'body-sm-weight'],
  ['fontWeightLabel', 'label-weight'],
  ['fontWeightInput', 'input-text-weight'],
];

const TYPOGRAPHY_LINE_HEIGHT_EXPORTS = [
  ['lineHeightH1', 'heading-h1-line-height'],
  ['lineHeightH2', 'heading-h2-line-height'],
  ['lineHeightBodyMd', 'body-md-line-height'],
  ['lineHeightBodyLg', 'body-lg-line-height'],
  ['lineHeightBodySm', 'body-sm-line-height'],
  ['lineHeightLabel', 'label-line-height'],
  ['lineHeightInput', 'input-text-line-height'],
];

function parseCssVars(css) {
  const vars = new Map();
  const re = /^\s*--([a-z0-9-]+):\s*(.+?);?\s*$/gm;
  let match;
  while ((match = re.exec(css)) !== null) {
    const raw = match[2].trim().replace(/\s*\/\*.*?\*\//g, '').replace(/;$/, '').trim();
    vars.set(match[1], raw);
  }
  return vars;
}

function resolveVar(name, vars, stack = new Set()) {
  if (stack.has(name)) {
    throw new Error(`Circular var reference: ${name}`);
  }
  const raw = vars.get(name);
  if (raw === undefined) {
    throw new Error(`Unknown CSS variable: --${name}`);
  }
  const varMatch = raw.match(/^var\(\s*--([a-z0-9-]+)\s*\)$/);
  if (varMatch) {
    stack.add(name);
    return resolveVar(varMatch[1], vars, stack);
  }
  return raw;
}

function colorVarToTsKey(varName) {
  const parts = varName.replace(/^color-/, '').split('-');
  const suffix = [];
  let i = parts.length - 1;
  while (i >= 0 && (/^\d+$/.test(parts[i]) || parts[i] === 'alpha')) {
    suffix.unshift(parts[i]);
    i--;
  }
  const family = parts
    .slice(0, i + 1)
    .map((part, idx) => (idx === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join('');
  const suffixStr = suffix
    .map((part) => (part === 'alpha' ? 'Alpha' : part))
    .join('');
  return family + suffixStr;
}

function formatColor(value) {
  if (/^#[0-9a-fA-F]{3,8}$/.test(value)) {
    return `'${value.toLowerCase()}'`;
  }
  // rgba() or 8-digit hex with alpha — keep as string for canvas fills
  if (/^rgba?\(/.test(value) || /^#[0-9a-fA-F]{8}$/.test(value)) {
    return `'${value}'`;
  }
  throw new Error(`Expected color, got: ${value}`);
}

function formatPx(value) {
  if (value.endsWith('px')) {
    return String(parseInt(value, 10));
  }
  if (/^\d+$/.test(value)) {
    return value;
  }
  throw new Error(`Expected px value, got: ${value}`);
}

function formatPercent(value) {
  if (value.endsWith('%')) {
    return String(parseFloat(value) / 100);
  }
  throw new Error(`Expected percent, got: ${value}`);
}

function emitSection(title, entries) {
  const lines = [`  // ${title}`, ...entries, ''];
  return lines.join('\n');
}

function main() {
  const css = fs.readFileSync(CSS_PATH, 'utf8');
  const vars = parseCssVars(css);

  const baseColorEntries = [];
  const colorKeys = [...vars.keys()]
    .filter((name) => name.startsWith('color-'))
    .sort();
  for (const varName of colorKeys) {
    const resolved = resolveVar(varName, vars);
    if (!/^#[0-9a-fA-F]{3,8}$/.test(resolved)) continue;
    const tsKey = colorVarToTsKey(varName);
    baseColorEntries.push(`  ${tsKey}: ${formatColor(resolved)}, // --${varName}`);
  }

  const semanticEntries = SEMANTIC_EXPORTS.map(([tsKey, cssVar, type]) => {
    const resolved = resolveVar(cssVar, vars);
    let formatted;
    if (type === 'color') formatted = formatColor(resolved);
    else if (type === 'px') formatted = formatPx(resolved);
    else throw new Error(`Unknown type: ${type}`);
    return `  ${tsKey}: ${formatted}, // --${cssVar}`;
  });

  const spacingEntries = SPACING_EXPORTS.map(([tsKey, cssVar]) => {
    const resolved = resolveVar(cssVar, vars);
    return `  ${tsKey}: ${formatPx(resolved)}, // --${cssVar}`;
  });

  const badgeEntries = BADGE_EXPORTS.map(([tsKey, cssVar]) => {
    const resolved = resolveVar(cssVar, vars);
    return `  ${tsKey}: ${formatPx(resolved)}, // --${cssVar}`;
  });

  const radiusEntries = RADIUS_EXPORTS.map(([tsKey, cssVar]) => {
    const resolved = resolveVar(cssVar, vars);
    return `  ${tsKey}: ${formatPx(resolved)}, // --${cssVar}`;
  });

  const typoSizeEntries = TYPOGRAPHY_SIZE_EXPORTS.map(([tsKey, cssVar]) => {
    const resolved = resolveVar(cssVar, vars);
    return `  ${tsKey}: ${formatPx(resolved)}, // --${cssVar}`;
  });

  const typoWeightEntries = TYPOGRAPHY_WEIGHT_EXPORTS.map(([tsKey, cssVar]) => {
    const resolved = resolveVar(cssVar, vars);
    return `  ${tsKey}: ${parseInt(resolved, 10)}, // --${cssVar}`;
  });

  const typoLineHeightEntries = TYPOGRAPHY_LINE_HEIGHT_EXPORTS.map(([tsKey, cssVar]) => {
    const resolved = resolveVar(cssVar, vars);
    return `  ${tsKey}: ${formatPercent(resolved)}, // --${cssVar}`;
  });

  const staticEntries = [
    "  accentBrand: '#9785ff', // --color-electric-violet-400 (canvas alias)",
    '  shadowColor: { r: 0, g: 0, b: 0, a: 0.05 },',
    '  shadowCard: { r: 40, g: 60, b: 90, a: 0.06 },',
    "  checkerLight: { r: 0.96, g: 0.96, b: 0.96 },",
    "  checkerDark: { r: 0.89, g: 0.89, b: 0.89 },",
    "  fontFamily: 'Figtree',",
    '  fontWeightRegular: 400,',
    '  fontWeightMedium: 500,',
    '  fontWeightSemiBold: 600,',
    '  fontWeightBold: 700,',
  ];

  const output = `// design-tokens.ts
// AUTO-GENERATED from design-tokens.css — do not edit by hand.
// Run: npm run generate:tokens

export const TOKENS = {
${emitSection('BASE COLORS', baseColorEntries)}${emitSection('SEMANTIC TOKENS', semanticEntries)}${emitSection('SPACING', spacingEntries)}${emitSection('BADGE LAYOUT', badgeEntries)}${emitSection('BORDER RADIUS', radiusEntries)}${emitSection('TYPOGRAPHY SIZES', typoSizeEntries)}${emitSection('TYPOGRAPHY WEIGHTS', typoWeightEntries)}${emitSection('TYPOGRAPHY LINE HEIGHTS', typoLineHeightEntries)}${emitSection('STATIC / CANVAS-ONLY', staticEntries)}};
`;

  fs.writeFileSync(OUT_PATH, output, 'utf8');
  console.log(`Wrote ${path.relative(ROOT, OUT_PATH)} (${baseColorEntries.length} base colors, ${semanticEntries.length} semantic tokens)`);
}

main();
