/// <reference types="@figma/plugin-typings" />
import { TOKENS } from "./design-tokens";
import { applyCardShell, applySectionPanel, applyPluginChip } from "./canvas-theme";
import { hexToRgb, createBadge } from "./layout-utils";
import { loadFonts } from "./load-fonts";
import {
  createOutcomeCardSections,
  mapExperimentDataToOutcomeData,
} from "./experiment-outcome-card";
import {
  EXPERIMENT_STATUS_STYLES,
  createOverviewSectionTitle,
  styleOverviewText,
  SECTION_PANEL_LAYOUT,
  formatDateForDisplay,
  resolveExperimentDisplayStatus,
  getExperimentTypeLabel,
  type ExperimentStatus,
  type ExperimentStatusConfig,
} from "./experiment-card-shared";
import type { MetricDefinition } from "./types";
import { BRAND_SVGS } from "./brand-icons";

const SUMMARY_CONTENT_MIN_WIDTH = 728;


/**
 * Create a brand icon as a Figma frame from SVG
 * @param brand - Brand name (figma, miro, jira, generic)
 * @param size - Icon size in pixels (default 14)
 * @returns FrameNode containing the vector icon
 */
function createBrandIconVector(brand: string, size: number = 14): FrameNode {
  const brandLower = brand.toLowerCase();
  const svgMarkup = BRAND_SVGS[brandLower] || BRAND_SVGS.generic;
  
  try {
    // Create node from SVG - this returns a FrameNode with vectors inside
    const svgNode = figma.createNodeFromSvg(svgMarkup);
    svgNode.name = `${brand} Icon`;
    
    // Scale to target size (SVG viewBox is 20×20)
    svgNode.resize(size, size);
    
    // Flatten to clean up the structure
    svgNode.fills = [];
    
    return svgNode;
  } catch (e) {
    console.error(`Failed to create SVG icon for ${brand}:`, e);
    
    // Fallback: create empty frame
    const fallback = figma.createFrame();
    fallback.name = `${brand} Icon (fallback)`;
    fallback.resize(size, size);
    fallback.fills = [];
    return fallback;
  }
}

export interface VariantData {
  id?: string;
  key: string;
  name: string;
  description?: string;
  figmaLink?: string;
  color?: string;
  isControl?: boolean;
  traffic: number;
  status?: string;
  metrics?: { [key: string]: number };
  isRolledOut?: boolean;
  parentEventName?: string;
}


export interface ExperimentCardOptions {
  // Outcome card options
  showOutcomeCard?: boolean;
  variants?: VariantData[];
  owner?: string;
  audience?: string;  // Target audience for the experiment
  experimentType?: string;
  hypothesis?: string;
  startDate?: string;
  endDate?: string;
  totalSampleSize?: number;
  confidenceLevel?: number;
  primaryMetric?: string;
  rolledOutVariantName?: string;  // Name of the rolled out variant (if status is rolled_out)
  rolledOutVariantColor?: string; // Color of the rolled out variant
  outcomeNotes?: string;
  dateCreated?: string; // Date when experiment was created (ISO format, auto-populated if not provided)
  excludeResources?: boolean; // If true, don't include resources section in the card
}

/**
 * Creates a comprehensive Experiment Info Card displaying experiment metadata and resources
 * 
 * Card layout: Two-panel design
 * - Left panel (60%): Experiment header, description, metrics summary, and details
 * - Right panel (40%): Resource links (Figma, Jira, Miro, Notion, etc.)
 * 
 * Features:
 * - Status badge (running, completed, failed, etc.) with color coding
 * - Experiment name and description
 * - Optional outcome card if variants data provided
 * - Metric definitions and calculations
 * - Responsive link section with brand logos
 * - Auto layout with proper spacing and alignment
 * 
 * @param experimentName - Title of the experiment
 * @param description - Experiment description/hypothesis
 * @param figmaLink - Link to Figma design file
 * @param jiraLink - Link to Jira ticket
 * @param miroLink - Link to Miro board
 * @param notionLink - Link to Notion doc
 * @param amplitudeLink - Link to Amplitude analytics
 * @param asanaLink - Link to Asana project
 * @param LinearLink - Link to Linear issue
 * @param SlackLink - Link to Slack channel
 * @param GithubLink - Link to GitHub PR/repo
 * @param ConfluenceLink - Link to Confluence page
 * @param TrelloLink - Link to Trello board
 * @param MondayLink - Link to Monday.com board
 * @param ClickupLink - Link to ClickUp task
 * @param genericLinks - Array of custom links
 * @param metrics - Metric definitions for outcome card
 * @param status - Experiment status: 'running' | 'completed' | 'failed' | 'paused'
 * @param options - Optional configuration (variants, owner, audience, dates, etc.)
 * @returns Promise<FrameNode> containing the complete info card
 * 
 * @example
 * const infoCard = await createExperimentInfoCard(
 *   'Pricing Page Button Color Experiment',
 *   'Testing whether CTA color changes help more visitors start checkout',
 *   'https://figma.com/...',
 *   'https://jira.com/...',
 *   // ... other links
 *   metrics,
 *   'running',
 *   { variants: variantList, owner: 'Alice' }
 * );
 */
