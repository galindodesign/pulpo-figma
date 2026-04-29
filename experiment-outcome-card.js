var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/// <reference types="@figma/plugin-typings" />
import { TOKENS } from "./design-tokens";
import { hexToRgb, getFontStyle, createBadge } from "./layout-utils";
import { loadFonts } from "./load-fonts";
import { EXPERIMENT_STATUS_STYLES, formatDateForDisplay, getExperimentTypeLabel, } from "./experiment-card-shared";
/**
 * Format metric value with appropriate precision (always decimal)
 */
function isPercentageMetric(metric) {
    if (!metric)
        return false;
    if (typeof metric.thresholdPct === "number")
        return true;
    const abbr = (metric.abbreviation || "").toLowerCase();
    if (abbr === "ctr" || abbr === "cr" || abbr === "cvr")
        return true;
    const metricName = metric.name.toLowerCase();
    return metricName.includes("rate") || metricName.includes("percent") || metricName.includes("%");
}
function normalizeMetricValueForComparison(metric, value) {
    if (!metric || !isPercentageMetric(metric))
        return value;
    if (value >= 0 && value <= 1)
        return value * 100;
    return value;
}
function formatMetricValue(value, metric) {
    if (value === undefined || value === null)
        return '--';
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
function formatUplift(uplift) {
    if (uplift === undefined || uplift === null)
        return '--';
    const sign = uplift >= 0 ? '+' : '';
    return `${sign}${uplift.toFixed(2)}%`;
}
function formatDelta(uplift) {
    if (uplift === undefined || uplift === null)
        return "--";
    const arrow = uplift > 0 ? "↑" : uplift < 0 ? "↓" : "→";
    const sign = uplift >= 0 ? "+" : "";
    return `${arrow} ${sign}${uplift.toFixed(2)}%`;
}
function getGoalPerformance(metric, value) {
    if (!metric || value === undefined || value === null)
        return undefined;
    if (typeof metric.thresholdPct !== "number" || !Number.isFinite(metric.thresholdPct))
        return undefined;
    if (metric.direction === "decrease")
        return value <= metric.thresholdPct;
    return value >= metric.thresholdPct;
}
function classifyOutcomeState(data) {
    var _a;
    const primaryMetricDef = data.metrics.find(m => getMetricKey(m) === data.primaryMetric || m.isPrimary);
    const primaryMetricKey = data.primaryMetric || (primaryMetricDef ? getMetricKey(primaryMetricDef) : undefined);
    const metricLabel = (primaryMetricDef === null || primaryMetricDef === void 0 ? void 0 : primaryMetricDef.abbreviation) || (primaryMetricDef === null || primaryMetricDef === void 0 ? void 0 : primaryMetricDef.name) || "primary metric";
    const bestVariant = data.variants
        .filter(v => !v.isControl)
        .map(v => { var _a; return ({ variant: v, uplift: primaryMetricKey ? (_a = v.metrics[primaryMetricKey]) === null || _a === void 0 ? void 0 : _a.uplift : undefined }); })
        .filter(v => v.uplift !== undefined)
        .sort((a, b) => (b.uplift - a.uplift))[0];
    if (data.status === "running") {
        return {
            state: "inconclusive",
            headline: "Inconclusive",
            detail: `Primary metric (${metricLabel}) has not reached significance yet. Keep running and collect more data.`,
        };
    }
    if (data.status === "paused") {
        return {
            state: "paused",
            headline: "Paused",
            detail: "Experiment is paused. Resume to collect more evidence, or close with current learnings.",
        };
    }
    if (data.status === "rolled_out") {
        const rolledOutVariant = data.variants.find(v => v.isRolledOut);
        const uplift = primaryMetricKey && rolledOutVariant ? (_a = rolledOutVariant.metrics[primaryMetricKey]) === null || _a === void 0 ? void 0 : _a.uplift : undefined;
        const upliftText = uplift !== undefined ? ` (${formatUplift(uplift)})` : "";
        return {
            state: "rolled_out",
            headline: "Winning",
            detail: `${(rolledOutVariant === null || rolledOutVariant === void 0 ? void 0 : rolledOutVariant.name) || "Winning variant"} is live${upliftText}. Monitor for regressions post-rollout.`,
        };
    }
    if (!bestVariant || bestVariant.uplift === undefined) {
        return {
            state: "inconclusive",
            headline: "Inconclusive",
            detail: "No clear winner yet. Extend the test or refine the hypothesis before deciding.",
        };
    }
    if (bestVariant.uplift > 0) {
        return {
            state: "winning",
            headline: "Winning",
            detail: `${bestVariant.variant.name} is outperforming Control by ${formatUplift(bestVariant.uplift)} on ${metricLabel}.`,
        };
    }
    return {
        state: "losing",
        headline: "Losing",
        detail: `Variants are underperforming Control (${formatUplift(bestVariant.uplift)} on ${metricLabel}). Consider iterating before rollout.`,
    };
}
/**
 * Get metric key from metric definition
 */
function getMetricKey(metric) {
    if (metric.abbreviation) {
        return metric.abbreviation.toLowerCase();
    }
    return metric.name.replace(/\s+/g, '_').toLowerCase();
}
/**
 * Creates an experiment outcome card displaying metrics results and variant comparisons
 *
 * Card layout: Three-section vertical design
 * - Header: Experiment name, date, and status badge
 * - Metrics Table: Variant performance metrics with uplift percentages, rolled-out indicators
 * - Summary: Recommendation and decision summary
 *
 * Features:
 * - Variant comparison against control (baseline)
 * - Primary metric highlighting with star icon
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
 *   experimentName: 'CTA Button Color Test',
 *   experimentType: 'ab_test',
 *   status: 'completed',
 *   variants: [
 *     { key: 'A', name: 'Control', traffic: 50, metrics: { conversions: 1200 }, isControl: true },
 *     { key: 'B', name: 'Red CTA', traffic: 50, metrics: { conversions: 1450 }, uplift: 20.8 }
 *   ],
 *   metrics: [
 *     { id: 'conv', name: 'Conversions', isPrimary: true }
 *   ]
 * });
 */
export function createExperimentOutcomeCard(data) {
    return __awaiter(this, void 0, void 0, function* () {
        yield loadFonts();
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
        const sections = yield createOutcomeCardSections(data);
        if (sections.headerSection) {
            card.appendChild(sections.headerSection);
        }
        card.appendChild(sections.metricsTable);
        card.appendChild(sections.summarySection);
        return card;
    });
}
export function createOutcomeCardSections(data, options) {
    return __awaiter(this, void 0, void 0, function* () {
        yield loadFonts();
        const includeHeader = (options === null || options === void 0 ? void 0 : options.includeHeader) !== false;
        const headerSection = includeHeader ? yield createHeaderSection(data) : undefined;
        const metricsTable = yield createMetricsTable(data);
        const summarySection = yield createSummarySection(data);
        return { headerSection, metricsTable, summarySection };
    });
}
/**
 * Create header section with experiment name, status, and key metrics context
 * Note: Hypothesis is shown in Info Card, not duplicated here
 */
function createHeaderSection(data) {
    return __awaiter(this, void 0, void 0, function* () {
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
        const contextParts = [];
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
    });
}
/**
 * Create the metrics comparison table
 */
function createMetricsTable(data) {
    return __awaiter(this, void 0, void 0, function* () {
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
        const headerRow = yield createTableHeaderRow(data, data.variants.length);
        table.appendChild(headerRow);
        // Metric rows - one for each metric
        for (let i = 0; i < data.metrics.length; i++) {
            const metric = data.metrics[i];
            const isLast = i === data.metrics.length - 1;
            const metricRow = yield createMetricRow(metric, data.variants, data.primaryMetric, isLast);
            table.appendChild(metricRow);
        }
        return table;
    });
}
/**
 * Create table header row with Goal and variant names (in variant order)
 */
function createTableHeaderRow(data, variantCount) {
    return __awaiter(this, void 0, void 0, function* () {
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
        // If a variant is explicitly marked as baseline/control, it will show the badge in its own header.
        if (data.variants.length > 0) {
            for (const variant of data.variants) {
                const variantHeader = createVariantHeaderCell(variant);
                variantHeader.layoutGrow = 1; // Grow to fill available space
                variantHeader.minWidth = 80;
                row.appendChild(variantHeader);
            }
        }
        else {
            // No variants at all - show a generic "Variant" column name
            const variantHeader = createTableCell('Variant', 100, true, true);
            variantHeader.layoutGrow = 1; // Grow to fill available space (flexible)
            variantHeader.minWidth = 80;
            row.appendChild(variantHeader);
        }
        return row;
    });
}
/**
 * Create a variant header cell with name and optional badges
 */
function createVariantHeaderCell(variant) {
    const variantName = variant.name || `Variant ${variant.key}`;
    // STRICT CHECK: Only show badge if isControl is explicitly boolean true (checkbox checked)
    // Must be boolean true, not just truthy
    const isExplicitlyControl = variant.isControl === true && typeof variant.isControl === 'boolean';
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
/**
 * Create a goal cell showing the target percent (preferred) or legacy range (min-max)
 */
function createGoalCell(metric, isPrimary = false) {
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
        goalText.fontName = getFontStyle(isPrimary ? "Bold" : "Medium");
        goalText.fontSize = TOKENS.fontSizeBodyMd;
        goalText.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textPrimary) }];
        goalText.textAutoResize = "WIDTH_AND_HEIGHT";
        goalText.textAlignHorizontal = "CENTER";
        goalText.characters = `${metric.direction === 'decrease' ? '≤' : '≥'} ${metric.thresholdPct}%`;
        cell.appendChild(goalText);
    }
    else if (metric.min !== undefined && metric.max !== undefined) {
        const goalText = figma.createText();
        goalText.fontName = getFontStyle(isPrimary ? "Bold" : "Medium");
        goalText.fontSize = TOKENS.fontSizeBodyMd;
        goalText.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textPrimary) }];
        goalText.textAutoResize = "WIDTH_AND_HEIGHT";
        goalText.textAlignHorizontal = "CENTER";
        goalText.characters = `${metric.min} - ${metric.max}`;
        cell.appendChild(goalText);
    }
    else {
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
 * Create a baseline cell showing just the control variant value
 * (Name and badge are shown in the header, so we don't repeat them here)
 */
function createBaselineCell(metricData, variant, isPrimary = false) {
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
    cell.name = "Baseline Cell";
    // Main value only (name and badge are in header)
    const valueText = figma.createText();
    valueText.fontName = getFontStyle(isPrimary ? "Bold" : "Medium");
    valueText.fontSize = TOKENS.fontSizeBodyMd;
    valueText.textAutoResize = "WIDTH_AND_HEIGHT";
    valueText.textAlignHorizontal = "CENTER";
    const value = metricData === null || metricData === void 0 ? void 0 : metricData.value;
    valueText.characters = formatMetricValue(value);
    valueText.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textPrimary) }];
    cell.appendChild(valueText);
    return cell;
}
/**
 * Create a metric row with values for all variants
 */
