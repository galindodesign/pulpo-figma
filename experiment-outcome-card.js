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
import { applyCardShell, applySectionPanel, applyTableHeaderRow, applyTableRowDivider, applyTableShell } from "./canvas-theme";
import { hexToRgb, createBadge } from "./layout-utils";
import { loadFonts } from "./load-fonts";
import { EXPERIMENT_STATUS_STYLES, SUMMARY_TYPOGRAPHY, SUMMARY_BULLET_PX, SECTION_PANEL_LAYOUT, createOverviewSectionTitle, styleOverviewText, formatDateForDisplay, getExperimentTypeLabel, createRolledOutBadge, resolveExperimentDisplayStatus, } from "./experiment-card-shared";
function getOutcomeSummaryBadge(data) {
    const hasRollout = data.variants.some(v => v.isRolledOut);
    const displayStatus = resolveExperimentDisplayStatus(data.status, hasRollout);
    const config = EXPERIMENT_STATUS_STYLES[displayStatus] || EXPERIMENT_STATUS_STYLES.running;
    return {
        label: config.label,
        bgColor: config.bgColor,
        borderColor: config.borderColor,
        textColor: config.textColor,
    };
}
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
    if (metric.direction === "neutral")
        return undefined;
    if (metric.direction === "decrease")
        return value <= metric.thresholdPct;
    return value >= metric.thresholdPct;
}
function variantDisplayName(variant) {
    return variant.name || `Variant ${variant.key}`;
}
function firstGoalLabel(goal) {
    return goal ? getMetricDisplayName(goal) : "Goal 1";
}
function goalTargetSuffix(goalMet) {
    if (goalMet === true)
        return ", on target";
    if (goalMet === false)
        return ", below target";
    return "";
}
function supportingGoalsBelowTargetDetail(failed) {
    if (failed <= 0)
        return "";
    return `${failed} other goal${failed === 1 ? "" : "s"} below target.`;
}
function sampleSizePhrase(totalSampleSize) {
    return totalSampleSize
        ? `${totalSampleSize.toLocaleString()} users`
        : "your sample size goal";
}
function goalPerformancePhrase(goalMet) {
    if (goalMet === true)
        return "on target";
    if (goalMet === false)
        return "below target";
    return "no target set";
}
function shouldShowEmbeddedNextStep(data) {
    const hasRollout = data.variants.some(v => v.isRolledOut);
    if (data.status === "rolled_out" || hasRollout)
        return false;
    if (data.status === "running" || data.status === "paused")
        return false;
    return true;
}
function classifyOutcomeState(data, options) {
    var _a, _b;
    const embeddedInOverview = (options === null || options === void 0 ? void 0 : options.embeddedInOverview) === true;
    const showTargetInCopy = !embeddedInOverview;
    const rolledOutVariant = data.variants.find(v => v.isRolledOut);
    const leadingGoal = getLeadingGoal(data);
    const leadingVariant = leadingGoal ? getLeadingVariant(data, leadingGoal) : undefined;
    const goalMet = leadingGoal && leadingVariant
        ? getGoalPerformance(leadingGoal, (_a = leadingVariant.metrics[getMetricKey(leadingGoal)]) === null || _a === void 0 ? void 0 : _a.value)
        : undefined;
    const focusVariant = rolledOutVariant || leadingVariant;
    const supportingIssues = focusVariant
        ? countSupportingGoalRegressions(data, focusVariant)
        : { failed: 0, total: 0 };
    const goalLabel = firstGoalLabel(leadingGoal);
    const leaderName = leadingVariant ? variantDisplayName(leadingVariant) : undefined;
    const facts = buildOutcomeFacts(data, leadingGoal, leadingVariant, {
        compact: (options === null || options === void 0 ? void 0 : options.compact) === true,
        embeddedInOverview,
        supportingIssuesFailed: supportingIssues.failed,
        rolledOutVariant,
    });
    if (data.status === "draft") {
        return {
            state: "inconclusive",
            headline: "Add goals and variant results to compare",
            detail: "",
            facts: [],
            nextStep: "Set status to Running when the test is live.",
        };
    }
    if (data.status === "running") {
        return {
            state: "running",
            headline: leaderName
                ? `${leaderName} leads on ${goalLabel}${showTargetInCopy ? goalTargetSuffix(goalMet) : ""}`
                : "Add variant results to compare",
            detail: "",
            facts,
            nextStep: embeddedInOverview
                ? ""
                : `Keep running until you reach ${sampleSizePhrase(data.totalSampleSize)} or your ${goalLabel} target.`,
        };
    }
    if (data.status === "paused") {
        return {
            state: "paused",
            headline: leaderName
                ? `Paused — ${leaderName} was leading on ${goalLabel}`
                : "Test paused",
            detail: "",
            facts,
            nextStep: embeddedInOverview ? "" : "Resume the test or mark it concluded.",
        };
    }
    if (data.status === "rolled_out" || rolledOutVariant) {
        const chosenVariant = rolledOutVariant || leadingVariant;
        const chosenName = chosenVariant ? variantDisplayName(chosenVariant) : undefined;
        const chosenGoalMet = leadingGoal && chosenVariant
            ? getGoalPerformance(leadingGoal, (_b = chosenVariant.metrics[getMetricKey(leadingGoal)]) === null || _b === void 0 ? void 0 : _b.value)
            : undefined;
        const rolloutDiffersFromLeader = !!(rolledOutVariant &&
            leadingVariant &&
            rolledOutVariant.id !== leadingVariant.id);
        let headline = chosenName ? `${chosenName} rolled out` : "Rolled out";
        if (chosenName && !rolloutDiffersFromLeader && showTargetInCopy && chosenGoalMet !== undefined) {
            headline = `${chosenName} rolled out${goalTargetSuffix(chosenGoalMet)}`;
        }
        let detail = "";
        if (rolloutDiffersFromLeader && leaderName && chosenName) {
            detail = `${leaderName} led on ${goalLabel}, but the team rolled out ${chosenName}.`;
        }
        else if (!embeddedInOverview) {
            detail = supportingGoalsBelowTargetDetail(supportingIssues.failed);
        }
        return {
            state: "rolled_out",
            headline,
            detail,
            facts,
            nextStep: embeddedInOverview
                ? ""
                : supportingIssues.failed > 0
                    ? "Watch the other goals in production."
                    : "Confirm results hold in production.",
        };
    }
    if (data.status === "completed" && leadingGoal && leadingVariant) {
        const leader = variantDisplayName(leadingVariant);
        let nextStep = "Pick a rolled-out variant in Details when the team agrees.";
        if (supportingIssues.failed > 0) {
            nextStep = "Review trade-offs, then pick a rolled-out variant in Details.";
        }
        else if (goalMet === false) {
            nextStep = "Extend the test, or pick a rolled-out variant in Details if the team accepts it.";
        }
        return {
            state: "recommendation",
            headline: goalMet === false && showTargetInCopy
                ? `${leader} leads on ${goalLabel}, but below target`
                : `${leader} leads on ${goalLabel}`,
            detail: !embeddedInOverview && supportingIssues.failed > 0
                ? supportingGoalsBelowTargetDetail(supportingIssues.failed)
                : "",
            facts,
            nextStep,
        };
    }
    let headline = "Not enough to compare yet";
    if (!leadingGoal || data.metrics.length === 0) {
        headline = "Add a goal to compare variants";
    }
    else if (!leadingVariant) {
        headline = data.status === "completed"
            ? "Add variant results to compare"
            : `${goalLabel}: no clear leader yet`;
    }
    else {
        headline = "Choose a rollout variant";
    }
    return {
        state: "inconclusive",
        headline,
        detail: "",
        facts,
        nextStep: data.variants.length >= 2
            ? "Use the results table, then pick a rolled-out variant in Details when the team aligns."
            : "Add goals and variant results first.",
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
function getMetricDisplayName(metric) {
    const name = (metric.name || '').trim();
    const abbreviation = (metric.abbreviation || '').trim();
    if (!abbreviation || abbreviation.toLowerCase() === name.toLowerCase()) {
        return name;
    }
    return `${name} (${abbreviation})`;
}
/** Goal #1 — first goal in list order (drag priority). Legacy fallbacks for older saves. */
function getLeadingGoal(data) {
    if (data.metrics.length > 0) {
        return data.metrics[0];
    }
    if (data.primaryMetric) {
        const legacyKey = data.primaryMetric.trim().toLowerCase();
        const matchedMetric = data.metrics.find(metric => {
            var _a;
            return (metric.id.toLowerCase() === legacyKey ||
                getMetricKey(metric) === legacyKey ||
                metric.name.toLowerCase() === legacyKey ||
                ((_a = metric.abbreviation) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === legacyKey);
        });
        if (matchedMetric) {
            return matchedMetric;
        }
    }
    return data.metrics.find(metric => metric.isPrimary) || data.metrics[0];
}
function getComparisonVariant(data) {
    return data.variants.find(variant => variant.isControl === true);
}
function getLeadingVariant(data, metric) {
    if (metric.direction === "neutral") {
        return undefined;
    }
    const metricKey = getMetricKey(metric);
    const variantsWithValue = data.variants.filter(variant => {
        var _a;
        const value = (_a = variant.metrics[metricKey]) === null || _a === void 0 ? void 0 : _a.value;
        return typeof value === "number" && Number.isFinite(value);
    });
    if (variantsWithValue.length === 0) {
        return undefined;
    }
    return variantsWithValue.reduce((bestVariant, candidateVariant) => {
        var _a, _b, _c, _d;
        const bestValue = (_b = (_a = bestVariant.metrics[metricKey]) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : 0;
        const candidateValue = (_d = (_c = candidateVariant.metrics[metricKey]) === null || _c === void 0 ? void 0 : _c.value) !== null && _d !== void 0 ? _d : 0;
        if (metric.direction === "decrease") {
            return candidateValue < bestValue ? candidateVariant : bestVariant;
        }
        return candidateValue > bestValue ? candidateVariant : bestVariant;
    });
}
function formatLeadingGoalFact(goalIndex, metric, variant) {
    const metricData = variant.metrics[getMetricKey(metric)];
    const metricValue = formatMetricValue(metricData === null || metricData === void 0 ? void 0 : metricData.value, metric);
    const goalPerformance = getGoalPerformance(metric, metricData === null || metricData === void 0 ? void 0 : metricData.value);
    const goalLabel = getMetricDisplayName(metric);
    return `${variantDisplayName(variant)} leads Goal ${goalIndex} (${goalLabel}) at ${metricValue} — ${goalPerformancePhrase(goalPerformance)}`;
}
function getCloseCallFact(data, metric, leadingVariant) {
    var _a, _b;
    const metricKey = getMetricKey(metric);
    const leadingValue = (_a = leadingVariant.metrics[metricKey]) === null || _a === void 0 ? void 0 : _a.value;
    if (leadingValue === undefined || leadingValue === null) {
        return undefined;
    }
    let closest;
    for (const candidate of data.variants) {
        if (candidate.id === leadingVariant.id)
            continue;
        const candidateValue = (_b = candidate.metrics[metricKey]) === null || _b === void 0 ? void 0 : _b.value;
        if (candidateValue === undefined || candidateValue === null)
            continue;
        const rawGap = Math.abs(leadingValue - candidateValue);
        const gapPp = isPercentageMetric(metric)
            ? (leadingValue >= 0 && leadingValue <= 1 && candidateValue >= 0 && candidateValue <= 1 ? rawGap * 100 : rawGap)
            : rawGap;
        if (gapPp <= 1 && (!closest || gapPp < closest.gapPp)) {
            closest = {
                name: candidate.name || `Variant ${candidate.key}`,
                gapPp,
            };
        }
    }
    if (!closest)
        return undefined;
    const metricLabel = metric.abbreviation || metric.name;
    return `${closest.name} is within ${closest.gapPp.toFixed(1)}pp on ${metricLabel} — almost tied.`;
}
function summarizeSupportingGoals(data, variant, maxGoals = 3) {
    const supportingGoals = data.metrics.slice(1);
    if (supportingGoals.length === 0) {
        return [];
    }
    const facts = [];
    for (let i = 0; i < supportingGoals.length && facts.length < maxGoals; i++) {
        const metric = supportingGoals[i];
        const goalNum = i + 2;
        const metricData = variant.metrics[getMetricKey(metric)];
        if (!metricData || metricData.value === undefined) {
            continue;
        }
        const metricValue = formatMetricValue(metricData.value, metric);
        const goalPerformance = getGoalPerformance(metric, metricData.value);
        const goalLabel = goalPerformance === undefined ? "no target set" : goalPerformance ? "on target" : "below target";
        facts.push(`Goal ${goalNum} (${metric.name}): ${metricValue} — ${goalLabel}`);
    }
    const remaining = supportingGoals.length - maxGoals;
    if (remaining > 0) {
        facts.push(`+ ${remaining} more goal${remaining === 1 ? "" : "s"} in table`);
    }
    return facts;
}
/** Supporting goals with thresholds only (no control/uplift). */
function countSupportingGoalRegressions(data, variant) {
    let failed = 0;
    let total = 0;
    for (const metric of data.metrics.slice(1)) {
        if (metric.direction === "neutral")
            continue;
        const metricData = variant.metrics[getMetricKey(metric)];
        if (!metricData || metricData.value === undefined)
            continue;
        const goalPerformance = getGoalPerformance(metric, metricData.value);
        if (goalPerformance === undefined)
            continue;
        total += 1;
        if (!goalPerformance) {
            failed += 1;
        }
    }
    return { failed, total };
}
function buildOutcomeFacts(data, leadingGoal, leadingVariant, options) {
    var _a;
    const compact = (options === null || options === void 0 ? void 0 : options.compact) === true;
    const embedded = (options === null || options === void 0 ? void 0 : options.embeddedInOverview) === true;
    const supportingFailed = (_a = options === null || options === void 0 ? void 0 : options.supportingIssuesFailed) !== null && _a !== void 0 ? _a : 0;
    if (embedded) {
        return [];
    }
    const facts = [];
    if (leadingGoal && leadingVariant) {
        facts.push(formatLeadingGoalFact(1, leadingGoal, leadingVariant));
        const closeCall = getCloseCallFact(data, leadingGoal, leadingVariant);
        if (closeCall) {
            facts.push(closeCall);
        }
    }
    const focusVariant = data.variants.find(v => v.isRolledOut) || leadingVariant;
    if (focusVariant && supportingFailed > 0 && !compact) {
        facts.push(supportingGoalsBelowTargetDetail(supportingFailed));
    }
    else if (focusVariant && !compact) {
        facts.push(...summarizeSupportingGoals(data, focusVariant));
    }
    return compact ? facts.slice(0, 1) : facts;
}
const OUTCOME_SUMMARY_MIN_WIDTH = 728;
function setWrappedText(text, characters, width) {
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
export function createExperimentOutcomeCard(data) {
    return __awaiter(this, void 0, void 0, function* () {
        yield loadFonts();
        const card = figma.createFrame();
        card.name = `Experiment Metrics — ${data.experimentName}`;
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
        const metricsTable = yield createMetricsTablesSection(data);
        const summarySection = yield createSummarySection(data, { embedded: (options === null || options === void 0 ? void 0 : options.embeddedSummary) === true });
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
        styleOverviewText(dateLabel, "caption");
        dateLabel.textAutoResize = "WIDTH_AND_HEIGHT";
        dateLabel.characters = dateFormatted;
        dateLabel.name = "Date Created Label";
        section.appendChild(dateLabel);
        // Status badge — chip style matching ui.html `.variant-passive-chip`
        const statusConfig = EXPERIMENT_STATUS_STYLES[data.status] || EXPERIMENT_STATUS_STYLES.running;
        const statusBadge = data.status === 'rolled_out'
            ? createRolledOutBadge()
            : createBadge(statusConfig.label, 'chip', statusConfig.bgColor, statusConfig.textColor, undefined, statusConfig.borderColor);
        section.appendChild(statusBadge);
        // Experiment name (Bold, 24px)
        const titleText = figma.createText();
        styleOverviewText(titleText, "cardTitle");
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
            styleOverviewText(contextText, "caption");
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
function createMetricsTablesSection(data) {
    return __awaiter(this, void 0, void 0, function* () {
        const section = figma.createFrame();
        section.layoutMode = "VERTICAL";
        section.counterAxisSizingMode = "FIXED";
        section.primaryAxisSizingMode = "AUTO";
        section.layoutAlign = "STRETCH";
        section.itemSpacing = SECTION_PANEL_LAYOUT.panelItemSpacing;
        section.layoutAlign = "STRETCH";
        section.fills = [];
        section.name = "Metrics Tables";
        const flippedMetricsTable = yield createFlippedMetricsTable(data);
        section.appendChild(flippedMetricsTable);
        const hasRolledOut = data.variants.some(v => v.isRolledOut);
        const legend = figma.createText();
        styleOverviewText(legend, "caption");
        legend.textAutoResize = "WIDTH_AND_HEIGHT";
        legend.characters = hasRolledOut
            ? "Highlighted cells show entered values for the rolled-out variant."
            : "Green = at or above target · Red = below target · Values are as entered";
        legend.name = "Table Legend";
        section.appendChild(legend);
        return section;
    });
}
function createMetricsTable(data) {
    return __awaiter(this, void 0, void 0, function* () {
        const table = figma.createFrame();
        table.layoutMode = "VERTICAL";
        table.counterAxisSizingMode = "FIXED"; // Fixed width to allow stretch
        table.primaryAxisSizingMode = "AUTO"; // Hug height
        table.layoutAlign = "STRETCH"; // Stretch to parent width
        table.itemSpacing = 0;
        applyTableShell(table);
        table.cornerRadius = TOKENS.radiusSM;
        table.name = "Metrics Table";
        // Table header row
        const headerRow = yield createTableHeaderRow(data, data.variants.length);
        table.appendChild(headerRow);
        // Metric rows - one for each metric
        for (let i = 0; i < data.metrics.length; i++) {
            const metric = data.metrics[i];
            const isLast = i === data.metrics.length - 1;
            const metricRow = yield createMetricRow(metric, data.variants, isLast, data);
            table.appendChild(metricRow);
        }
        return table;
    });
}
function createFlippedMetricsTable(data) {
    return __awaiter(this, void 0, void 0, function* () {
        const table = figma.createFrame();
        table.layoutMode = "VERTICAL";
        table.counterAxisSizingMode = "FIXED";
        table.primaryAxisSizingMode = "AUTO";
        table.layoutAlign = "STRETCH";
        table.itemSpacing = 0;
        applyTableShell(table);
        table.cornerRadius = TOKENS.radiusSM;
        table.name = "Metrics Table — Variants as Rows";
        const headerRow = yield createFlippedTableHeaderRow(data.metrics);
        table.appendChild(headerRow);
        if (data.variants.length > 0) {
            const comparisonVariant = getComparisonVariant(data);
            for (let i = 0; i < data.variants.length; i++) {
                const variant = data.variants[i];
                const isLast = i === data.variants.length - 1;
                const variantRow = yield createVariantMetricRow(variant, data.metrics, comparisonVariant, isLast, data);
                table.appendChild(variantRow);
            }
        }
        else {
            const emptyRow = yield createEmptyVariantMetricRow(data.metrics);
            table.appendChild(emptyRow);
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
        applyTableHeaderRow(row);
        row.name = "Header Row";
        // First column: Metric label (fixed width)
        const metricHeader = createTableCell('Goal', 140, true, false);
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
function createFlippedTableHeaderRow(metrics) {
    return __awaiter(this, void 0, void 0, function* () {
        const row = figma.createFrame();
        row.layoutMode = "HORIZONTAL";
        row.counterAxisSizingMode = "AUTO";
        row.primaryAxisSizingMode = "FIXED";
        row.layoutAlign = "STRETCH";
        row.counterAxisAlignItems = "MIN";
        row.minHeight = 48;
        applyTableHeaderRow(row);
        row.name = "Flipped Header Row";
        const variantHeader = createTableCell('Variant', 200, true, false);
        variantHeader.layoutGrow = 0;
        variantHeader.layoutAlign = "STRETCH";
        row.appendChild(variantHeader);
        if (metrics.length > 0) {
            for (let i = 0; i < metrics.length; i++) {
                const metricHeader = createFlippedMetricHeaderCell(metrics[i]);
                metricHeader.layoutGrow = 1;
                metricHeader.layoutAlign = "STRETCH";
                row.appendChild(metricHeader);
            }
        }
        else {
            const metricHeader = createTableCell('Metric', 120, true, true);
            metricHeader.layoutGrow = 1;
            metricHeader.layoutAlign = "STRETCH";
            row.appendChild(metricHeader);
        }
        return row;
    });
}
/**
 * Create a variant header cell with name
 */
function createVariantHeaderCell(variant) {
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
    styleOverviewText(nameText, "tableHeader");
    nameText.textAutoResize = "WIDTH_AND_HEIGHT";
    nameText.characters = variantName;
    cell.appendChild(nameText);
    return cell;
}
function createFlippedMetricHeaderCell(metric) {
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
    styleOverviewText(metricText, "tableHeader");
    metricText.textAlignHorizontal = "CENTER";
    metricText.characters = getMetricDisplayName(metric);
    metricText.textAutoResize = "HEIGHT";
    metricText.layoutAlign = "STRETCH";
    cell.appendChild(metricText);
    const goalLabel = getGoalLabel(metric);
    if (goalLabel !== '--') {
        const goalText = figma.createText();
        styleOverviewText(goalText, "caption");
        goalText.textAlignHorizontal = "CENTER";
        goalText.characters = goalLabel;
        goalText.textAutoResize = "HEIGHT";
        goalText.layoutAlign = "STRETCH";
        cell.appendChild(goalText);
    }
    return cell;
}
function getGoalLabel(metric) {
    if (typeof metric.thresholdPct === 'number' && Number.isFinite(metric.thresholdPct)) {
        return `${getGoalDirectionArrow(metric)} ${metric.thresholdPct}%`;
    }
    if (metric.min !== undefined && metric.max !== undefined) {
        return `${metric.min} - ${metric.max}`;
    }
    return '--';
}
function getGoalDirectionArrow(metric) {
    if (metric.direction === 'decrease')
        return '↓';
    if (metric.direction === 'neutral')
        return '→';
    return '↑';
}
/**
 * Create a goal cell showing the target percent (preferred) or legacy range (min-max)
 */
function createGoalCell(metric) {
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
        styleOverviewText(goalText, "fieldValue");
        goalText.textAutoResize = "WIDTH_AND_HEIGHT";
        goalText.textAlignHorizontal = "CENTER";
        goalText.characters = `${getGoalDirectionArrow(metric)} ${metric.thresholdPct}%`;
        cell.appendChild(goalText);
    }
    else if (metric.min !== undefined && metric.max !== undefined) {
        const goalText = figma.createText();
        styleOverviewText(goalText, "fieldValue");
        goalText.textAutoResize = "WIDTH_AND_HEIGHT";
        goalText.textAlignHorizontal = "CENTER";
        goalText.characters = `${metric.min} - ${metric.max}`;
        cell.appendChild(goalText);
    }
    else {
        const noGoalText = figma.createText();
        styleOverviewText(noGoalText, "caption");
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
function createComparisonCell(metricData, variant) {
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
    styleOverviewText(valueText, "fieldValue");
    valueText.textAutoResize = "WIDTH_AND_HEIGHT";
    valueText.textAlignHorizontal = "CENTER";
    const value = metricData === null || metricData === void 0 ? void 0 : metricData.value;
    valueText.characters = formatMetricValue(value);
    cell.appendChild(valueText);
    return cell;
}
/**
 * Create a metric row with values for all variants
 */
function createMetricRow(metric_1, variants_1) {
    return __awaiter(this, arguments, void 0, function* (metric, variants, isLast = false, data) {
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
            applyTableRowDivider(row);
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
        const comparisonVariant = variants.find(v => v.isControl === true);
        if (variants.length > 0) {
            for (const variant of variants) {
                const metricData = variant.metrics[metricKey];
                const isComparison = !!comparisonVariant && variant.id === comparisonVariant.id;
                const highlight = data ? getCellHighlight(variant, metric, data, comparisonVariant) : 'none';
                const valueCell = createMetricValueCell(metricData, isComparison, metric, highlight);
                valueCell.layoutGrow = 1; // Grow to fill available space
                row.appendChild(valueCell);
            }
        }
        else {
            const emptyValueCell = createMetricValueCell(undefined, true, metric);
            emptyValueCell.layoutGrow = 1;
            row.appendChild(emptyValueCell);
        }
        return row;
    });
}
function createVariantMetricRow(variant_1, metrics_1, comparisonVariant_1) {
    return __awaiter(this, arguments, void 0, function* (variant, metrics, comparisonVariant, isLast = false, data) {
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
            applyTableRowDivider(row);
        }
        row.name = `Variant Row: ${variant.name || variant.key}`;
        const variantCell = createVariantNameCell(variant, (data === null || data === void 0 ? void 0 : data.showVariantTouchpointName) === true);
        variantCell.layoutGrow = 0;
        row.appendChild(variantCell);
        if (metrics.length > 0) {
            for (const metric of metrics) {
                const metricKey = getMetricKey(metric);
                const metricData = variant.metrics[metricKey];
                const isComparison = !!comparisonVariant && variant.id === comparisonVariant.id;
                const highlight = data ? getCellHighlight(variant, metric, data, comparisonVariant) : 'none';
                const valueCell = createMetricValueCell(metricData, isComparison, metric, highlight);
                valueCell.layoutGrow = 1;
                row.appendChild(valueCell);
            }
        }
        else {
            const emptyValueCell = createMetricValueCell(undefined, true);
            emptyValueCell.layoutGrow = 1;
            row.appendChild(emptyValueCell);
        }
        return row;
    });
}
function createEmptyVariantMetricRow(metrics) {
    return __awaiter(this, void 0, void 0, function* () {
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
    });
}
function createVariantNameCell(variant, showTouchpointName = false) {
    var _a;
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
    styleOverviewText(nameText, "fieldValue");
    nameText.textAutoResize = "WIDTH_AND_HEIGHT";
    nameText.characters = variantName;
    nameRow.appendChild(nameText);
    if (variant.isRolledOut) {
        nameRow.appendChild(createRolledOutBadge());
    }
    cell.appendChild(nameRow);
    if (showTouchpointName && ((_a = variant.parentEventName) === null || _a === void 0 ? void 0 : _a.trim())) {
        const touchpointText = figma.createText();
        styleOverviewText(touchpointText, "caption");
        touchpointText.textAutoResize = "WIDTH_AND_HEIGHT";
        touchpointText.characters = variant.parentEventName.trim();
        cell.appendChild(touchpointText);
    }
    if (variant.figmaLink) {
        const linkText = figma.createText();
        styleOverviewText(linkText, "link");
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
function createMetricNameCell(metric) {
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
    styleOverviewText(nameText, "fieldValue");
    nameText.textAutoResize = "WIDTH_AND_HEIGHT";
    nameText.characters = metric.name;
    nameRow.appendChild(nameText);
    cell.appendChild(nameRow);
    // Sub-info row: abbreviation only (range moved to value cell)
    const hasAbbrev = metric.abbreviation && metric.abbreviation !== metric.name;
    if (hasAbbrev) {
        const subText = figma.createText();
        styleOverviewText(subText, "caption");
        subText.textAutoResize = "WIDTH_AND_HEIGHT";
        subText.characters = metric.abbreviation;
        cell.appendChild(subText);
    }
    return cell;
}
/**
 * Decide whether a metric value cell on the rolled-out (or leading) variant
 * row should be highlighted, and if so whether positively or negatively.
 *
 * Returns 'positive' (green), 'negative' (red), or 'none' (no fill).
 */
function getCellHighlight(variant, metric, data, comparisonVariant) {
    var _a;
    const rolledOutVariant = data.variants.find(v => v.isRolledOut);
    const leadingGoal = getLeadingGoal(data);
    const isRolledOutRow = !!rolledOutVariant && variant.id === rolledOutVariant.id;
    const isLeadingRow = !rolledOutVariant
        && (data.status === 'completed' || data.status === 'rolled_out')
        && !!leadingGoal
        && ((_a = getLeadingVariant(data, leadingGoal)) === null || _a === void 0 ? void 0 : _a.id) === variant.id;
    if (!isRolledOutRow && !isLeadingRow)
        return 'none';
    // For the leading (pre-rollout) row, only highlight the Goal #1 column.
    if (isLeadingRow && leadingGoal && getMetricKey(metric) !== getMetricKey(leadingGoal)) {
        return 'none';
    }
    const metricKey = getMetricKey(metric);
    const metricData = variant.metrics[metricKey];
    if (!metricData || metricData.value === undefined)
        return 'none';
    // When a comparison variant exists, judge by direction-aware change.
    if (comparisonVariant && variant.id !== comparisonVariant.id && metricData.uplift !== undefined) {
        const directionIsDecrease = metric.direction === 'decrease';
        const changeIsGood = directionIsDecrease
            ? metricData.uplift <= 0
            : metricData.uplift >= 0;
        return changeIsGood ? 'positive' : 'negative';
    }
    // Fallback: use goal threshold when no legacy control uplift is available.
    const goalPerformance = getGoalPerformance(metric, metricData.value);
    if (goalPerformance !== undefined) {
        return goalPerformance ? 'positive' : 'negative';
    }
    // Goal #1 on rolled-out row with no other signal: mild positive.
    if (isRolledOutRow && leadingGoal && getMetricKey(metric) === getMetricKey(leadingGoal)) {
        return 'positive';
    }
    return 'none';
}
/**
 * Cell highlight contract (rollout-only, table layer):
 * - Green fill: rolled-out or leading variant on Goal #1 / supporting goals
 *   that meet threshold or beat a legacy control uplift when present.
 * - Red fill: missed goal threshold or unfavorable legacy control uplift.
 * - No fill: other variants and cells without a signal.
 */
function createMetricValueCell(metricData, isComparisonVariant = false, metric, highlight = 'none') {
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
    if (highlight === 'positive') {
        cell.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.malachite50) }];
    }
    else if (highlight === 'negative') {
        cell.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.coralRed50) }];
    }
    else {
        cell.fills = [];
    }
    cell.name = "Value Cell";
    // Main value
    const value = metricData === null || metricData === void 0 ? void 0 : metricData.value;
    const valueText = figma.createText();
    styleOverviewText(valueText, "fieldValue");
    valueText.textAutoResize = "WIDTH_AND_HEIGHT";
    valueText.textAlignHorizontal = "CENTER";
    valueText.characters = formatMetricValue(value, metric);
    cell.appendChild(valueText);
    // Delta row (only shown when change is available from an explicit comparison variant)
    const showVariantDelta = !isComparisonVariant && (metricData === null || metricData === void 0 ? void 0 : metricData.uplift) !== undefined;
    if (showVariantDelta) {
        const upliftRow = figma.createFrame();
        upliftRow.layoutMode = "HORIZONTAL";
        upliftRow.counterAxisSizingMode = "AUTO";
        upliftRow.primaryAxisSizingMode = "AUTO";
        upliftRow.itemSpacing = 4;
        upliftRow.counterAxisAlignItems = "CENTER";
        upliftRow.fills = [];
        upliftRow.name = "Uplift Row";
        const uplift = metricData.uplift;
        const directionIsDecrease = (metric === null || metric === void 0 ? void 0 : metric.direction) === 'decrease';
        const changeIsGood = directionIsDecrease ? uplift <= 0 : uplift >= 0;
        const upliftColor = changeIsGood ? TOKENS.malachite600 : TOKENS.coralRed500;
        const upliftText = figma.createText();
        styleOverviewText(upliftText, "caption");
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
    styleOverviewText(text, isHeader ? "tableHeader" : "fieldValue");
    text.textAutoResize = "WIDTH_AND_HEIGHT";
    text.characters = content;
    cell.appendChild(text);
    return cell;
}
/**
 * Create summary/recommendation section
 */
function createSummarySection(data, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const embedded = (options === null || options === void 0 ? void 0 : options.embedded) === true;
        const outcome = classifyOutcomeState(data, { compact: embedded, embeddedInOverview: embedded });
        const rationaleText = (data.outcomeNotes || "").trim();
        const rolledOutVariant = data.variants.find(v => v.isRolledOut);
        if (embedded) {
            const section = figma.createFrame();
            section.layoutMode = "VERTICAL";
            section.counterAxisSizingMode = "AUTO";
            section.primaryAxisSizingMode = "AUTO";
            section.layoutAlign = "STRETCH";
            section.itemSpacing = SECTION_PANEL_LAYOUT.sectionGap;
            section.fills = [];
            section.name = "Section: Outcome summary";
            section.appendChild(createOverviewSectionTitle("Outcome summary"));
            const panelWidth = OUTCOME_SUMMARY_MIN_WIDTH;
            const contentWidth = panelWidth - (SECTION_PANEL_LAYOUT.panelPadding * 2);
            const panel = figma.createFrame();
            panel.layoutMode = "VERTICAL";
            panel.counterAxisSizingMode = "AUTO";
            panel.primaryAxisSizingMode = "AUTO";
            panel.layoutAlign = "STRETCH";
            panel.itemSpacing = SECTION_PANEL_LAYOUT.panelItemSpacing;
            panel.paddingTop = panel.paddingBottom = SECTION_PANEL_LAYOUT.panelPadding;
            panel.paddingLeft = panel.paddingRight = SECTION_PANEL_LAYOUT.panelPadding;
            panel.cornerRadius = SECTION_PANEL_LAYOUT.panelCornerRadius;
            applySectionPanel(panel);
            panel.name = "Outcome Summary Panel";
            appendOutcomeSummaryBody(panel, outcome, data, contentWidth, {
                embedded: true,
                includeDecisionFields: true,
                rolledOutVariant,
                rationaleText,
            });
            section.appendChild(panel);
            return section;
        }
        const section = figma.createFrame();
        section.layoutMode = "VERTICAL";
        section.counterAxisSizingMode = "FIXED";
        section.primaryAxisSizingMode = "AUTO";
        section.itemSpacing = SECTION_PANEL_LAYOUT.panelItemSpacing;
        section.paddingTop = section.paddingBottom = SECTION_PANEL_LAYOUT.panelPadding;
        section.paddingLeft = section.paddingRight = SECTION_PANEL_LAYOUT.panelPadding;
        section.cornerRadius = SECTION_PANEL_LAYOUT.panelCornerRadius;
        applySectionPanel(section);
        section.name = "Outcome Summary Section";
        section.layoutAlign = "STRETCH";
        section.minWidth = OUTCOME_SUMMARY_MIN_WIDTH;
        const contentWidth = OUTCOME_SUMMARY_MIN_WIDTH - (SECTION_PANEL_LAYOUT.panelPadding * 2);
        const summaryBadge = getOutcomeSummaryBadge(data);
        const headerRow = figma.createFrame();
        headerRow.layoutMode = "HORIZONTAL";
        headerRow.counterAxisSizingMode = "AUTO";
        headerRow.primaryAxisSizingMode = "AUTO";
        headerRow.counterAxisAlignItems = "CENTER";
        headerRow.itemSpacing = 8;
        headerRow.fills = [];
        headerRow.name = "Outcome Summary Header";
        const headerText = createOverviewSectionTitle("Outcome summary");
        headerRow.appendChild(headerText);
        const stateBadge = createBadge(summaryBadge.label, "chip", summaryBadge.bgColor, summaryBadge.textColor, undefined, summaryBadge.borderColor);
        headerRow.appendChild(stateBadge);
        section.appendChild(headerRow);
        appendOutcomeSummaryBody(section, outcome, data, contentWidth, {
            includeDecisionFields: false,
            rolledOutVariant,
            rationaleText,
        });
        return section;
    });
}
function appendEmbeddedDecisionField(parent, label, value, contentWidth, valueDot) {
    const labelNode = figma.createText();
    styleOverviewText(labelNode, "fieldLabel");
    labelNode.textAutoResize = "WIDTH_AND_HEIGHT";
    labelNode.characters = label;
    parent.appendChild(labelNode);
    const valueNode = figma.createText();
    styleOverviewText(valueNode, "fieldValue");
    if (valueDot) {
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
        dot.fills = [{ type: "SOLID", color: hexToRgb(valueDot) }];
        valueRow.appendChild(dot);
        setWrappedText(valueNode, value, contentWidth);
        valueRow.appendChild(valueNode);
        parent.appendChild(valueRow);
    }
    else {
        setWrappedText(valueNode, value, contentWidth);
        parent.appendChild(valueNode);
    }
}
function appendOutcomeSummaryBody(parent, outcome, data, contentWidth, options) {
    const embedded = options.embedded === true;
    const headline = outcome.headline.trim();
    const detail = outcome.detail.trim();
    if (headline) {
        const headlineText = figma.createText();
        styleOverviewText(headlineText, "headline");
        setWrappedText(headlineText, headline, contentWidth);
        headlineText.name = "Readout";
        parent.appendChild(headlineText);
    }
    if (detail) {
        const outcomeDetail = figma.createText();
        styleOverviewText(outcomeDetail, "fieldValue");
        setWrappedText(outcomeDetail, detail, contentWidth);
        parent.appendChild(outcomeDetail);
    }
    if (options.includeDecisionFields) {
        if (options.rationaleText) {
            const rationaleFrame = figma.createFrame();
            rationaleFrame.layoutMode = "VERTICAL";
            rationaleFrame.counterAxisSizingMode = "AUTO";
            rationaleFrame.primaryAxisSizingMode = "AUTO";
            rationaleFrame.layoutAlign = "STRETCH";
            rationaleFrame.itemSpacing = SECTION_PANEL_LAYOUT.rowItemSpacing;
            rationaleFrame.fills = [];
            rationaleFrame.name = "Row: Decision rationale";
            appendEmbeddedDecisionField(rationaleFrame, "Decision rationale", options.rationaleText, contentWidth);
            parent.appendChild(rationaleFrame);
        }
    }
    else if (options.rationaleText) {
        const rationaleFrame = figma.createFrame();
        rationaleFrame.layoutMode = "VERTICAL";
        rationaleFrame.counterAxisSizingMode = "AUTO";
        rationaleFrame.primaryAxisSizingMode = "AUTO";
        rationaleFrame.layoutAlign = "STRETCH";
        rationaleFrame.itemSpacing = SECTION_PANEL_LAYOUT.rowItemSpacing;
        rationaleFrame.fills = [];
        rationaleFrame.name = "Decision Rationale";
        const rationaleLabel = figma.createText();
        styleOverviewText(rationaleLabel, "fieldLabel");
        rationaleLabel.textAutoResize = "WIDTH_AND_HEIGHT";
        rationaleLabel.characters = "Decision rationale";
        rationaleFrame.appendChild(rationaleLabel);
        const rationaleBody = figma.createText();
        styleOverviewText(rationaleBody, "fieldValue");
        setWrappedText(rationaleBody, options.rationaleText, contentWidth);
        rationaleFrame.appendChild(rationaleBody);
        parent.appendChild(rationaleFrame);
    }
    if (!embedded && outcome.facts.length > 0) {
        for (const fact of outcome.facts) {
            parent.appendChild(createSummaryFactRow(fact, contentWidth));
        }
    }
    const nextStep = outcome.nextStep.trim();
    const showNextStep = nextStep && (!embedded || shouldShowEmbeddedNextStep(data));
    if (showNextStep) {
        const nextStepText = figma.createText();
        styleOverviewText(nextStepText, "bodyEmphasis");
        setWrappedText(nextStepText, `Next step: ${nextStep}`, contentWidth);
        nextStepText.name = "Next step";
        parent.appendChild(nextStepText);
    }
}
function createSummaryFactRow(fact, width) {
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
    dot.resize(SUMMARY_BULLET_PX, SUMMARY_BULLET_PX);
    dot.fills = [{ type: "SOLID", color: hexToRgb(SUMMARY_TYPOGRAPHY.body) }];
    row.appendChild(dot);
    const factText = figma.createText();
    styleOverviewText(factText, "fieldValue");
    setWrappedText(factText, fact, width - (SUMMARY_BULLET_PX + 6));
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
export function createOutcomeCardFromExperimentData(experimentName, metrics, variants, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = mapExperimentDataToOutcomeData(experimentName, metrics, variants, options);
        return createExperimentOutcomeCard(data);
    });
}
export function mapExperimentDataToOutcomeData(experimentName, metrics, variants, options) {
    const touchpointNames = new Set(variants
        .map(v => { var _a; return (_a = v.parentEventName) === null || _a === void 0 ? void 0 : _a.trim(); })
        .filter((name) => !!name));
    const showVariantTouchpointName = touchpointNames.size > 1;
    // Use a comparison anchor only when older saved data explicitly marks one.
    const comparisonVariant = variants.find(v => v.isControl === true);
    // Convert variants to outcome format with uplift calculations
    const variantOutcomes = variants.map((v, index) => {
        var _a, _b, _c, _d;
        // Keep the internal flag explicit; do not create a fallback comparison variant.
        const isControl = v.isControl === true;
        const outcomeMetrics = {};
        for (const metric of metrics) {
            const metricKey = getMetricKey(metric);
            const rawValue = (_b = (_a = v.metrics) === null || _a === void 0 ? void 0 : _a[metricKey]) !== null && _b !== void 0 ? _b : 0;
            const rawComparisonValue = (_d = (_c = comparisonVariant === null || comparisonVariant === void 0 ? void 0 : comparisonVariant.metrics) === null || _c === void 0 ? void 0 : _c[metricKey]) !== null && _d !== void 0 ? _d : 0;
            const value = normalizeMetricValueForComparison(metric, rawValue);
            const comparisonValue = normalizeMetricValueForComparison(metric, rawComparisonValue);
            // Calculate change only when an explicit comparison variant exists.
            let uplift;
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
            parentEventName: v.parentEventName,
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
        outcomeNotes: options === null || options === void 0 ? void 0 : options.outcomeNotes,
        showVariantTouchpointName,
    };
}
