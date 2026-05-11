/// <reference types="@figma/plugin-typings" />
import { TOKENS } from "./design-tokens";
import { hexToRgb, getFontStyle, createBadge } from "./layout-utils";
import { loadFonts } from "./load-fonts";
import {
  EXPERIMENT_STATUS_STYLES,
  formatDateForDisplay,
  getExperimentTypeLabel,
} from "./experiment-card-shared";
import type { MetricDefinition } from "./types";

const ROLLED_OUT_BADGE_BG = "#fffbb5";
const ROLLED_OUT_BADGE_TEXT = "#484122";
const TROPHY_ICON_SVG = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none">
  <path d="M6 9H4.5a1 1 0 0 1 0-5H6" stroke="${ROLLED_OUT_BADGE_TEXT}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M18 9h1.5a1 1 0 0 0 0-5H18" stroke="${ROLLED_OUT_BADGE_TEXT}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M4 22h16" stroke="${ROLLED_OUT_BADGE_TEXT}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z" stroke="${ROLLED_OUT_BADGE_TEXT}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978" stroke="${ROLLED_OUT_BADGE_TEXT}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978" stroke="${ROLLED_OUT_BADGE_TEXT}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

function createRolledOutIcon(): FrameNode {
  const icon = figma.createNodeFromSvg(TROPHY_ICON_SVG);
  icon.name = "Rolled Out Icon";
  icon.resize(10, 10);
  icon.fills = [];
  return icon;
}

/**
 * Experiment Metrics Card
 * 
 * Displays experiment outcomes in a table format following growth experiment best practices:
 * - Clear comparison of observed variant performance
 * - Change percentages when an explicit comparison variant is available
 * - Goal-level metric comparison
 * - Rolled out variant indicator
 */

export interface VariantOutcome {
  id: string;
  key: string;           // "A", "B", "C"
  name: string;          // "Blue button", "Red button"
  color?: string;        // Variant dot color
  figmaLink?: string;    // Optional design link for this variant
  isControl?: boolean;   // Optional explicit comparison anchor from older saved data
  traffic: number;       // Traffic allocation percentage
  sampleSize?: number;   // Number of users in this variant
  metrics: {
    [metricKey: string]: {
      value: number;
      uplift?: number;           // % change vs an explicitly selected comparison variant
    };
  };
  isRolledOut?: boolean; // Has been rolled out to production
}

export interface ExperimentOutcomeData {
  experimentName: string;
  experimentType?: string;   // 'ab_test', 'multivariate', etc.
  hypothesis?: string;
  startDate?: string;
  endDate?: string;
  audience?: string;        // Target audience for the experiment
  totalSampleSize?: number;
  status: 'running' | 'completed' | 'paused' | 'draft' | 'rolled_out';
  primaryMetric?: string;  // Key of the primary decision metric
  metrics: MetricDefinition[];
  variants: VariantOutcome[];
  dateCreated?: string; // Date when experiment was created (ISO format, auto-populated if not provided)
}

/**
 * Format metric value with appropriate precision (always decimal)
 */
function isPercentageMetric(metric?: MetricDefinition): boolean {
  if (!metric) return false;
  if (typeof metric.thresholdPct === "number") return true;
  const abbr = (metric.abbreviation || "").toLowerCase();
  if (abbr === "ctr" || abbr === "cr" || abbr === "cvr") return true;
  const metricName = metric.name.toLowerCase();
  return metricName.includes("rate") || metricName.includes("percent") || metricName.includes("%");
}

function normalizeMetricValueForComparison(metric: MetricDefinition | undefined, value: number): number {
  if (!metric || !isPercentageMetric(metric)) return value;
  if (value >= 0 && value <= 1) return value * 100;
  return value;
}