function createMetricRow(metric_1, variants_1, primaryMetric_1) {
    return __awaiter(this, arguments, void 0, function* (metric, variants, primaryMetric, isLast = false) {
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
        const isPrimary = primaryMetric === metricKey || metric.isPrimary === true;
        // Metric name cell (fixed width)
        const metricCell = createMetricNameCell(metric, isPrimary);
        metricCell.layoutGrow = 0; // Don't grow
        row.appendChild(metricCell);
        // Goal cell (fixed width) - shows min-max range
        const goalCell = createGoalCell(metric, isPrimary);
        goalCell.layoutGrow = 0; // Don't grow
        row.appendChild(goalCell);
        // Render variant value cells in the SAME order as provided.
        // Treat the comparison variant (explicit baseline/control if set, otherwise first variant)
        // as the "no-uplift" column, but do NOT move it.
        const comparisonVariant = variants.find(v => v.isControl === true) || variants[0];
        if (variants.length > 0) {
            for (const variant of variants) {
                const metricData = variant.metrics[metricKey];
                const isComparison = !!comparisonVariant && variant.id === comparisonVariant.id;
                const valueCell = createMetricValueCell(metricData, isComparison, isPrimary, metric);
                valueCell.layoutGrow = 1; // Grow to fill available space
                row.appendChild(valueCell);
            }
        }
        else {
            // No variants at all - still render one placeholder value cell to match header.
            const emptyValueCell = createMetricValueCell(undefined, true, isPrimary, metric);
            emptyValueCell.layoutGrow = 1;
            row.appendChild(emptyValueCell);
        }
        return row;
    });
}
/**
 * Create the metric name cell
 */
