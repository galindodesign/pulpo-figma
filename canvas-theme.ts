// canvas-theme.ts
// Resolves canvas-adaptive colors from the current Figma page background.

import { TOKENS } from './design-tokens';
import { hexToRgb } from './layout-utils';

export type CanvasTheme = 'on-light' | 'on-dark';

export interface CardShadowConfig {
  color: { r: number; g: number; b: number; a: number };
  offset: { x: number; y: number };
  radius: number;
  spread: number;
}

export interface CanvasTokenSet {
  theme: CanvasTheme;
  fillsSurface: RGB;
  border: RGB;
  sectionTint: RGB;
  connectorPrimary: RGB;
  connectorBrand: RGB;
  connectorWinner: RGB;
  connectorRollout: RGB;
  cardShadow: CardShadowConfig;
}

/** Pages darker than this use on-dark connector/border tokens (~#444444 and below). */
const LUMINANCE_THRESHOLD = 0.15;

const CARD_SHADOW_ON_LIGHT: CardShadowConfig = {
  color: { r: 0, g: 0, b: 0, a: 0.1 },
  offset: { x: 0, y: 1 },
  radius: 4,
  spread: 0,
};

const CARD_SHADOW_ON_DARK: CardShadowConfig = {
  color: { r: 0, g: 0, b: 0, a: 0.22 },
  offset: { x: 0, y: 1 },
  radius: 6,
  spread: 0,
};

function buildTokenSet(theme: CanvasTheme): CanvasTokenSet {
  if (theme === 'on-dark') {
    return {
      theme,
      fillsSurface: hexToRgb(TOKENS.fillsSurface),
      border: hexToRgb(TOKENS.paleSky400),
      sectionTint: hexToRgb(TOKENS.azure50),
      connectorPrimary: hexToRgb(TOKENS.paleSky300),
      connectorBrand: hexToRgb(TOKENS.electricViolet400),
      connectorWinner: hexToRgb(TOKENS.malachite400),
      connectorRollout: hexToRgb(TOKENS.electricViolet400),
      cardShadow: CARD_SHADOW_ON_DARK,
    };
  }

  return {
    theme,
    fillsSurface: hexToRgb(TOKENS.fillsSurface),
    border: hexToRgb(TOKENS.borderStrong),
    sectionTint: hexToRgb(TOKENS.azure50),
    connectorPrimary: hexToRgb(TOKENS.azure600),
    connectorBrand: hexToRgb(TOKENS.electricViolet600),
    connectorWinner: hexToRgb(TOKENS.malachite600),
    connectorRollout: hexToRgb(TOKENS.electricViolet600),
    cardShadow: CARD_SHADOW_ON_LIGHT,
  };
}

let activeCanvasTokens: CanvasTokenSet = buildTokenSet('on-light');

/**
 * WCAG relative luminance for sRGB (0 = black, 1 = white).
 */
export function relativeLuminance(rgb: RGB): number {
  const toLinear = (channel: number) =>
    channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);

  const r = toLinear(rgb.r);
  const g = toLinear(rgb.g);
  const b = toLinear(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Classify canvas as on-light or on-dark from page background fill.
 * Light and mid-gray Figma page colors share on-light tokens; only near-black
 * canvases switch to lighter connectors and stronger card shadows.
 */
export function resolveCanvasTheme(page?: PageNode): CanvasTheme {
  const backgrounds = page?.backgrounds;
  const fill = backgrounds && backgrounds.length > 0 ? backgrounds[0] : null;

  if (fill?.type === 'SOLID' && fill.visible !== false) {
    const opacity = fill.opacity ?? 1;
    const color = fill.color;
    const rgb: RGB = {
      r: color.r * opacity + (1 - opacity),
      g: color.g * opacity + (1 - opacity),
      b: color.b * opacity + (1 - opacity),
    };
    return relativeLuminance(rgb) < LUMINANCE_THRESHOLD ? 'on-dark' : 'on-light';
  }

  return 'on-light';
}

/**
 * Initialize active canvas tokens from the current page. Call once per flow creation.
 */
export function initCanvasTheme(page?: PageNode): CanvasTheme {
  const theme = resolveCanvasTheme(page);
  activeCanvasTokens = buildTokenSet(theme);
  return theme;
}

/** Active canvas token set (defaults to on-light until initCanvasTheme runs). */
export function getCanvasTokens(): CanvasTokenSet {
  return activeCanvasTokens;
}

/** Build a standard card drop-shadow effect from canvas tokens. */
export function createCardShadowEffect(): DropShadowEffect {
  const shadow = activeCanvasTokens.cardShadow;
  return {
    type: 'DROP_SHADOW',
    color: shadow.color,
    offset: shadow.offset,
    radius: shadow.radius,
    spread: shadow.spread,
    visible: true,
    blendMode: 'NORMAL',
  };
}

/** Outer experiment card shell: white surface, border, shadow. */
export function applyCardShell(frame: FrameNode): void {
  const canvas = activeCanvasTokens;
  frame.fills = [{ type: 'SOLID', color: canvas.fillsSurface }];
  frame.strokes = [{ type: 'SOLID', color: canvas.border }];
  frame.strokeWeight = 1;
  frame.effects = [createCardShadowEffect()];
}

/** Inset panel (summary, hypothesis, details): tinted fill + shared border. */
export function applySectionPanel(frame: FrameNode): void {
  const canvas = activeCanvasTokens;
  frame.fills = [{ type: 'SOLID', color: canvas.sectionTint }];
  frame.strokes = [{ type: 'SOLID', color: canvas.border }];
  frame.strokeWeight = 1;
}

/** Metrics table outer frame: border only, transparent interior. */
export function applyTableShell(frame: FrameNode): void {
  const canvas = activeCanvasTokens;
  frame.fills = [];
  frame.strokes = [{ type: 'SOLID', color: canvas.border }];
  frame.strokeWeight = 1;
}

/** Table header row: subtle tint, bottom divider. */
export function applyTableHeaderRow(frame: FrameNode): void {
  const canvas = activeCanvasTokens;
  frame.fills = [{ type: 'SOLID', color: canvas.sectionTint }];
  frame.strokes = [{ type: 'SOLID', color: canvas.border }];
  frame.strokeWeight = 1;
  frame.strokeTopWeight = 0;
  frame.strokeLeftWeight = 0;
  frame.strokeRightWeight = 0;
}

/** Data row bottom divider (omit on last row). */
export function applyTableRowDivider(frame: FrameNode): void {
  const canvas = activeCanvasTokens;
  frame.fills = [];
  frame.strokes = [{ type: 'SOLID', color: canvas.border }];
  frame.strokeWeight = 1;
  frame.strokeTopWeight = 0;
  frame.strokeLeftWeight = 0;
  frame.strokeRightWeight = 0;
}
