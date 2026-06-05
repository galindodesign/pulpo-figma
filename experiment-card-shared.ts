import { TOKENS } from "./design-tokens";
import { hexToRgb } from "./layout-utils";

export type ExperimentStatus = "draft" | "running" | "paused" | "completed" | "rolled_out";

export interface ExperimentStatusConfig {
  label: string;
  bgColor: string;
  textColor: string;
}

/** Unified text colors for experiment summary panels (labels, body, bullets). */
export const SUMMARY_TYPOGRAPHY = {
  label: TOKENS.textTertiary,
  body: TOKENS.textPrimary,
  muted: TOKENS.textSecondary,
} as const;

/** Bullet diameter for summary list rows (matches body text color). */
export const SUMMARY_BULLET_PX = 5;

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
  link: { weight: "Medium", size: TOKENS.fontSizeBodySm, color: TOKENS.royalBlue600 },
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
    bgColor: TOKENS.azure50,
    textColor: TOKENS.azure500,
  },
  running: {
    label: "Running",
    bgColor: TOKENS.azure100,
    textColor: TOKENS.azure700,
  },
  paused: {
    label: "Paused",
    bgColor: TOKENS.azure100,
    textColor: TOKENS.azure700,
  },
  completed: {
    label: "Concluded",
    bgColor: TOKENS.azure100,
    textColor: TOKENS.azure700,
  },
  rolled_out: {
    label: "Rolled out",
    bgColor: "#FFF420",
    textColor: TOKENS.textPrimary,
  },
};

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