function formatMetricValue(value: number | undefined, metric?: MetricDefinition): string {
  if (value === undefined || value === null) return '--';

  if (isPercentageMetric(metric)) {
    const percentValue = (value >= 0 && value <= 1) ? value * 100 : value;
    return `${percentValue.toFixed(2)}%`;
  }

  if (Math.abs(value) >= 1000) {
    return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  return value.toFixed(2);
}

/**
 * Format uplift value with + or - sign
 */
function formatUplift(uplift: number | undefined): string {
  if (uplift === undefined || uplift === null) return '--';
  const sign = uplift >= 0 ? '+' : '';
  return `${sign}${uplift.toFixed(2)}%`;
}

function formatDelta(uplift: number | undefined): string {
  if (uplift === undefined || uplift === null) return "--";
  const arrow = uplift > 0 ? "↑" : uplift < 0 ? "↓" : "→";
  const sign = uplift >= 0 ? "+" : "";
  return `${arrow} ${sign}${uplift.toFixed(2)}%`;
}

function getGoalPerformance(metric: MetricDefinition | undefined, value: number | undefined): boolean | undefined {
  if (!metric || value === undefined || value === null) return undefined;
  if (typeof metric.thresholdPct !== "number" || !Number.isFinite(metric.thresholdPct)) return undefined;
  if (metric.direction === "neutral") return undefined;
  if (metric.direction === "decrease") return value <= metric.thresholdPct;
  return value >= metric.thresholdPct;
}

type OutcomeState = "recommendation" | "inconclusive" | "running" | "paused" | "rolled_out";

interface OutcomeSummaryContent {
  state: OutcomeState;
  headline: string;
  detail: string;
  facts: string[];
  nextStep: string;
}

function classifyOutcomeState(data: ExperimentOutcomeData): OutcomeSummaryContent {
  const rolledOutVariant = data.variants.find(v => v.isRolledOut);
  const primaryMetric = getPrimaryDecisionMetric(data);
  const leadingVariant = primaryMetric ? getLeadingVariant(data, primaryMetric) : undefined;
  const comparisonVariant = getComparisonVariant(data);
  const primaryFact = primaryMetric && leadingVariant
    ? formatPrimaryMetricFact(primaryMetric, leadingVariant, comparisonVariant)
    : "Primary metric: not set";
  const facts = [
    primaryFact,
    `${data.variants.length} variant${data.variants.length === 1 ? "" : "s"} evaluated`,
  ];

  if (data.totalSampleSize) {
    facts.push(`${data.totalSampleSize.toLocaleString()} users sampled`);
  }

  if (data.status === "running") {
    return {
      state: "running",
      headline: "Keep collecting evidence",
      detail: leadingVariant
        ? `${leadingVariant.name} is currently strongest on the primary metric, but results are still in progress.`
        : "Results are still developing. Use the goal table to watch the primary metric and guardrails before deciding.",
      facts,
      nextStep: "Continue monitoring until the experiment reaches its planned sample size or decision threshold.",
    };
  }

  if (data.status === "paused") {
    return {
      state: "paused",
      headline: "Experiment paused",
      detail: "The current data is preserved, but the experiment is not collecting new evidence.",
      facts,
      nextStep: "Resume to gather more data, or close the experiment with the current learning and rationale.",
    };
  }

  if (data.status === "rolled_out" || rolledOutVariant) {
    const chosenVariant = rolledOutVariant || leadingVariant;
    return {
      state: "rolled_out",
      headline: chosenVariant ? `Decision: ${chosenVariant.name} is live` : "Decision: rollout complete",
      detail: chosenVariant
        ? `${chosenVariant.name} has been moved forward. Use the table above to confirm the primary metric and any guardrail trade-offs.`
        : "A rollout decision has been recorded. Use the table above to confirm the primary metric and any guardrail trade-offs.",
      facts,
      nextStep: "Monitor post-rollout performance and rollback if guardrails regress.",
    };
  }

  if (data.status === "completed" && primaryMetric && leadingVariant) {
    return {
      state: "recommendation",
      headline: `Recommendation: review ${leadingVariant.name}`,
      detail: `${leadingVariant.name} has the strongest observed ${getMetricDisplayName(primaryMetric)} result. Confirm guardrails and qualitative context before rollout.`,
      facts,
      nextStep: "Choose a rollout candidate only if the primary win is strong enough and no guardrails show meaningful regression.",
    };
  }

  return {
    state: "inconclusive",
    headline: "Decision needs more context",
    detail: primaryMetric
      ? "No clear rollout decision has been marked. Compare the primary metric against guardrails before choosing a variant."
      : "Set a primary metric so the outcome card can explain which result should drive the decision.",
    facts,
    nextStep: "Document the decision criteria, then mark the rollout variant when the team has aligned.",
  };
}

/**
 * Get metric key from metric definition
 */
function getMetricKey(metric: MetricDefinition): string {
  if (metric.abbreviation) {
    return metric.abbreviation.toLowerCase();
  }
  return metric.name.replace(/\s+/g, '_').toLowerCase();
}

function getMetricDisplayName(metric: MetricDefinition): string {
  const name = (metric.name || '').trim();
  const abbreviation = (metric.abbreviation || '').trim();
  if (!abbreviation || abbreviation.toLowerCase() === name.toLowerCase()) {
    return name;
  }
  return `${name} (${abbreviation})`;
}

function getPrimaryDecisionMetric(data: ExperimentOutcomeData): MetricDefinition | undefined {
  if (data.primaryMetric) {
    const primaryMetricKey = data.primaryMetric.trim().toLowerCase();
    const matchedMetric = data.metrics.find(metric => (
      metric.id.toLowerCase() === primaryMetricKey ||
      getMetricKey(metric) === primaryMetricKey ||
      metric.name.toLowerCase() === primaryMetricKey ||
      metric.abbreviation?.toLowerCase() === primaryMetricKey
    ));

    if (matchedMetric) {
      return matchedMetric;
    }
  }

  return data.metrics.find(metric => metric.isPrimary) || data.metrics[0];
}

function getComparisonVariant(data: ExperimentOutcomeData): VariantOutcome | undefined {
  return data.variants.find(variant => variant.isControl === true);
}

function getLeadingVariant(data: ExperimentOutcomeData, metric: MetricDefinition): VariantOutcome | undefined {
  if (metric.direction === "neutral") {
    return undefined;
  }

  const metricKey = getMetricKey(metric);
  const variantsWithValue = data.variants.filter(variant => {
    const value = variant.metrics[metricKey]?.value;
    return typeof value === "number" && Number.isFinite(value);
  });

  if (variantsWithValue.length === 0) {
    return undefined;
  }

  return variantsWithValue.reduce((bestVariant, candidateVariant) => {
    const bestValue = bestVariant.metrics[metricKey]?.value ?? 0;
    const candidateValue = candidateVariant.metrics[metricKey]?.value ?? 0;

    if (metric.direction === "decrease") {
      return candidateValue < bestValue ? candidateVariant : bestVariant;
    }

    return candidateValue > bestValue ? candidateVariant : bestVariant;
  });
}

function formatPrimaryMetricFact(
  metric: MetricDefinition,
  variant: VariantOutcome,
  comparisonVariant: VariantOutcome | undefined
): string {
  const metricData = variant.metrics[getMetricKey(metric)];
  const metricValue = formatMetricValue(metricData?.value, metric);
  const changeLabel = comparisonVariant && variant.id !== comparisonVariant.id && metricData?.uplift !== undefined
    ? `, ${formatUplift(metricData.uplift)} change from ${comparisonVariant.name || `Variant ${comparisonVariant.key}`}`
    : "";
  const goalPerformance = getGoalPerformance(metric, metricData?.value);
  const goalLabel = goalPerformance === undefined ? "goal not set" : goalPerformance ? "goal met" : "goal not met";

  return `Primary metric: ${variant.name} at ${metricValue}${changeLabel} (${goalLabel})`;
}

const OUTCOME_SUMMARY_MIN_WIDTH = 728;
const OUTCOME_SUMMARY_HORIZONTAL_PADDING = 16;

function setWrappedText(text: TextNode, characters: string, width: number): void {
  text.textAutoResize = "HEIGHT";
  text.layoutAlign = "STRETCH";
  text.characters = characters;
  text.resize(width, text.height);
}

/**
 * Creates an experiment outcome card displaying metrics results and variant comparisons
 * 
 * Card layout: Three-section vertical design
 * - Header: Experiment name, date, and status badge
 * - Metrics Table: Variant performance metrics with optional change percentages and rolled-out indicators
 * - Summary: Recommendation and decision summary
 * 
 * Features:
 * - Variant performance comparison without requiring a preselected comparison variant
 * - Goal-level performance comparison
 * - Traffic/sample size annotations
 * - Rolled-out indicator badge for variants in production
 * - Status-based styling (running, completed, failed, rolled_out)
 * - Auto-layout with proper spacing and alignment
 * - Minimum dimensions: 792×612px
 * 
 * @param data - Experiment outcome data containing variants, metrics, and status
 * @returns Promise<FrameNode> containing the complete outcome card with metrics table
 * 
 * @example
 * const outcomeCard = await createExperimentOutcomeCard({
 *   experimentName: 'Pricing Page Button Color Experiment',
 *   experimentType: 'ab_test',
 *   status: 'completed',
 *   variants: [
 *     { key: 'A', name: 'Blue button', traffic: 50, metrics: { conversions: 1200 } },
 *     { key: 'B', name: 'Red button', traffic: 50, metrics: { conversions: 1450 }, uplift: 20.8 }
 *   ],
 *   metrics: [
 *     { id: 'conv', name: 'Conversions', isPrimary: true }
 *   ]
 * });
 */
export async function createExperimentOutcomeCard(
  data: ExperimentOutcomeData
): Promise<FrameNode> {
  await loadFonts();

  const card = figma.createFrame();
  card.name = `Experiment Metrics — ${data.experimentName}`;
  card.layoutMode = "VERTICAL";
  card.counterAxisSizingMode = "AUTO";
  card.primaryAxisSizingMode = "AUTO";
  card.itemSpacing = 24;
  card.paddingLeft = card.paddingRight = 32;
  card.paddingTop = card.paddingBottom = 32;
  card.cornerRadius = 24;
  card.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.fillsSurface) }];
  card.strokes = [{ type: "SOLID", color: hexToRgb(TOKENS.border) }];
  card.strokeWeight = 1;
  card.minWidth = 792;
  card.minHeight = 612;

  const sections = await createOutcomeCardSections(data);
  if (sections.headerSection) {
    card.appendChild(sections.headerSection);
  }
  card.appendChild(sections.metricsTable);
  card.appendChild(sections.summarySection);

  return card;
}

