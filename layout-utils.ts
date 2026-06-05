// layout-utils.ts
// Utility functions for layout, color, and formatting used in Figma node creation

import { TOKENS } from './design-tokens';

// ===== Performance Optimization: Memoization Cache =====
/**
 * Cache for hexToRgb conversions to avoid repeated calculations
 * Typical flow has 10-50 color conversions, many repeated
 */
const colorCache = new Map<string, RGB>();

/**
 * Converts a hexadecimal color string to Figma's RGB format
 * Uses memoization cache to avoid repeated conversions (performance optimization)
 * @param hex - Hex color string with or without # prefix (e.g., '#FF0000' or 'FF0000')
 *              Supports both 6-digit (#RRGGBB) and 3-digit (#RGB) formats
 * @returns RGB object with r, g, b values normalized to 0-1 range
 * @example
 * hexToRgb('#FF0000') // { r: 1, g: 0, b: 0 } (red)
 * hexToRgb('00FF00') // { r: 0, g: 1, b: 0 } (green)
 * hexToRgb('#0F0')   // { r: 0, g: 1, b: 0 } (green, 3-digit)
 */
export function hexToRgb(hex: string): RGB {
  // Check cache first
  if (colorCache.has(hex)) {
    return colorCache.get(hex)!;
  }
  
  // Calculate and cache result
  let normalized = hex.replace('#', '');
  if (normalized.length === 3) {
    normalized = normalized.split('').map(x => x + x).join('');
  }
  const num = parseInt(normalized, 16);
  const rgb = {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255,
  };
  
  colorCache.set(hex, rgb);
  return rgb;
}

/**
 * Retrieves a spacing/sizing value from design tokens
 * Used to maintain consistent spacing throughout the plugin using centralized token definitions
 * @param token - Key from TOKENS object (must be a numeric token)
 * @returns The numeric value of the token
 * @example
 * getSpacing('space12') // Returns 12 (or whatever value is defined in TOKENS)
 * getSpacing('radiusMD') // Returns medium border radius value
 */
export function getSpacing(token: keyof typeof TOKENS): number {
  return TOKENS[token] as number;
}

/**
 * Creates a font style configuration for Figma text nodes
 * Maintains consistent typography throughout the plugin
 * @param style - Font weight/style: 'Bold' (700), 'Regular' (400), or 'Medium' (500)
 * @returns Font configuration object { family, style } ready for Figma text nodes
 * @example
 * const text = figma.createText();
 * text.fontName = getFontStyle('Bold');
 * text.fontSize = 16;
 * text.characters = 'Heading';
 */
export function getFontStyle(style: 'Bold' | 'Regular' | 'Medium' = 'Regular') {
  return { family: TOKENS.fontFamily, style };
}

// ============================================
// BADGE UTILITIES
// Consolidated badge creation for consistent styling across the plugin
// ============================================

export type BadgeStyle = 'chip' | 'chip-icon';

/** @deprecated Use `'chip'` — kept for call-site compatibility during migration. */
export type LegacyBadgeStyle = 'filled' | 'outlined' | 'micro';

function resolveBadgeStyle(style: BadgeStyle | LegacyBadgeStyle, label: string, icon?: SceneNode): BadgeStyle {
  if (style === 'chip-icon') return 'chip-icon';
  if (style === 'chip') return 'chip';
  // Legacy micro + icon, no label → icon-only chip (matches ui.html rolled-out chip)
  if (style === 'micro' && icon && !label.trim()) return 'chip-icon';
  return 'chip';
}

/**
 * Creates a styled badge matching ui.html `.variant-passive-chip` (20px, bordered pill).
 *
 * @param label - Text label; omit or pass '' with `chip-icon` for icon-only badges
 * @param style - `'chip'` (default pill) or `'chip-icon'` (20×20, icon centered)
 * @param bgColor - Background fill (hex)
 * @param textColor - Label / icon stroke color (hex)
 * @param icon - Optional leading icon (12px in chip, 12px centered in chip-icon)
 * @param borderColor - Border color (hex); defaults to bgColor when omitted
 * @param iconSize - Icon dimension in px; defaults to {@link TOKENS.badgeIconSize}
 */
