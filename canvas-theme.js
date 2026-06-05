// canvas-theme.ts
// Resolves canvas-adaptive colors from the current Figma page background.
import { TOKENS } from './design-tokens';
import { hexToRgb } from './layout-utils';
const LUMINANCE_THRESHOLD = 0.45;
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
            fillsSurface: hexToRgb(TOKENS.fillsSurface),
            border: hexToRgb(TOKENS.paleSky400),
            sectionTint: hexToRgb(TOKENS.azure100),
            sectionTintBorder: hexToRgb(TOKENS.azure200),
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
        sectionTintBorder: hexToRgb(TOKENS.azure100),
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