export async function createOutcomeCardSections(
  data: ExperimentOutcomeData,
  options?: { includeHeader?: boolean }
): Promise<{ headerSection?: FrameNode; metricsTable: FrameNode; summarySection: FrameNode }> {
  await loadFonts();

  const includeHeader = options?.includeHeader !== false;
  const headerSection = includeHeader ? await createHeaderSection(data) : undefined;
  const metricsTable = await createMetricsTablesSection(data);
  const summarySection = await createSummarySection(data);

  return { headerSection, metricsTable, summarySection };
}

/**
 * Create header section with experiment name, status, and key metrics context
 * Note: Hypothesis is shown in Info Card, not duplicated here
 */
async function createHeaderSection(data: ExperimentOutcomeData): Promise<FrameNode> {
  const section = figma.createFrame();
  section.layoutMode = "VERTICAL";
  section.counterAxisSizingMode = "AUTO";
  section.primaryAxisSizingMode = "AUTO";
  section.itemSpacing = 8;
  section.fills = [];
  section.name = "Header Section";

  // Date created label - auto-populated (above badge row)
  const dateCreated = data.dateCreated || new Date().toISOString().split('T')[0];
  const dateFormatted = formatDateForDisplay(dateCreated);
  const dateLabel = figma.createText();
  dateLabel.fontName = { family: "Figtree", style: "Regular" };
  dateLabel.fontSize = TOKENS.fontSizeLabel;
  dateLabel.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textPrimary), opacity: 0.5 }];
  dateLabel.textAutoResize = "WIDTH_AND_HEIGHT";
  dateLabel.characters = dateFormatted;
  dateLabel.name = "Date Created Label";
  section.appendChild(dateLabel);

  // Status badge - filled for rolled_out (yellow), outlined for others
  const statusConfig = EXPERIMENT_STATUS_STYLES[data.status] || EXPERIMENT_STATUS_STYLES.running;
  const statusStyle = data.status === 'rolled_out' ? 'filled' : 'outlined';
  // For outlined badges, use textColor for stroke to match info-card; for filled, use bgColor
  const strokeOrFillColor = statusStyle === 'outlined' ? statusConfig.textColor : statusConfig.bgColor;
  const statusBadge = createBadge(statusConfig.label, statusStyle, strokeOrFillColor, statusConfig.textColor);
  section.appendChild(statusBadge);

  // Experiment name (Bold, 24px)
  const titleText = figma.createText();
  titleText.fontName = getFontStyle("Bold");
  titleText.fontSize = 24;
  titleText.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textPrimary) }];
  titleText.textAutoResize = "WIDTH_AND_HEIGHT";
  titleText.characters = data.experimentName || 'Untitled Experiment';
  section.appendChild(titleText);

  // Context row: Timeline + Audience + Sample Size (compact metadata line)
  const contextParts: string[] = [];
  
  // Add experiment type
  if (data.experimentType) {
    contextParts.push(getExperimentTypeLabel(data.experimentType));
  }
  
  // Add timeline
  if (data.startDate || data.endDate) {
    const dateRange = [data.startDate, data.endDate].filter(Boolean).join(' → ');
    contextParts.push(dateRange);
  }
  
  // Add audience
  if (data.audience) {
    contextParts.push(data.audience);
  }
  
  // Add sample size
  if (data.totalSampleSize) {
    contextParts.push(`${data.totalSampleSize.toLocaleString()} users`);
  }
  
  // Render context line if we have any parts
  if (contextParts.length > 0) {
    const contextText = figma.createText();
    contextText.fontName = getFontStyle("Regular");
    contextText.fontSize = TOKENS.fontSizeBodySm;
    contextText.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textTertiary) }];
    contextText.textAutoResize = "WIDTH_AND_HEIGHT";
    contextText.characters = contextParts.join('  •  ');
    section.appendChild(contextText);
  }

  return section;
}


/**
 * Create the metrics comparison table
 */
async function createMetricsTablesSection(data: ExperimentOutcomeData): Promise<FrameNode> {
  const section = figma.createFrame();
  section.layoutMode = "VERTICAL";
  section.counterAxisSizingMode = "FIXED";
  section.primaryAxisSizingMode = "AUTO";
  section.layoutAlign = "STRETCH";
  section.itemSpacing = 16;
  section.fills = [];
  section.name = "Metrics Tables";

  const flippedMetricsTable = await createFlippedMetricsTable(data);

  section.appendChild(flippedMetricsTable);

  return section;
}

async function createMetricsTable(data: ExperimentOutcomeData): Promise<FrameNode> {
  const table = figma.createFrame();
  table.layoutMode = "VERTICAL";
  table.counterAxisSizingMode = "FIXED"; // Fixed width to allow stretch
  table.primaryAxisSizingMode = "AUTO"; // Hug height
  table.layoutAlign = "STRETCH"; // Stretch to parent width
  table.itemSpacing = 0;
  table.fills = [];
  table.strokes = [{ type: "SOLID", color: hexToRgb(TOKENS.border) }];
  table.strokeWeight = 1;
  table.cornerRadius = 8;
  table.name = "Metrics Table";

  // Table header row
  const headerRow = await createTableHeaderRow(data, data.variants.length);
  table.appendChild(headerRow);

  // Metric rows - one for each metric
  for (let i = 0; i < data.metrics.length; i++) {
    const metric = data.metrics[i];
    const isLast = i === data.metrics.length - 1;
    const metricRow = await createMetricRow(metric, data.variants, isLast);
    table.appendChild(metricRow);
  }

  return table;
}

async function createFlippedMetricsTable(data: ExperimentOutcomeData): Promise<FrameNode> {
  const table = figma.createFrame();
  table.layoutMode = "VERTICAL";
  table.counterAxisSizingMode = "FIXED";
  table.primaryAxisSizingMode = "AUTO";
  table.layoutAlign = "STRETCH";
  table.itemSpacing = 0;
  table.fills = [];
  table.strokes = [{ type: "SOLID", color: hexToRgb(TOKENS.border) }];
  table.strokeWeight = 1;
  table.cornerRadius = 8;
  table.name = "Metrics Table — Variants as Rows";

  const headerRow = await createFlippedTableHeaderRow(data.metrics);
  table.appendChild(headerRow);

  if (data.variants.length > 0) {
      const comparisonVariant = getComparisonVariant(data);
    for (let i = 0; i < data.variants.length; i++) {
      const variant = data.variants[i];
      const isLast = i === data.variants.length - 1;
      const variantRow = await createVariantMetricRow(
        variant,
        data.metrics,
        comparisonVariant,
        isLast
      );
      table.appendChild(variantRow);
    }
  } else {
    const emptyRow = await createEmptyVariantMetricRow(data.metrics);
    table.appendChild(emptyRow);
  }

  return table;
}

