// experiment-node.ts
// Modularized node creation functions for Figma plugin

import { TOKENS } from './design-tokens';
import { hexToRgb, getFontStyle, createBadge } from './layout-utils';
import type { MetricDefinition } from './types';

const THUMBNAIL_WIDTH = 368;
const THUMBNAIL_HEIGHT = 260;
const ROLLED_OUT_BADGE_BG = '#fffbb5';
const ROLLED_OUT_BADGE_TEXT = '#484122';
const TROPHY_ICON_SVG = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none">
  <path d="M6 9H4.5a1 1 0 0 1 0-5H6" stroke="${ROLLED_OUT_BADGE_TEXT}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M18 9h1.5a1 1 0 0 0 0-5H18" stroke="${ROLLED_OUT_BADGE_TEXT}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M4 22h16" stroke="${ROLLED_OUT_BADGE_TEXT}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z" stroke="${ROLLED_OUT_BADGE_TEXT}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978" stroke="${ROLLED_OUT_BADGE_TEXT}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978" stroke="${ROLLED_OUT_BADGE_TEXT}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

/** Official Figma multi-color mark (paths align with plugin UI `brandIcons.figma`) */
const FIGMA_BRAND_LOGO_SVG = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M8 24c2.208 0 4-1.792 4-4v-4H8c-2.208 0-4 1.792-4 4s1.792 4 4 4z" fill="#0ACF83"/>
  <path d="M4 12c0-2.208 1.792-4 4-4h4v8H8c-2.208 0-4-1.792-4-4z" fill="#A259FF"/>
  <path d="M4 4c0-2.208 1.792-4 4-4h4v8H8C5.792 8 4 6.208 4 4z" fill="#F24E1E"/>
  <path d="M12 0h4c2.208 0 4 1.792 4 4s-1.792 4-4 4h-4V0z" fill="#FF7262"/>
  <path d="M20 12c0 2.208-1.792 4-4 4s-4-1.792-4-4 1.792-4 4-4 4 1.792 4 4z" fill="#1ABCFE"/>