export async function createExperimentInfoCard(
  experimentName: string,
  description: string = "",
  figmaLink: string = "",
  jiraLink: string = "",
  miroLink: string = "",
  notionLink: string = "",
  amplitudeLink: string = "",
  asanaLink: string = "",
  LinearLink: string = "",
  SlackLink: string = "",
  GithubLink: string = "",
  ConfluenceLink: string = "",
  TrelloLink: string = "",
  MondayLink: string = "",
  ClickupLink: string = "",
  genericLinks: string[] = [],

  metrics?: MetricDefinition[],
  status: ExperimentStatus = 'running',
  options?: ExperimentCardOptions
): Promise<FrameNode> {
  // Ensure all fonts are loaded before creating any text nodes
  await loadFonts();
  // Container
  const card = figma.createFrame();
  card.name = `Experiment Overview`;
  card.layoutMode = "VERTICAL";
  card.counterAxisSizingMode = "AUTO";
  card.primaryAxisSizingMode = "AUTO";
  card.itemSpacing = TOKENS.space24;
  card.paddingLeft = card.paddingRight = TOKENS.space32;
  card.paddingTop = card.paddingBottom = TOKENS.space32;
  card.cornerRadius = TOKENS.radiusLG;
  applyCardShell(card);
  card.minWidth = 792;
  card.minHeight = 612;

  const CONTENT_MIN_WIDTH = 728;
  const CONTENT_MAX_WIDTH = 1400;
  const CARD_MAX_WIDTH = 1800;

  const statusConfig = EXPERIMENT_STATUS_STYLES[status] || EXPERIMENT_STATUS_STYLES.running;
  const hasRollout = !!(options?.rolledOutVariantName?.trim());
  const displayStatus = resolveExperimentDisplayStatus(status, hasRollout);

  // Parse YYYY-MM-DD as local date to avoid timezone day shifts.
  function parseDateLocal(dateString?: string): Date | null {
    if (!dateString) return null;
    const isoDateOnly = /^(\d{4})-(\d{2})-(\d{2})$/;
    const match = dateString.match(isoDateOnly);
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]) - 1;
      const day = Number(match[3]);
      return new Date(year, month, day);
    }
    const parsed = new Date(dateString);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function formatUIDate(dateString?: string): string {
    const date = parseDateLocal(dateString);
    if (!date) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  let runDatesValue = '';
  if (options?.startDate && options?.endDate) {
    const start = parseDateLocal(options.startDate);
    const end = parseDateLocal(options.endDate);
    if (start && end) {
      runDatesValue = `${formatUIDate(options.startDate)} → ${formatUIDate(options.endDate)}`;
    } else {
      runDatesValue = `${options.startDate} – ${options.endDate}`;
    }
  } else if (options?.startDate) {
    const start = parseDateLocal(options.startDate);
    runDatesValue = start ? formatUIDate(options.startDate) : options.startDate;
  } else if (options?.endDate) {
    const end = parseDateLocal(options.endDate);
    runDatesValue = end ? formatUIDate(options.endDate) : options.endDate;
  }

  const runSampleSizeValue =
    options?.totalSampleSize !== undefined &&
    options.totalSampleSize !== null &&
    options.totalSampleSize > 0
      ? options.totalSampleSize.toLocaleString()
      : "";

  // === SECTION 1: HEADER (status, title, purpose) ===
  const headerSection = await createStoryHeaderWithBadges(
    experimentName,
    description.trim(),
    statusConfig,
    CONTENT_MIN_WIDTH,
  );
  card.appendChild(headerSection);

  // === SINGLE-COLUMN CONTENT FLOW ===
  const contentStack = figma.createFrame();
  contentStack.name = "Content Flow";
  contentStack.layoutMode = "VERTICAL";
  contentStack.counterAxisSizingMode = "FIXED";
  contentStack.primaryAxisSizingMode = "AUTO";
  contentStack.layoutAlign = "STRETCH";
  contentStack.itemSpacing = TOKENS.space24;
  contentStack.fills = [];
  contentStack.strokes = [];
  contentStack.minWidth = CONTENT_MIN_WIDTH;

  card.appendChild(contentStack);

  const audienceValue = options?.audience?.trim() || "";
  const ownerValue = options?.owner?.trim() || "";

  const contextGroups = buildContextDetailsGroups({
    runDates: runDatesValue,
    sampleSize: runSampleSizeValue,
    experimentType: options?.experimentType,
    audience: audienceValue,
    owner: ownerValue,
    hypothesis: options?.hypothesis?.trim() || "",
    notes: options?.outcomeNotes?.trim() || "",
  });

  try {
    await appendDetailsSection(contentStack, "Details", contextGroups, CONTENT_MIN_WIDTH);
  } catch (e) {
    console.error('Error creating overview details sections:', e);
  }

  const shouldShowInlineOutcome =
    options?.showOutcomeCard === true &&
    !!options?.variants &&
    options.variants.length > 0 &&
    !!metrics &&
    metrics.length > 0;

  if (shouldShowInlineOutcome) {
    try {
      const outcomeData = mapExperimentDataToOutcomeData(
        experimentName,
        metrics!,
        options!.variants!,
        {
          hypothesis: options?.hypothesis,
          experimentType: options?.experimentType,
          startDate: options?.startDate,
          endDate: options?.endDate,
          audience: options?.audience,
          totalSampleSize: options?.totalSampleSize,
          dateCreated: options?.dateCreated,
          status: displayStatus,
          primaryMetric: options?.primaryMetric,
          outcomeNotes: options?.outcomeNotes,
        }
      );

      const outcomeSections = await createOutcomeCardSections(outcomeData, {
        includeHeader: false,
        embeddedSummary: true,
      });
      outcomeSections.summarySection.layoutAlign = "STRETCH";
      outcomeSections.metricsTable.layoutAlign = "STRETCH";

      const metricsSection = figma.createFrame();
      metricsSection.name = "Section: Results";
      metricsSection.layoutMode = "VERTICAL";
      metricsSection.counterAxisSizingMode = "AUTO";
      metricsSection.primaryAxisSizingMode = "AUTO";
      metricsSection.layoutAlign = "STRETCH";
      metricsSection.itemSpacing = SECTION_PANEL_LAYOUT.sectionGap;
      metricsSection.fills = [];

      metricsSection.appendChild(createOverviewSectionTitle("Results"));
      metricsSection.appendChild(outcomeSections.metricsTable);
      contentStack.appendChild(metricsSection);
      contentStack.appendChild(outcomeSections.summarySection);
    } catch (e) {
      console.error('Error creating inline outcome sections:', e);
    }
  }

  if (!options?.excludeResources) {
    try {
      const linksSection = createResourcesSection(
        figmaLink,
        jiraLink,
        miroLink,
        notionLink,
        amplitudeLink,
        asanaLink,
        LinearLink,
        SlackLink,
        GithubLink,
        ConfluenceLink,
        TrelloLink,
        MondayLink,
        ClickupLink,
        genericLinks,
        CONTENT_MIN_WIDTH,
      );
      linksSection.layoutAlign = "STRETCH";
      contentStack.appendChild(linksSection);
    } catch (e) {
      console.error("Error creating resources section:", e);
    }
  }

  const measuredContentWidth = contentStack.width > 0 ? contentStack.width : CONTENT_MIN_WIDTH;
  const contentTargetWidth = Math.min(CONTENT_MAX_WIDTH, Math.max(CONTENT_MIN_WIDTH, measuredContentWidth));
  contentStack.minWidth = contentTargetWidth;
  contentStack.maxWidth = contentTargetWidth;

  const cardContentWidth = contentTargetWidth + card.paddingLeft + card.paddingRight;
  const cardTargetWidth = Math.min(CARD_MAX_WIDTH, Math.max(card.minWidth, cardContentWidth));
  card.counterAxisSizingMode = "FIXED";
  card.minWidth = cardTargetWidth;
  card.maxWidth = cardTargetWidth;
  
  // Ensure card has valid dimensions
  if (card.width === 0 || card.height === 0) {
    console.warn('Card has zero dimensions, forcing layout recalculation');
    card.resize(Math.max(card.width, 792), Math.max(card.height, 612));
  }

  return card;
}