function createMetricNameCell(metric, isPrimary) {
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
    nameText.fontName = getFontStyle(isPrimary ? "Medium" : "Regular");
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
        subText.characters = metric.abbreviation;
        cell.appendChild(subText);
    }
    return cell;
}
/**
 * Create a metric value cell with uplift indicator
 */
function createMetricValueCell(metricData, isControl = false, isPrimary = false, metric) {
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
    const value = metricData === null || metricData === void 0 ? void 0 : metricData.value;
    const controlPerformance = isControl ? getGoalPerformance(metric, value) : undefined;
    // Add light background color based on variant uplift or control goal performance.
    if (!isControl && (metricData === null || metricData === void 0 ? void 0 : metricData.uplift) !== undefined) {
        const isPositive = metricData.uplift >= 0;
        cell.fills = [{ type: "SOLID", color: hexToRgb(isPositive ? TOKENS.malachite50 : TOKENS.coralRed50) }];
    }
    else if (isControl && controlPerformance !== undefined) {
        cell.fills = [{ type: "SOLID", color: hexToRgb(controlPerformance ? TOKENS.malachite50 : TOKENS.coralRed50) }];
    }
    else {
        cell.fills = [];
    }
    cell.name = "Value Cell";
    // Main value
    const valueText = figma.createText();
    valueText.fontName = getFontStyle(isPrimary ? "Bold" : "Medium");
    valueText.fontSize = TOKENS.fontSizeBodyMd;
    valueText.textAutoResize = "WIDTH_AND_HEIGHT";
    valueText.textAlignHorizontal = "CENTER";
    valueText.characters = formatMetricValue(value, metric);
    valueText.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textPrimary) }];
    cell.appendChild(valueText);
    // Delta row (variants: uplift; control: baseline delta styling)
    const showControlDelta = isControl && value !== undefined;
    const showVariantDelta = !isControl && (metricData === null || metricData === void 0 ? void 0 : metricData.uplift) !== undefined;
    if (showControlDelta || showVariantDelta) {
        const upliftRow = figma.createFrame();
        upliftRow.layoutMode = "HORIZONTAL";
        upliftRow.counterAxisSizingMode = "AUTO";
        upliftRow.primaryAxisSizingMode = "AUTO";
        upliftRow.itemSpacing = 4;
        upliftRow.counterAxisAlignItems = "CENTER";
        upliftRow.fills = [];
        upliftRow.name = "Uplift Row";
        // Uplift value with color based on direction
        const uplift = showVariantDelta ? metricData.uplift : 0;
        let upliftColor = TOKENS.textTertiary;
        if (showVariantDelta) {
            const isPositive = uplift >= 0;
            upliftColor = isPositive ? TOKENS.malachite600 : TOKENS.coralRed500;
        }
        else if (controlPerformance !== undefined) {
            upliftColor = controlPerformance ? TOKENS.malachite600 : TOKENS.coralRed500;
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
function createTableCell(content, width, isHeader = false, alignCenter = true) {
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
function createSummarySection(data) {
    return __awaiter(this, void 0, void 0, function* () {
        const section = figma.createFrame();
        section.layoutMode = "VERTICAL";
        section.counterAxisSizingMode = "AUTO";
        section.primaryAxisSizingMode = "AUTO";
        section.itemSpacing = 8;
        section.paddingTop = section.paddingBottom = 12;
        section.paddingLeft = section.paddingRight = 12;
        section.cornerRadius = 8;
        section.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.fillsSurface) }];
        section.strokes = [{ type: "SOLID", color: hexToRgb(TOKENS.border) }];
        section.strokeWeight = 1;
        section.name = "Outcome Section";
        section.layoutAlign = "STRETCH";
        const outcome = classifyOutcomeState(data);
        const primaryMetricDef = data.metrics.find(m => getMetricKey(m) === data.primaryMetric || m.isPrimary);
        const primaryMetricKey = data.primaryMetric || (primaryMetricDef ? getMetricKey(primaryMetricDef) : undefined);
        const primaryMetricLabel = (primaryMetricDef === null || primaryMetricDef === void 0 ? void 0 : primaryMetricDef.abbreviation) || (primaryMetricDef === null || primaryMetricDef === void 0 ? void 0 : primaryMetricDef.name) || "primary metric";
        // Header (styled same as section labels)
        const headerText = figma.createText();
        headerText.fontName = getFontStyle("Medium");
        headerText.fontSize = TOKENS.fontSizeLabel;
        headerText.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textPrimary) }];
        headerText.opacity = 0.5;
        headerText.textAutoResize = "WIDTH_AND_HEIGHT";
        headerText.characters = "Outcome";
        section.appendChild(headerText);
        const outcomeDetail = figma.createText();
        outcomeDetail.fontName = getFontStyle("Medium");
        outcomeDetail.fontSize = TOKENS.fontSizeBodyMd;
        outcomeDetail.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textPrimary) }];
        outcomeDetail.textAutoResize = "WIDTH_AND_HEIGHT";
        outcomeDetail.characters = outcome.detail;
        section.appendChild(outcomeDetail);
        const rolledOutVariant = data.variants.find(v => v.isRolledOut);
        if (rolledOutVariant) {
            const rolledOutMetric = primaryMetricKey ? rolledOutVariant.metrics[primaryMetricKey] : undefined;
            const upliftText = (rolledOutMetric === null || rolledOutMetric === void 0 ? void 0 : rolledOutMetric.uplift) !== undefined ? formatUplift(rolledOutMetric.uplift) : "--";
            const rolledOutLine = figma.createText();
            rolledOutLine.fontName = getFontStyle("Medium");
            rolledOutLine.fontSize = TOKENS.fontSizeBodyMd;
            rolledOutLine.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textPrimary) }];
            rolledOutLine.textAutoResize = "WIDTH_AND_HEIGHT";
            rolledOutLine.characters = `Rolled out: ${rolledOutVariant.name} (${upliftText} ${primaryMetricLabel})`;
            section.appendChild(rolledOutLine);
        }
        return section;
    });
}
/**
 * Convenience function to create an outcome card from experiment info card data
 *
 * Bridges the data structure used in experiment-info-card with the outcome card format.
 * Automatically:
 * - Identifies control variant (must be explicitly marked with isControl: true)
 * - Calculates uplift percentages for each metric vs control
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
 *   'New CTA Button',
 *   [{ id: 'conv', name: 'Conversions', isPrimary: true }],
 *   [
 *     { key: 'A', name: 'Control', traffic: 50, isControl: true, metrics: { conversions: 100 } },
 *     { key: 'B', name: 'Red', traffic: 50, metrics: { conversions: 120 } }
 *   ],
 *   { status: 'completed' }
 * );
 */