</svg>`;

/**
 * Row with Figma brand icon + "Open in Figma" hyperlink (top border). Caller passes a non-empty URL string.
 */
function createOpenInFigmaLinkRow(figmaLink: string): FrameNode {
  const trimmed = figmaLink.trim();
  const linkRow = figma.createFrame();
  linkRow.layoutMode = 'HORIZONTAL';
  linkRow.counterAxisSizingMode = 'AUTO';
  linkRow.primaryAxisSizingMode = 'FIXED';
  linkRow.itemSpacing = 4;
  linkRow.counterAxisAlignItems = 'CENTER';
  linkRow.fills = [];
  linkRow.name = 'Figma Link Row';
  linkRow.layoutAlign = 'STRETCH';

  try {
    const figmaIcon = figma.createNodeFromSvg(FIGMA_BRAND_LOGO_SVG);
    figmaIcon.name = 'Figma Icon';
    figmaIcon.resize(14, 14);
    figmaIcon.fills = [];
    linkRow.appendChild(figmaIcon);
  } catch {
    const fallbackIcon = figma.createFrame();
    fallbackIcon.name = 'Figma Icon (fallback)';
    fallbackIcon.resize(14, 14);
    fallbackIcon.fills = [];
    linkRow.appendChild(fallbackIcon);
  }

  const linkText = figma.createText();
  linkText.fontName = getFontStyle('Medium');
  linkText.fontSize = TOKENS.fontSizeBodySm;
  linkText.fills = [{ type: 'SOLID', color: hexToRgb(TOKENS.royalBlue600) }];
  linkText.textAutoResize = 'WIDTH_AND_HEIGHT';
  linkText.hyperlink = { type: 'URL', value: trimmed };
  linkText.characters = 'Open in Figma';
  linkText.name = 'Figma Link';
  linkRow.appendChild(linkText);

  return linkRow;
}

type ThumbnailSourceNode = SceneNode & {
  clone(): SceneNode;
  resize?: (width: number, height: number) => void;
  resizeWithoutConstraints?: (width: number, height: number) => void;
};

function createRolledOutIcon(): FrameNode {
  const icon = figma.createNodeFromSvg(TROPHY_ICON_SVG);
  icon.name = 'Rolled Out Icon';
  icon.resize(10, 10);
  icon.fills = [];
  return icon;
}

function canCloneThumbnailSource(node: SceneNode | null | undefined): node is ThumbnailSourceNode {
  return !!node && typeof (node as { clone?: unknown }).clone === 'function';
}

function resizeThumbnailChild(node: SceneNode, width: number, height: number): void {
  const resizable = node as SceneNode & {
    resize?: (width: number, height: number) => void;
    resizeWithoutConstraints?: (width: number, height: number) => void;
  };

  if (typeof resizable.resize === 'function') {
    resizable.resize(width, height);
  } else if (typeof resizable.resizeWithoutConstraints === 'function') {
    resizable.resizeWithoutConstraints(width, height);
  }
}

function createThumbnailFrame(
  sourceNode?: SceneNode | null,
  options: { cornerRadius?: number; placeholderMessage?: string } = {}
): FrameNode {
  const thumb = figma.createFrame();
  thumb.layoutMode = 'NONE';
  thumb.resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
  thumb.cornerRadius = options.cornerRadius ?? TOKENS.radiusMD;
  thumb.name = 'Thumbnail - Replace with image';
  thumb.layoutAlign = 'MIN';
  thumb.clipsContent = true;

  if (!canCloneThumbnailSource(sourceNode)) {
    thumb.fills = [{ type: 'SOLID', color: hexToRgb(TOKENS.royalBlue100) }];
    thumb.strokes = [{ type: 'SOLID', color: hexToRgb(TOKENS.royalBlue200) }];
    thumb.strokeWeight = 1;
    if (options.placeholderMessage) {
      const title = figma.createText();
      title.fontName = getFontStyle("Bold");
      title.fontSize = TOKENS.fontSizeBodySm;
      title.lineHeight = { value: 16, unit: "PIXELS" };
      title.fills = [{ type: 'SOLID', color: hexToRgb(TOKENS.textPrimary) }];
      title.textAlignHorizontal = 'CENTER';
      title.textAutoResize = 'HEIGHT';
      title.characters = options.placeholderMessage;
      title.resize(THUMBNAIL_WIDTH - 48, title.height);
      title.name = 'Thumbnail Message Title';

      const helper = figma.createText();
      helper.fontName = getFontStyle("Regular");
      helper.fontSize = TOKENS.fontSizeLabel;
      helper.lineHeight = { value: 14, unit: "PIXELS" };
      helper.fills = [{ type: 'SOLID', color: hexToRgb(TOKENS.textSecondary) }];
      helper.textAlignHorizontal = 'CENTER';
      helper.textAutoResize = 'HEIGHT';
      helper.characters = 'Use a frame from this Figma file to render a preview.';
      helper.resize(THUMBNAIL_WIDTH - 48, helper.height);
      helper.name = 'Thumbnail Message Helper';

      const contentHeight = title.height + 8 + helper.height;
      title.x = 24;
      title.y = (THUMBNAIL_HEIGHT - contentHeight) / 2;
      helper.x = 24;
      helper.y = title.y + title.height + 8;

      thumb.appendChild(title);
      thumb.appendChild(helper);
    }
    return thumb;
  }

  thumb.fills = [];
  thumb.strokes = [];

  const clone = sourceNode.clone();
  clone.name = 'Thumbnail Source';

  const sourceWidth = Math.max(1, sourceNode.width || THUMBNAIL_WIDTH);
  const sourceHeight = Math.max(1, sourceNode.height || THUMBNAIL_HEIGHT);
  const scale = Math.max(THUMBNAIL_WIDTH / sourceWidth, THUMBNAIL_HEIGHT / sourceHeight);
  const resizedWidth = sourceWidth * scale;
  const resizedHeight = sourceHeight * scale;

  resizeThumbnailChild(clone, resizedWidth, resizedHeight);
  clone.x = (THUMBNAIL_WIDTH - resizedWidth) / 2;
  clone.y = (THUMBNAIL_HEIGHT - resizedHeight) / 2;

  const roundedClone = clone as SceneNode & { cornerRadius?: number | PluginAPI['mixed'] };
  if (typeof roundedClone.cornerRadius === 'number') {
    roundedClone.cornerRadius = TOKENS.radiusSM;
  }

  thumb.appendChild(clone);
  return thumb;
}

/**
 * Creates an icon frame from an SVG string using Figma's importSVGAsync
 * Handles color updates and scaling to match the target size
 * 
 * Useful for embedding custom icons (status indicators, badges, etc.) into Figma nodes
 * Automatically handles SVG color updates and sizing to prevent icons from exceeding frame bounds
 * 
 * @param svgString - Complete SVG XML string (e.g., from clipboard or inline data)
 * @param size - Desired icon size in pixels (default: 16)
 * @param name - Name for the resulting frame node (appears in Layers panel)
 * @param color - RGB color for the icon strokes (default: black); pass via parameter to customize
 * @returns Promise<FrameNode> containing the imported and formatted SVG
 * 
 * @note Falls back to placeholder rectangle if importSVGAsync fails (graceful degradation)
 * @note Recursively updates all stroke colors in the SVG to the provided color parameter
 * 
 * @example
 * const icon = await createIconFromSVG(
 *   '<svg viewBox="0 0 16 16">...</svg>',
 *   20,
 *   'Success Icon',
 *   { r: 0, g: 1, b: 0 }  // green
 * );
 */
async function createIconFromSVG(
  svgString: string,
  size: number = 16,
  name: string = 'Icon',
  color: RGB = { r: 0, g: 0, b: 0 } // Default black
): Promise<FrameNode> {
  // Create container frame first
  const frame = figma.createFrame();
  frame.resize(size, size);
  frame.fills = [];
  frame.strokes = [];
  frame.name = name;
  frame.clipsContent = false;

  try {
    // Check if importSVGAsync exists using type-safe method
    const figmaExt = figma as Partial<typeof figma> & { importSVGAsync?: (svg: string) => Promise<FrameNode | null> };
    if (typeof figmaExt.importSVGAsync !== 'function') {
      console.warn('importSVGAsync not available, using fallback');
      return frame;
    }

    // Use safe optional chaining for importSVGAsync
    const importedNode = await figmaExt.importSVGAsync?.(svgString);
    
    if (!importedNode) {
      console.warn('importSVGAsync returned null/undefined');
      return frame;
    }
    
    // Recursively update stroke colors to the desired color
    function updateStrokeColors(node: SceneNode) {
      if (node.type === 'VECTOR') {
        if (node.strokes && node.strokes.length > 0) {
          node.strokes = [{ type: 'SOLID', color }];
        }
      } else if ('children' in node) {
        for (const child of node.children) {
          updateStrokeColors(child);
        }
      }
    }
    updateStrokeColors(importedNode);
    
    // Append the imported node to frame
    frame.appendChild(importedNode);
    
    // Scale the imported node to fit the desired size
    // The SVG has viewBox="0 0 16 16", so we need to scale it
    const scale = size / 16;
    if (importedNode.width > 0 && importedNode.height > 0) {
      importedNode.resize(importedNode.width * scale, importedNode.height * scale);
    } else {
      // If width/height are 0, try to set a default size
      importedNode.resize(size, size);
    }
    
    // Center the imported node in the frame
    importedNode.x = (size - importedNode.width) / 2;
    importedNode.y = (size - importedNode.height) / 2;
    
    return frame;
  } catch (error) {
    console.error('Failed to import SVG:', error);
    // Fallback: create a simple placeholder rectangle so something is visible
    const placeholder = figma.createRectangle();
    placeholder.resize(size, size);
    placeholder.fills = [{ type: 'SOLID', color }];
    placeholder.strokes = [];
    placeholder.cornerRadius = 2;
    frame.appendChild(placeholder);
    return frame;
  }
}




/**
 * Creates a Touchpoint (Event) card for displaying an experiment event/step
 * Shows the event name, optional thumbnail, step number, and variant count
 * 
 * Card layout:
 * - Thumbnail: 368×260px placeholder (ready for "Replace with" image)
 * - Header: Event name
 * - Body: Space for event metadata and notes (in v2 flows)
 * 
 * Features:
 * - Supports optional thumbnail from current selection (Frame or Rectangle)
 * - Keeps the header compact by omitting visual badges
 * - Auto-fallback event name if not provided
 * - Card height hugs content (same auto-layout behavior as variant canvas cards)
 * 
 * @param eventName - Display name for the event (e.g., "Purchase Button Click")
 * @param variantCount - Number of variants being tested at this event (currently hidden in the UI)
 * @param eventIndex - Position in event sequence (currently hidden in the UI)
 * @param thumbnailSource - Optional node to clone for the card thumbnail
 * @param thumbnailMessage - Optional placeholder text when no thumbnail is available
 * @param options - Optional touchpoint Figma link row (`showFigmaLink: false` hides even when URL is set)
 * @returns FrameNode containing the complete event card
 * 
 * @example
 * const eventCard = createEventCard('Homepage Load', 3, 0, null, undefined, { figmaLink: 'https://...' });
 * eventCard.x = 100;
 * eventCard.y = 200;
 * figma.currentPage.appendChild(eventCard);
 */
export function createEventCard(
  eventName: string,
  _variantCount?: number,
  _eventIndex?: number,
  thumbnailSource?: SceneNode | null,
  thumbnailMessage?: string,
  options?: { figmaLink?: string; showFigmaLink?: boolean }
): FrameNode {
  const card = figma.createFrame();
  card.layoutMode = 'VERTICAL';
  card.counterAxisSizingMode = 'AUTO';
  card.primaryAxisSizingMode = 'AUTO';
  card.minWidth = 300; // 18.75rem
  card.maxWidth = 400; // 25rem
  // No fixed height: primaryAxisSizingMode AUTO hugs thumbnail + header + optional Figma row (like variant cards)
  card.paddingLeft = 16;
  card.paddingRight = 16;
  card.paddingTop = 16; // 1rem
  card.paddingBottom = 16; // 0.75rem
  card.cornerRadius = 16; // 1rem
  card.fills = [{ type: 'SOLID', color: hexToRgb(TOKENS.fillsSurface) }];
  card.strokes = [{ type: 'SOLID', color: hexToRgb(TOKENS.border) }];
  card.strokeWeight = 1;
  card.effects = [{
    type: 'DROP_SHADOW',
    color: { r: 0, g: 0, b: 0, a: 0.05 },
    offset: { x: 0, y: 1 },
    radius: 2,
    spread: 0,
    visible: true,
    blendMode: 'NORMAL',
  }];
  card.itemSpacing = 8; // 1rem gap
  card.primaryAxisAlignItems = 'MIN';
  card.counterAxisAlignItems = 'MIN';
  // Naming shows up in the Layers panel; use user-facing "Touchpoint" vocabulary.
  card.name = `Touchpoint: ${eventName}`;

  const selection = figma.currentPage.selection;
  
  // Check if user has selected a Frame or Rectangle to use as thumbnail
  // Only use FRAME or RECTANGLE types - ignore TEXT and other node types
  // to prevent accidentally cloning text content (like pasted URLs) into thumbnails
  const selectedNode = selection && selection.length > 0 ? selection[0] : null;
  const isValidThumbnailSource = selectedNode && 
    (selectedNode.type === 'FRAME' || selectedNode.type === 'RECTANGLE');
  const resolvedThumbnailSource = thumbnailSource || (isValidThumbnailSource ? selectedNode : null);
  const thumb = createThumbnailFrame(resolvedThumbnailSource, {
    cornerRadius: TOKENS.radiusMD,
    placeholderMessage: thumbnailMessage,
  });
  card.appendChild(thumb);

  // Group touchpoint name text
  const eventDetailsContainer = figma.createFrame();
  eventDetailsContainer.layoutMode = 'HORIZONTAL';
  eventDetailsContainer.counterAxisSizingMode = 'AUTO';
  eventDetailsContainer.primaryAxisSizingMode = 'FIXED';
  eventDetailsContainer.primaryAxisAlignItems = 'MIN';
  eventDetailsContainer.counterAxisAlignItems = 'CENTER';
  eventDetailsContainer.itemSpacing = 8;
  eventDetailsContainer.fills = [];
  eventDetailsContainer.strokes = [];
  eventDetailsContainer.name = 'Touchpoint Details Container';
  eventDetailsContainer.layoutAlign = 'STRETCH';
  eventDetailsContainer.resize(300 - 32, 32); // Match card width minus padding
  eventDetailsContainer.paddingBottom = 8;
  eventDetailsContainer.paddingTop = 8;

  const eventNameText = figma.createText();
  eventNameText.fontName = getFontStyle("Bold");
  eventNameText.fontSize = TOKENS.fontSizeBodyLg;
  eventNameText.fills = [{ type: 'SOLID', color: hexToRgb(TOKENS.textPrimary) }];
  eventNameText.textAutoResize = 'WIDTH_AND_HEIGHT';
  eventNameText.textAlignHorizontal = 'LEFT';
  eventNameText.layoutGrow = 1;
  // Auto-number fallback: if eventName is empty, use 'Touchpoint <n>'
  // Try to extract a number from the card name if possible
  let fallbackEventNumber = 1;
  // Try to parse an explicit number from the card name (if present)
  const match = card.name.match(/(?:Touchpoint): (\d+)/);
  if (!eventName && match && match[1]) {
    fallbackEventNumber = parseInt(match[1], 10);
  }
  eventNameText.characters = eventName || `Touchpoint ${fallbackEventNumber}`;
  eventNameText.name = 'Touchpoint Name Text';
  eventDetailsContainer.appendChild(eventNameText);

  card.appendChild(eventDetailsContainer);

  const rawFigmaLink = options?.figmaLink;
  const trimmedFigma =
    typeof rawFigmaLink === 'string' && rawFigmaLink.trim().length > 0 ? rawFigmaLink.trim() : '';
  if (trimmedFigma && options?.showFigmaLink !== false) {
    card.appendChild(createOpenInFigmaLinkRow(trimmedFigma));
  }

  return card;
}

import type { Variant } from './types';

/**
 * Creates a Variant card displaying experiment variant details and performance metrics
 * 
 * Card layout:
 * - Header: Variant name + rollout badge
 * - Metrics section: Chipset showing metric values and confidence indicators
 * - Description: Optional variant description text (hidden by default)
 * 
 * Features:
 * - Omits comparison badges while still indicating rollout status
 * - Color-coded border: Purple (2px) for rolled-out variants, standard gray for others
 * - Metrics display with compact chip layout
 * - Auto-height to fit content
 * - Responsive width (400-640px)
 * 
 * @param variant - Variant data object containing: id, name, traffic, status, metrics, etc.
 * @param variantIndex - Position in variant list (used for numbering/display, 0-indexed)
 * @param options - Optional configuration
 * @param options.rolledout - Whether this variant was selected as rolled-out winner (Purple border)
 * @param options.metrics - Available metric definitions from plugin (for rendering metric chips)
 * @param options.showDescription - Whether to display variant description text (default: false)
 * @returns Promise<FrameNode> containing the complete variant card
 * 
 * @example
 * const variantCard = await createVariantCard(
 *   { name: 'CTA Button Red', traffic: 50, metrics: { ctr: 2.5 } },
 *   0,
 *   { rolledout: true, metrics: metricDefs }
 * );
 * figma.currentPage.appendChild(variantCard);
 */
export async function createVariantCard(
  variant: Variant, 
  variantIndex?: number, 
  options?: { 
    rolledout?: boolean;
    metrics?: MetricDefinition[]; // Available metrics from plugin
    thumbnailSource?: SceneNode | null;
    thumbnailMessage?: string;
    /**
     * Whether to render the variant description text on the canvas node.
     * Default: false (hidden) to keep nodes compact.
     */
    showDescription?: boolean;
  }
): Promise<FrameNode> {
  const card = figma.createFrame();
  card.layoutMode = 'VERTICAL';
  card.counterAxisSizingMode = 'AUTO';
  card.primaryAxisSizingMode = 'AUTO';
  card.minWidth = 400; // 25rem
  card.maxWidth = 640; // 40rem
  // Height will hug content automatically with primaryAxisSizingMode = 'AUTO'
  card.paddingLeft = 16;
  card.paddingRight = 16;
  card.paddingTop = 16; // 1rem
  card.paddingBottom = 16; // 0.75rem
  card.cornerRadius = 16; // 1rem
  card.fills = [{ type: 'SOLID', color: hexToRgb(TOKENS.fillsSurface) }];
  // Use green border (2px) if this variant was rolled out - indicates success/shipped
  if (options?.rolledout) {
    card.strokes = [{ type: 'SOLID', color: hexToRgb(TOKENS.electricViolet500) }];
    card.strokeWeight = 2;
  } else {
    card.strokes = [{ type: 'SOLID', color: hexToRgb(TOKENS.border) }];
    card.strokeWeight = 1;
  }
  card.effects = [{
    type: 'DROP_SHADOW',
    color: { r: 0, g: 0, b: 0, a: 0.05 },
    offset: { x: 0, y: 1 },
    radius: 2,
    spread: 0,
    visible: true,
    blendMode: 'NORMAL',
  }];
  card.itemSpacing = 8; // 1rem gap
  card.primaryAxisAlignItems = 'MIN';
  card.counterAxisAlignItems = 'MIN';

  const thumb = createThumbnailFrame(options?.thumbnailSource, {
    cornerRadius: TOKENS.radiusSM,
    placeholderMessage: options?.thumbnailMessage,
  });
  card.appendChild(thumb);

  // Variant details section: name row and traffic
  const variantDetailsContainer = figma.createFrame();
  variantDetailsContainer.layoutMode = 'VERTICAL';
  variantDetailsContainer.counterAxisSizingMode = 'AUTO';
  variantDetailsContainer.primaryAxisSizingMode = 'AUTO';
  variantDetailsContainer.itemSpacing = 8;
  variantDetailsContainer.fills = [];
  variantDetailsContainer.strokes = [];
  variantDetailsContainer.name = 'Variant Details';
  variantDetailsContainer.layoutAlign = 'STRETCH';
  variantDetailsContainer.paddingBottom = 8 ;
  variantDetailsContainer.paddingTop = 8;

  // Radio button + variant name row
  const nameRow = figma.createFrame();
  nameRow.layoutMode = 'HORIZONTAL';
  nameRow.counterAxisSizingMode = 'AUTO';
  nameRow.primaryAxisSizingMode = 'FIXED';
  nameRow.itemSpacing = 6;
  // MIN: left-align like touchpoint cards. (SPACE_BETWEEN with a single child centers the row in Figma.)
  nameRow.primaryAxisAlignItems = 'MIN';
  nameRow.counterAxisAlignItems = 'CENTER';
  nameRow.fills = [];
  nameRow.strokes = [];
  nameRow.name = 'Name Row';
  nameRow.layoutAlign = 'STRETCH';
  nameRow.resize(300 - 32, 16); // Match card width minus padding

  // Left: radio button + variant name
  const nameLeft = figma.createFrame();
  nameLeft.layoutMode = 'HORIZONTAL';
  nameLeft.counterAxisSizingMode = 'AUTO';
  nameLeft.primaryAxisSizingMode = 'AUTO';
  nameLeft.itemSpacing = 6;
  nameLeft.primaryAxisAlignItems = 'MIN';
  nameLeft.counterAxisAlignItems = 'CENTER';
  nameLeft.fills = [];
  nameLeft.strokes = [];
  nameLeft.name = 'Name Left';
  nameLeft.layoutGrow = 1;

  // Radio button indicator (uses variant color)
  const radioButton = figma.createEllipse();
  radioButton.resize(10, 10);
  const variantColor = (variant as Record<string, unknown>).color as string | undefined || TOKENS.royalBlue600;
  radioButton.fills = [{ type: 'SOLID', color: hexToRgb(variantColor) }];
  radioButton.strokes = [];
  radioButton.name = 'Radio Button';
  nameLeft.appendChild(radioButton);

  // Variant name (with fallback logic always applied)
  const variantNameText = figma.createText();
  variantNameText.fontName = getFontStyle("Bold");
  variantNameText.fontSize = TOKENS.fontSizeBodyLg;
  variantNameText.fills = [{ type: 'SOLID', color: hexToRgb(TOKENS.textPrimary) }];
  variantNameText.textAutoResize = 'WIDTH_AND_HEIGHT';
  // Always apply fallback: if name is empty, whitespace, or missing, use 'Variant <index+1>'
  const displayName = (typeof variant.name === 'string' && variant.name.trim().length > 0)
    ? variant.name
    : (variantIndex !== undefined ? `Variant ${variantIndex + 1}` : 'Variant');
  variantNameText.characters = displayName;
  variantNameText.name = 'Variant Name';
  nameLeft.appendChild(variantNameText);
  nameRow.appendChild(nameLeft);

  if (options?.rolledout) {
    const rolledoutBadge = createBadge('Rolled out', 'micro', ROLLED_OUT_BADGE_BG, ROLLED_OUT_BADGE_TEXT, createRolledOutIcon());
    nameRow.appendChild(rolledoutBadge);
  }

  variantDetailsContainer.appendChild(nameRow);

  // Variant description is intentionally hidden on canvas nodes for now.
  // (We keep description in the data model / metadata; just don't render it.)
  if (options?.showDescription) {
    const variantLabel = figma.createText();
    variantLabel.fontName = getFontStyle("Regular");
    variantLabel.fontSize = TOKENS.fontSizeBodyMd;
    variantLabel.fills = [{ type: 'SOLID', color: hexToRgb(TOKENS.textPrimary) }];
    variantLabel.textAutoResize = 'WIDTH_AND_HEIGHT';
    const description = (variant as Record<string, unknown>).description as string | undefined;
    variantLabel.characters = description || '';
    variantLabel.name = 'Variant Label';
    variantDetailsContainer.appendChild(variantLabel);
  }

  card.appendChild(variantDetailsContainer);

  // Figma link row — shows a clickable link to the variant's Figma design (above goals)
  const variantFigmaLink = (variant as Record<string, unknown>).figmaLink as string | undefined;
  if (variantFigmaLink && typeof variantFigmaLink === 'string' && variantFigmaLink.trim().length > 0) {
    card.appendChild(createOpenInFigmaLinkRow(variantFigmaLink));
  }

  // Always show the rule between the variant-link area and Goals (same as when a link row is present).
  const linkGoalsSeparator = figma.createRectangle();
  linkGoalsSeparator.name = 'Variant Link Goals Separator';
  linkGoalsSeparator.resize(268, 1);
  linkGoalsSeparator.layoutAlign = 'STRETCH';
  linkGoalsSeparator.fills = [{ type: 'SOLID', color: hexToRgb(TOKENS.border) }];
  linkGoalsSeparator.strokes = [];
  card.appendChild(linkGoalsSeparator);

  // Metrics section - displays available metrics for this variant (e.g. conversion rate, click-through rate)
  const metricsSection = figma.createFrame();
  metricsSection.layoutMode = 'VERTICAL';
  metricsSection.counterAxisSizingMode = 'AUTO';
  metricsSection.primaryAxisSizingMode = 'AUTO';
  metricsSection.itemSpacing = TOKENS.space8;
  metricsSection.fills = [];
  metricsSection.strokes = [];
  metricsSection.name = 'Goals Section';
  metricsSection.paddingTop = 0;
  metricsSection.layoutAlign = 'STRETCH';

  // Metrics header (label above metrics list)
  const metricsHeader = figma.createText();
  metricsHeader.fontName = getFontStyle("Bold");
  metricsHeader.fontSize = TOKENS.fontSizeBodySm;
  metricsHeader.fills = [{ type: 'SOLID', color: hexToRgb(TOKENS.textPrimary) }];
  metricsHeader.opacity = 0.5;
  metricsHeader.textAutoResize = 'WIDTH_AND_HEIGHT';
  metricsHeader.characters = 'Goals';
  metricsHeader.name = 'Goals Header';
  metricsSection.appendChild(metricsHeader);

  // Format metrics as percentage values (matches UI input formatting).
  // Also auto-migrates saved 0..1 values → 0..100 display.
  const formatMetric = (value: number | undefined): string => {
    if (value === undefined || value === null || !Number.isFinite(value)) return '--';
    const pct = value >= 0 && value <= 1 ? value * 100 : value;
    const fixed = pct.toFixed(2);
    const trimmed = fixed.replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
    return `${trimmed}%`;
  };

  // Create metric text items: metric name (abbreviation): value format
  // Styling matches outcome card table for consistency
  const createMetricItem = (metricName: string, abbreviation: string, value: string): FrameNode => {
    const metricItem = figma.createFrame();
    metricItem.layoutMode = 'HORIZONTAL';
    metricItem.counterAxisSizingMode = 'AUTO';
    metricItem.primaryAxisSizingMode = 'AUTO';
    metricItem.layoutAlign = 'STRETCH'; // Stretch to parent width
    metricItem.primaryAxisAlignItems = 'SPACE_BETWEEN'; // Space between label (left) and value badge (right)
    metricItem.itemSpacing = 8;
    metricItem.fills = [];
    metricItem.strokes = [];
    metricItem.name = `${metricName} Metric Item`;
    metricItem.counterAxisAlignItems = 'CENTER'; // Middle align vertically (center items in the row)
    // metricItem.height = 24; // Removed because .height is read-only for auto layout frames
    
    // Label: metric name (abbreviation):
    const labelText = figma.createText();
    labelText.fontName = getFontStyle("Regular");
    labelText.fontSize = TOKENS.fontSizeBodyMd;
    labelText.fills = [{ type: 'SOLID', color: hexToRgb(TOKENS.textPrimary) }];
    labelText.textAutoResize = 'WIDTH_AND_HEIGHT';
    labelText.characters = `${metricName} (${abbreviation}):`;
    labelText.name = `${metricName} Label`;
    metricItem.appendChild(labelText);
    
    // Value - text only, winner indicated by green color
    const valueContainer = figma.createFrame();
    valueContainer.layoutMode = 'HORIZONTAL';
    valueContainer.counterAxisSizingMode = 'AUTO';
    valueContainer.primaryAxisSizingMode = 'AUTO';
    valueContainer.paddingLeft = 0;
    valueContainer.paddingRight = 0;
    valueContainer.paddingTop = 0;
    valueContainer.paddingBottom = 0;
    valueContainer.fills = []; // Remove badge backgrounds entirely
    valueContainer.strokes = [];
    valueContainer.name = `${metricName} Value`;
    
    const valueText = figma.createText();
    // Consistent styling matching outcome card table
    valueText.fontName = getFontStyle("Medium");
    valueText.fills = [{ type: 'SOLID', color: hexToRgb(TOKENS.textPrimary) }];
    valueText.fontSize = TOKENS.fontSizeBodyMd;
    valueText.textAutoResize = 'WIDTH_AND_HEIGHT';
    valueText.characters = value;
    valueText.name = `${metricName} Value Text`;
    valueContainer.appendChild(valueText);
    metricItem.appendChild(valueContainer);
    
    return metricItem;
  };

  // Display only metrics that are defined in the plugin
  const availableMetrics = options?.metrics || [];
  
  // Generate metric key from abbreviation or name (same logic as UI)
  const getMetricKey = (metric: MetricDefinition): string => {
    if (metric.abbreviation) {
      return metric.abbreviation.toLowerCase();
    }
    return metric.name.replace(/\s+/g, '_').toLowerCase();
  };
  
  // Display each available metric (show all defined metrics, even if no value)
  for (const metric of availableMetrics) {
    if (!metric.name) continue; // Skip metrics without a name
    
    const metricKey = getMetricKey(metric);
    const metricsObj = variant.metrics as Record<string, unknown> | undefined;
    const metricValueRaw = metricsObj?.[metricKey];
    
    // Keep empty values as undefined so we show '--' (node is a summary, not an input).
    const metricValue =
      metricValueRaw !== undefined && metricValueRaw !== null && metricValueRaw !== ''
        ? (typeof metricValueRaw === 'number' ? metricValueRaw : parseFloat(String(metricValueRaw)))
        : undefined;
    
    const metricName = metric.name;
    const abbreviation = metric.abbreviation || metric.name;
    const metricItem = createMetricItem(metricName, abbreviation, formatMetric(metricValue));
    metricsSection.appendChild(metricItem);
  }

  card.appendChild(metricsSection);
  
  // After metrics section is added to card, resize metric items to match section width
  // This ensures they stretch to full width
  if (metricsSection.children.length > 1) { // More than just the header
    const sectionWidth = metricsSection.width;
    for (let i = 1; i < metricsSection.children.length; i++) {
      const metricItem = metricsSection.children[i] as FrameNode;
      if (metricItem.type === 'FRAME') {
        metricItem.resize(sectionWidth, metricItem.height);
      }
    }
  }

  return card;
}

/**
 * Creates a small, compact metric display chip for showing single metric values
 * Used in outcome cards, variant cards, and other metric-heavy layouts
 * 
 * Design:
 * - Horizontal layout with label and value side-by-side
 * - Light background with border
 * - Compact padding and rounded corners (small radius)
 * 
 * @param label - Metric label (e.g., "CTR", "Conv Rate", "RPM")
 * @param value - Numeric value to display
 * @returns FrameNode containing the metric chip (ready to append to parent)
 * 
 * @example
 * const chip = createMetricChip('CTR', 2.5);
 * metricsContainer.appendChild(chip);
 */
export function createMetricChip(label: string, value: number): FrameNode {
  const chip = figma.createFrame();
  chip.layoutMode = 'HORIZONTAL';
  chip.counterAxisSizingMode = 'AUTO';
  chip.primaryAxisSizingMode = 'AUTO';
  chip.paddingLeft = chip.paddingRight = TOKENS.space8;
  chip.paddingTop = chip.paddingBottom = TOKENS.space4 / 2;
  chip.cornerRadius = TOKENS.radiusSM;
  chip.fills = [{ type: 'SOLID', color: hexToRgb(TOKENS.fillsBackground) }];
  chip.strokes = [{ type: 'SOLID', color: hexToRgb(TOKENS.border) }];
  chip.strokeWeight = 1;
  chip.name = 'Metric Chip';
  const txt = figma.createText();
  txt.fontSize = TOKENS.fontSizeBodyLg;
  try {
    txt.fontName = getFontStyle("Bold");
  } catch {
    txt.fontName = getFontStyle("Medium");
  }
  txt.fills = [{ type: 'SOLID', color: hexToRgb(TOKENS.textSecondary) }];
  txt.textAutoResize = 'WIDTH_AND_HEIGHT';
  txt.characters = `${label}: ${value}`;
  chip.appendChild(txt);
  return chip;
}

// Add more node creation functions as needed.