/**
 * Create a two-panel canvas layout for experiment overview
 * Left panel: Info card (without resources)
 * Right panel: Resources section
 */
export async function createExperimentCanvasLayout(
  experimentName: string,
  description: string = "",
  figmaLink: string = "",
  jiraLink: string = "",
  miroLink: string = "",
  notionLink: string = "",
  amplitudeLink: string = "",
  asanaLink: string = "",
  LinearLink: string = "",
  SlackLink: string = "",
  GithubLink: string = "",
  ConfluenceLink: string = "",
  TrelloLink: string = "",
  MondayLink: string = "",
  ClickupLink: string = "",
  genericLinks: string[] = [],

  metrics?: MetricDefinition[],
  status: ExperimentStatus = 'running',
  options?: ExperimentCardOptions
): Promise<FrameNode> {
  await loadFonts();

  // Main canvas container - horizontal layout
  const canvas = figma.createFrame();
  canvas.name = `Experiment Canvas — ${experimentName}`;
  canvas.layoutMode = "HORIZONTAL";
  canvas.counterAxisSizingMode = "AUTO";
  canvas.primaryAxisSizingMode = "AUTO";
  canvas.itemSpacing = 24; // Gap between panels
  canvas.paddingLeft = canvas.paddingRight = 0;
  canvas.paddingTop = canvas.paddingBottom = 0;
  canvas.fills = [];
  canvas.strokes = [];
  canvas.effects = [];

  // Left Panel - Info Card (wider, ~60%)
  const leftPanel = figma.createFrame();
  leftPanel.name = "Overview Panel";
  leftPanel.layoutMode = "VERTICAL";
  leftPanel.counterAxisSizingMode = "FIXED";
  leftPanel.primaryAxisSizingMode = "AUTO";
  leftPanel.minWidth = 400; // Minimum width
  leftPanel.layoutGrow = 1; // Flexible to fill space
  leftPanel.paddingLeft = leftPanel.paddingRight = 0;
  leftPanel.paddingTop = leftPanel.paddingBottom = 0;
  leftPanel.itemSpacing = 0;
  leftPanel.fills = [];
  leftPanel.strokes = [];

  // Create info card without resources
  const infoCardOptions = { ...options, excludeResources: true };
  const infoCard = await createExperimentInfoCard(
    experimentName,
    description,
    figmaLink,
    jiraLink,
    miroLink,
    notionLink,
    amplitudeLink,
    asanaLink,
    LinearLink,
    SlackLink,
    GithubLink,
    ConfluenceLink,
    TrelloLink,
    MondayLink,
    ClickupLink,
    genericLinks,
    metrics,
    status,
    infoCardOptions
  );
  leftPanel.appendChild(infoCard);

  // Right Panel - Resources (narrower, ~40%)
  const rightPanel = figma.createFrame();
  rightPanel.name = "Resources Panel";
  rightPanel.layoutMode = "VERTICAL";
  rightPanel.counterAxisSizingMode = "FIXED";
  rightPanel.primaryAxisSizingMode = "AUTO";
  rightPanel.minWidth = 350; // Minimum width (per plan spec)
  rightPanel.maxWidth = 600; // Maximum width
  rightPanel.layoutGrow = 0; // Fixed width, don't grow
  rightPanel.paddingLeft = rightPanel.paddingRight = 24;
  rightPanel.paddingTop = rightPanel.paddingBottom = 24;
  rightPanel.itemSpacing = 0;
  rightPanel.fills = [];
  rightPanel.strokes = [];

  // Create resources section
  const resourcesSection = createResourcesSection(
    figmaLink,
    jiraLink,
    miroLink,
    notionLink,
    amplitudeLink,
    asanaLink,
    LinearLink,
    SlackLink,
    GithubLink,
    ConfluenceLink,
    TrelloLink,
    MondayLink,
    ClickupLink,
    genericLinks
  );
  if (resourcesSection) {
    rightPanel.appendChild(resourcesSection);
  }
  canvas.appendChild(leftPanel);
  if (resourcesSection) {
    canvas.appendChild(rightPanel);
  }

  return canvas;
}

