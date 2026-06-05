import { TOKENS } from "./design-tokens";
import { hexToRgb, createBadge } from "./layout-utils";

export type ExperimentStatus = "draft" | "running" | "paused" | "completed" | "rolled_out";

export interface ExperimentStatusConfig {
  label: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
}

/** Unified text colors for experiment summary panels (labels, body, bullets). */
export const SUMMARY_TYPOGRAPHY = {
  label: TOKENS.typographyMetaColor,
  body: TOKENS.typographyBodyColor,
  muted: TOKENS.typographyMutedColor,
} as const;

/** Bullet diameter for summary list rows (matches body text color). */
export const SUMMARY_BULLET_PX = 5;

/** Shared spacing and radius for section panels — mirrors design-tokens.css section + radius tokens. */
export const SECTION_PANEL_LAYOUT = {
  /** Gap between section eyebrow and panel below it (--space-8). */
  sectionGap: TOKENS.space8,
  /** Vertical gap between rows/blocks inside a panel (--section-gap). */
  panelItemSpacing: TOKENS.sectionGap,
  /** Gap between label and value within a row (--space-4). */
  rowItemSpacing: TOKENS.space4,
  /** Panel corner radius (--radius-sm). */
  panelCornerRadius: TOKENS.radiusSM,
  /** Panel inset padding (--section-padding). */
  panelPadding: TOKENS.sectionPadding,
} as const;

/**
 * Typography roles for experiment canvas cards (overview, touchpoint, variant, entry/exit).
 * - cardTitle: experiment name on overview card
 * - headline: touchpoint / variant / entry / exit card title
 * - sectionTitle: Summary, Goals and Variants, Outcome summary, table column headers
 * - fieldLabel: Description, Goals, metric names
 * - fieldValue: summary values, metric values, table body cells, notes
 * - link: Open in Figma rows
 */
export type OverviewTextRole =
  | "cardTitle"
  | "headline"
  | "sectionTitle"
  | "fieldLabel"
  | "fieldValue"
  | "body"
  | "bodyMuted"
  | "bodyEmphasis"
  | "caption"
  | "tableHeader"
  | "link";

const OVERVIEW_TEXT_STYLES: Record<
  OverviewTextRole,
  { weight: "Bold" | "Medium" | "Regular"; size: number; color: string }
> = {
  cardTitle: { weight: "Bold", size: 24, color: SUMMARY_TYPOGRAPHY.body },
  headline: { weight: "Bold", size: TOKENS.fontSizeBodyLg, color: SUMMARY_TYPOGRAPHY.body },
  sectionTitle: { weight: "Medium", size: TOKENS.fontSizeLabel, color: SUMMARY_TYPOGRAPHY.label },
  fieldLabel: { weight: "Regular", size: TOKENS.fontSizeLabel, color: SUMMARY_TYPOGRAPHY.label },
  fieldValue: { weight: "Regular", size: TOKENS.fontSizeBodySm, color: SUMMARY_TYPOGRAPHY.body },
  body: { weight: "Regular", size: TOKENS.fontSizeBodyMd, color: SUMMARY_TYPOGRAPHY.body },
  bodyMuted: { weight: "Regular", size: TOKENS.fontSizeBodyMd, color: SUMMARY_TYPOGRAPHY.muted },
  bodyEmphasis: { weight: "Medium", size: TOKENS.fontSizeBodySm, color: SUMMARY_TYPOGRAPHY.body },
  caption: { weight: "Regular", size: TOKENS.fontSizeLabel, color: SUMMARY_TYPOGRAPHY.label },
  tableHeader: { weight: "Medium", size: TOKENS.fontSizeLabel, color: SUMMARY_TYPOGRAPHY.label },
  link: { weight: "Medium", size: TOKENS.fontSizeBodySm, color: TOKENS.typographyLinkColor },
};

/** Apply a consistent overview-card text style to an existing TextNode. */
export function styleOverviewText(text: TextNode, role: OverviewTextRole): void {
  const style = OVERVIEW_TEXT_STYLES[role];
  text.fontName = { family: TOKENS.fontFamily, style: style.weight };
  text.fontSize = style.size;
  text.fills = [{ type: "SOLID", color: hexToRgb(style.color) }];
}

/** Section eyebrow label (Summary, Goals and Variants, Resources, …). */
export function createOverviewSectionTitle(title: string): TextNode {
  const text = figma.createText();
  styleOverviewText(text, "sectionTitle");
  text.textAutoResize = "WIDTH_AND_HEIGHT";
  text.characters = title;
  return text;
}