export function createBadge(
  label: string,
  style: BadgeStyle | LegacyBadgeStyle,
  bgColor: string,
  textColor: string,
  icon?: SceneNode,
  borderColor?: string,
  iconSize?: number
): FrameNode {
  const resolvedStyle = resolveBadgeStyle(style, label, icon);
  const border = borderColor ?? bgColor;

  const badge = figma.createFrame();
  badge.layoutMode = "HORIZONTAL";
  badge.primaryAxisSizingMode = resolvedStyle === 'chip-icon' ? "FIXED" : "AUTO";
  badge.counterAxisAlignItems = "CENTER";
  badge.primaryAxisAlignItems = "CENTER";
  badge.itemSpacing = icon && label.trim() ? TOKENS.space4 : 0;
  badge.name = label.trim() ? `${label} Badge` : 'Badge';

  badge.cornerRadius = TOKENS.radiusXS;
  badge.strokeWeight = 1;
  badge.strokes = [{ type: "SOLID", color: hexToRgb(border) }];
  badge.fills = [{ type: "SOLID", color: hexToRgb(bgColor) }];

  if (resolvedStyle === 'chip-icon') {
    badge.counterAxisSizingMode = "FIXED";
    badge.resize(TOKENS.badgeHeight, TOKENS.badgeHeight);
    badge.paddingLeft = badge.paddingRight = 0;
    badge.paddingTop = badge.paddingBottom = 0;
  } else {
    badge.counterAxisSizingMode = "FIXED";
    badge.minHeight = TOKENS.badgeHeight;
    badge.maxHeight = TOKENS.badgeHeight;
    badge.paddingLeft = badge.paddingRight = TOKENS.badgePaddingX;
    badge.paddingTop = badge.paddingBottom = 0;
  }

  if (icon) {
    const resolvedIconSize = iconSize ?? TOKENS.badgeIconSize;
    // Clone the icon to avoid issues if it's already in the document
    const iconClone = icon.clone();
    // Resize icon to fit badge (12px — matches ui.html variant-passive-chip icons)
    // Check if the cloned node has resize method (FrameNode, RectangleNode, etc.)
    if ('resize' in iconClone && typeof iconClone.resize === 'function') {
      if (iconClone.width > 0 && iconClone.height > 0) {
        const scale = resolvedIconSize / Math.max(iconClone.width, iconClone.height);
        iconClone.resize(iconClone.width * scale, iconClone.height * scale);
      } else {
        iconClone.resize(resolvedIconSize, resolvedIconSize);
      }
    } else if ('children' in iconClone && iconClone.children.length > 0) {
      // If it's a group/frame, try to resize the first child
      const firstChild = iconClone.children[0];
      if ('resize' in firstChild && typeof firstChild.resize === 'function') {
        if (firstChild.width > 0 && firstChild.height > 0) {
          const scale = resolvedIconSize / Math.max(firstChild.width, firstChild.height);
          firstChild.resize(firstChild.width * scale, firstChild.height * scale);
        } else {
          firstChild.resize(resolvedIconSize, resolvedIconSize);
        }
      }
    }
    badge.appendChild(iconClone);

    // Clean up temporary source node (e.g. createNodeFromSvg output) so it
    // does not remain on the canvas outside the badge.
    if (icon.parent && icon.parent !== badge) {
      icon.remove();
    }
  }

  if (label.trim()) {
    const text = figma.createText();
    text.fontName = getFontStyle("Medium");
    text.fontSize = TOKENS.fontSizeLabel;
    text.lineHeight = { unit: "PIXELS", value: TOKENS.badgeHeight };
    text.fills = [{ type: "SOLID", color: hexToRgb(textColor) }];
    text.textAutoResize = "WIDTH_AND_HEIGHT";
    text.characters = label;
    badge.appendChild(text);
  }

  return badge;
}
