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

export type BadgeStyle = 'filled' | 'outlined' | 'micro';

/**
 * Creates a styled badge component for displaying labels, statuses, or metadata
 * Badges are used throughout the plugin for variant labels, status indicators, metrics, etc.
 * 
 * Three styles available:
 * - 'filled': Solid background, fixed 16px height (default for most badges)
 * - 'outlined': Border only, fixed 16px height (for status tags)
 * - 'micro': Smaller badge (10px height) for dense layouts like metric tables
 * 
 * @param label - Text to display in the badge
 * @param style - Badge variant: 'filled' | 'outlined' | 'micro'
 * @param bgColor - Background color (hex string) for filled/micro badges; border color for outlined
 * @param textColor - Text color (hex string)
 * @param icon - Optional icon node to display before the text (will be resized to fit badge)
 * @returns FrameNode containing the styled badge
 * 
 * @example
 * // Variant status badge
 * const badge = createBadge('Winner', 'filled', '#10B981', '#FFFFFF');
 * 
 * @example
 * // Metric label in table (micro)
 * const metricBadge = createBadge('CTR', 'micro', '#E0E7FF', '#4F46E5');
 */
export function createBadge(
  label: string,
  style: BadgeStyle,
  bgColor: string,
  textColor: string,
  icon?: SceneNode
): FrameNode {
  const badge = figma.createFrame();
  badge.layoutMode = "HORIZONTAL";
  badge.primaryAxisSizingMode = "AUTO";
  badge.counterAxisAlignItems = "CENTER";
  badge.itemSpacing = icon ? 4 : 0;
  badge.name = `${label} Badge`;

  if (style === 'micro') {
    // Micro badge: smaller, auto height, for table cells
    badge.counterAxisSizingMode = "AUTO";
    badge.paddingLeft = badge.paddingRight = 4;
    badge.paddingTop = badge.paddingBottom = 2;
    badge.cornerRadius = 3;
    badge.fills = [{ type: "SOLID", color: hexToRgb(bgColor) }];
  } else if (style === 'outlined') {
    // Outlined badge: fixed 16px height, border, no fill
    badge.counterAxisSizingMode = "FIXED";
    badge.minHeight = 16;
    badge.maxHeight = 16;
    badge.paddingLeft = badge.paddingRight = 4;
    badge.paddingTop = badge.paddingBottom = 2;
    badge.cornerRadius = 4;
    badge.fills = [];
    badge.strokes = [{ type: "SOLID", color: hexToRgb(bgColor) }];
    badge.strokeWeight = 1;
  } else {
    // Filled badge: fixed 16px height, solid fill
    badge.counterAxisSizingMode = "FIXED";
    badge.minHeight = 16;
    badge.maxHeight = 16;
    badge.paddingLeft = badge.paddingRight = 4;
    badge.paddingTop = badge.paddingBottom = 2;
    badge.cornerRadius = 4;
    badge.fills = [{ type: "SOLID", color: hexToRgb(bgColor) }];
  }

  // Add icon if provided
  if (icon) {
    // Clone the icon to avoid issues if it's already in the document
    const iconClone = icon.clone();
    // Resize icon to fit badge (typically 10-12px for micro badges)
    const iconSize = style === 'micro' ? 10 : 12;
    // Check if the cloned node has resize method (FrameNode, RectangleNode, etc.)
    if ('resize' in iconClone && typeof iconClone.resize === 'function') {
      if (iconClone.width > 0 && iconClone.height > 0) {
        const scale = iconSize / Math.max(iconClone.width, iconClone.height);
        iconClone.resize(iconClone.width * scale, iconClone.height * scale);
      } else {
        iconClone.resize(iconSize, iconSize);
      }
    } else if ('children' in iconClone && iconClone.children.length > 0) {
      // If it's a group/frame, try to resize the first child
      const firstChild = iconClone.children[0];
      if ('resize' in firstChild && typeof firstChild.resize === 'function') {
        if (firstChild.width > 0 && firstChild.height > 0) {
          const scale = iconSize / Math.max(firstChild.width, firstChild.height);
          firstChild.resize(firstChild.width * scale, firstChild.height * scale);
        } else {
          firstChild.resize(iconSize, iconSize);
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

  const text = figma.createText();
  text.fontName = getFontStyle("Medium");
  text.fontSize = style === 'micro' ? TOKENS.fontSizeLabel : 9;
  text.lineHeight = style === 'micro' ? { unit: "AUTO" } : { unit: "PIXELS", value: 10 };
  text.fills = [{ type: "SOLID", color: hexToRgb(textColor) }];
  text.textAutoResize = "WIDTH_AND_HEIGHT";
  text.characters = label;
  badge.appendChild(text);

  return badge;
}