// ============================================
// RESOURCES SECTION
// ============================================

/**
 * Create resources section with all links
 * Extracted from createExperimentInfoCard for reuse in canvas layout
 */
function createResourcesSection(
  figmaLink: string = "",
  jiraLink: string = "",
  miroLink: string = "",
  notionLink: string = "",
  amplitudeLink: string = "",
  asanaLink: string = "",
  LinearLink: string = "",
  SlackLink: string = "",
  GithubLink: string = "",
  ConfluenceLink: string = "",
  TrelloLink: string = "",
  MondayLink: string = "",
  ClickupLink: string = "",
  genericLinks: string[] = [],
  contentWidth = SUMMARY_CONTENT_MIN_WIDTH,
): FrameNode {
  const linksSection = figma.createFrame();
  linksSection.layoutMode = "VERTICAL";
  linksSection.counterAxisSizingMode = "AUTO";
  linksSection.primaryAxisSizingMode = "AUTO";
  linksSection.primaryAxisAlignItems = "MIN";
  linksSection.counterAxisAlignItems = "MIN";
  linksSection.layoutAlign = "STRETCH";
  linksSection.itemSpacing = SECTION_PANEL_LAYOUT.sectionGap;
  linksSection.fills = [];
  linksSection.strokes = [];
  linksSection.name = "Links Section";

  linksSection.appendChild(createOverviewSectionTitle("Resources"));

  const linksContainer = figma.createFrame();
  linksContainer.layoutMode = "HORIZONTAL";
  linksContainer.layoutWrap = "WRAP";
  linksContainer.counterAxisSizingMode = "AUTO";
  linksContainer.primaryAxisSizingMode = "AUTO";
  linksContainer.primaryAxisAlignItems = "MIN";
  linksContainer.counterAxisAlignItems = "MIN";
  linksContainer.layoutAlign = "STRETCH";
  linksContainer.maxWidth = contentWidth;
  linksContainer.itemSpacing = TOKENS.space8;
  linksContainer.counterAxisSpacing = TOKENS.space8;
  linksContainer.fills = [];
  linksContainer.strokes = [];
  linksContainer.name = "Links";

  const appendChip = (label: string, url?: string) => {
    const chip = tryCreateLinkChip(label, url);
    if (chip) linksContainer.appendChild(chip);
  };

  appendChip("Figma", figmaLink);
  appendChip("Jira", jiraLink);
  appendChip("Miro", miroLink);
  appendChip("Notion", notionLink);
  appendChip("Amplitude", amplitudeLink);
  appendChip("Asana", asanaLink);
  appendChip("Linear", LinearLink);
  appendChip("Slack", SlackLink);
  appendChip("GitHub", GithubLink);
  appendChip("Confluence", ConfluenceLink);
  appendChip("Trello", TrelloLink);
  appendChip("Monday", MondayLink);
  appendChip("Clickup", ClickupLink);
  if (genericLinks?.length) {
    for (const url of genericLinks) {
      appendChip("Link", url);
    }
  }

  if (linksContainer.children.length === 0) {
    const placeholderText = figma.createText();
    styleOverviewText(placeholderText, "caption");
    placeholderText.textAutoResize = "WIDTH_AND_HEIGHT";
    placeholderText.characters = "—";
    placeholderText.name = "Resources Placeholder";
    linksContainer.appendChild(placeholderText);
  }

  linksSection.appendChild(linksContainer);
  return linksSection;
}