/**
 * Create table header row with Goal and variant names (in variant order)
 */
async function createTableHeaderRow(data: ExperimentOutcomeData, variantCount: number): Promise<FrameNode> {
  const row = figma.createFrame();
  row.layoutMode = "HORIZONTAL";
  row.counterAxisSizingMode = "FIXED"; // Fixed height
  row.primaryAxisSizingMode = "FIXED"; // Fixed width to stretch
  row.layoutAlign = "STRETCH"; // Stretch to parent width
  row.counterAxisAlignItems = "CENTER";
  row.minHeight = 40;
  row.resize(row.width, 40);
  row.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.fillsSurface) }];
  row.strokes = [{ type: "SOLID", color: hexToRgb(TOKENS.border) }];
  row.strokeWeight = 1;
  row.strokeTopWeight = 0;
  row.strokeLeftWeight = 0;
  row.strokeRightWeight = 0;
  row.name = "Header Row";

  // First column: Metric label (fixed width)
  const metricHeader = createTableCell('Key Metric', 140, true, false);
  metricHeader.layoutGrow = 0; // Don't grow
  metricHeader.minWidth = 200;
  row.appendChild(metricHeader);

  // Second column: Goal label (fixed width)
  const goalHeader = createTableCell('Goal', 100, true, true);
  goalHeader.layoutGrow = 0; // Don't grow
  goalHeader.minWidth = 100;
  row.appendChild(goalHeader);

  // Variant headers: render in the SAME order as provided (do not move columns around).
  // Render headers in the same order as provided.
  if (data.variants.length > 0) {
    for (const variant of data.variants) {
      const variantHeader = createVariantHeaderCell(variant);
      variantHeader.layoutGrow = 1; // Grow to fill available space
      variantHeader.minWidth = 80;
      row.appendChild(variantHeader);
    }
  } else {
    // No variants at all - show a generic "Variant" column name
    const variantHeader = createTableCell('Variant', 100, true, true);
    variantHeader.layoutGrow = 1; // Grow to fill available space (flexible)
    variantHeader.minWidth = 80;
    row.appendChild(variantHeader);
  }

  return row;
}

async function createFlippedTableHeaderRow(metrics: MetricDefinition[]): Promise<FrameNode> {
  const row = figma.createFrame();
  row.layoutMode = "HORIZONTAL";
  row.counterAxisSizingMode = "AUTO";
  row.primaryAxisSizingMode = "FIXED";
  row.layoutAlign = "STRETCH";
  row.counterAxisAlignItems = "MIN";
  row.minHeight = 48;
  row.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.fillsSurface) }];
  row.strokes = [{ type: "SOLID", color: hexToRgb(TOKENS.border) }];
  row.strokeWeight = 1;
  row.strokeTopWeight = 0;
  row.strokeLeftWeight = 0;
  row.strokeRightWeight = 0;
  row.name = "Flipped Header Row";

  const variantHeader = createTableCell('Variant', 200, true, false);
  variantHeader.layoutGrow = 0;
  variantHeader.layoutAlign = "STRETCH";
  row.appendChild(variantHeader);

  if (metrics.length > 0) {
    for (const metric of metrics) {
      const metricHeader = createFlippedMetricHeaderCell(metric);
      metricHeader.layoutGrow = 1;
      metricHeader.layoutAlign = "STRETCH";
      row.appendChild(metricHeader);
    }
  } else {
    const metricHeader = createTableCell('Metric', 120, true, true);
    metricHeader.layoutGrow = 1;
    metricHeader.layoutAlign = "STRETCH";
    row.appendChild(metricHeader);
  }

  return row;
}

/**
 * Create a variant header cell with name
 */
function createVariantHeaderCell(variant: VariantOutcome): FrameNode {
  const variantName = variant.name || `Variant ${variant.key}`;

  const cell = figma.createFrame();
  cell.layoutMode = "HORIZONTAL";
  cell.counterAxisSizingMode = "FIXED"; // Fixed height
  cell.primaryAxisSizingMode = "FIXED"; // Fixed width (will be overridden by layoutGrow)
  cell.layoutAlign = "STRETCH";
  cell.minWidth = 80;
  cell.resize(100, 40);
  cell.counterAxisAlignItems = "CENTER";
  cell.primaryAxisAlignItems = "CENTER";
  cell.itemSpacing = 6;
  cell.paddingLeft = 12;
  cell.paddingRight = 8;
  cell.fills = [];
  cell.name = `Variant Header: ${variantName}`;

  // Variant name
  const nameText = figma.createText();
  nameText.fontName = getFontStyle("Medium");
  nameText.fontSize = TOKENS.fontSizeBodySm;
  nameText.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textSecondary) }];
  nameText.textAutoResize = "WIDTH_AND_HEIGHT";
  nameText.characters = variantName;
  cell.appendChild(nameText);

  return cell;
}

function createFlippedMetricHeaderCell(metric: MetricDefinition): FrameNode {
  const cell = figma.createFrame();
  cell.layoutMode = "VERTICAL";
  cell.counterAxisSizingMode = "AUTO";
  cell.primaryAxisSizingMode = "FIXED";
  cell.layoutAlign = "STRETCH";
  cell.minWidth = 120;
  cell.resize(120, 48);
  cell.counterAxisAlignItems = "CENTER";
  cell.primaryAxisAlignItems = "CENTER";
  cell.itemSpacing = 2;
  cell.paddingTop = 8;
  cell.paddingBottom = 8;
  cell.paddingLeft = cell.paddingRight = 8;
  cell.fills = [];
  cell.name = `Metric Header: ${metric.name}`;

  const metricText = figma.createText();
  metricText.fontName = getFontStyle("Medium");
  metricText.fontSize = TOKENS.fontSizeBodySm;
  metricText.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textSecondary) }];
  metricText.textAlignHorizontal = "CENTER";
  metricText.characters = getMetricDisplayName(metric);
  metricText.textAutoResize = "HEIGHT";
  metricText.layoutAlign = "STRETCH";
  cell.appendChild(metricText);

  const goalLabel = getGoalLabel(metric);
  if (goalLabel !== '--') {
    const goalText = figma.createText();
    goalText.fontName = getFontStyle("Regular");
    goalText.fontSize = TOKENS.fontSizeLabel;
    goalText.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textTertiary) }];
    goalText.textAlignHorizontal = "CENTER";
    goalText.characters = goalLabel;
    goalText.textAutoResize = "HEIGHT";
    goalText.layoutAlign = "STRETCH";
    cell.appendChild(goalText);
  }

  return cell;
}