export function createOutcomeCardFromExperimentData(experimentName, metrics, variants, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = mapExperimentDataToOutcomeData(experimentName, metrics, variants, options);
        return createExperimentOutcomeCard(data);
    });
}
export function mapExperimentDataToOutcomeData(experimentName, metrics, variants, options) {
    // Find control variant (only if explicitly marked as control, otherwise use first variant for comparison)
    const trueControlVariant = variants.find(v => v.isControl === true);
    const controlVariant = trueControlVariant || variants[0];
    // Convert variants to outcome format with uplift calculations
    const variantOutcomes = variants.map((v, index) => {
        var _a, _b, _c, _d;
        // Only set isControl to true if explicitly marked as control (isControl === true)
        // Don't set it to true just because it's the first variant
        const isControl = v.isControl === true;
        const outcomeMetrics = {};
        for (const metric of metrics) {
            const metricKey = getMetricKey(metric);
            const rawValue = (_b = (_a = v.metrics) === null || _a === void 0 ? void 0 : _a[metricKey]) !== null && _b !== void 0 ? _b : 0;
            const rawControlValue = (_d = (_c = controlVariant === null || controlVariant === void 0 ? void 0 : controlVariant.metrics) === null || _c === void 0 ? void 0 : _c[metricKey]) !== null && _d !== void 0 ? _d : 0;
            const value = normalizeMetricValueForComparison(metric, rawValue);
            const controlValue = normalizeMetricValueForComparison(metric, rawControlValue);
            // Calculate uplift vs control
            let uplift;
            if (!isControl && controlValue > 0) {
                uplift = ((value - controlValue) / controlValue) * 100;
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
            isControl,
            traffic: v.traffic,
            metrics: outcomeMetrics,
            isRolledOut: v.isRolledOut,
        };
    });
    return {
        experimentName,
        experimentType: options === null || options === void 0 ? void 0 : options.experimentType,
        hypothesis: options === null || options === void 0 ? void 0 : options.hypothesis,
        startDate: options === null || options === void 0 ? void 0 : options.startDate,
        endDate: options === null || options === void 0 ? void 0 : options.endDate,
        audience: options === null || options === void 0 ? void 0 : options.audience,
        totalSampleSize: options === null || options === void 0 ? void 0 : options.totalSampleSize,
        status: (options === null || options === void 0 ? void 0 : options.status) || 'running',
        primaryMetric: options === null || options === void 0 ? void 0 : options.primaryMetric,
        metrics,
        variants: variantOutcomes,
        dateCreated: options === null || options === void 0 ? void 0 : options.dateCreated,
    };
}