interface SummaryDetailField {
  label: string;
  value: string;
  valueColor?: string;
  valueDot?: string;
  wrap?: boolean;
}

interface SummaryDetailGroup {
  name: string;
  fields: SummaryDetailField[];
  /** Render fields two per row when possible */
  pairFields?: boolean;
  layout?: "default" | "setup" | "details";
}

function buildDecisionDetailsGroups(input: {
  status: ExperimentStatus;
  rolledOutVariantName?: string;
  rolledOutVariantColor?: string;
  decisionRationale?: string;
}): SummaryDetailGroup[] {
  const groups: SummaryDetailGroup[] = [];
  const isConcluded = input.status === "completed" || input.status === "rolled_out";
  if (!isConcluded && !input.rolledOutVariantName) {
    return groups;
  }

  const decisionFields: SummaryDetailField[] = [];
  if (input.rolledOutVariantName) {
    decisionFields.push({
      label: "Rolled-out variant",
      value: input.rolledOutVariantName,
      valueDot: input.rolledOutVariantColor,
    });
  }
  if (decisionFields.length > 0) {
    groups.push({
      name: "Decision",
      fields: decisionFields,
    });
  }

  return groups;
}

function buildContextDetailsGroups(input: {
  runDates: string;
  sampleSize: string;
  audience: string;
  owner: string;
  experimentType?: string;
  hypothesis?: string;
  notes?: string;
}): SummaryDetailGroup[] {
  const typeLabel = input.experimentType?.trim()
    ? getExperimentTypeLabel(input.experimentType.trim())
    : "";
  const datesValue = input.runDates.trim() || "—";
  const sampleSizeValue = input.sampleSize.trim()
    ? `${input.sampleSize.trim()} users`
    : "—";
  const hypothesisValue = input.hypothesis?.trim() || "";
  const notesValue = input.notes?.trim() || "";

  const scalarFields: SummaryDetailField[] = [
    { label: "Dates", value: datesValue },
    { label: "Sample size", value: sampleSizeValue },
    { label: "Experiment type", value: typeLabel || "—" },
    { label: "Owner", value: input.owner.trim() || "—", wrap: true },
    { label: "Audience", value: input.audience.trim() || "—", wrap: true },
  ];

  const fields: SummaryDetailField[] = [];
  if (hypothesisValue) {
    fields.push({ label: "Hypothesis", value: hypothesisValue, wrap: true });
  }
  if (notesValue) {
    fields.push({ label: "Notes", value: notesValue, wrap: true });
  }
  fields.push(...scalarFields);

  return [{
    name: "Details",
    layout: "details",
    fields,
  }];
}

function buildSummaryDetailsGroups(input: {
  status: ExperimentStatus;
  rolledOutVariantName?: string;
  rolledOutVariantColor?: string;
  decisionRationale?: string;
  runDates?: string;
  sampleSize?: string;
  audience: string;
  owner: string;
  experimentType?: string;
  hypothesis?: string;
  confidenceLevel?: number;
}): SummaryDetailGroup[] {
  return [
    ...buildDecisionDetailsGroups(input),
    ...buildContextDetailsGroups({
      runDates: input.runDates ?? "",
      sampleSize: input.sampleSize ?? "",
      audience: input.audience,
      owner: input.owner,
      experimentType: input.experimentType,
      hypothesis: input.hypothesis,
      notes: input.decisionRationale,
    }),
  ];
}

function setWrappedOverviewText(text: TextNode, characters: string, width: number): void {
  text.textAutoResize = "HEIGHT";
  if (width > 0) {
    text.resize(width, Math.max(text.height, 1));
  }
  text.characters = characters;
  if (width > 0) {
    text.resize(width, text.height);
  }
}

function shouldWrapDetailValue(label: string, wrap?: boolean): boolean {
  if (wrap === true) return true;
  return (
    label === "Description" ||
    label === "Hypothesis" ||
    label === "What we're testing" ||
    label === "Notes" ||
    label === "Audience" ||
    label === "Owner"
  );
}