function getGoalLabel(metric: MetricDefinition): string {
  if (typeof metric.thresholdPct === 'number' && Number.isFinite(metric.thresholdPct)) {
    return `${getGoalDirectionArrow(metric)} ${metric.thresholdPct}%`;
  }
  if (metric.min !== undefined && metric.max !== undefined) {
    return `${metric.min} - ${metric.max}`;
  }
  return '--';
}

function getGoalDirectionArrow(metric: MetricDefinition): string {
  if (metric.direction === 'decrease') return '↓';
  if (metric.direction === 'neutral') return '→';
  return '↑';
}

/**
 * Create a goal cell showing the target percent (preferred) or legacy range (min-max)
 */
function createGoalCell(metric: MetricDefinition): FrameNode {
  const cell = figma.createFrame();
  cell.layoutMode = "VERTICAL";
  cell.counterAxisSizingMode = "FIXED"; // Fixed height
  cell.primaryAxisSizingMode = "FIXED"; // Fixed width
  cell.layoutAlign = "STRETCH";
  cell.minWidth = 80; 
  cell.resize(100, 48);
  cell.counterAxisAlignItems = "CENTER";
  cell.primaryAxisAlignItems = "CENTER";
  cell.itemSpacing = 2;
  cell.paddingLeft = cell.paddingRight = 8;
  cell.fills = [];
  cell.name = "Goal Cell";

  if (typeof metric.thresholdPct === 'number' && Number.isFinite(metric.thresholdPct)) {
    const goalText = figma.createText();
    goalText.fontName = getFontStyle("Medium");
    goalText.fontSize = TOKENS.fontSizeBodyMd;
    goalText.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textPrimary) }];
    goalText.textAutoResize = "WIDTH_AND_HEIGHT";
    goalText.textAlignHorizontal = "CENTER";
    goalText.characters = `${getGoalDirectionArrow(metric)} ${metric.thresholdPct}%`;
    cell.appendChild(goalText);
  } else if (metric.min !== undefined && metric.max !== undefined) {
    const goalText = figma.createText();
    goalText.fontName = getFontStyle("Medium");
    goalText.fontSize = TOKENS.fontSizeBodyMd;
    goalText.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textPrimary) }];
    goalText.textAutoResize = "WIDTH_AND_HEIGHT";
    goalText.textAlignHorizontal = "CENTER";
    goalText.characters = `${metric.min} - ${metric.max}`;
    cell.appendChild(goalText);
  } else {
    const noGoalText = figma.createText();
    noGoalText.fontName = getFontStyle("Regular");
    noGoalText.fontSize = TOKENS.fontSizeLabel;
    noGoalText.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textTertiary) }];
    noGoalText.textAutoResize = "WIDTH_AND_HEIGHT";
    noGoalText.textAlignHorizontal = "CENTER";
    noGoalText.characters = '--';
    cell.appendChild(noGoalText);
  }

  return cell;
}

/**
 * Create a comparison cell showing just the comparison variant value.
 * Name is shown in the header, so we don't repeat it here.
 */
function createComparisonCell(
  metricData: VariantOutcome['metrics'][string] | undefined,
  variant: VariantOutcome
): FrameNode {
  const cell = figma.createFrame();
  cell.layoutMode = "VERTICAL";
  cell.counterAxisSizingMode = "FIXED"; // Fixed height
  cell.primaryAxisSizingMode = "FIXED"; // Fixed width
  cell.layoutAlign = "STRETCH";
  cell.minWidth = 80;
  cell.resize(100, 48);
  cell.counterAxisAlignItems = "CENTER";
  cell.primaryAxisAlignItems = "CENTER";
  cell.itemSpacing = 2;
  cell.paddingLeft = cell.paddingRight = 8;
  cell.fills = [];
  cell.name = "Comparison Cell";

  // Main value only (name and badge are in header)
  const valueText = figma.createText();
  valueText.fontName = getFontStyle("Medium");
  valueText.fontSize = TOKENS.fontSizeBodyMd;
  valueText.textAutoResize = "WIDTH_AND_HEIGHT";
  valueText.textAlignHorizontal = "CENTER";
  
  const value = metricData?.value;
  valueText.characters = formatMetricValue(value);
  valueText.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textPrimary) }];
  cell.appendChild(valueText);

  return cell;
}

/**
 * Create a metric row with values for all variants
 */
async function createMetricRow(
  metric: MetricDefinition,
  variants: VariantOutcome[],
  isLast: boolean = false
): Promise<FrameNode> {
  const row = figma.createFrame();
  row.layoutMode = "HORIZONTAL";
  row.counterAxisSizingMode = "FIXED"; // Fixed height
  row.primaryAxisSizingMode = "FIXED"; // Fixed width to stretch
  row.layoutAlign = "STRETCH"; // Stretch to parent width
  row.counterAxisAlignItems = "CENTER";
  row.minHeight = 48;
  row.resize(row.width, 48);
  row.fills = [];
  
  if (!isLast) {
    row.strokes = [{ type: "SOLID", color: hexToRgb(TOKENS.border) }];
    row.strokeWeight = 1;
    row.strokeTopWeight = 0;
    row.strokeLeftWeight = 0;
    row.strokeRightWeight = 0;
  }
  
  row.name = `Row: ${metric.name}`;

  const metricKey = getMetricKey(metric);
  // Metric name cell (fixed width)
  const metricCell = createMetricNameCell(metric);
  metricCell.layoutGrow = 0; // Don't grow
  row.appendChild(metricCell);

  // Goal cell (fixed width) - shows min-max range
  const goalCell = createGoalCell(metric);
  goalCell.layoutGrow = 0; // Don't grow
  row.appendChild(goalCell);

  // Render variant value cells in the SAME order as provided.
  // Treat an explicitly selected comparison variant as the "no-change" column,
  // but do not invent one when the experiment did not define it.
  const comparisonVariant = variants.find(v => v.isControl === true);

  if (variants.length > 0) {
    for (const variant of variants) {
      const metricData = variant.metrics[metricKey];
      const isComparison = !!comparisonVariant && variant.id === comparisonVariant.id;
      const valueCell = createMetricValueCell(metricData, isComparison, metric);
      valueCell.layoutGrow = 1; // Grow to fill available space
      row.appendChild(valueCell);
    }
  } else {
    // No variants at all - still render one placeholder value cell to match header.
    const emptyValueCell = createMetricValueCell(undefined, true, metric);
    emptyValueCell.layoutGrow = 1;
    row.appendChild(emptyValueCell);
  }

  return row;
}