export const EXPERIMENT_STATUS_STYLES: Record<ExperimentStatus, ExperimentStatusConfig> = {
  draft: {
    label: "Draft",
    bgColor: TOKENS.badgeNeutralBg,
    borderColor: TOKENS.badgeNeutralBorder,
    textColor: TOKENS.azure500,
  },
  running: {
    label: "Running",
    bgColor: TOKENS.badgeNeutralBg,
    borderColor: TOKENS.badgeNeutralBorder,
    textColor: TOKENS.azure700,
  },
  paused: {
    label: "Paused",
    bgColor: TOKENS.badgeNeutralBg,
    borderColor: TOKENS.badgeNeutralBorder,
    textColor: TOKENS.azure700,
  },
  completed: {
    label: "Concluded",
    bgColor: TOKENS.badgeNeutralBg,
    borderColor: TOKENS.badgeNeutralBorder,
    textColor: TOKENS.azure700,
  },
  rolled_out: {
    label: "Rolled out",
    bgColor: TOKENS.badgeRolledOutBg,
    borderColor: TOKENS.badgeRolledOutBorder,
    textColor: TOKENS.badgeRolledOutText,
  },
};

const TROPHY_ICON_SVG = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none">
  <path d="M6 9H4.5a1 1 0 0 1 0-5H6" stroke="${TOKENS.badgeRolledOutText}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M18 9h1.5a1 1 0 0 0 0-5H18" stroke="${TOKENS.badgeRolledOutText}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M4 22h16" stroke="${TOKENS.badgeRolledOutText}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z" stroke="${TOKENS.badgeRolledOutText}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978" stroke="${TOKENS.badgeRolledOutText}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978" stroke="${TOKENS.badgeRolledOutText}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

/** Trophy icon for rolled-out badges on canvas cards. */
export function createRolledOutIcon(): FrameNode {
  const icon = figma.createNodeFromSvg(TROPHY_ICON_SVG);
  icon.name = "Rolled Out Icon";
  icon.resize(TOKENS.badgeRolledOutIconSize, TOKENS.badgeRolledOutIconSize);
  icon.fills = [];
  return icon;
}

/** Rolled-out badge with label + trophy icon (canvas cards). */
export function createRolledOutBadge(): FrameNode {
  const icon = createRolledOutIcon();
  return createBadge(
    "Rolled out",
    "chip",
    TOKENS.badgeRolledOutBg,
    TOKENS.badgeRolledOutText,
    icon,
    TOKENS.badgeRolledOutBorder,
    TOKENS.badgeRolledOutIconSize
  );
}

export function formatDateForDisplay(dateString?: string): string {
  if (!dateString) {
    dateString = new Date().toISOString().split("T")[0];
  }

  try {
    const date = new Date(dateString);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  } catch {
    return dateString;
  }
}

export function getExperimentTypeLabel(type: string): string {
  const labels: { [key: string]: string } = {
    ab_test: "A/B Test",
    multivariate: "Multivariate",
    feature_flag: "Feature Flag",
    holdout: "Holdout",
    rollout: "Rollout",
  };
  return labels[type] || type;
}

const LUCIDE_STAR_FILLED_SVG = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor"/>
</svg>`;

export function createLucideStarFilledIcon(size: number = 12, color: RGB = hexToRgb(TOKENS.azure700)): FrameNode {
  try {
    const svgNode = figma.createNodeFromSvg(LUCIDE_STAR_FILLED_SVG);
    svgNode.name = "Star Icon";

    const updateFillColors = (node: SceneNode) => {
      if (node.type === "VECTOR" || node.type === "ELLIPSE" || node.type === "POLYGON" || node.type === "STAR" || node.type === "RECTANGLE") {
        const fills = node.fills;
        if (Array.isArray(fills) && fills.length > 0) {
          node.fills = [{ type: "SOLID", color }];
        }
      } else if ("children" in node) {
        for (const child of node.children) {
          updateFillColors(child);
        }
      }
    };
    updateFillColors(svgNode);

    svgNode.resize(size, size);
    svgNode.fills = [];

    return svgNode;
  } catch (e) {
    console.error("Failed to create star icon:", e);

    const fallback = figma.createFrame();
    fallback.name = "Star Icon (fallback)";
    fallback.resize(size, size);
    fallback.fills = [];
    return fallback;
  }
}