function createSummaryDetailValueNode(
  field: SummaryDetailField,
  contentWidth: number,
): TextNode {
  const valueNode = figma.createText();
  styleOverviewText(valueNode, "fieldValue");
  if (field.valueColor) {
    valueNode.fills = [{ type: "SOLID", color: hexToRgb(field.valueColor) }];
  }
  const wrapValue = shouldWrapDetailValue(field.label, field.wrap);
  if (wrapValue && contentWidth > 0) {
    setWrappedOverviewText(valueNode, field.value || "—", contentWidth);
  } else {
    valueNode.textAutoResize = "WIDTH_AND_HEIGHT";
    valueNode.characters = field.value || "—";
  }
  return valueNode;
}

function createSummaryDetailFieldRow(
  field: SummaryDetailField,
  contentWidth: number,
): FrameNode {
  const row = figma.createFrame();
  row.layoutMode = "VERTICAL";
  row.counterAxisSizingMode = "FIXED";
  row.primaryAxisSizingMode = "AUTO";
  row.layoutAlign = "STRETCH";
  row.counterAxisAlignItems = "MIN";
  row.itemSpacing = SECTION_PANEL_LAYOUT.rowItemSpacing;
  row.fills = [];
  row.strokes = [];
  row.name = `Row: ${field.label}`;
  if (contentWidth > 0) {
    row.minWidth = contentWidth;
  }

  const labelNode = figma.createText();
  styleOverviewText(labelNode, "fieldLabel");
  labelNode.textAutoResize = "WIDTH_AND_HEIGHT";
  labelNode.characters = field.label;
  row.appendChild(labelNode);

  const valueNode = createSummaryDetailValueNode(field, contentWidth);
  if (field.valueDot) {
    const valueRow = figma.createFrame();
    valueRow.layoutMode = "HORIZONTAL";
    valueRow.counterAxisSizingMode = "AUTO";
    valueRow.primaryAxisSizingMode = "AUTO";
    valueRow.counterAxisAlignItems = "CENTER";
    valueRow.itemSpacing = SECTION_PANEL_LAYOUT.rowItemSpacing;
    valueRow.fills = [];
    valueRow.name = "Value Row";

    const dot = figma.createEllipse();
    dot.resize(8, 8);
    dot.fills = [{ type: "SOLID", color: hexToRgb(field.valueDot) }];
    valueRow.appendChild(dot);
    valueRow.appendChild(valueNode);
    row.appendChild(valueRow);
  } else {
    row.appendChild(valueNode);
  }

  return row;
}

function createSummaryDetailPairRow(
  fields: SummaryDetailField[],
  contentWidth: number,
): FrameNode {
  const pairRow = figma.createFrame();
  pairRow.layoutMode = "HORIZONTAL";
  pairRow.counterAxisSizingMode = "AUTO";
  pairRow.primaryAxisSizingMode = "FIXED";
  pairRow.layoutAlign = "STRETCH";
  pairRow.counterAxisAlignItems = "MIN";
  pairRow.itemSpacing = TOKENS.space16;
  pairRow.fills = [];
  pairRow.name = `Row: ${fields.map(field => field.label).join(" + ")}`;

  const columnWidth = contentWidth > 0
    ? Math.max(0, (contentWidth - TOKENS.space16) / 2)
    : 0;

  for (const field of fields) {
    const cell = createSummaryDetailFieldRow(field, columnWidth);
    cell.layoutGrow = 1;
    pairRow.appendChild(cell);
  }

  return pairRow;
}

/**
 * Create experiment details in grouped, hierarchy-driven rows inside the card panel.
 */