async function createVariantMetricRow(
  variant: VariantOutcome,
  metrics: MetricDefinition[],
  comparisonVariant: VariantOutcome | undefined,
  isLast: boolean = false
): Promise<FrameNode> {
  const row = figma.createFrame();
  row.layoutMode = "HORIZONTAL";
  row.counterAxisSizingMode = "FIXED";
  row.primaryAxisSizingMode = "FIXED";
  row.layoutAlign = "STRETCH";
  row.counterAxisAlignItems = "CENTER";
  row.minHeight = 48;
  row.resize(row.width, 48);
  row.fills = [];

  if (!isLast) {
    row.strokes = [{ type: "SOLID", color: hexToRgb(TOKENS.border) }];
    row.strokeWeight = 1;
    row.strokeTopWeight = 0;
    row.strokeLeftWeight = 0;
    row.strokeRightWeight = 0;
  }

  row.name = `Variant Row: ${variant.name || variant.key}`;

  const variantCell = createVariantNameCell(variant);
  variantCell.layoutGrow = 0;
  row.appendChild(variantCell);

  if (metrics.length > 0) {
    for (const metric of metrics) {
      const metricKey = getMetricKey(metric);
      const metricData = variant.metrics[metricKey];
      const isComparison = !!comparisonVariant && variant.id === comparisonVariant.id;
      const valueCell = createMetricValueCell(metricData, isComparison, metric);
      valueCell.layoutGrow = 1;
      row.appendChild(valueCell);
    }
  } else {
    const emptyValueCell = createMetricValueCell(undefined, true);
    emptyValueCell.layoutGrow = 1;
    row.appendChild(emptyValueCell);
  }

  return row;
}

async function createEmptyVariantMetricRow(metrics: MetricDefinition[]): Promise<FrameNode> {
  const row = figma.createFrame();
  row.layoutMode = "HORIZONTAL";
  row.counterAxisSizingMode = "FIXED";
  row.primaryAxisSizingMode = "FIXED";
  row.layoutAlign = "STRETCH";
  row.counterAxisAlignItems = "CENTER";
  row.minHeight = 48;
  row.resize(row.width, 48);
  row.fills = [];
  row.name = "Variant Row: Empty";

  const variantCell = createTableCell('--', 200, false, false);
  variantCell.layoutGrow = 0;
  row.appendChild(variantCell);

  const columnCount = Math.max(metrics.length, 1);
  for (let i = 0; i < columnCount; i++) {
    const emptyValueCell = createMetricValueCell(undefined, true, metrics[i]);
    emptyValueCell.layoutGrow = 1;
    row.appendChild(emptyValueCell);
  }

  return row;
}

function createVariantNameCell(variant: VariantOutcome): FrameNode {
  const cell = figma.createFrame();
  cell.layoutMode = "VERTICAL";
  cell.counterAxisSizingMode = "FIXED";
  cell.primaryAxisSizingMode = "FIXED";
  cell.layoutAlign = "STRETCH";
  cell.minWidth = 200;
  cell.resize(200, 48);
  cell.counterAxisAlignItems = "MIN";
  cell.primaryAxisAlignItems = "CENTER";
  cell.itemSpacing = 2;
  cell.paddingLeft = 12;
  cell.paddingRight = 8;
  cell.fills = [];
  cell.name = "Variant Cell";

  const nameRow = figma.createFrame();
  nameRow.layoutMode = "HORIZONTAL";
  nameRow.counterAxisSizingMode = "AUTO";
  nameRow.primaryAxisSizingMode = "AUTO";
  nameRow.itemSpacing = 8;
  nameRow.counterAxisAlignItems = "CENTER";
  nameRow.fills = [];
  nameRow.name = "Variant Name Row";

  const colorDot = figma.createEllipse();
  colorDot.resize(8, 8);
  const variantColor = variant.color || TOKENS.royalBlue600;
  colorDot.fills = [{ type: "SOLID", color: hexToRgb(variantColor) }];
  nameRow.appendChild(colorDot);

  const variantName = variant.name || `Variant ${variant.key}`;
  const nameText = figma.createText();
  nameText.fontName = { family: "Figtree", style: "Regular" };
  nameText.fontSize = TOKENS.fontSizeBodySm;
  nameText.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textPrimary) }];
  nameText.textAutoResize = "WIDTH_AND_HEIGHT";
  nameText.characters = variantName;
  nameRow.appendChild(nameText);

  if (variant.isRolledOut) {
    const rolledOutBadge = createBadge('Rolled Out', 'micro', ROLLED_OUT_BADGE_BG, ROLLED_OUT_BADGE_TEXT, createRolledOutIcon());
    nameRow.appendChild(rolledOutBadge);
  }

  cell.appendChild(nameRow);

  if (variant.figmaLink) {
    const linkText = figma.createText();
    linkText.fontName = getFontStyle("Medium");
    linkText.fontSize = TOKENS.fontSizeLabel;
    linkText.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.royalBlue600) }];
    linkText.textAutoResize = "WIDTH_AND_HEIGHT";
    linkText.characters = "Open in Figma";
    linkText.hyperlink = { type: "URL", value: variant.figmaLink.trim() };
    cell.appendChild(linkText);
  }

  return cell;
}

/**
 * Create the metric name cell
 */
function createMetricNameCell(metric: MetricDefinition): FrameNode {
  const cell = figma.createFrame();
  cell.layoutMode = "VERTICAL";
  cell.counterAxisSizingMode = "FIXED"; // Fixed width
  cell.primaryAxisSizingMode = "FIXED"; // Fixed height
  cell.layoutAlign = "STRETCH";
  cell.minWidth = 200;
  cell.resize(140, 48);
  cell.counterAxisAlignItems = "MIN";
  cell.primaryAxisAlignItems = "CENTER";
  cell.itemSpacing = 2;
  cell.paddingLeft = 12;
  cell.paddingRight = 8;
  cell.fills = [];
  cell.name = `Metric Cell`;

  // Metric name
  const nameRow = figma.createFrame();
  nameRow.layoutMode = "HORIZONTAL";
  nameRow.counterAxisSizingMode = "AUTO";
  nameRow.primaryAxisSizingMode = "AUTO";
  nameRow.itemSpacing = 4;
  nameRow.counterAxisAlignItems = "CENTER";
  nameRow.fills = [];
  nameRow.name = "Name Row";

  const nameText = figma.createText();
  nameText.fontName = getFontStyle("Regular");
  nameText.fontSize = TOKENS.fontSizeBodySm;
  nameText.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textPrimary) }];
  nameText.textAutoResize = "WIDTH_AND_HEIGHT";
  nameText.characters = metric.name;
  nameRow.appendChild(nameText);

  cell.appendChild(nameRow);

  // Sub-info row: abbreviation only (range moved to value cell)
  const hasAbbrev = metric.abbreviation && metric.abbreviation !== metric.name;

  if (hasAbbrev) {
    const subText = figma.createText();
    subText.fontName = getFontStyle("Regular");
    subText.fontSize = TOKENS.fontSizeLabel;
    subText.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textTertiary) }];
    subText.textAutoResize = "WIDTH_AND_HEIGHT";
    subText.characters = metric.abbreviation!;
    cell.appendChild(subText);
  }

  return cell;
}

/**
 * Create a metric value cell with uplift indicator
 */
