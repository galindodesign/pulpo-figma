// canvas-theme.ts
// Canvas-adaptive tokens + shared chrome API (mirrors design-tokens.css plugin surfaces).
import { TOKENS } from './design-tokens';
import { hexToRgb } from './layout-utils';
/** Pages darker than this use on-dark connector/border tokens (~#444444 and below). */
const LUMINANCE_THRESHOLD = 0.15;
const CARD_SHADOW_ON_LIGHT = {
    color: { r: 0, g: 0, b: 0, a: 0.1 },
    offset: { x: 0, y: 1 },
    radius: 4,
    spread: 0,
};
const CARD_SHADOW_ON_DARK = {
    color: { r: 0, g: 0, b: 0, a: 0.22 },
    offset: { x: 0, y: 1 },
    radius: 6,
    spread: 0,
};
function buildTokenSet(theme) {
    if (theme === 'on-dark') {
        return {
            theme,
            fillsSurface: hexToRgb(TOKENS.canvasSurface),
            border: hexToRgb(TOKENS.canvasBorderOnDark),
            sectionTint: hexToRgb(TOKENS.canvasSectionTint),
            connectorPrimary: hexToRgb(TOKENS.paleSky300),
            connectorBrand: hexToRgb(TOKENS.electricViolet400),
            connectorWinner: hexToRgb(TOKENS.malachite400),
            connectorRollout: hexToRgb(TOKENS.electricViolet400),
            cardShadow: CARD_SHADOW_ON_DARK,
        };
    }
    return {
        theme,
        fillsSurface: hexToRgb(TOKENS.canvasSurface),
        border: hexToRgb(TOKENS.canvasBorderDefault),
        sectionTint: hexToRgb(TOKENS.canvasSectionTint),
        connectorPrimary: hexToRgb(TOKENS.azure600),
        connectorBrand: hexToRgb(TOKENS.electricViolet600),
        connectorWinner: hexToRgb(TOKENS.malachite600),
        connectorRollout: hexToRgb(TOKENS.electricViolet600),
        cardShadow: CARD_SHADOW_ON_LIGHT,
    };
}
let activeCanvasTokens = buildTokenSet('on-light');
/**
 * WCAG relative luminance for sRGB (0 = black, 1 = white).
 */