async function appendDetailsSection(
  parent: FrameNode,
  title: string,
  groups: SummaryDetailGroup[],
  fallbackWidth = SUMMARY_CONTENT_MIN_WIDTH,
): Promise<void> {
  await loadFonts();

  const section = figma.createFrame();
  section.layoutMode = "VERTICAL";
  section.counterAxisSizingMode = "FIXED";
  section.primaryAxisSizingMode = "AUTO";
  section.layoutAlign = "STRETCH";
  section.itemSpacing = SECTION_PANEL_LAYOUT.sectionGap;
  section.fills = [];
  section.name = `Section: ${title}`;

  const sectionWidth = parent.maxWidth || parent.minWidth || parent.width || fallbackWidth;
  section.minWidth = sectionWidth;
  section.counterAxisSizingMode = "FIXED";

  section.appendChild(createOverviewSectionTitle(title));

  const detailsContainer = figma.createFrame();
  detailsContainer.layoutMode = "VERTICAL";
  detailsContainer.counterAxisSizingMode = "AUTO";
  detailsContainer.primaryAxisSizingMode = "AUTO";
  detailsContainer.layoutAlign = "STRETCH";
  detailsContainer.itemSpacing = SECTION_PANEL_LAYOUT.sectionGap;
  detailsContainer.paddingLeft = detailsContainer.paddingRight = SECTION_PANEL_LAYOUT.panelPadding;
  detailsContainer.paddingTop = detailsContainer.paddingBottom = SECTION_PANEL_LAYOUT.panelPadding;
  detailsContainer.cornerRadius = SECTION_PANEL_LAYOUT.panelCornerRadius;
  applySectionPanel(detailsContainer);
  detailsContainer.name = "Details Container";
  section.appendChild(detailsContainer);

  const contentWidth = Math.max(
    0,
    sectionWidth - (detailsContainer.paddingLeft || 0) - (detailsContainer.paddingRight || 0),
  );

  for (const group of groups) {
    const groupFrame = figma.createFrame();
    groupFrame.layoutMode = "VERTICAL";
    groupFrame.counterAxisSizingMode = "AUTO";
    groupFrame.primaryAxisSizingMode = "AUTO";
    groupFrame.layoutAlign = "STRETCH";
    groupFrame.itemSpacing = SECTION_PANEL_LAYOUT.panelItemSpacing;
    groupFrame.fills = [];
    groupFrame.name = `Details Group: ${group.name}`;

    const fields = group.fields;
    if (group.layout === "details") {
      const hypothesisField = fields.find(field => field.label === "Hypothesis");
      const notesField = fields.find(field => field.label === "Notes");
      const datesField = fields.find(field => field.label === "Dates");
      const sampleField = fields.find(field => field.label === "Sample size");
      const typeField = fields.find(field => field.label === "Experiment type");
      const ownerField = fields.find(field => field.label === "Owner");
      const audienceField = fields.find(field => field.label === "Audience");

      if (hypothesisField) {
        groupFrame.appendChild(createSummaryDetailFieldRow(hypothesisField, contentWidth));
      }
      if (notesField) {
        groupFrame.appendChild(createSummaryDetailFieldRow(notesField, contentWidth));
      }
      if (datesField && sampleField) {
        groupFrame.appendChild(createSummaryDetailPairRow([datesField, sampleField], contentWidth));
      } else if (datesField) {
        groupFrame.appendChild(createSummaryDetailFieldRow(datesField, contentWidth));
      } else if (sampleField) {
        groupFrame.appendChild(createSummaryDetailFieldRow(sampleField, contentWidth));
      }
      if (typeField && ownerField) {
        groupFrame.appendChild(createSummaryDetailPairRow([typeField, ownerField], contentWidth));
      } else if (typeField) {
        groupFrame.appendChild(createSummaryDetailFieldRow(typeField, contentWidth));
      } else if (ownerField) {
        groupFrame.appendChild(createSummaryDetailFieldRow(ownerField, contentWidth));
      }
      if (audienceField) {
        groupFrame.appendChild(createSummaryDetailFieldRow(audienceField, contentWidth));
      }
    } else if (group.layout === "setup") {
      const datesField = fields.find(field => field.label === "Dates");
      const sampleField = fields.find(field => field.label === "Sample size");
      const scalarFields = [datesField, sampleField].filter(
        (field): field is SummaryDetailField => !!field,
      );

      if (scalarFields.length === 2) {
        groupFrame.appendChild(createSummaryDetailPairRow(scalarFields, contentWidth));
      } else if (scalarFields.length === 1) {
        groupFrame.appendChild(createSummaryDetailFieldRow(scalarFields[0], contentWidth));
      }

      for (const field of fields) {
        if (field.label === "Audience" || field.label === "Owner") {
          groupFrame.appendChild(createSummaryDetailFieldRow(field, contentWidth));
        }
      }
    } else if (group.pairFields) {
      for (let index = 0; index < fields.length; index += 2) {
        const pair = fields.slice(index, index + 2);
        if (pair.length === 2) {
          groupFrame.appendChild(createSummaryDetailPairRow(pair, contentWidth));
        } else {
          groupFrame.appendChild(createSummaryDetailFieldRow(pair[0], contentWidth));
        }
      }
    } else {
      for (const field of fields) {
        groupFrame.appendChild(createSummaryDetailFieldRow(field, contentWidth));
      }
    }

    detailsContainer.appendChild(groupFrame);
  }

  parent.appendChild(section);
}