function createMetricValueCell(
  metricData: VariantOutcome['metrics'][string] | undefined,
  isComparisonVariant: boolean = false,
  metric?: MetricDefinition
): FrameNode {
  const cell = figma.createFrame();
  cell.layoutMode = "VERTICAL";
  cell.counterAxisSizingMode = "FIXED"; // Fixed height
  cell.primaryAxisSizingMode = "FIXED"; // Fixed width (will be overridden by layoutGrow)
  cell.layoutAlign = "STRETCH";
  cell.minWidth = 80;
  cell.resize(100, 48);
  cell.counterAxisAlignItems = "CENTER";
  cell.primaryAxisAlignItems = "CENTER";
  cell.itemSpacing = 2;
  cell.paddingLeft = cell.paddingRight = 8;
  
  const value = metricData?.value;
  const goalPerformance = getGoalPerformance(metric, value);

  // Add light background color based on metric goal performance or available change.
  if (!isComparisonVariant && metricData?.uplift !== undefined) {
    const isPositive = metricData.uplift >= 0;
    cell.fills = [{ type: "SOLID", color: hexToRgb(isPositive ? TOKENS.malachite50 : TOKENS.coralRed50) }];
  } else if (goalPerformance !== undefined) {
    cell.fills = [{ type: "SOLID", color: hexToRgb(goalPerformance ? TOKENS.malachite50 : TOKENS.coralRed50) }];
  } else {
    cell.fills = [];
  }
  cell.name = "Value Cell";

  // Main value
  const valueText = figma.createText();
  valueText.fontName = getFontStyle("Medium");
  valueText.fontSize = TOKENS.fontSizeBodyMd;
  valueText.textAutoResize = "WIDTH_AND_HEIGHT";
  valueText.textAlignHorizontal = "CENTER";
  
  valueText.characters = formatMetricValue(value, metric);
  valueText.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textPrimary) }];
  cell.appendChild(valueText);

  // Delta row (only shown when change is available from an explicit comparison variant)
  const showVariantDelta = !isComparisonVariant && metricData?.uplift !== undefined;
  if (showVariantDelta) {
    const upliftRow = figma.createFrame();
    upliftRow.layoutMode = "HORIZONTAL";
    upliftRow.counterAxisSizingMode = "AUTO";
    upliftRow.primaryAxisSizingMode = "AUTO";
    upliftRow.itemSpacing = 4;
    upliftRow.counterAxisAlignItems = "CENTER";
    upliftRow.fills = [];
    upliftRow.name = "Uplift Row";

    // Uplift value with color based on direction
    const uplift = showVariantDelta ? metricData!.uplift : 0;
    let upliftColor = TOKENS.textTertiary;
    if (showVariantDelta) {
      const isPositive = uplift! >= 0;
      upliftColor = isPositive ? TOKENS.malachite600 : TOKENS.coralRed500;
    }
    
    const upliftText = figma.createText();
    upliftText.fontName = getFontStyle("Medium");
    upliftText.fontSize = TOKENS.fontSizeLabel;
    upliftText.fills = [{ type: "SOLID", color: hexToRgb(upliftColor) }];
    upliftText.textAutoResize = "WIDTH_AND_HEIGHT";
    upliftText.characters = formatDelta(uplift);
    upliftRow.appendChild(upliftText);

    cell.appendChild(upliftRow);
  }

  return cell;
}

/**
 * Create a simple table cell
 */
function createTableCell(
  content: string,
  width: number,
  isHeader: boolean = false,
  alignCenter: boolean = true
): FrameNode {
  const cell = figma.createFrame();
  cell.layoutMode = "HORIZONTAL";
  cell.counterAxisSizingMode = "FIXED"; // Fixed height
  cell.primaryAxisSizingMode = "FIXED"; // Fixed width
  cell.resize(width, 40);
  cell.minWidth = width;
  cell.counterAxisAlignItems = "CENTER";
  cell.primaryAxisAlignItems = alignCenter ? "CENTER" : "MIN";
  cell.paddingLeft = 12;
  cell.paddingRight = 8;
  cell.fills = [];
  cell.name = `Cell: ${content}`;

  const text = figma.createText();
  text.fontName = getFontStyle(isHeader ? "Medium" : "Regular");
  text.fontSize = TOKENS.fontSizeBodySm;
  text.fills = [{ type: "SOLID", color: hexToRgb(isHeader ? TOKENS.textSecondary : TOKENS.textPrimary) }];
  text.textAutoResize = "WIDTH_AND_HEIGHT";
  text.characters = content;
  cell.appendChild(text);

  return cell;
}

/**
 * Create summary/recommendation section
 */
async function createSummarySection(data: ExperimentOutcomeData): Promise<FrameNode> {
  const section = figma.createFrame();
  section.layoutMode = "VERTICAL";
  section.counterAxisSizingMode = "FIXED";
  section.primaryAxisSizingMode = "AUTO";
  section.itemSpacing = 10;
  section.paddingTop = section.paddingBottom = 16;
  section.paddingLeft = section.paddingRight = OUTCOME_SUMMARY_HORIZONTAL_PADDING;
  section.cornerRadius = 12;
  section.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.azure50) }];
  section.strokes = [{ type: "SOLID", color: hexToRgb(TOKENS.azure100) }];
  section.strokeWeight = 1;
  section.name = "Outcome Summary Section";
  section.layoutAlign = "STRETCH";
  section.minWidth = OUTCOME_SUMMARY_MIN_WIDTH;

  const contentWidth = OUTCOME_SUMMARY_MIN_WIDTH - (OUTCOME_SUMMARY_HORIZONTAL_PADDING * 2);

  const outcome = classifyOutcomeState(data);

  const stateColors: Record<OutcomeState, string> = {
    recommendation: TOKENS.royalBlue700,
    inconclusive: TOKENS.azure600,
    running: TOKENS.royalBlue700,
    paused: TOKENS.yellow700,
    rolled_out: TOKENS.malachite700,
  };

  const headerRow = figma.createFrame();
  headerRow.layoutMode = "HORIZONTAL";
  headerRow.counterAxisSizingMode = "AUTO";
  headerRow.primaryAxisSizingMode = "AUTO";
  headerRow.counterAxisAlignItems = "CENTER";
  headerRow.itemSpacing = 8;
  headerRow.fills = [];
  headerRow.name = "Outcome Summary Header";

  const headerText = figma.createText();
  headerText.fontName = getFontStyle("Medium");
  headerText.fontSize = TOKENS.fontSizeLabel;
  headerText.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textTertiary) }];
  headerText.textAutoResize = "WIDTH_AND_HEIGHT";
  headerText.characters = "Outcome summary";
  headerRow.appendChild(headerText);

  const stateBadge = createBadge(
    outcome.state === "rolled_out" ? "Decision" : outcome.state === "running" ? "Live read" : "Guidance",
    "micro",
    TOKENS.fillsSurface,
    stateColors[outcome.state]
  );
  headerRow.appendChild(stateBadge);
  section.appendChild(headerRow);

  const headlineText = figma.createText();
  headlineText.fontName = getFontStyle("Bold");
  headlineText.fontSize = TOKENS.fontSizeBodyLg;
  headlineText.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textPrimary) }];
  setWrappedText(headlineText, outcome.headline, contentWidth);
  section.appendChild(headlineText);

  const outcomeDetail = figma.createText();
  outcomeDetail.fontName = getFontStyle("Regular");
  outcomeDetail.fontSize = TOKENS.fontSizeBodyMd;
  outcomeDetail.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textSecondary) }];
  setWrappedText(outcomeDetail, outcome.detail, contentWidth);
  section.appendChild(outcomeDetail);

  const factsFrame = figma.createFrame();
  factsFrame.layoutMode = "VERTICAL";
  factsFrame.counterAxisSizingMode = "FIXED";
  factsFrame.primaryAxisSizingMode = "AUTO";
  factsFrame.layoutAlign = "STRETCH";
  factsFrame.minWidth = contentWidth;
  factsFrame.itemSpacing = 4;
  factsFrame.fills = [];
  factsFrame.name = "Outcome Evidence";

  for (const fact of outcome.facts) {
    factsFrame.appendChild(createSummaryFactRow(fact, stateColors[outcome.state], contentWidth));
  }
  section.appendChild(factsFrame);

  const nextStepText = figma.createText();
  nextStepText.fontName = getFontStyle("Medium");
  nextStepText.fontSize = TOKENS.fontSizeBodySm;
  nextStepText.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textPrimary) }];
  setWrappedText(nextStepText, `Next step: ${outcome.nextStep}`, contentWidth);
  section.appendChild(nextStepText);

  return section;
}