export function relativeLuminance(rgb) {
    const toLinear = (channel) => channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
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
export function resolveCanvasTheme(page) {
    var _a;
    const backgrounds = page === null || page === void 0 ? void 0 : page.backgrounds;
    const fill = backgrounds && backgrounds.length > 0 ? backgrounds[0] : null;
    if ((fill === null || fill === void 0 ? void 0 : fill.type) === 'SOLID' && fill.visible !== false) {
        const opacity = (_a = fill.opacity) !== null && _a !== void 0 ? _a : 1;
        const color = fill.color;
        const rgb = {
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
export function initCanvasTheme(page) {
    const theme = resolveCanvasTheme(page);
    activeCanvasTokens = buildTokenSet(theme);
    return theme;
}
/** Active canvas token set (defaults to on-light until initCanvasTheme runs). */
export function getCanvasTokens() {
    return activeCanvasTokens;
}
/** Build a standard card drop-shadow effect from canvas tokens. */
export function createCardShadowEffect() {
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
// ---------------------------------------------------------------------------
// Shared chrome API — mirrors ui.html / design-tokens.css plugin surfaces
// ---------------------------------------------------------------------------
/**
 * Outer card shell — mirrors .Card / --variant-card-* / --plugin-card-*.
 * Sets surface, border, optional shadow, and default card radius.
 */
export function applyPluginCard(frame, options = {}) {
    const canvas = activeCanvasTokens;
    const { emphasis, borderWeight, borderColor, shadow = true, radius = true } = options;
    frame.fills = [{ type: 'SOLID', color: hexToRgb(TOKENS.pluginCardSurface) }];
    if (emphasis === 'brand') {
        frame.strokes = [{ type: 'SOLID', color: hexToRgb(TOKENS.electricViolet500) }];
        frame.strokeWeight = borderWeight !== null && borderWeight !== void 0 ? borderWeight : 2;
    }
    else {
        frame.strokes = [{ type: 'SOLID', color: borderColor !== null && borderColor !== void 0 ? borderColor : canvas.border }];
        frame.strokeWeight = borderWeight !== null && borderWeight !== void 0 ? borderWeight : 1;
    }
    if (radius) {
        frame.cornerRadius = TOKENS.pluginCardRadius;
    }
    frame.effects = shadow ? [createCardShadowEffect()] : [];
}
/**
 * Inset section panel — mirrors --section-border / --plugin-section-*.
 * Border-only interior; call applyPluginSectionLayout for padding.
 */
export function applyPluginSection(frame) {
    frame.fills = [];
    frame.strokes = [{ type: 'SOLID', color: hexToRgb(TOKENS.pluginSectionBorder) }];
    frame.strokeWeight = 1;
    frame.cornerRadius = TOKENS.pluginSectionRadius;
}
/** Section panel padding from --plugin-section-padding. */
export function applyPluginSectionLayout(frame) {
    const pad = TOKENS.pluginSectionPadding;
    frame.paddingLeft = frame.paddingRight = pad;
    frame.paddingTop = frame.paddingBottom = pad;
}
/**
 * Form input surface — mirrors --input-bg / --input-border / --input-radius.
 */
export function applyPluginInput(frame) {
    frame.fills = [{ type: 'SOLID', color: hexToRgb(TOKENS.pluginInputBg) }];
    frame.strokes = [{ type: 'SOLID', color: hexToRgb(TOKENS.pluginInputBorderColor) }];
    frame.strokeWeight = 1;
    frame.cornerRadius = TOKENS.pluginInputRadius;
}
/**
 * Tinted chip (link rows, tags) — mirrors --plugin-chip-*.
 */
export function applyPluginChip(frame) {
    frame.fills = [{ type: 'SOLID', color: hexToRgb(TOKENS.pluginChipBg) }];
    frame.strokes = [{ type: 'SOLID', color: hexToRgb(TOKENS.pluginChipBorder) }];
    frame.strokeWeight = 1;
    frame.cornerRadius = TOKENS.radiusXS;
}
/**
 * Subtle filled chip (metric badges) — mirrors --plugin-subtle-fill + section border.
 */
export function applyPluginSubtleChip(frame) {
    const canvas = activeCanvasTokens;
    frame.fills = [{ type: 'SOLID', color: hexToRgb(TOKENS.pluginSubtleFill) }];
    frame.strokes = [{ type: 'SOLID', color: canvas.border }];
    frame.strokeWeight = 1;
    frame.cornerRadius = TOKENS.radiusSM;
}
/**
 * Note / meta callout block — tinted fill + border (--meta-bg equivalent).
 */
export function applyPluginMetaPanel(frame) {
    const canvas = activeCanvasTokens;
    frame.fills = [{ type: 'SOLID', color: canvas.sectionTint }];
    frame.strokes = [{ type: 'SOLID', color: canvas.border }];
    frame.strokeWeight = 1;
    frame.cornerRadius = TOKENS.radiusSM;
}
// ---------------------------------------------------------------------------
// Legacy aliases (card builders — prefer applyPlugin* for new code)
// ---------------------------------------------------------------------------
/** @deprecated Use applyPluginCard */
export function applyCardShell(frame) {
    applyPluginCard(frame, { radius: false, shadow: true });
}
/** @deprecated Use applyPluginSection */
export function applySectionPanel(frame) {
    applyPluginSection(frame);
}
/** Metrics table outer frame: border only, transparent interior. */
export function applyTableShell(frame) {
    applyPluginSection(frame);
}
/** Table header row: subtle tint, bottom divider. */
export function applyTableHeaderRow(frame) {
    const canvas = activeCanvasTokens;
    frame.fills = [{ type: 'SOLID', color: canvas.sectionTint }];
    frame.strokes = [{ type: 'SOLID', color: canvas.border }];
    frame.strokeWeight = 1;
    frame.strokeTopWeight = 0;
    frame.strokeLeftWeight = 0;
    frame.strokeRightWeight = 0;
}
/** Data row bottom divider (omit on last row). */
export function applyTableRowDivider(frame) {
    const canvas = activeCanvasTokens;
    frame.fills = [];
    frame.strokes = [{ type: 'SOLID', color: canvas.border }];
    frame.strokeWeight = 1;
    frame.strokeTopWeight = 0;
    frame.strokeLeftWeight = 0;
    frame.strokeRightWeight = 0;
}