// SECTION 1: Header with status badge, title, and description
async function createStoryHeaderWithBadges(
  experimentName: string,
  description: string,
  statusConfig: ExperimentStatusConfig,
  contentWidth = 0,
): Promise<FrameNode> {
  await loadFonts();
  const section = figma.createFrame();
  section.layoutMode = "VERTICAL";
  section.counterAxisSizingMode = contentWidth > 0 ? "FIXED" : "AUTO";
  section.primaryAxisSizingMode = "AUTO";
  section.primaryAxisAlignItems = "MIN";
  section.counterAxisAlignItems = "MIN";
  section.layoutAlign = "STRETCH";
  section.itemSpacing = SECTION_PANEL_LAYOUT.sectionGap;
  section.fills = [];
  section.strokes = [];
  section.name = "Header Section";
  if (contentWidth > 0) {
    section.minWidth = contentWidth;
  }

  const metaRow = figma.createFrame();
  metaRow.layoutMode = "HORIZONTAL";
  metaRow.counterAxisSizingMode = "AUTO";
  metaRow.primaryAxisSizingMode = "AUTO";
  metaRow.counterAxisAlignItems = "CENTER";
  metaRow.itemSpacing = TOKENS.space8;
  metaRow.fills = [];
  metaRow.name = "Header Meta Row";

  const statusBadge = createBadge(
    statusConfig.label,
    "chip",
    statusConfig.bgColor,
    statusConfig.textColor,
    undefined,
    statusConfig.borderColor,
  );
  metaRow.appendChild(statusBadge);
  section.appendChild(metaRow);

  const titleText = figma.createText();
  styleOverviewText(titleText, "cardTitle");
  titleText.textAutoResize = "WIDTH_AND_HEIGHT";
  titleText.characters = experimentName && experimentName.length > 0 ? experimentName : "Untitled Experiment";
  section.appendChild(titleText);

  const descriptionText = description.trim();
  const purposeWidth = contentWidth > 0 ? contentWidth : SUMMARY_CONTENT_MIN_WIDTH;

  if (descriptionText) {
    const descriptionNode = figma.createText();
    styleOverviewText(descriptionNode, "fieldValue");
    descriptionNode.name = "Description";
    if (purposeWidth > 0) {
      setWrappedOverviewText(descriptionNode, descriptionText, purposeWidth);
    } else {
      descriptionNode.textAutoResize = "WIDTH_AND_HEIGHT";
      descriptionNode.characters = descriptionText;
    }
    section.appendChild(descriptionNode);
  }

  return section;
}

function normalizeCanvasLinkUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function applyLinkHyperlink(text: TextNode, start: number, end: number, url: string): void {
  const normalized = normalizeCanvasLinkUrl(url);
  if (!normalized || end <= start) return;
  try {
    text.setRangeHyperlink(start, end, { type: "URL", value: normalized });
  } catch (e) {
    console.warn("Could not set hyperlink on link chip:", e);
  }
}

function tryCreateLinkChip(label: string, url?: string): FrameNode | null {
  if (!url?.trim()) return null;
  try {
    return createLinkChip(label, url);
  } catch (e) {
    console.warn(`Failed to create link chip for ${label}:`, e);
    return null;
  }
}

function createLinkChip(label: string, url?: string): FrameNode {
  const chip = figma.createFrame();
  chip.layoutMode = "HORIZONTAL";
  chip.counterAxisSizingMode = "AUTO";
  chip.primaryAxisSizingMode = "AUTO";
  chip.primaryAxisAlignItems = "MIN";
  chip.counterAxisAlignItems = "CENTER";
  chip.layoutAlign = 'STRETCH';
  chip.minWidth = 137; // 21rem
  chip.maxWidth = 137; // 21rem
  chip.itemSpacing = TOKENS.space8;
  chip.paddingLeft = chip.paddingRight = TOKENS.space8;
  chip.paddingTop = chip.paddingBottom = TOKENS.space8;
  applyPluginChip(chip);
  chip.name = "Link Chip";
  
  // Brand icon (vector) - larger size for this layout
  const icon = createBrandIconVector(label, 16);
  chip.appendChild(icon);
  
  // Text container (vertical stack for title + URL)
  const textContainer = figma.createFrame();
  textContainer.layoutMode = "VERTICAL";
  textContainer.counterAxisSizingMode = "AUTO";
  textContainer.primaryAxisSizingMode = "AUTO";
  textContainer.itemSpacing = 0;
  textContainer.fills = [];
  textContainer.name = "Link Text";
  textContainer.layoutAlign = "STRETCH";
  
  
  // Title - descriptive link label
  const linkLabels: Record<string, string> = {
    'Figma': 'Figma link',
    'Miro': 'Miro board',
    'Jira': 'Jira ticket',
    'Notion': 'Notion page',
    'Amplitude': 'Amplitude dashboard',
    'Generic': 'Link to website',
    'Asana': 'Asana task',
    'Linear': 'Linear ticket',
    'Slack': 'Slack channel',
    'GitHub': 'GitHub repository',
    'Confluence': 'Confluence page',
    'Trello': 'Trello board',
    'Monday': 'Monday task',
    'ClickUp': 'ClickUp task',
  };
  const title = figma.createText();
  styleOverviewText(title, "fieldValue");
  title.lineHeight = { unit: "PIXELS", value: 12 };
  title.textAutoResize = "WIDTH_AND_HEIGHT";
  title.name = "Link Title";
  const titleText = linkLabels[label] || `${label} link`;
  title.characters = titleText;
  textContainer.appendChild(title);
  chip.appendChild(textContainer);

  if (url?.trim()) {
    applyLinkHyperlink(title, 0, titleText.length, url);
  }
  return chip;
}