function createSummaryFactRow(fact: string, accentColor: string, width: number): FrameNode {
  const row = figma.createFrame();
  row.layoutMode = "HORIZONTAL";
  row.counterAxisSizingMode = "AUTO";
  row.primaryAxisSizingMode = "FIXED";
  row.layoutAlign = "STRETCH";
  row.counterAxisAlignItems = "CENTER";
  row.itemSpacing = 6;
  row.fills = [];
  row.name = "Outcome Evidence Row";
  row.minWidth = width;

  const dot = figma.createEllipse();
  dot.resize(5, 5);
  dot.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textTertiary) }];
  row.appendChild(dot);

  const factText = figma.createText();
  factText.fontName = getFontStyle("Regular");
  factText.fontSize = TOKENS.fontSizeBodySm;
  factText.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textTertiary) }];
  setWrappedText(factText, fact, width - 11);
  row.appendChild(factText);

  return row;
}


/**
 * Convenience function to create an outcome card from experiment info card data
 * 
 * Bridges the data structure used in experiment-info-card with the outcome card format.
 * Automatically:
 * - Uses an explicit comparison variant only when saved data provides one
 * - Calculates change percentages for each metric when that comparison exists
 * - Converts metric definitions to outcome format
 * - Handles missing data gracefully with defaults
 * 
 * @param experimentName - Title of the experiment
 * @param metrics - Array of metric definitions used in the experiment
 * @param variants - Array of variant results with traffic and metric values
 * @param options - Optional experiment metadata (hypothesis, type, dates, status, etc.)
 * @returns Promise<FrameNode> containing the outcome card with calculated metrics
 * 
 * @example
 * const outcomeCard = await createOutcomeCardFromExperimentData(
 *   'Pricing Page Button Color Experiment',
 *   [{ id: 'conv', name: 'Conversions', isPrimary: true }],
 *   [
 *     { key: 'A', name: 'Blue button', traffic: 50, metrics: { conversions: 100 } },
 *     { key: 'B', name: 'Red button', traffic: 50, metrics: { conversions: 120 } }
 *   ],
 *   { status: 'completed' }
 * );
 */
export async function createOutcomeCardFromExperimentData(
  experimentName: string,
  metrics: MetricDefinition[],
  variants: Array<{
    id?: string;
    key: string;
    name: string;
    color?: string;
    figmaLink?: string;
    isControl?: boolean;
    traffic: number;
    status?: string;
    metrics?: { [key: string]: number };
    isRolledOut?: boolean;
  }>,
  options?: {
    hypothesis?: string;
    experimentType?: string;
    startDate?: string;
    endDate?: string;
    audience?: string;
    totalSampleSize?: number;
    status?: 'running' | 'completed' | 'paused' | 'draft' | 'rolled_out';
    primaryMetric?: string;
    dateCreated?: string;
  }
): Promise<FrameNode> {
  const data = mapExperimentDataToOutcomeData(experimentName, metrics, variants, options);
  return createExperimentOutcomeCard(data);
}

export function mapExperimentDataToOutcomeData(
  experimentName: string,
  metrics: MetricDefinition[],
  variants: Array<{
    id?: string;
    key: string;
    name: string;
    color?: string;
    figmaLink?: string;
    isControl?: boolean;
    traffic: number;
    status?: string;
    metrics?: { [key: string]: number };
    isRolledOut?: boolean;
  }>,
  options?: {
    hypothesis?: string;
    experimentType?: string;
    startDate?: string;
    endDate?: string;
    audience?: string;
    totalSampleSize?: number;
    status?: 'running' | 'completed' | 'paused' | 'draft' | 'rolled_out';
    primaryMetric?: string;
    dateCreated?: string;
  }
): ExperimentOutcomeData {
  // Use a comparison anchor only when older saved data explicitly marks one.
  const comparisonVariant = variants.find(v => v.isControl === true);
  
  // Convert variants to outcome format with uplift calculations
  const variantOutcomes: VariantOutcome[] = variants.map((v, index) => {
    // Keep the internal flag explicit; do not create a fallback comparison variant.
    const isControl = v.isControl === true;
    const outcomeMetrics: VariantOutcome['metrics'] = {};

    for (const metric of metrics) {
      const metricKey = getMetricKey(metric);
      const rawValue = v.metrics?.[metricKey] ?? 0;
      const rawComparisonValue = comparisonVariant?.metrics?.[metricKey] ?? 0;
      const value = normalizeMetricValueForComparison(metric, rawValue);
      const comparisonValue = normalizeMetricValueForComparison(metric, rawComparisonValue);
      
      // Calculate change only when an explicit comparison variant exists.
      let uplift: number | undefined;
      if (comparisonVariant && !isControl && comparisonValue > 0) {
        uplift = ((value - comparisonValue) / comparisonValue) * 100;
      }

      outcomeMetrics[metricKey] = {
        value,
        uplift,
      };
    }

    return {
      id: v.id || `variant-${index}`,
      key: v.key,
      name: v.name || `Variant ${v.key}`,
      color: v.color,
      figmaLink: v.figmaLink,
      isControl,
      traffic: v.traffic,
      metrics: outcomeMetrics,
      isRolledOut: v.isRolledOut,
    };
  });

  return {
    experimentName,
    experimentType: options?.experimentType,
    hypothesis: options?.hypothesis,
    startDate: options?.startDate,
    endDate: options?.endDate,
    audience: options?.audience,
    totalSampleSize: options?.totalSampleSize,
    status: options?.status || 'running',
    primaryMetric: options?.primaryMetric,
    metrics,
    variants: variantOutcomes,
    dateCreated: options?.dateCreated,
  };
}
