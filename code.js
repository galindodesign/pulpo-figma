/// <reference types="@figma/plugin-typings" />
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// ===== Imports =====
import { createExperimentInfoCard } from './experiment-info-card';
import { TOKENS } from './design-tokens';
import { hexToRgb } from './layout-utils';
import { createEventCard, createVariantCard } from './experiment-node';
import { FEEDBACK_EMAIL } from './plugin-constants';
// ===== Error Handling System =====
/**
 * Displays a structured error/info message to the user
 * @param error The error message object
 */
function notifyUser(error) {
    let message = error.title;
    if (error.detail)
        message += `\n${error.detail}`;
    if (error.actionHint)
        message += `\n${error.actionHint}`;
    figma.notify(message);
}
/**
 * Common error messages used throughout the plugin
 */
const ERRORS = {
    NO_CONNECTORS_FOUND: {
        type: 'info',
        title: '✓ No connectors to refresh',
        detail: 'No connector lines found in the selected frame.',
        actionHint: 'Try selecting a frame with connector lines.'
    },
    CONNECTOR_REFRESH_PARTIAL_FAILURE: (refreshed, errors) => ({
        type: 'warning',
        title: `⚠️ Refreshed ${refreshed} connector${refreshed !== 1 ? 's' : ''}`,
        detail: `${errors} connector${errors !== 1 ? 's' : ''} failed to update.`,
        actionHint: 'Check that connector endpoints are still valid.'
    }),
    CONNECTOR_REFRESH_FAILED: (errorCount) => ({
        type: 'error',
        title: '❌ Failed to refresh connectors',
        detail: `${errorCount} error${errorCount !== 1 ? 's' : ''} encountered.`,
        actionHint: 'Try recreating the flow or check the console for details.'
    }),
    NO_CONNECTORS_CREATED: {
        type: 'warning',
        title: '⚠️ No connectors created',
        detail: 'The flow was created but connector lines could not be drawn.',
        actionHint: 'Flow structure is intact. You can add connectors manually or try refreshing.'
    },
    CONNECTORS_CREATED: (count) => ({
        type: 'success',
        title: `✓ Created ${count} connector${count !== 1 ? 's' : ''}`,
        detail: 'Connector lines have been drawn between flow nodes.'
    }),
    FLOW_CREATED_SUCCESSFULLY: {
        type: 'success',
        title: '✓ Experiment flow created',
        detail: 'Nodes, connectors, and entry notes have been generated.'
    },
    FLOW_DELETED_SUCCESSFULLY: {
        type: 'success',
        title: '✓ Flow frames deleted',
        detail: 'Old experiment flow frames have been removed.'
    },
    OLD_FLOW_SCHEMA: {
        type: 'info',
        title: 'ℹ️ Legacy flow detected',
        detail: 'This flow uses an older format.',
        actionHint: 'Please use the updated flow builder for new experiments.'
    },
    NO_VARIANTS: {
        type: 'error',
        title: '❌ At least one variant required',
        detail: 'Please add at least one variant to create a flow.',
        actionHint: 'Add variants in the flow builder form and try again.'
    },
    DEPRECATED_FLOW_TYPE: {
        type: 'warning',
        title: '⚠️ Deprecated flow type',
        detail: 'This flow type is no longer supported.',
        actionHint: 'Please use the updated flow builder instead.'
    },
    INVALID_THUMBNAIL_SELECTION: {
        type: 'error',
        title: '❌ Select 0-3 frames for thumbnails',
        detail: 'You selected frames to use as variant thumbnails.',
        actionHint: 'Select up to 3 frames and try again.'
    },
    FORM_INCOMPLETE: {
        type: 'error',
        title: '❌ Form incomplete',
        detail: 'Please fill out all required fields in the experiment form.',
        actionHint: 'Click "Create from selection" again after completing the form.'
    },
    FLOW_FROM_SELECTION_CREATED: {
        type: 'success',
        title: '✓ Flow created from selection',
        detail: 'Your experiment flow has been generated from the selected frames.'
    },
    OPERATION_CANCELLED: {
        type: 'info',
        title: 'Operation cancelled'
    },
    VALIDATION_FAILED: (errorCount) => ({
        type: 'error',
        title: '❌ Flow data validation failed',
        detail: `Flow contains ${errorCount} validation error${errorCount !== 1 ? 's' : ''}.`,
        actionHint: 'See the detailed list in the plugin panel.'
    })
};
// ===== Performance Utilities =====
/**
 * Batch append multiple nodes to parent to reduce layout recalculation overhead
 * Figma recalculates layout after each appendChild - batching reduces this
 * @param parent - Parent frame/node
 * @param children - Array of nodes to append
 */
function batchAppendChildren(parent, children) {
    // Temporarily disable auto-layout to prevent recalculation on each append
    const wasAutoLayout = 'layoutMode' in parent && parent.layoutMode !== 'NONE';
    const originalLayoutMode = wasAutoLayout ? parent.layoutMode : undefined;
    if (wasAutoLayout) {
        parent.layoutMode = 'NONE';
    }
    // Append all children
    children.forEach(child => parent.appendChild(child));
    // Re-enable auto-layout (triggers single recalculation)
    if (wasAutoLayout && originalLayoutMode) {
        parent.layoutMode = originalLayoutMode;
    }
}
/**
 * Pre-cache frequently used RGB colors to avoid repeated conversions
 */
const CACHED_COLORS = {
    royalBlue600: hexToRgb(TOKENS.royalBlue600),
    malachite600: hexToRgb(TOKENS.malachite600),
    electricViolet600: hexToRgb(TOKENS.electricViolet600),
    textPrimary: hexToRgb(TOKENS.textPrimary),
    textSecondary: hexToRgb(TOKENS.textSecondary),
    fillsSurface: hexToRgb(TOKENS.fillsSurface),
    border: hexToRgb(TOKENS.border),
    azure50: hexToRgb(TOKENS.azure50),
};
// ===== Type Guards & Safe Type Utilities =====
/**
 * Type guard: Check if value is ExperimentV2
 * @param value - Value to check
 * @returns true if value is a valid ExperimentV2
 */
function isExperimentV2(value) {
    if (!value || typeof value !== 'object')
        return false;
    const obj = value;
    return (typeof obj.id === 'string' &&
        typeof obj.name === 'string' &&
        typeof obj.roundNumber === 'number');
}
/**
 * Type guard: Check if value is FlowV2
 * @param value - Value to check
 * @returns true if value is a valid FlowV2
 */
function isFlowV2(value) {
    if (!value || typeof value !== 'object')
        return false;
    const obj = value;
    if (typeof obj.id !== 'string')
        return false;
    if (!obj.entry || typeof obj.entry !== 'object')
        return false;
    if (!obj.exit || typeof obj.exit !== 'object')
        return false;
    if (!Array.isArray(obj.events))
        return false;
    if (!Array.isArray(obj.connectors))
        return false;
    return true;
}
/**
 * Type guard: Check if value is VariantV2
 * @param value - Value to check
 * @returns true if value is a valid VariantV2
 */
function isVariantV2(value) {
    if (!value || typeof value !== 'object')
        return false;
    const obj = value;
    return (typeof obj.id === 'string' &&
        typeof obj.parentEventId === 'string' &&
        typeof obj.key === 'string' &&
        typeof obj.name === 'string' &&
        typeof obj.traffic === 'number');
}
/**
 * Type guard: Check if value is CreateFlowV2Payload
 * @param value - Value to check
 * @returns true if value is a valid CreateFlowV2Payload
 */
function isCreateFlowV2Payload(value) {
    if (!value || typeof value !== 'object')
        return false;
    const obj = value;
    return isExperimentV2(obj.experiment) && isFlowV2(obj.flow);
}
/**
 * Type guard: Check if value is MetricDefinition
 * @param value - Value to check
 * @returns true if value is a valid MetricDefinition
 */
function isMetricDefinition(value) {
    if (!value || typeof value !== 'object')
        return false;
    const obj = value;
    return (typeof obj.id === 'string' &&
        typeof obj.name === 'string' &&
        (obj.abbreviation === undefined || typeof obj.abbreviation === 'string') &&
        (obj.isPrimary === undefined || typeof obj.isPrimary === 'boolean'));
}
/**
 * Type guard: Check if value is an array of MetricDefinitions
 * @param value - Value to check
 * @returns true if value is a valid MetricDefinition array
 */
function isMetricDefinitionArray(value) {
    return Array.isArray(value) && value.every(item => isMetricDefinition(item));
}
/**
 * Safely extract string property from object with type checking
 * @param obj - Object to extract from
 * @param key - Property key
 * @returns The string value if found and correct type, undefined otherwise
 */
function safeGetString(obj, key) {
    if (!obj || typeof obj !== 'object')
        return undefined;
    const value = obj[key];
    return typeof value === 'string' ? value : undefined;
}
/**
 * Safely extract number property from object with type checking
 * @param obj - Object to extract from
 * @param key - Property key
 * @returns The number value if found and correct type, undefined otherwise
 */
function safeGetNumber(obj, key) {
    if (!obj || typeof obj !== 'object')
        return undefined;
    const value = obj[key];
    return typeof value === 'number' ? value : undefined;
}
/**
 * Safely extract boolean property from object with type checking
 * @param obj - Object to extract from
 * @param key - Property key
 * @returns The boolean value if found and correct type, false otherwise
 */
function safeGetBoolean(obj, key) {
    if (!obj || typeof obj !== 'object')
        return false;
    const value = obj[key];
    return typeof value === 'boolean' ? value : false;
}
/**
 * Safely extract property from object
 * @param obj - Object to extract from
 * @param key - Property key
 * @returns The value if found, undefined otherwise
 */
function safeGetProperty(obj, key) {
    if (!obj || typeof obj !== 'object')
        return undefined;
    return obj[key];
}
// ===== Flow Data Validation System =====
function validationIssue(section, field, message) {
    return { section, field, message };
}
function validationSectionLabel(section) {
    if (section === 'experiment')
        return 'Experiment';
    if (section === 'goals')
        return 'Goals';
    return 'Journey';
}
function postValidationFailedToUi(issues) {
    figma.ui.postMessage({ type: 'validation-failed', issues });
}
/**
 * Validates ExperimentV2 structure for required fields and data integrity
 * @param experiment The experiment object to validate
 * @returns ValidationResult with any issues or warnings found
 */
function validateExperiment(experiment) {
    var _a;
    const issues = [];
    const warnings = [];
    if (!experiment) {
        issues.push(validationIssue('experiment', 'experiment', 'Experiment data is missing.'));
        return { isValid: false, issues, warnings };
    }
    if (!experiment.id || typeof experiment.id !== 'string') {
        issues.push(validationIssue('experiment', 'id', 'Internal experiment id is invalid—try again from the form.'));
    }
    if (!experiment.name || typeof experiment.name !== 'string' || !String(experiment.name).trim()) {
        issues.push(validationIssue('experiment', 'title', 'Add a title for this experiment.'));
    }
    if (!experiment.description) {
        warnings.push('Experiment has no description');
    }
    if (experiment.outcomes && typeof experiment.outcomes === 'object') {
        const rolledOutVariantId = (_a = experiment.outcomes.rolledOutVariantId) !== null && _a !== void 0 ? _a : experiment.outcomes.rolledoutVariantId;
        if (rolledOutVariantId && typeof rolledOutVariantId !== 'string') {
            warnings.push('Rolled-out variant ID should be a string if provided');
        }
    }
    return {
        isValid: issues.length === 0,
        issues,
        warnings
    };
}
/**
 * Validates FlowV2 structure for required fields and data integrity
 * @param flow The flow object to validate
 * @returns ValidationResult with any issues or warnings found
 */
function validateFlow(flow) {
    const issues = [];
    const warnings = [];
    if (!flow) {
        issues.push(validationIssue('journey', 'flow', 'Journey flow data is missing.'));
        return { isValid: false, issues, warnings };
    }
    if (!flow.entry || typeof flow.entry !== 'object') {
        issues.push(validationIssue('journey', 'entry', 'Journey is missing the start (entry) node.'));
    }
    else {
        if (!flow.entry.id || typeof flow.entry.id !== 'string') {
            issues.push(validationIssue('journey', 'entry', 'Start node is invalid—try creating the flow again.'));
        }
        if (!flow.entry.label || typeof flow.entry.label !== 'string') {
            issues.push(validationIssue('journey', 'entry', 'Start node needs a label.'));
        }
    }
    if (!flow.exit || typeof flow.exit !== 'object') {
        issues.push(validationIssue('journey', 'exit', 'Journey is missing the end (exit) node.'));
    }
    else {
        if (!flow.exit.id || typeof flow.exit.id !== 'string') {
            issues.push(validationIssue('journey', 'exit', 'End node is invalid—try creating the flow again.'));
        }
        if (!flow.exit.label || typeof flow.exit.label !== 'string') {
            issues.push(validationIssue('journey', 'exit', 'End node needs a label.'));
        }
    }
    if (!Array.isArray(flow.events)) {
        issues.push(validationIssue('journey', 'events', 'Journey must include touchpoints.'));
    }
    else {
        if (flow.events.length === 0) {
            warnings.push('Flow has no events');
        }
        for (let i = 0; i < flow.events.length; i++) {
            const event = flow.events[i];
            const stepLabel = `Touchpoint ${i + 1}`;
            if (!event.id || typeof event.id !== 'string') {
                issues.push(validationIssue('journey', `event-${i}`, `${stepLabel} is missing an id—try adding the step again.`));
            }
            if (!event.name || typeof event.name !== 'string') {
                warnings.push(`${stepLabel} has no name`);
            }
            if (!Array.isArray(event.variants)) {
                warnings.push(`${stepLabel} has no variants list`);
            }
            else if (event.variants.length > 0) {
                for (let vIdx = 0; vIdx < event.variants.length; vIdx++) {
                    const variant = event.variants[vIdx];
                    const vLabel = `${stepLabel}, variant ${vIdx + 1}`;
                    if (!variant.id || typeof variant.id !== 'string') {
                        issues.push(validationIssue('journey', `variant-${i}-${vIdx}`, `${vLabel}: missing id.`));
                    }
                    if (!variant.key || typeof variant.key !== 'string') {
                        issues.push(validationIssue('journey', `variant-${i}-${vIdx}`, `${vLabel}: missing variant key.`));
                    }
                    if (typeof variant.traffic !== 'number' || variant.traffic < 0) {
                        issues.push(validationIssue('journey', `variant-${i}-${vIdx}`, `${vLabel}: traffic must be zero or a positive number.`));
                    }
                }
            }
        }
    }
    if (flow.connectors && !Array.isArray(flow.connectors)) {
        issues.push(validationIssue('journey', 'connectors', 'Connectors must be a list when provided.'));
    }
    else if (Array.isArray(flow.connectors) && flow.connectors.length > 0) {
        for (let i = 0; i < flow.connectors.length; i++) {
            const connector = flow.connectors[i];
            if (!connector.from || !connector.from.id) {
                issues.push(validationIssue('journey', `connector-${i}`, `Connector ${i + 1} is missing its start anchor.`));
            }
            if (!connector.to || !connector.to.id) {
                issues.push(validationIssue('journey', `connector-${i}`, `Connector ${i + 1} is missing its end anchor.`));
            }
            if (!connector.type || typeof connector.type !== 'string') {
                issues.push(validationIssue('journey', `connector-${i}`, `Connector ${i + 1} has an invalid type.`));
            }
        }
    }
    if (flow.layout && typeof flow.layout === 'object') {
        if (flow.layout.eventSpacing && typeof flow.layout.eventSpacing !== 'number') {
            warnings.push('Layout eventSpacing should be a number if provided');
        }
        if (flow.layout.variantSpacing && typeof flow.layout.variantSpacing !== 'number') {
            warnings.push('Layout variantSpacing should be a number if provided');
        }
    }
    return {
        isValid: issues.length === 0,
        issues,
        warnings
    };
}
/**
 * Validates both experiment and flow, combining results
 * @param experiment The experiment to validate
 * @param flow The flow to validate
 * @returns Combined ValidationResult
 */
function validateFlowData(experiment, flow) {
    const experimentResult = validateExperiment(experiment);
    const flowResult = validateFlow(flow);
    return {
        isValid: experimentResult.isValid && flowResult.isValid,
        issues: [...experimentResult.issues, ...flowResult.issues],
        warnings: [...experimentResult.warnings, ...flowResult.warnings]
    };
}
/**
 * Safely get absolute coordinates accounting for parent frames
 * Avoids unsafe 'as any' casts by using calculated coordinates
 * @param node - Node to get coordinates for
 * @returns Absolute {x, y} coordinates
 */
function getAbsoluteCoordinates(node) {
    let x = node.x || 0;
    let y = node.y || 0;
    // Walk up the parent chain to account for nested frames
    let parent = node.parent;
    while (parent && 'x' in parent && 'y' in parent) {
        x += parent.x || 0;
        y += parent.y || 0;
        parent = parent.parent;
    }
    return { x, y };
}
/**
 * Type-safe way to access optional properties that may be added by this plugin
 * @param node - Node to get metadata from
 * @returns Extra metadata or undefined
 */
function getNodeExtra(node) {
    try {
        const meta = getNodeMeta(node);
        return meta === null || meta === void 0 ? void 0 : meta.extra;
    }
    catch (_a) {
        return undefined;
    }
}
// --- Utility: Create a native Figma connector between two nodes, magnetized to edges ---
/**
 * Creates a Figma ConnectorNode between two nodes, magnetized to specified edges.
 * These connectors automatically update when nodes are moved!
 * @param fromNode The node to start from
 * @param toNode The node to end at
 * @param fromMagnet 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM'
 * @param toMagnet 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM'
 * @param options Optional styling (color, strokeWeight, etc)
 * @returns The created ConnectorNode
 */
/**
 * Check if we're running in FigJam (where ConnectorNode is available)
 * vs regular Figma (where it's not)
 */
function isFigJam() {
    try {
        // Check if createConnector is available
        if (typeof figma.createConnector === 'function') {
            // Try to create a test connector to see if it actually works
            // But we can't do that without side effects, so check editorType instead
            return figma.editorType === 'figjam';
        }
        return false;
    }
    catch (_a) {
        return false;
    }
}
/**
 * Creates a native Figma connector between two nodes with magnetic attachment points.
 * These connectors automatically update when nodes are moved (FigJam only).
 *
 * @param fromNode - The source node to connect from
 * @param toNode - The destination node to connect to
 * @param fromMagnet - Magnetic attachment point on source: 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM'
 * @param toMagnet - Magnetic attachment point on destination: 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM'
 * @param options - Optional styling configuration
 * @param options.color - RGB color for the connector stroke
 * @param options.strokeWeight - Connector line width in pixels
 * @param options.connectorLineType - Line style: 'ELBOWED' | 'STRAIGHT' | 'CURVED'
 * @returns ConnectorNode if successful, null if FigJam unavailable or creation fails
 * @note Only available in FigJam; returns null in regular Figma
 */
function createMagnetizedConnector(fromNode, toNode, fromMagnet = 'RIGHT', toMagnet = 'LEFT', options) {
    var _a, _b;
    // Only try native connectors in FigJam
    if (!isFigJam()) {
        return null;
    }
    try {
        const connector = figma.createConnector();
        connector.connectorStart = {
            endpointNodeId: fromNode.id,
            magnet: fromMagnet
        };
        connector.connectorEnd = {
            endpointNodeId: toNode.id,
            magnet: toMagnet
        };
        connector.connectorLineType = (options === null || options === void 0 ? void 0 : options.connectorLineType) || 'ELBOWED';
        connector.strokeWeight = (_a = options === null || options === void 0 ? void 0 : options.strokeWeight) !== null && _a !== void 0 ? _a : 4;
        connector.strokeJoin = 'ROUND';
        connector.connectorEndStrokeCap = 'ARROW_LINES';
        connector.strokes = [{ type: 'SOLID', color: (_b = options === null || options === void 0 ? void 0 : options.color) !== null && _b !== void 0 ? _b : CACHED_COLORS.royalBlue600 }];
        connector.name = 'Connector line';
        return connector;
    }
    catch (error) {
        return null;
    }
}
/**
 * Determines the best magnet position for a connector based on node positions and connector type
 */
function getMagnetPositions(fromNode, toNode, type) {
    // Helper to get absolute position
    function getAbsolutePos(node) {
        let x = node.x, y = node.y;
        let parent = node.parent;
        while (parent && parent.type !== 'PAGE') {
            if ('x' in parent && 'y' in parent) {
                x += parent.x;
                y += parent.y;
            }
            parent = parent.parent;
        }
        return { x, y };
    }
    const fromAbs = getAbsolutePos(fromNode);
    const toAbs = getAbsolutePos(toNode);
    const dx = toAbs.x - fromAbs.x;
    const dy = toAbs.y - fromAbs.y;
    if (type === 'PRIMARY_FLOW_LINE' || type === 'MERGE_LINE') {
        // Horizontal connections: RIGHT to LEFT
        return { fromMagnet: 'RIGHT', toMagnet: 'LEFT' };
    }
    else if (type === 'BRANCH_LINE') {
        // Vertical connections: BOTTOM to TOP
        return { fromMagnet: 'BOTTOM', toMagnet: 'TOP' };
    }
    else {
        // Auto-detect based on distance
        if (Math.abs(dx) > Math.abs(dy)) {
            return { fromMagnet: dx > 0 ? 'RIGHT' : 'LEFT', toMagnet: dx > 0 ? 'LEFT' : 'RIGHT' };
        }
        else {
            return { fromMagnet: dy > 0 ? 'BOTTOM' : 'TOP', toMagnet: dy > 0 ? 'TOP' : 'BOTTOM' };
        }
    }
}
/**
 * Creates a dynamic connector that automatically updates when nodes move.
 * Tries native ConnectorNode first (best option), falls back to VectorNode with refresh capability.
 * @param fromNode The source node
 * @param toNode The destination node
 * @param type The connector type
 * @param options Optional styling and metadata
 * @returns The created connector node (ConnectorNode or VectorNode)
 */
function createDynamicConnector(fromNode, toNode, type, options) {
    const useNative = (options === null || options === void 0 ? void 0 : options.useNativeConnector) !== false; // Default to true
    if (useNative) {
        // Try native ConnectorNode first (automatically updates when nodes move!)
        const { fromMagnet, toMagnet } = getMagnetPositions(fromNode, toNode, type);
        const style = getConnectorStyle(type, {
            winner: options === null || options === void 0 ? void 0 : options.winner,
            variantColor: options === null || options === void 0 ? void 0 : options.variantColor,
            rolledout: options === null || options === void 0 ? void 0 : options.rolledout // NEW
        });
        const nativeConnector = createMagnetizedConnector(fromNode, toNode, fromMagnet, toMagnet, {
            color: style.color,
            strokeWeight: style.strokeWeight,
            connectorLineType: type === 'PRIMARY_FLOW_LINE' ? 'STRAIGHT' : 'ELBOWED',
        });
        if (nativeConnector) {
            // Store metadata for identification
            nativeConnector.setPluginData('connectorMeta', JSON.stringify({
                type,
                fromNodeId: fromNode.id,
                toNodeId: toNode.id,
                isNative: true,
                label: options === null || options === void 0 ? void 0 : options.label,
            }));
            nativeConnector.name = `${type} (Dynamic): ${fromNode.name} → ${toNode.name}`;
            return nativeConnector;
        }
    }
    // Fallback to VectorNode (static, but can be refreshed)
    const vectorConnector = createConnectorV2(fromNode, toNode, type, undefined, options);
    if (vectorConnector) {
        // Store metadata including node IDs for refresh capability
        vectorConnector.setPluginData('connectorMeta', JSON.stringify({
            type,
            fromNodeId: fromNode.id,
            toNodeId: toNode.id,
            isNative: false,
            label: options === null || options === void 0 ? void 0 : options.label,
        }));
        vectorConnector.name = `${type} (Static): ${fromNode.name} → ${toNode.name}`;
    }
    return vectorConnector;
}
/**
 * Refreshes positions of all VectorNode-based connectors on the current page.
 *
 * VectorNode connectors don't update automatically; call this after moving nodes
 * in regular Figma. Native ConnectorNodes (FigJam) auto-update and don't need refresh.
 *
 * @async
 * @returns Promise<void>
 * @throws May catch errors silently for orphaned connectors (deleted nodes)
 *
 * Usage:
 * - Direct call: `await refreshConnectors()`
 * - From UI: `figma.ui.postMessage({ type: 'refresh-connectors' })`
 * - Auto-refresh: Connectors refresh automatically when nodes move (if listeners active)
 *
 * @see setupAutoRefreshConnectors for automatic refresh on node changes
 */
const refreshDebounceTimer = null;
let isRefreshing = false;
function refreshConnectors() {
    return __awaiter(this, void 0, void 0, function* () {
        // Prevent concurrent refreshes
        if (isRefreshing) {
            return;
        }
        isRefreshing = true;
        const connectors = [];
        // Find all connector nodes with metadata
        function findConnectors(node) {
            // Skip if node is removed
            if ('removed' in node && node.removed) {
                return;
            }
            if (node.type === 'VECTOR') {
                try {
                    // Check if node still exists before accessing plugin data
                    const meta = node.getPluginData('connectorMeta');
                    if (meta) {
                        try {
                            const parsed = JSON.parse(meta);
                            // Track connectors that need refreshing:
                            // 1. Non-native connectors with fromNodeId and toNodeId
                            // 2. Branch trunks (BRANCH_TRUNK) that need to update when variants move
                            if (parsed.type === 'BRANCH_TRUNK' ||
                                (parsed.isNative === false || (parsed.isNative === undefined && parsed.fromNodeId && parsed.toNodeId))) {
                                connectors.push(node);
                            }
                        }
                        catch (e) {
                            // Invalid metadata, skip
                            console.warn('Invalid connector metadata:', e);
                        }
                    }
                }
                catch (metaError) {
                    // Node might have been deleted or doesn't have metadata
                    // Skip silently - this is expected for orphaned connectors
                    // Don't log to avoid console spam
                }
            }
            if ('children' in node) {
                for (const child of node.children) {
                    findConnectors(child);
                }
            }
        }
        findConnectors(figma.currentPage);
        if (connectors.length === 0) {
            notifyUser(ERRORS.NO_CONNECTORS_FOUND);
            isRefreshing = false;
            return;
        }
        let refreshed = 0;
        let errors = 0;
        // Use Promise.all to fetch all nodes asynchronously
        const refreshPromises = connectors.map((connector) => __awaiter(this, void 0, void 0, function* () {
            try {
                // First check if the connector node itself still exists
                if (!connector || connector.removed) {
                    return { success: false, error: 'connector_removed' };
                }
                // Try to get metadata - if connector was deleted, this will fail
                let meta;
                try {
                    const metaString = connector.getPluginData('connectorMeta');
                    if (!metaString) {
                        return { success: false, error: 'no_metadata' };
                    }
                    meta = JSON.parse(metaString);
                }
                catch (metaError) {
                    console.warn('Could not read connector metadata, connector may have been deleted:', metaError);
                    return { success: false, error: 'metadata_error' };
                }
                if (!meta.fromNodeId || !meta.toNodeId) {
                    return { success: false, error: 'invalid_metadata' };
                }
                // Try to fetch nodes - handle cases where nodes don't exist
                let fromNode = null;
                let toNode = null;
                try {
                    fromNode = (yield figma.getNodeByIdAsync(meta.fromNodeId));
                }
                catch (err) {
                    // From node does not exist
                }
                try {
                    toNode = (yield figma.getNodeByIdAsync(meta.toNodeId));
                }
                catch (err) {
                    // To node does not exist
                }
                if (!fromNode || !toNode) {
                    // If nodes don't exist, remove the orphaned connector
                    try {
                        if (connector && !connector.removed) {
                            connector.remove();
                        }
                    }
                    catch (removeErr) {
                        // Connector already removed, ignore
                    }
                    return { success: false, error: 'missing_nodes' };
                }
                // Remove old connector and its endpoint markers (if any)
                const parent = connector.parent;
                // Find and remove arrowhead/dot siblings for this connector only
                if (parent && 'children' in parent && !parent.removed) {
                    try {
                        const siblings = parent.children;
                        const endpointMarkers = siblings.filter(child => {
                            if ((child.type !== 'VECTOR' && child.type !== 'ELLIPSE') || child === connector || child.removed) {
                                return false;
                            }
                            try {
                                const markerMetaString = child.getPluginData('connectorMeta');
                                if (markerMetaString) {
                                    const markerMeta = JSON.parse(markerMetaString);
                                    return markerMeta.isEndpointMarker === true &&
                                        markerMeta.fromNodeId === meta.fromNodeId &&
                                        markerMeta.toNodeId === meta.toNodeId &&
                                        markerMeta.type === meta.type;
                                }
                            }
                            catch (_a) {
                                // Fall back to legacy name-based cleanup below
                            }
                            return child.name === 'Arrowhead' || child.name.includes('Arrowhead');
                        });
                        for (const marker of endpointMarkers) {
                            marker.remove();
                        }
                    }
                    catch (arrowErr) {
                        // Endpoint marker already removed or parent changed, continue
                    }
                }
                // Remove the old connector
                try {
                    if (connector && !connector.removed) {
                        connector.remove();
                    }
                }
                catch (removeErr) {
                    // Connector already removed, continue
                }
                // Handle BRANCH_TRUNK specially - recreate the entire branching tree
                if (meta.type === 'BRANCH_TRUNK') {
                    // Find the event node and all variant nodes
                    try {
                        const eventNode = yield figma.getNodeByIdAsync(meta.fromNodeId);
                        if (!eventNode) {
                            connector.remove();
                            return { success: false, error: 'event_node_missing' };
                        }
                        // Get all variant nodes
                        const variantNodeIds = meta.variantNodeIds || [];
                        const variantNodes = [];
                        for (const variantId of variantNodeIds) {
                            try {
                                const variantNode = yield figma.getNodeByIdAsync(variantId);
                                if (variantNode) {
                                    variantNodes.push({
                                        connector: {
                                            id: `branch-${variantId}`,
                                            type: 'BRANCH_LINE',
                                            from: { nodeType: 'EVENT_NODE', id: meta.fromNodeId },
                                            to: { nodeType: 'VARIANT_NODE', id: variantId }
                                        },
                                        node: variantNode
                                    });
                                }
                            }
                            catch (err) {
                                // Variant node doesn't exist, skip
                            }
                        }
                        if (variantNodes.length > 0) {
                            // Remove old trunk and all its branches
                            const parent = connector.parent;
                            if (parent && 'children' in parent) {
                                // Find and remove all related branch connectors
                                const siblings = parent.children;
                                for (const sibling of siblings) {
                                    if (sibling.type === 'VECTOR' && sibling !== connector) {
                                        try {
                                            const siblingMeta = sibling.getPluginData('connectorMeta');
                                            if (siblingMeta) {
                                                const parsedSibling = JSON.parse(siblingMeta);
                                                if (parsedSibling.type === 'BRANCH_LINE' && parsedSibling.fromNodeId === meta.fromNodeId) {
                                                    sibling.remove();
                                                }
                                            }
                                        }
                                        catch (_a) {
                                            // Ignore errors
                                        }
                                    }
                                }
                            }
                            connector.remove();
                            // Recreate the branching tree
                            const newTree = createBranchingTree(eventNode, variantNodes, meta.experimentId);
                            return { success: true };
                        }
                        else {
                            // No variants left, remove trunk
                            connector.remove();
                            return { success: false, error: 'no_variants' };
                        }
                    }
                    catch (err) {
                        return { success: false, error: 'trunk_refresh_failed' };
                    }
                }
                // Create new connector at updated positions
                const newConnector = createConnectorV2(fromNode, toNode, meta.type, undefined, {
                    label: meta.label,
                });
                // Restore metadata
                if (newConnector) {
                    try {
                        // Get original metadata if connector still exists
                        const originalMeta = connector && !connector.removed
                            ? connector.getPluginData('connectorMeta')
                            : JSON.stringify(meta);
                        newConnector.setPluginData('connectorMeta', originalMeta);
                        newConnector.name = connector && !connector.removed ? connector.name : `${meta.type} Line`;
                        // Append to parent or page
                        if (parent && !parent.removed) {
                            parent.appendChild(newConnector);
                        }
                        else {
                            figma.currentPage.appendChild(newConnector);
                        }
                        return { success: true };
                    }
                    catch (appendErr) {
                        // Clean up the new connector if append failed
                        try {
                            newConnector.remove();
                        }
                        catch (_b) {
                            // Ignore cleanup errors
                        }
                        return { success: false, error: 'append_failed' };
                    }
                }
                return { success: false, error: 'creation_failed' };
            }
            catch (error) {
                // If connector exists but has an error, try to remove it to clean up
                try {
                    if (connector && !connector.removed) {
                        connector.remove();
                    }
                }
                catch (_c) {
                    // Ignore cleanup errors
                }
                return { success: false, error: error instanceof Error ? error.message : String(error) };
            }
        }));
        // Wait for all refresh operations to complete
        const results = yield Promise.all(refreshPromises);
        for (const result of results) {
            if (result.success) {
                refreshed++;
            }
            else {
                errors++;
            }
        }
        isRefreshing = false;
        if (refreshed > 0 && errors === 0) {
            notifyUser(ERRORS.CONNECTORS_CREATED(refreshed));
        }
        else if (refreshed > 0 && errors > 0) {
            notifyUser(ERRORS.CONNECTOR_REFRESH_PARTIAL_FAILURE(refreshed, errors));
        }
        else if (errors > 0) {
            notifyUser(ERRORS.CONNECTOR_REFRESH_FAILED(errors));
        }
    });
}
/**
 * Sets up automatic connector refresh when nodes are moved.
 * Only needed in regular Figma (not FigJam, where native connectors auto-update).
 * Uses event listeners since setInterval doesn't work reliably in Figma plugins.
 */
const lastNodePositions = new Map();
const refreshTimeout = null;
function setupAutoRefreshConnectors() {
    return __awaiter(this, void 0, void 0, function* () {
        // Only set up auto-refresh in regular Figma (not FigJam)
        if (isFigJam()) {
            return;
        }
        // Store initial positions of all nodes with connectors
        function storeNodePositions() {
            lastNodePositions.clear();
            function findConnectors(node) {
                if (node.type === 'VECTOR') {
                    const meta = node.getPluginData('connectorMeta');
                    if (meta) {
                        try {
                            const parsed = JSON.parse(meta);
                            // Track connectors that are not native (or don't have isNative flag for backward compatibility)
                            // Also track if it has fromNodeId and toNodeId (means it's a connector we can refresh)
                            if ((parsed.isNative === false || parsed.isNative === undefined) && parsed.fromNodeId && parsed.toNodeId) {
                                // Store node IDs for async tracking (we'll fetch positions when needed)
                                // Just store the IDs for now - we'll fetch positions async in checkAndRefresh
                                lastNodePositions.set(parsed.fromNodeId, { x: 0, y: 0 }); // Placeholder, will be updated
                                lastNodePositions.set(parsed.toNodeId, { x: 0, y: 0 }); // Placeholder, will be updated
                            }
                        }
                        catch (e) {
                            // Invalid metadata
                        }
                    }
                }
                if ('children' in node) {
                    for (const child of node.children) {
                        findConnectors(child);
                    }
                }
            }
            findConnectors(figma.currentPage);
        }
        // Initial position storage
        storeNodePositions();
        // Check for position changes and refresh if needed
        function checkAndRefresh() {
            return __awaiter(this, void 0, void 0, function* () {
                if (isRefreshing) {
                    return;
                }
                let needsRefresh = false;
                // Fetch all node positions asynchronously
                const nodeIds = Array.from(lastNodePositions.keys());
                const nodePromises = nodeIds.map(id => figma.getNodeByIdAsync(id));
                const nodes = yield Promise.all(nodePromises);
                for (let i = 0; i < nodeIds.length; i++) {
                    const nodeId = nodeIds[i];
                    const node = nodes[i];
                    const lastPos = lastNodePositions.get(nodeId) || { x: 0, y: 0 };
                    if (node && 'x' in node && 'y' in node) {
                        const currentPos = { x: node.x, y: node.y };
                        // Check if position changed (with small threshold to avoid floating point issues)
                        // Also check if this is the first time we're tracking (lastPos is 0,0 placeholder)
                        if (lastPos.x === 0 && lastPos.y === 0) {
                            // First time tracking, just store the position
                            lastNodePositions.set(nodeId, currentPos);
                        }
                        else if (Math.abs(currentPos.x - lastPos.x) > 0.1 || Math.abs(currentPos.y - lastPos.y) > 0.1) {
                            needsRefresh = true;
                            lastNodePositions.set(nodeId, currentPos);
                        }
                    }
                }
                if (needsRefresh) {
                    refreshConnectors().then(() => {
                        // Update positions after refresh
                        storeNodePositions();
                    }).catch(err => {
                        // Auto-refresh error
                    });
                }
            });
        }
        // Use selection change event - triggers when user selects/moves nodes
        figma.on('selectionchange', () => {
            // Check immediately (no debounce needed for selection)
            checkAndRefresh().catch(err => {
            });
        });
        // Try to set up documentchange listener (requires loadAllPagesAsync in some cases)
        try {
            // Try to load all pages first (required for documentchange in some modes)
            // This will fail gracefully if not needed or not available
            if (typeof figma.loadAllPagesAsync === 'function') {
                try {
                    yield figma.loadAllPagesAsync();
                }
                catch (loadError) {
                }
            }
            // Also listen to document changes (when nodes are transformed)
            figma.on('documentchange', (event) => {
                // Check if any nodes were moved
                const hasTransform = event.documentChanges.some(change => {
                    return change.type === 'PROPERTY_CHANGE' &&
                        (change.properties.includes('x') ||
                            change.properties.includes('y'));
                });
                if (hasTransform) {
                    checkAndRefresh();
                }
            });
        }
        catch (error) {
            // Continue without documentchange - selectionchange will still work
        }
    });
}
/**
 * Creates branching tree structure: trunk from event to midpoint, then branches to variants.
 * Used for routing flow from events to their variants with split visualization.
 *
 * @param eventNode - Source event node
 * @param variantNodes - Array of variant nodes with their connector metadata
 * @param experimentId - Experiment ID for metadata storage
 * @returns Array of created connector nodes (trunk + branches)
 *
 * @example
 * ```ts
 * const branches = createBranchingTree(eventCard, variantCards, experiment.id);
 * ```
 */
function createBranchingTree(eventNode, variantNodes, experimentId) {
    const result = [];
    // Helper to get absolute position
    function getAbsolutePos(node) {
        let x = node.x, y = node.y;
        let parent = node.parent;
        while (parent && parent.type !== 'PAGE') {
            if ('x' in parent && 'y' in parent) {
                x += parent.x;
                y += parent.y;
            }
            parent = parent.parent;
        }
        return { x, y };
    }
    // Get style for branch lines
    const style = getConnectorStyle('BRANCH_LINE', {});
    const color = style.color;
    const strokeWeight = style.strokeWeight;
    // Calculate positions
    const eventAbs = getAbsolutePos(eventNode);
    const eventBottom = { x: eventAbs.x + eventNode.width / 2, y: eventAbs.y + eventNode.height };
    // Get all variant positions and calculate trunk endpoint
    const variantPositions = variantNodes.map(v => {
        const vAbs = getAbsolutePos(v.node);
        const variantTop = { x: vAbs.x + v.node.width / 2, y: vAbs.y };
        return Object.assign(Object.assign({}, v), { pos: variantTop, absPos: vAbs });
    });
    // Calculate trunk length dynamically based on variant positions
    // Trunk should extend to a point that allows smooth, flexible branching to all variants
    const trunkLength = 50; // Base trunk length (increased for smoother appearance)
    // Calculate the minimum Y position needed for all variants
    const minVariantY = Math.min(...variantPositions.map(v => v.pos.y));
    // Trunk should extend to allow smooth curves - extend further for better flexibility
    const distanceToVariants = minVariantY - eventBottom.y;
    // Trunk extends to about 35% of distance to closest variant, with minimum of base length
    // This gives more room for smooth elbow curves
    const dynamicTrunkLength = Math.max(trunkLength, distanceToVariants * 0.35);
    const trunkEnd = { x: eventBottom.x, y: eventBottom.y + dynamicTrunkLength };
    // Create trunk (vertical line from event bottom)
    const trunkPath = `M ${eventBottom.x} ${eventBottom.y} L ${trunkEnd.x} ${trunkEnd.y}`;
    const trunk = figma.createVector();
    trunk.vectorPaths = [{ windingRule: "NONZERO", data: trunkPath }];
    trunk.strokes = [{ type: "SOLID", color }];
    trunk.strokeWeight = strokeWeight;
    trunk.strokeAlign = "CENTER";
    trunk.strokeCap = "ROUND";
    trunk.strokeJoin = "ROUND";
    if (style.dashPattern)
        trunk.dashPattern = style.dashPattern;
    trunk.name = "Branch Trunk";
    // Store metadata for trunk so it can be refreshed when variants move
    trunk.setPluginData('connectorMeta', JSON.stringify({
        connectorId: `trunk-${eventNode.id}`,
        type: 'BRANCH_TRUNK',
        fromNodeId: eventNode.id,
        toNodeId: null, // Trunk doesn't connect to a specific node
        experimentId: experimentId,
        variantNodeIds: variantNodes.map(v => v.node.id), // Track all variant IDs for refresh
        isNative: false
    }));
    figma.currentPage.appendChild(trunk);
    result.push(trunk);
    // Create branches from trunk end to each variant using createConnectorV2 (for endpoint dots)
    for (const variant of variantPositions) {
        // Use createConnectorV2 to ensure endpoint dots are created
        const branch = createConnectorV2(
        // fromNode: a virtual node at trunkEnd (create a minimal node object)
        {
            id: `trunk-end-${eventNode.id}`,
            x: trunkEnd.x,
            y: trunkEnd.y,
            width: 0,
            height: 0,
            parent: figma.currentPage,
            type: 'RECTANGLE', // minimal stub, not actually used
        }, variant.node, 'BRANCH_LINE', undefined, {
            label: variant.connector.label,
            index: 0,
            winner: false,
            variantColor: undefined,
            rolledout: false,
        });
        // Store metadata (important: mark as not native so refresh system can find it)
        branch.setPluginData('connectorMeta', JSON.stringify({
            connectorId: variant.connector.id,
            type: 'BRANCH_LINE',
            fromNodeId: eventNode.id,
            toNodeId: variant.node.id,
            experimentId: experimentId,
            label: variant.connector.label,
            isNative: false
        }));
        result.push(branch);
    }
    return result;
}
/**
 * Creates a merging tree structure: branches from each variant to midpoint, then trunk to target
 * @param variantNodes Array of variant nodes and their connector metadata
 * @param targetNode The destination node (event or exit)
 * @param experimentId The experiment ID for metadata
 * @returns Array of created vector nodes (branches + trunk)
 */
function createMergingTree(variantNodes, targetNode, experimentId) {
    const result = [];
    // Helper to get absolute position
    function getAbsolutePos(node) {
        let x = node.x, y = node.y;
        let parent = node.parent;
        while (parent && parent.type !== 'PAGE') {
            if ('x' in parent && 'y' in parent) {
                x += parent.x;
                y += parent.y;
            }
            parent = parent.parent;
        }
        return { x, y };
    }
    // Get style for merge lines
    const style = getConnectorStyle('MERGE_LINE', {});
    const color = style.color;
    const strokeWeight = style.strokeWeight;
    // Calculate target position (left edge, center)
    const targetAbs = getAbsolutePos(targetNode);
    const arrowOffset = 0; // No offset - arrowhead at card edge
    const targetLeft = {
        x: targetAbs.x + arrowOffset,
        y: targetAbs.y + targetNode.height / 2
    };
    // Calculate merge point (trunk start) - positioned before the target
    const trunkLength = 40; // Horizontal distance from target
    const trunkStart = { x: targetLeft.x - trunkLength, y: targetLeft.y };
    // Create trunk (horizontal line to target)
    const trunkPath = `M ${trunkStart.x} ${trunkStart.y} L ${targetLeft.x} ${targetLeft.y}`;
    const trunk = figma.createVector();
    trunk.vectorPaths = [{ windingRule: "NONZERO", data: trunkPath }];
    trunk.strokes = [{ type: "SOLID", color }];
    trunk.strokeWeight = strokeWeight;
    trunk.strokeAlign = "CENTER";
    trunk.strokeCap = "ROUND";
    trunk.strokeJoin = "ROUND";
    if (style.dashPattern)
        trunk.dashPattern = style.dashPattern;
    trunk.name = "Merge Trunk";
    figma.currentPage.appendChild(trunk);
    result.push(trunk);
    // No arrowhead for merge trunk - only PRIMARY_FLOW_LINE gets arrowheads
    // Create branches from each variant to trunk start
    for (const variant of variantNodes) {
        const vAbs = getAbsolutePos(variant.node);
        const variantRight = {
            x: vAbs.x + variant.node.width,
            y: vAbs.y + variant.node.height / 2
        };
        // Create branch path with elbow from variant right to trunk start
        let branchPath;
        const dx = trunkStart.x - variantRight.x;
        const dy = trunkStart.y - variantRight.y;
        // Simple straight line from variant right directly to trunk start (no elbow)
        // This was the "almost perfect" version the user mentioned
        // Just draw a straight line from variant to trunk
        branchPath = `M ${variantRight.x} ${variantRight.y} L ${trunkStart.x} ${trunkStart.y}`;
        const branch = figma.createVector();
        branch.vectorPaths = [{ windingRule: "NONZERO", data: branchPath }];
        branch.strokes = [{ type: "SOLID", color }];
        branch.strokeWeight = strokeWeight;
        branch.strokeAlign = "CENTER";
        branch.strokeCap = "ROUND";
        branch.strokeJoin = "ROUND";
        if (style.dashPattern)
            branch.dashPattern = style.dashPattern;
        branch.name = `Merge from Variant`;
        figma.currentPage.appendChild(branch);
        // Store metadata (important: mark as not native so refresh system can find it)
        branch.setPluginData('connectorMeta', JSON.stringify({
            connectorId: variant.connector.id,
            type: 'MERGE_LINE',
            fromNodeId: variant.node.id,
            toNodeId: targetNode.id,
            experimentId: experimentId,
            label: variant.connector.label,
            isNative: false // Critical: mark as non-native so refresh system tracks it
        }));
        result.push(branch);
    }
    return result;
}
/**
 * Simple connector creation function - clean start
 * Uses the exact pattern from the working connectNodes function
 */
function createConnectorV2(fromNode, toNode, type, flowFrame, options) {
    var _a;
    const style = getConnectorStyle(type, {
        winner: options === null || options === void 0 ? void 0 : options.winner,
        variantColor: options === null || options === void 0 ? void 0 : options.variantColor,
        rolledout: options === null || options === void 0 ? void 0 : options.rolledout // NEW
    });
    const color = style.color;
    const strokeWeight = style.strokeWeight;
    // Helper to get absolute position (like connectNodes)
    function getAbsolutePos(node) {
        let x = node.x, y = node.y;
        let parent = node.parent;
        while (parent && parent.type !== 'PAGE') {
            if ('x' in parent && 'y' in parent) {
                x += parent.x;
                y += parent.y;
            }
            parent = parent.parent;
        }
        return { x, y };
    }
    // Get edge points (like connectNodes)
    function getEdgePoints(from, to) {
        const fromAbs = getAbsolutePos(from);
        const toAbs = getAbsolutePos(to);
        const dx = toAbs.x - fromAbs.x;
        const dy = toAbs.y - fromAbs.y;
        // Offset for arrowhead to stop before card edge
        const arrowOffset = 0; // No offset - arrowhead at card edge
        let fromPoint, toPoint;
        if (type === 'PRIMARY_FLOW_LINE' || type === 'MERGE_LINE') {
            // Horizontal connections (left-right)
            // Use RIGHT edge of 'from' node, LEFT edge of 'to' node
            fromPoint = { x: dx > 0 ? fromAbs.x + from.width : fromAbs.x, y: fromAbs.y + from.height / 2 };
            // Offset the destination point inward by arrowOffset
            toPoint = {
                x: dx > 0 ? toAbs.x + arrowOffset : toAbs.x + to.width - arrowOffset,
                y: toAbs.y + to.height / 2
            };
        }
        else if (type === 'BRANCH_LINE') {
            // Vertical connections (event to variant: bottom to top)
            // Use BOTTOM edge of 'from' node, TOP edge of 'to' node
            fromPoint = { x: fromAbs.x + from.width / 2, y: fromAbs.y + from.height };
            // Offset the destination point inward by arrowOffset
            toPoint = {
                x: toAbs.x + to.width / 2,
                y: toAbs.y + arrowOffset
            };
        }
        else {
            // Auto-detect based on distance
            if (Math.abs(dx) > Math.abs(dy)) {
                // Horizontal
                fromPoint = { x: dx > 0 ? fromAbs.x + from.width : fromAbs.x, y: fromAbs.y + from.height / 2 };
                toPoint = {
                    x: dx > 0 ? toAbs.x + arrowOffset : toAbs.x + to.width - arrowOffset,
                    y: toAbs.y + to.height / 2
                };
            }
            else {
                // Vertical
                fromPoint = { x: fromAbs.x + from.width / 2, y: dy > 0 ? fromAbs.y + from.height : fromAbs.y };
                toPoint = {
                    x: toAbs.x + to.width / 2,
                    y: dy > 0 ? toAbs.y + arrowOffset : toAbs.y + to.height - arrowOffset
                };
            }
        }
        return { from: fromPoint, to: toPoint };
    }
    const { from: startAbs, to: endAbs } = getEdgePoints(fromNode, toNode);
    // Always work in absolute coordinates for accurate edge positioning
    // endAbs is the EXACT card edge position - use this directly for arrowhead
    const start = Object.assign({}, startAbs), end = Object.assign({}, endAbs);
    const flowFrameAbs = flowFrame ? getAbsolutePos(flowFrame) : null;
    // Convert to flowFrame-local if provided (only for line path coordinates)
    // Arrowhead will always use endAbs (absolute) for precise positioning
    if (flowFrameAbs) {
        start.x = startAbs.x - flowFrameAbs.x;
        start.y = startAbs.y - flowFrameAbs.y;
        end.x = endAbs.x - flowFrameAbs.x;
        end.y = endAbs.y - flowFrameAbs.y;
    }
    // When flowFrame is undefined, start/end are already absolute (same as startAbs/endAbs)
    const primaryFlowMarkerGap = 6;
    function getPrimaryFlowEndpointMetrics() {
        const dotSize = Math.max(12, strokeWeight * 2.5);
        const dotStrokeWeight = Math.max(2, Math.round(strokeWeight * 0.6));
        return {
            dotSize,
            dotStrokeWeight,
            markerOffset: dotSize / 2 - dotStrokeWeight / 2 + primaryFlowMarkerGap,
        };
    }
    function toPathCoordinates(point) {
        return flowFrameAbs
            ? { x: point.x - flowFrameAbs.x, y: point.y - flowFrameAbs.y }
            : point;
    }
    function getPrimaryFlowEndpointPosition(edgePoint, direction, role) {
        const { markerOffset } = getPrimaryFlowEndpointMetrics();
        const directionLength = Math.hypot(direction.x, direction.y) || 1;
        const unitDirection = {
            x: direction.x / directionLength,
            y: direction.y / directionLength,
        };
        const directionMultiplier = role === 'start' ? 1 : -1;
        return {
            x: edgePoint.x + unitDirection.x * markerOffset * directionMultiplier,
            y: edgePoint.y + unitDirection.y * markerOffset * directionMultiplier,
        };
    }
    function createPrimaryFlowEndpointDot(center, role) {
        const { dotSize, dotStrokeWeight } = getPrimaryFlowEndpointMetrics();
        const dot = figma.createEllipse();
        dot.resize(dotSize, dotSize);
        dot.fills = [{ type: "SOLID", color }];
        dot.strokes = [{ type: "SOLID", color }];
        dot.strokeWeight = dotStrokeWeight;
        dot.strokeAlign = "CENTER";
        dot.name = role === 'start' ? "Flow Start Dot" : "Flow End Dot";
        dot.setPluginData('connectorMeta', JSON.stringify({
            type,
            fromNodeId: fromNode.id,
            toNodeId: toNode.id,
            isEndpointMarker: true,
            markerRole: role,
        }));
        if (flowFrameAbs) {
            dot.x = center.x - flowFrameAbs.x - dotSize / 2;
            dot.y = center.y - flowFrameAbs.y - dotSize / 2;
            flowFrame.appendChild(dot);
        }
        else {
            dot.x = center.x - dotSize / 2;
            dot.y = center.y - dotSize / 2;
            figma.currentPage.appendChild(dot);
        }
        return dot;
    }
    const index = (_a = options === null || options === void 0 ? void 0 : options.index) !== null && _a !== void 0 ? _a : 0;
    let midX, midY;
    let line;
    const cornerRadius = 24; // Radius for rounded corners
    if (Math.abs(start.x - end.x) > Math.abs(start.y - end.y)) {
        // Horizontal - with horizontal segments at start and end
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        let pathData = ''; // Initialize to avoid TypeScript error
        // Track the actual endpoints of the path for dot positioning
        let actualPathStart = { x: startAbs.x, y: startAbs.y };
        let actualPathEnd = { x: end.x, y: end.y };
        let pathStartDirection = { x: 1, y: 0 }; // Default direction (right)
        let pathEndDirection = { x: 1, y: 0 }; // Default direction (right)
        // Get path coordinates (for all connector types)
        let pathStartX = flowFrame ? start.x : startAbs.x;
        let pathStartY = flowFrame ? start.y : startAbs.y;
        let pathEndX = flowFrame ? end.x : endAbs.x;
        let pathEndY = flowFrame ? end.y : endAbs.y;
        let pathDy = pathEndY - pathStartY;
        // PRIMARY_FLOW_LINE: entry/exit points are always straight horizontal (0 degrees), curve only at midpoint if vertically offset
        if (type === 'PRIMARY_FLOW_LINE') {
            // PRIMARY_FLOW_LINE connects event to event (left to right)
            // Entry point: straight horizontal (0 degrees) from event right edge
            // Exit point: straight horizontal (0 degrees) to event left edge
            // Midpoint: curve only if nodes are vertically offset
            const horizontalDirection = Math.sign(pathEndX - pathStartX) || 1;
            const primaryStartAbs = getPrimaryFlowEndpointPosition(startAbs, { x: horizontalDirection, y: 0 }, 'start');
            const primaryEndAbs = getPrimaryFlowEndpointPosition(endAbs, { x: horizontalDirection, y: 0 }, 'end');
            const primaryStart = toPathCoordinates(primaryStartAbs);
            const primaryEnd = toPathCoordinates(primaryEndAbs);
            pathStartX = primaryStart.x;
            pathStartY = primaryStart.y;
            pathEndX = primaryEnd.x;
            pathEndY = primaryEnd.y;
            pathDy = pathEndY - pathStartY;
            const absDy = Math.abs(pathDy);
            // If nodes are vertically aligned, use straight horizontal line (0 degrees at entry and exit)
            if (absDy < 2) {
                // Vertically aligned - straight horizontal line
                pathData = `M ${pathStartX} ${pathStartY} L ${pathEndX} ${pathStartY}`;
                actualPathStart = primaryStartAbs;
                actualPathEnd = primaryEndAbs;
                pathStartDirection = { x: Math.sign(pathEndX - pathStartX), y: 0 };
                // Direction is horizontal, pointing toward the card (0 degrees)
                pathEndDirection = { x: Math.sign(pathEndX - pathStartX), y: 0 };
            }
            else {
                // Vertically offset - use midpoint curve with straight horizontal entry/exit segments
                // Calculate midpoint X
                const midX = (pathStartX + pathEndX) / 2;
                const absDx = Math.abs(pathEndX - pathStartX);
                // Corner radius scales with distance, max 20px
                const cornerRadius = Math.min(20, Math.min(absDx, absDy) * 0.4);
                // Path structure:
                // 1. Straight horizontal from entry (startX to midX - radius) - 0 degrees
                // 2. Curve from horizontal to vertical at midpoint
                // 3. Straight vertical segment
                // 4. Curve from vertical to horizontal at midpoint
                // 5. Straight horizontal to exit (midX + radius to endX) - 0 degrees
                pathData = `M ${pathStartX} ${pathStartY}`;
                // Straight horizontal segment from entry (0 degrees)
                const horizontalEndX = midX - cornerRadius;
                pathData += ` L ${horizontalEndX} ${pathStartY}`;
                // Curve from horizontal to vertical (at midpoint)
                // Control point creates smooth transition
                const verticalStartY = pathDy > 0
                    ? pathStartY + cornerRadius // Going down
                    : pathStartY - cornerRadius; // Going up
                // Quadratic bezier: from (midX - radius, startY) via (midX, startY) to (midX, startY ± radius)
                pathData += ` Q ${midX} ${pathStartY} ${midX} ${verticalStartY}`;
                // Straight vertical segment
                const verticalEndY = pathDy > 0
                    ? pathEndY - cornerRadius // Going down
                    : pathEndY + cornerRadius; // Going up
                pathData += ` L ${midX} ${verticalEndY}`;
                // Curve from vertical to horizontal (at midpoint)
                // Quadratic bezier: from (midX, endY ± radius) via (midX, endY) to (midX + radius, endY)
                pathData += ` Q ${midX} ${pathEndY} ${midX + cornerRadius} ${pathEndY}`;
                // Straight horizontal segment to exit (0 degrees)
                pathData += ` L ${pathEndX} ${pathEndY}`;
                // Actual path end is at the card edge
                actualPathStart = primaryStartAbs;
                actualPathEnd = primaryEndAbs;
                pathStartDirection = { x: Math.sign(pathEndX - pathStartX), y: 0 };
                // Direction is horizontal, pointing toward the card (0 degrees)
                pathEndDirection = { x: Math.sign(pathEndX - pathStartX), y: 0 };
            }
        }
        else if (Math.abs(pathDy) < 1) {
            // Simple straight horizontal line (no vertical displacement) - for other connector types
            // CRITICAL: Path must start and end at EXACT card edge coordinates
            pathData = `M ${pathStartX} ${pathStartY} L ${pathEndX} ${pathEndY}`;
            // Actual path end is at the card edge
            // Use endAbs (absolute coordinates) for arrowhead positioning to ensure it's at the exact card edge
            actualPathEnd = { x: endAbs.x, y: endAbs.y };
            // Direction is horizontal, pointing toward the card
            pathEndDirection = { x: Math.sign(pathEndX - pathStartX), y: 0 };
        }
        else {
            // For BRANCH_LINE: entry/exit points are always straight, curve only at midpoint if offset
            if (type === 'BRANCH_LINE') {
                // Always offset endpoints for BRANCH_LINE (both straight and curved)
                const verticalDirection = Math.sign((flowFrame ? end.y : endAbs.y) - (flowFrame ? start.y : startAbs.y)) || 1;
                const branchStartAbs = getPrimaryFlowEndpointPosition(startAbs, { x: 0, y: verticalDirection }, 'start');
                const branchEndAbs = getPrimaryFlowEndpointPosition(endAbs, { x: 0, y: verticalDirection }, 'end');
                const branchStart = toPathCoordinates(branchStartAbs);
                const branchEnd = toPathCoordinates(branchEndAbs);
                const pathStartX = branchStart.x;
                const pathStartY = branchStart.y;
                const pathEndX = branchEnd.x;
                const pathEndY = branchEnd.y;
                const dx = pathEndX - pathStartX;
                const dy = pathEndY - pathStartY;
                const absDx = Math.abs(dx);
                // Magnet behavior: if nodes are horizontally aligned (X centers match), use straight vertical line
                if (absDx < 2) {
                    // Horizontally aligned - straight vertical line (90 degrees at entry and exit)
                    pathData = `M ${pathStartX} ${pathStartY} L ${pathEndX} ${pathEndY}`;
                    actualPathStart = branchStartAbs;
                    actualPathEnd = branchEndAbs;
                    pathEndDirection = { x: 0, y: Math.sign(dy) }; // Straight vertical
                }
                else {
                    // Not aligned - use midpoint curve with straight entry/exit segments
                    const midY = (pathStartY + pathEndY) / 2;
                    const absDy = Math.abs(dy);
                    const cornerRadius = Math.min(20, Math.min(absDx, absDy) * 0.4);
                    pathData = `M ${pathStartX} ${pathStartY}`;
                    // Straight vertical segment from entry (90 degrees)
                    const verticalEndY = midY - cornerRadius;
                    pathData += ` L ${pathStartX} ${verticalEndY}`;
                    // Curve from vertical to horizontal (at midpoint)
                    const horizontalStartX = dx > 0
                        ? pathStartX + cornerRadius // Going right
                        : pathStartX - cornerRadius; // Going left
                    pathData += ` Q ${pathStartX} ${midY} ${horizontalStartX} ${midY}`;
                    // Straight horizontal segment
                    const horizontalEndX = dx > 0
                        ? pathEndX - cornerRadius // Going right
                        : pathEndX + cornerRadius; // Going left
                    pathData += ` L ${horizontalEndX} ${midY}`;
                    // Curve from horizontal to vertical (at midpoint)
                    pathData += ` Q ${pathEndX} ${midY} ${pathEndX} ${midY + cornerRadius}`;
                    // Straight vertical segment to exit (90 degrees)
                    pathData += ` L ${pathEndX} ${pathEndY}`;
                    actualPathStart = branchStartAbs;
                    actualPathEnd = branchEndAbs;
                    pathEndDirection = { x: 0, y: Math.sign(dy) }; // Exit is straight vertical
                }
            }
            else if (type === 'MERGE_LINE') {
                // MERGE_LINE uses straight direct line from card edge to card edge
                const pathStartX = flowFrame ? start.x : startAbs.x;
                const pathStartY = flowFrame ? start.y : startAbs.y;
                const pathEndX = flowFrame ? end.x : endAbs.x;
                const pathEndY = flowFrame ? end.y : endAbs.y;
                pathData = `M ${pathStartX} ${pathStartY} L ${pathEndX} ${pathEndY}`;
                actualPathEnd = { x: endAbs.x, y: endAbs.y };
                const dx = pathEndX - pathStartX;
                const dy = pathEndY - pathStartY;
                const length = Math.sqrt(dx * dx + dy * dy);
                pathEndDirection = length > 0 ? { x: dx / length, y: dy / length } : { x: 1, y: 0 };
            }
            else {
                // Fallback for any other connector types (should not normally occur)
                pathData = `M ${pathStartX} ${pathStartY} L ${pathEndX} ${pathEndY}`;
                actualPathEnd = { x: endAbs.x, y: endAbs.y };
                pathEndDirection = { x: Math.sign(pathEndX - pathStartX), y: 0 };
            }
        }
        line = figma.createVector();
        line.vectorPaths = [{ windingRule: "NONZERO", data: pathData }];
        line.strokes = [{ type: "SOLID", color }];
        line.strokeWeight = strokeWeight;
        line.strokeAlign = "CENTER";
        line.strokeCap = "ROUND";
        line.strokeJoin = "ROUND";
        if (style.dashPattern)
            line.dashPattern = style.dashPattern;
        line.name = `${type} Line`;
        // Append to the same parent as the coordinate system
        if (flowFrame)
            flowFrame.appendChild(line);
        else
            figma.currentPage.appendChild(line);
        // Endpoint dots for PRIMARY_FLOW_LINE and BRANCH_LINE (always, regardless of orientation)
        // MERGE_LINE does not get endpoint markers
        if (type === 'PRIMARY_FLOW_LINE' || type === 'BRANCH_LINE') {
            createPrimaryFlowEndpointDot(actualPathStart, 'start');
            createPrimaryFlowEndpointDot(actualPathEnd, 'end');
        }
    }
    else {
        // Vertical - with vertical segments at start and end
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        let pathData;
        // Track the actual endpoints of the path for dot positioning
        let actualPathStart = { x: startAbs.x, y: startAbs.y };
        let actualPathEnd = { x: end.x, y: end.y };
        let pathStartDirection = { x: 0, y: 1 }; // Default direction (down)
        let pathEndDirection = { x: 0, y: 1 }; // Default direction (down)
        let primaryPathStartX = flowFrame ? start.x : startAbs.x;
        let primaryPathStartY = flowFrame ? start.y : startAbs.y;
        let primaryPathEndX = flowFrame ? end.x : endAbs.x;
        let primaryPathEndY = flowFrame ? end.y : endAbs.y;
        let primaryStartAbs = startAbs;
        let primaryEndAbs = endAbs;
        // Apply endpoint offset logic for PRIMARY_FLOW_LINE and BRANCH_LINE
        if (type === 'PRIMARY_FLOW_LINE') {
            const verticalDirection = Math.sign(primaryPathEndY - primaryPathStartY) || 1;
            primaryStartAbs = getPrimaryFlowEndpointPosition(startAbs, { x: 0, y: verticalDirection }, 'start');
            primaryEndAbs = getPrimaryFlowEndpointPosition(endAbs, { x: 0, y: verticalDirection }, 'end');
            const primaryStart = toPathCoordinates(primaryStartAbs);
            const primaryEnd = toPathCoordinates(primaryEndAbs);
            primaryPathStartX = primaryStart.x;
            primaryPathStartY = primaryStart.y;
            primaryPathEndX = primaryEnd.x;
            primaryPathEndY = primaryEnd.y;
        }
        else if (type === 'BRANCH_LINE') {
            // For BRANCH_LINE, apply endpoint offset logic (vertical direction)
            const verticalDirection = Math.sign(primaryPathEndY - primaryPathStartY) || 1;
            primaryStartAbs = getPrimaryFlowEndpointPosition(startAbs, { x: 0, y: verticalDirection }, 'start');
            primaryEndAbs = getPrimaryFlowEndpointPosition(endAbs, { x: 0, y: verticalDirection }, 'end');
            const branchStart = toPathCoordinates(primaryStartAbs);
            const branchEnd = toPathCoordinates(primaryEndAbs);
            primaryPathStartX = branchStart.x;
            primaryPathStartY = branchStart.y;
            primaryPathEndX = branchEnd.x;
            primaryPathEndY = branchEnd.y;
        }
        // For BRANCH_LINE in vertical orientation: entry/exit points are always straight, curve only at midpoint if offset
        if (type === 'BRANCH_LINE') {
            // BRANCH_LINE connects event bottom center to variant top center
            // Entry point: straight vertical (90 degrees) from event bottom
            // Exit point: straight vertical (90 degrees) to variant top
            // Midpoint: curve only if nodes are offset horizontally
            const pathStartX = primaryPathStartX;
            const pathStartY = primaryPathStartY;
            const pathEndX = primaryPathEndX;
            const pathEndY = primaryPathEndY;
            const absDx = Math.abs(dx);
            // Magnet behavior: if nodes are horizontally aligned (X centers match), use straight vertical line
            if (absDx < 2) {
                // Horizontally aligned - straight vertical line (90 degrees at entry and exit)
                pathData = `M ${pathStartX} ${pathStartY} L ${pathEndX} ${pathEndY}`;
                actualPathStart = primaryStartAbs;
                actualPathEnd = primaryEndAbs;
                pathStartDirection = { x: 0, y: Math.sign(pathEndY - pathStartY) };
                pathEndDirection = { x: 0, y: Math.sign(pathEndY - pathStartY) }; // Straight vertical
            }
            else {
                // Not aligned - use midpoint curve with straight entry/exit segments
                // Calculate midpoint Y
                const midY = (pathStartY + pathEndY) / 2;
                const absDy = Math.abs(dy);
                // Corner radius scales with distance, max 20px
                const cornerRadius = Math.min(20, Math.min(absDx, absDy) * 0.4);
                // Path structure: 
                // 1. Straight vertical from entry (startY to midY - radius) - 90 degrees
                // 2. Curve from vertical to horizontal at midpoint
                // 3. Straight horizontal segment
                // 4. Curve from horizontal to vertical at midpoint  
                // 5. Straight vertical to exit (midY + radius to endY) - 90 degrees
                pathData = `M ${pathStartX} ${pathStartY}`;
                // Straight vertical segment from entry (90 degrees)
                const verticalEndY = midY - cornerRadius;
                pathData += ` L ${pathStartX} ${verticalEndY}`;
                // Curve from vertical to horizontal (at midpoint)
                // Control point creates smooth transition
                const horizontalStartX = dx > 0
                    ? pathStartX + cornerRadius // Going right
                    : pathStartX - cornerRadius; // Going left
                // Quadratic bezier: from (startX, midY - radius) via (startX, midY) to (startX ± radius, midY)
                pathData += ` Q ${pathStartX} ${midY} ${horizontalStartX} ${midY}`;
                // Straight horizontal segment
                const horizontalEndX = dx > 0
                    ? pathEndX - cornerRadius // Going right
                    : pathEndX + cornerRadius; // Going left
                pathData += ` L ${horizontalEndX} ${midY}`;
                // Curve from horizontal to vertical (at midpoint)
                // Quadratic bezier: from (endX ± radius, midY) via (endX, midY) to (endX, midY + radius)
                pathData += ` Q ${pathEndX} ${midY} ${pathEndX} ${midY + cornerRadius}`;
                // Straight vertical segment to exit (90 degrees)
                pathData += ` L ${pathEndX} ${pathEndY}`;
                // Use offset endpoints for marker support
                actualPathStart = primaryStartAbs;
                actualPathEnd = primaryEndAbs;
                pathStartDirection = { x: 0, y: Math.sign(pathEndY - pathStartY) };
                pathEndDirection = { x: 0, y: Math.sign(pathEndY - pathStartY) }; // Exit is straight vertical
            }
        }
        else if (Math.abs(dx) < 1) {
            // Simple straight vertical line (for other connector types)
            // CRITICAL: Path must start and end at EXACT card edge coordinates
            // Use startAbs/endAbs directly to ensure precision (when flowFrame is undefined, start/end == startAbs/endAbs)
            const pathStartX = primaryPathStartX;
            const pathStartY = primaryPathStartY;
            const pathEndX = primaryPathEndX;
            const pathEndY = primaryPathEndY;
            pathData = `M ${pathStartX} ${pathStartY} L ${pathEndX} ${pathEndY}`;
            actualPathStart = primaryStartAbs;
            // Actual path end is at the card edge
            // Use endAbs (absolute coordinates) for arrowhead positioning to ensure it's at the exact card edge
            actualPathEnd = primaryEndAbs;
            pathStartDirection = { x: 0, y: Math.sign(pathEndY - pathStartY) };
            // Direction is vertical, pointing toward the card
            pathEndDirection = { x: 0, y: Math.sign(pathEndY - pathStartY) };
        }
        else {
            // For MERGE_LINE, use straight direct line
            // For PRIMARY_FLOW_LINE with horizontal displacement, use curved path
            if (type === 'MERGE_LINE') {
                // Straight direct line from card edge to card edge (no curves, no angles)
                // CRITICAL: Path must start and end at EXACT card edge coordinates
                const pathStartX = flowFrame ? start.x : startAbs.x;
                const pathStartY = flowFrame ? start.y : startAbs.y;
                const pathEndX = flowFrame ? end.x : endAbs.x;
                const pathEndY = flowFrame ? end.y : endAbs.y;
                // Simple straight line directly connecting the edges
                pathData = `M ${pathStartX} ${pathStartY} L ${pathEndX} ${pathEndY}`;
                // actualPathEnd is the exact card edge position
                actualPathStart = { x: startAbs.x, y: startAbs.y };
                actualPathEnd = { x: endAbs.x, y: endAbs.y };
                // Direction points directly toward the card
                const dx = pathEndX - pathStartX;
                const dy = pathEndY - pathStartY;
                const length = Math.sqrt(dx * dx + dy * dy);
                pathStartDirection = length > 0 ? { x: dx / length, y: dy / length } : { x: 0, y: 1 };
                pathEndDirection = length > 0 ? { x: dx / length, y: dy / length } : { x: 0, y: 1 };
            }
            else {
                // Complex path with horizontal segment and rounded corners (for PRIMARY_FLOW_LINE with horizontal displacement)
                const radius = Math.min(Math.abs(dx) / 2, cornerRadius);
                // Calculate midpoint Y for the horizontal segment
                midY = start.y + dy * 0.5 + index * 12;
                // Build path: vertical down → curve → horizontal → curve → vertical down
                // CRITICAL: Path must start and end at EXACT card edge coordinates
                const pathStartX = primaryPathStartX;
                const pathStartY = primaryPathStartY;
                const pathEndX = primaryPathEndX;
                const pathEndY = primaryPathEndY;
                pathData = `M ${pathStartX} ${pathStartY}`;
                // Initial vertical segment - starts from card edge
                pathData += ` L ${pathStartX} ${midY - radius}`;
                // First corner: vertical to horizontal (going right or left)
                pathData += ` Q ${pathStartX} ${midY} ${pathStartX + radius * Math.sign(dx)} ${midY}`;
                // Horizontal segment
                pathData += ` L ${pathEndX - radius * Math.sign(dx)} ${midY}`;
                // Second corner: horizontal to vertical (going down)
                pathData += ` Q ${pathEndX} ${midY} ${pathEndX} ${midY + radius}`;
                // Final vertical segment - ends exactly at the card edge
                const finalSegmentStart = { x: pathEndX, y: midY + radius };
                pathData += ` L ${pathEndX} ${pathEndY}`;
                // actualPathEnd MUST be the exact card edge position (endAbs) for arrowhead positioning
                actualPathStart = primaryStartAbs;
                actualPathEnd = primaryEndAbs;
                pathStartDirection = { x: 0, y: Math.sign((midY - radius) - pathStartY) || Math.sign(pathEndY - pathStartY) };
                // Direction is vertical, pointing toward the card (from final segment start to end)
                pathEndDirection = { x: 0, y: Math.sign(pathEndY - finalSegmentStart.y) };
            }
        }
        line = figma.createVector();
        line.vectorPaths = [{ windingRule: "NONZERO", data: pathData }];
        line.strokes = [{ type: "SOLID", color }];
        line.strokeWeight = strokeWeight;
        line.strokeAlign = "CENTER";
        line.strokeCap = "ROUND";
        line.strokeJoin = "ROUND";
        if (style.dashPattern)
            line.dashPattern = style.dashPattern;
        line.name = `${type} Line`;
        // Append to the same parent as the coordinate system
        if (flowFrame)
            flowFrame.appendChild(line);
        else
            figma.currentPage.appendChild(line);
        // Endpoint dots for PRIMARY_FLOW_LINE and BRANCH_LINE (always, regardless of orientation)
        // MERGE_LINE does not get endpoint markers
        if (type === 'PRIMARY_FLOW_LINE' || type === 'BRANCH_LINE') {
            createPrimaryFlowEndpointDot(actualPathStart, 'start');
            createPrimaryFlowEndpointDot(actualPathEnd, 'end');
        }
    }
    return line;
}
// Delete frames named 'Sample Experiment Flow' or matching 'Experiment Flow' patterns
function deleteExperimentFlowFrames() {
    const pattern = /Sample Experiment Flow|Experiment Flow.*|undefined/i;
    const frames = figma.currentPage.findAll(node => node.type === "FRAME" && pattern.test(node.name));
    for (const frame of frames) {
        frame.remove();
    }
}
// --- V2 Experiment Flow Helpers ---
/**
 * Get connector style configuration based on type
 */
function getConnectorStyle(type, options) {
    // Prioritize rollout over winner for visual distinction
    if (options === null || options === void 0 ? void 0 : options.rolledout) {
        switch (type) {
            case 'PRIMARY_FLOW_LINE':
            case 'BRANCH_LINE':
            case 'MERGE_LINE':
                return {
                    strokeWeight: 3, // Medium thickness (between normal and winner)
                    color: hexToRgb(TOKENS.electricViolet600), // Purple for rollout
                    dashPattern: undefined, // Solid line for winner
                    arrowhead: true,
                };
            default:
                return {
                    strokeWeight: 3,
                    color: hexToRgb(TOKENS.electricViolet600),
                    dashPattern: undefined, // Solid line for winner
                    arrowhead: true,
                };
        }
    }
    // Winner styling (only if not rolled out)
    if (options === null || options === void 0 ? void 0 : options.winner) {
        switch (type) {
            case 'PRIMARY_FLOW_LINE':
                return {
                    strokeWeight: 3, // Thicker for winner
                    color: hexToRgb(TOKENS.malachite600), // Green for winner
                    dashPattern: undefined, // Solid line for winner
                    arrowhead: true,
                };
            case 'BRANCH_LINE':
                return {
                    strokeWeight: 3,
                    color: hexToRgb(TOKENS.malachite600),
                    dashPattern: undefined,
                    arrowhead: true,
                };
            case 'MERGE_LINE':
                return {
                    strokeWeight: 3,
                    color: hexToRgb(TOKENS.malachite600),
                    dashPattern: undefined,
                    arrowhead: true,
                };
            default:
                return {
                    strokeWeight: 4,
                    color: hexToRgb(TOKENS.malachite600),
                    dashPattern: undefined,
                    arrowhead: true,
                };
        }
    }
    // Default styling
    switch (type) {
        case 'PRIMARY_FLOW_LINE':
            return {
                strokeWeight: 3,
                color: hexToRgb(TOKENS.accentPrimary),
                dashPattern: undefined, // Solid line
                arrowhead: true,
            };
        case 'BRANCH_LINE':
            return {
                strokeWeight: 3,
                color: hexToRgb(TOKENS.accentBrand),
                dashPattern: undefined, // Solid line
                arrowhead: true,
            };
        case 'MERGE_LINE':
            return {
                strokeWeight: 3,
                color: hexToRgb(TOKENS.accentBrand),
                dashPattern: undefined, // Solid line
                arrowhead: true,
            };
        default:
            return {
                strokeWeight: 4,
                color: hexToRgb(TOKENS.textPrimary),
                dashPattern: undefined, // Solid line
                arrowhead: true,
            };
    }
}
const selectedEventIndex = 0; // Default to first event selected
/**
 * Type guard to check if message is a known plugin message type
 * @param msg - Message to check
 * @returns true if message is a recognized plugin message type
 */
function isKnownMessageType(msg) {
    if (!msg || typeof msg !== 'object')
        return false;
    const obj = msg;
    const type = obj.type;
    return typeof type === 'string' && ['create-flow-v2', 'delete-experiment-flows', 'refresh-connectors', 'resize-ui'].includes(type);
}
/// <reference types="@figma/plugin-typings" />
/* eslint-disable no-inner-declarations */
const KEEP_OPEN = true;
if (figma.editorType === 'figma') {
    // --- SAMPLE DATA (mirrors UI sample) ---
    const sampleMetrics = [
        {
            id: 'checkout_cvr',
            name: 'Checkout conversion rate',
            abbreviation: 'CVR',
            direction: 'increase',
            thresholdPct: 48,
            isPrimary: true,
        },
        {
            id: 'cta_ctr',
            name: 'CTA click-through rate',
            abbreviation: 'CTR',
            direction: 'increase',
            thresholdPct: 72,
        },
        {
            id: 'support_rate',
            name: 'Support contact rate',
            abbreviation: 'SCR',
            direction: 'decrease',
            thresholdPct: 6,
        },
    ];
    const sampleEvents = [
        {
            id: 'event-0',
            name: 'Pricing page visit',
            hasVariants: false,
            variants: []
        },
        {
            id: 'event-1',
            name: 'Checkout CTA',
            hasVariants: true,
            variants: [
                {
                    key: 'A',
                    name: 'Blue button',
                    description: 'Blue "Start free trial" CTA with standard pricing copy.',
                    color: TOKENS.royalBlue600,
                    traffic: 50,
                    status: 'none',
                    isControl: false,
                    metrics: { cvr: 0.421, ctr: 0.684, scr: 0.071 }
                },
                {
                    key: 'B',
                    name: 'Red button',
                    description: 'Red "Start free trial" CTA with the same pricing copy.',
                    color: TOKENS.coralRed500,
                    traffic: 50,
                    status: 'winner',
                    metrics: { cvr: 0.493, ctr: 0.742, scr: 0.052 }
                }
            ]
        },
        {
            id: 'event-2',
            name: 'Trial signup complete',
            hasVariants: false,
            variants: []
        },
    ];
    // --- DEMO: Create node cards for each event and its variants ---
    /**
     * Creates a connector with an arrowhead between two points in Figma.
     * @param x1 Start X
     * @param y1 Start Y
     * @param x2 End X
     * @param y2 End Y
     * @param options Optional styling (color, strokeWeight, arrowSize)
     * @returns The created VECTOR node
     */
    function createConnectorWithArrow(x1, y1, x2, y2, options) {
        var _a, _b, _c, _d;
        // Subtle blue/gray, dashed
        const color = (_a = options === null || options === void 0 ? void 0 : options.color) !== null && _a !== void 0 ? _a : hexToRgb(TOKENS.royalBlue400);
        const strokeWeight = (_b = options === null || options === void 0 ? void 0 : options.strokeWeight) !== null && _b !== void 0 ? _b : 2;
        const arrowSize = (_c = options === null || options === void 0 ? void 0 : options.arrowSize) !== null && _c !== void 0 ? _c : 16;
        const dashPattern = (_d = options === null || options === void 0 ? void 0 : options.dashPattern) !== null && _d !== void 0 ? _d : [6, 3];
        // Elbow (right-angle) connector: horizontal, then vertical
        const midX = x1 + (x2 - x1) * 0.5;
        // Arrowhead at end pointing toward the card (from x2,y2 to midX,y1)
        const dx = x2 - midX;
        const dy = y2 - y1;
        const angle = Math.atan2(y2 - y1, x2 - midX);
        const arrowAngle = Math.PI / 6;
        const arrowX1 = x2 - arrowSize * Math.cos(angle - arrowAngle);
        const arrowY1 = y2 - arrowSize * Math.sin(angle - arrowAngle);
        const arrowX2 = x2 - arrowSize * Math.cos(angle + arrowAngle);
        const arrowY2 = y2 - arrowSize * Math.sin(angle + arrowAngle);
        // Find bounding box
        const points = [
            { x: x1, y: y1 },
            { x: midX, y: y1 },
            { x: midX, y: y2 },
            { x: x2, y: y2 },
            { x: arrowX1, y: arrowY1 },
            { x: arrowX2, y: arrowY2 },
        ];
        const minX = Math.min(...points.map(p => p.x));
        const minY = Math.min(...points.map(p => p.y));
        const maxX = Math.max(...points.map(p => p.x));
        const maxY = Math.max(...points.map(p => p.y));
        const width = maxX - minX;
        const height = maxY - minY;
        // Path relative to (0,0) in the vector node
        const rel = (x, y) => `${x - minX} ${y - minY}`;
        const path = [
            `M ${rel(x1, y1)} L ${rel(midX, y1)} L ${rel(midX, y2)} L ${rel(x2, y2)}`,
            `M ${rel(x2, y2)} L ${rel(arrowX1, arrowY1)}`,
            `M ${rel(x2, y2)} L ${rel(arrowX2, arrowY2)}`,
        ].join(' ');
        const vector = figma.createVector();
        vector.vectorPaths = [{ data: path, windingRule: "NONZERO" }];
        vector.strokes = [{ type: 'SOLID', color }];
        vector.strokeWeight = strokeWeight;
        vector.strokeCap = 'ROUND';
        vector.strokeJoin = 'ROUND';
        vector.strokeMiterLimit = 4;
        vector.dashPattern = dashPattern;
        vector.x = minX;
        vector.y = minY;
        vector.resizeWithoutConstraints(width || 1, height || 1);
        return vector;
    }
    // --- Sample Flow (Unified V2 Schema) ---
    // Converts sample data to v2 format and uses the unified flow creation function
    function createSampleFlowFromData() {
        return __awaiter(this, void 0, void 0, function* () {
            const experimentId = 'sample-experiment';
            // Convert sample data to v2 format
            const experiment = {
                id: experimentId,
                name: 'Pricing Page Button Color Experiment',
                roundNumber: 2,
                description: 'Test whether CTA color changes help more pricing-page visitors start checkout.',
                status: 'rolled_out',
                experimentType: 'ab_test',
                hypothesis: 'If the CTA uses a higher-contrast red treatment, more pricing-page visitors will notice it and start checkout.',
                owner: 'Growth Team',
                audience: 'New pricing-page visitors on self-serve plans',
                startDate: '2026-04-01',
                endDate: '2026-04-21',
                sampleSize: 18420,
                confidenceLevel: 95,
                outcomes: {
                    rolledOutVariantId: `variant-event-1-1`,
                    notes: 'Red button cleared the primary CVR goal and reduced support contact rate, so it was rolled out.',
                },
            };
            // Convert events to v2 format
            const events = sampleEvents.map((event, eventIdx) => {
                const variants = (event.variants || []).map((variant, vIdx) => ({
                    id: `variant-${event.id}-${vIdx}`,
                    parentEventId: event.id,
                    key: variant.key || String.fromCharCode(65 + vIdx),
                    name: variant.name,
                    description: variant.description,
                    traffic: variant.traffic,
                    metrics: variant.metrics,
                    style: variant.color ? { variantColor: variant.color } : undefined,
                    isControl: variant.isControl,
                    status: variant.status, // Preserve status for card rendering
                    color: variant.color, // Preserve color for card rendering
                }));
                return {
                    id: event.id,
                    name: event.name,
                    nodeType: 'EVENT_NODE',
                    variants: variants.length > 0 ? variants : undefined,
                };
            });
            // Create entry and exit nodes
            const entry = {
                id: `entry-${experimentId}`,
                label: 'Entry',
                nodeType: 'ENTRY_NODE',
            };
            const exit = {
                id: `exit-${experimentId}`,
                label: 'Exit',
                nodeType: 'EXIT_NODE',
            };
            // Build connectors array (auto-generated if not provided)
            const connectors = [];
            // Entry to first event
            if (events.length > 0) {
                connectors.push({
                    id: `conn-entry-${Date.now()}`,
                    type: 'PRIMARY_FLOW_LINE',
                    from: { nodeType: 'ENTRY_NODE', id: entry.id },
                    to: { nodeType: 'EVENT_NODE', id: events[0].id },
                    arrowhead: true,
                });
            }
            // Event to event
            for (let i = 0; i < events.length - 1; i++) {
                connectors.push({
                    id: `conn-event-${i}-${i + 1}-${Date.now()}`,
                    type: 'PRIMARY_FLOW_LINE',
                    from: { nodeType: 'EVENT_NODE', id: events[i].id },
                    to: { nodeType: 'EVENT_NODE', id: events[i + 1].id },
                    arrowhead: true,
                });
            }
            // Last event to exit
            if (events.length > 0) {
                connectors.push({
                    id: `conn-exit-${Date.now()}`,
                    type: 'PRIMARY_FLOW_LINE',
                    from: { nodeType: 'EVENT_NODE', id: events[events.length - 1].id },
                    to: { nodeType: 'EXIT_NODE', id: exit.id },
                    arrowhead: true,
                });
            }
            // Event to variants (branch lines)
            for (const event of events) {
                if (event.variants && event.variants.length > 0) {
                    for (const variant of event.variants) {
                        connectors.push({
                            id: `conn-branch-${event.id}-${variant.id}-${Date.now()}`,
                            type: 'BRANCH_LINE',
                            from: { nodeType: 'EVENT_NODE', id: event.id },
                            to: { nodeType: 'VARIANT_NODE', id: variant.id },
                            label: variant.traffic ? `${variant.traffic}%` : undefined,
                            arrowhead: true,
                        });
                    }
                }
            }
            // Variants to next event (merge lines)
            for (let i = 0; i < events.length - 1; i++) {
                const currentEvent = events[i];
                const nextEvent = events[i + 1];
                if (currentEvent.variants && currentEvent.variants.length > 0) {
                    for (const variant of currentEvent.variants) {
                        connectors.push({
                            id: `conn-merge-${variant.id}-${nextEvent.id}-${Date.now()}`,
                            type: 'MERGE_LINE',
                            from: { nodeType: 'VARIANT_NODE', id: variant.id },
                            to: { nodeType: 'EVENT_NODE', id: nextEvent.id },
                            arrowhead: true,
                        });
                    }
                }
            }
            // Variants to exit (if last event has variants)
            if (events.length > 0) {
                const lastEvent = events[events.length - 1];
                if (lastEvent.variants && lastEvent.variants.length > 0) {
                    for (const variant of lastEvent.variants) {
                        connectors.push({
                            id: `conn-merge-${variant.id}-exit-${Date.now()}`,
                            type: 'MERGE_LINE',
                            from: { nodeType: 'VARIANT_NODE', id: variant.id },
                            to: { nodeType: 'EXIT_NODE', id: exit.id },
                            arrowhead: true,
                        });
                    }
                }
            }
            const flow = {
                id: `flow-${experimentId}`,
                layout: { direction: 'HORIZONTAL', eventSpacing: 80, variantSpacing: 40 },
                entry,
                events,
                exit,
                connectors,
            };
            // Use unified flow creation function
            yield createFlowV2FromData(experiment, flow, sampleMetrics);
        });
    }
    const MIN_UI_WIDTH = 500;
    // Keep in sync with package.json version
    const PLUGIN_VERSION = '1.0.0';
    figma.showUI(__html__, {
        width: MIN_UI_WIDTH,
        height: 720,
        title: 'Petri',
        themeColors: true,
    });
    figma.ui.postMessage({ type: 'plugin-version', version: PLUGIN_VERSION });
    figma.ui.postMessage({ type: 'plugin-config', feedbackEmail: FEEDBACK_EMAIL });
    figma.ui.postMessage({
        type: 'current-file-context',
        fileKey: figma.fileKey || ''
    });
    function createNodeCard(title, subtitle, trafficLabel, note) {
        const card = figma.createFrame();
        card.layoutMode = 'VERTICAL';
        card.counterAxisSizingMode = 'AUTO';
        card.primaryAxisSizingMode = 'AUTO';
        card.paddingLeft = card.paddingRight = TOKENS.space16;
        card.paddingTop = card.paddingBottom = TOKENS.space16;
        card.cornerRadius = TOKENS.radiusLG;
        card.fills = [{ type: 'SOLID', color: CACHED_COLORS.fillsSurface }];
        card.strokes = [{ type: 'SOLID', color: CACHED_COLORS.border }];
        card.strokeWeight = 1;
        card.name = title ? `Node: ${title}` : 'Node';
        card.itemSpacing = TOKENS.space8;
        const topRow = figma.createFrame();
        topRow.layoutMode = 'HORIZONTAL';
        topRow.counterAxisSizingMode = 'AUTO';
        topRow.primaryAxisSizingMode = 'AUTO';
        topRow.itemSpacing = TOKENS.space4;
        topRow.fills = [];
        topRow.strokes = [];
        topRow.name = 'Top Row';
        const titleText = figma.createText();
        titleText.fontName = { family: "Figtree", style: "Bold" };
        titleText.fontSize = TOKENS.fontSizeBodyLg;
        titleText.fills = [{ type: 'SOLID', color: hexToRgb(TOKENS.textPrimary) }];
        titleText.textAutoResize = 'WIDTH_AND_HEIGHT';
        titleText.characters = title && title.length > 0 ? title : '';
        topRow.appendChild(titleText);
        if (trafficLabel) {
            // Removed Pill: traffic chip
        }
        card.appendChild(topRow);
        // Subtitle (if provided)
        if (subtitle && subtitle.length > 0) {
            const subtitleText = figma.createText();
            subtitleText.fontName = { family: "Figtree", style: "Regular" };
            subtitleText.fontSize = TOKENS.fontSizeBodyMd;
            subtitleText.fills = [{ type: 'SOLID', color: hexToRgb(TOKENS.textSecondary) }];
            subtitleText.textAutoResize = 'WIDTH_AND_HEIGHT';
            subtitleText.characters = subtitle;
            subtitleText.name = 'Subtitle';
            card.appendChild(subtitleText);
        }
        // Note/Description (if provided)
        if (note && note.length > 0) {
            const noteContainer = figma.createFrame();
            noteContainer.layoutMode = 'VERTICAL';
            noteContainer.counterAxisSizingMode = 'AUTO';
            noteContainer.primaryAxisSizingMode = 'AUTO';
            noteContainer.paddingLeft = noteContainer.paddingRight = TOKENS.space12;
            noteContainer.paddingTop = noteContainer.paddingBottom = TOKENS.space8;
            noteContainer.cornerRadius = TOKENS.radiusSM;
            noteContainer.fills = [{ type: 'SOLID', color: hexToRgb(TOKENS.azure50) }];
            noteContainer.strokes = [{ type: 'SOLID', color: hexToRgb(TOKENS.border) }];
            noteContainer.strokeWeight = 1;
            noteContainer.name = 'Note Container';
            // Set a reasonable fixed width for note container (will be constrained by card)
            noteContainer.resize(200, noteContainer.height);
            const noteText = figma.createText();
            noteText.fontName = { family: "Figtree", style: "Regular" };
            noteText.fontSize = TOKENS.fontSizeBodySm;
            noteText.fills = [{ type: 'SOLID', color: hexToRgb(TOKENS.textTertiary) }];
            noteText.textAutoResize = 'HEIGHT'; // Allow wrapping
            noteText.characters = note;
            noteText.name = 'Note Text';
            // Set width to fill container (accounting for container padding)
            const textWidth = noteContainer.width - (TOKENS.space12 * 2);
            noteText.resize(textWidth > 0 ? textWidth : 176, noteText.height);
            noteContainer.appendChild(noteText);
            card.appendChild(noteContainer);
        }
        return card;
    }
    function parseFigmaNodeIdFromUrl(rawUrl) {
        const trimmed = rawUrl.trim();
        if (!trimmed) {
            return { kind: 'invalid', url: rawUrl, reason: 'Missing URL' };
        }
        const figmaUrlMatch = trimmed.match(/^https?:\/\/([^/]+)(\/[^?#]*)?(?:\?([^#]*))?/i);
        if (!figmaUrlMatch) {
            return { kind: 'invalid', url: rawUrl, reason: 'Invalid URL' };
        }
        const hostname = figmaUrlMatch[1];
        if (!/figma\.com$/i.test(hostname) && !/\.figma\.com$/i.test(hostname)) {
            return { kind: 'invalid', url: rawUrl, reason: 'URL is not a Figma URL' };
        }
        const path = figmaUrlMatch[2] || '';
        const fileKeyMatch = path.match(/^\/(?:file|design|proto|board)\/([^/]+)/i);
        const fileKey = fileKeyMatch ? decodeURIComponent(fileKeyMatch[1]) : undefined;
        const query = figmaUrlMatch[3] || '';
        const nodeIdMatch = query.match(/(?:^|&)(?:node-id|node_id)=([^&]+)/i);
        const nodeId = nodeIdMatch ? nodeIdMatch[1] : '';
        if (!nodeId) {
            return { kind: 'external-url', url: trimmed, reason: 'Missing node id' };
        }
        try {
            return { kind: 'node-id', nodeId: decodeURIComponent(nodeId).replace(/-/g, ':'), fileKey };
        }
        catch (_a) {
            return { kind: 'invalid', url: rawUrl, reason: 'Invalid Figma node id' };
        }
    }
    function resolveFigmaNodeUrl(rawUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!rawUrl)
                return undefined;
            const parsed = parseFigmaNodeIdFromUrl(rawUrl);
            if (parsed.kind !== 'node-id')
                return parsed;
            try {
                const currentFileKey = figma.fileKey;
                if (parsed.fileKey && currentFileKey && parsed.fileKey !== currentFileKey) {
                    return { kind: 'external-url', url: rawUrl.trim(), reason: 'Different Figma file' };
                }
                const figmaWithLookup = figma;
                const node = typeof figmaWithLookup.getNodeByIdAsync === 'function'
                    ? yield figmaWithLookup.getNodeByIdAsync(parsed.nodeId)
                    : null;
                if (node && 'type' in node && node.type !== 'PAGE' && node.type !== 'DOCUMENT') {
                    return { kind: 'current-file-node', node: node };
                }
                return { kind: 'external-url', url: rawUrl.trim(), reason: 'Node was not found in current file' };
            }
            catch (error) {
                console.warn('Could not resolve Figma node URL', rawUrl, error);
                return { kind: 'invalid', url: rawUrl, reason: 'Could not resolve node in current file' };
            }
        });
    }
    function resolveThumbnailSourceFromFigmaLink(rawUrl, label) {
        return __awaiter(this, void 0, void 0, function* () {
            const resolution = yield resolveFigmaNodeUrl(rawUrl);
            if (!resolution)
                return { node: null };
            if (resolution.kind === 'current-file-node') {
                return { node: resolution.node };
            }
            const suffix = label ? ` for ${label}` : '';
            if (resolution.kind === 'external-url') {
                console.warn(`Figma thumbnail link${suffix} could not be resolved in the current file; leaving placeholder.`, resolution.reason, resolution.url);
                const reason = resolution.reason === 'Different Figma file'
                    ? 'points to another Figma file'
                    : 'is not in this file';
                figma.notify(`Figma frame link${suffix} ${reason}, so the thumbnail stayed as a placeholder.`);
                return {
                    node: null,
                    message: resolution.reason === 'Different Figma file'
                        ? 'Frame link is from another Figma file'
                        : 'Frame link could not be found in this file',
                };
            }
            else {
                console.warn(`Invalid Figma thumbnail link${suffix}; leaving placeholder.`, resolution.reason, resolution.url);
                figma.notify(`Figma frame link${suffix} could not be used, so the thumbnail stayed as a placeholder.`);
                return { node: null, message: 'Frame link could not be used' };
            }
        });
    }
    // --- Unified V2 Flow Creation Function ---
    // Extracted from message handler for reuse by both UI messages and sample flows
    /**
   * Main flow rendering pipeline. Creates complete experiment flow visualization from structured data.
   *
   * Generates:
   * - Entry/exit node cards
   * - Event (touchpoint) cards with variants
   * - Connectors (primary flow, branches, merges)
   * - Metrics and outcome information
   * - Auto-layout frame organization
   *
   * @async
   * @param experiment - Experiment metadata (id, name, description, outcomes)
   * @param flow - Flow structure (events, connectors, layout configuration)
   * @param metrics - Metric definitions and calculations
   * @returns Promise<void>
   * @throws Catches errors internally and notifies user; doesn't throw
   *
   * @note Automatically sets up auto-refresh listeners for connectors in regular Figma
   * @note Call after UI form submission or via message handler
   *
   * @example
   * ```ts
   * const { experiment, flow, metrics } = msg.payload as CreateFlowV2Payload;
   * await createFlowV2FromData(experiment, flow, metrics);
   * ```
   */
    function createFlowV2FromData(experiment, flow, metrics) {
        return __awaiter(this, void 0, void 0, function* () {
            // ========================================================================
            // FLOW RENDERING PIPELINE
            // Orchestrates complete experiment flow creation in 5 stages:
            //   1. SETUP: Load fonts, clean up existing frames
            //   2. DATA PREP: Collect and normalize variants from all events
            //   3. NODE CREATION: Create info card and all flow nodes (entry→events→variants→exit)
            //   4. LAYOUT: Calculate positions with proper spacing and vertical centering
            //   5. CONNECTORS: Draw connections using dynamic system (native ConnectorNode when possible)
            // ========================================================================
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15;
            yield loadFonts();
            // --- PRE-STAGE: VALIDATE FLOW DATA ---
            // Validate that experiment and flow have all required fields before attempting to render
            // Early validation prevents cryptic errors later in the pipeline
            const validation = validateFlowData(experiment, flow);
            if (!validation.isValid) {
                postValidationFailedToUi(validation.issues);
                console.error('[Petri] createFlowV2FromData validation', validation.issues);
                const preview = validation.issues.slice(0, 3).map((i) => `${validationSectionLabel(i.section)}: ${i.message}`).join('\n');
                notifyUser({
                    type: 'error',
                    title: 'Fix a few things before creating the flow',
                    detail: preview + (validation.issues.length > 3 ? `\n(+${validation.issues.length - 3} more in the plugin panel)` : ''),
                    actionHint: 'Details are listed in the plugin toast.',
                });
                return;
            }
            // Log warnings if any (non-blocking)
            if (validation.warnings.length > 0) {
            }
            // --- STAGE 1: SETUP & FRAME CLEANUP ---
            // Remove existing frames to avoid duplicates when re-running the flow builder
            const flowFrameName = `Experiment Flow — ${experiment.name}`;
            const infoCardName = `Experiment Overview — ${experiment.name}`;
            const cardsContainerName = `Experiment Cards — ${experiment.name}`;
            const existingFlow = figma.currentPage.findOne(n => n.type === 'FRAME' && n.name === flowFrameName);
            if (existingFlow)
                existingFlow.remove();
            let infoCard = figma.currentPage.findOne(n => n.type === 'FRAME' && n.name === infoCardName);
            if (infoCard)
                infoCard.remove();
            // Also remove existing cards container (info + outcome)
            const existingCardsContainer = figma.currentPage.findOne(n => n.type === 'FRAME' && n.name === cardsContainerName);
            if (existingCardsContainer)
                existingCardsContainer.remove();
            // --- STAGE 2: DATA PREPARATION & VARIANT COLLECTION ---
            // Collect all variants from all events and normalize their properties
            // This unified list is used for the outcome card showing all variants with metrics
            // Normalizing here ensures consistent properties across the flow
            const allVariants = [];
            // Iterate through all events and extract variants, applying normalizations
            for (const event of flow.events) {
                if (event.variants && event.variants.length > 0) {
                    event.variants.forEach((variant, index) => {
                        var _a, _b, _c, _d;
                        const rolledOutId = (_b = (_a = experiment.outcomes) === null || _a === void 0 ? void 0 : _a.rolledOutVariantId) !== null && _b !== void 0 ? _b : (_c = experiment.outcomes) === null || _c === void 0 ? void 0 : _c.rolledoutVariantId;
                        // Preserve an explicit comparison flag from older saved data without inventing one.
                        const finalIsControl = safeGetBoolean(variant, 'isControl');
                        allVariants.push({
                            id: variant.id,
                            key: variant.key,
                            name: variant.name || `Variant ${variant.key}`, // Fallback if no name provided
                            description: variant.description,
                            figmaLink: safeGetString(variant, 'figmaLink'),
                            isControl: finalIsControl,
                            traffic: variant.traffic,
                            metrics: variant.metrics,
                            // Check if this is the rolled-out (winning) variant from outcomes
                            isRolledOut: rolledOutId === variant.id,
                            // Statistical significance marker passed from UI for outcome card display
                            isStatSig: safeGetBoolean(variant, 'isStatSig'),
                            // Variant color used for visual identification in cards
                            color: safeGetString(variant, 'color') || ((_d = variant.style) === null || _d === void 0 ? void 0 : _d.variantColor),
                        });
                    });
                }
            }
            // Enforce at most one explicit comparison anchor across all variants.
            // If none is marked, leave all variants unanchored.
            if (allVariants.length > 0) {
                const firstControlIndex = allVariants.findIndex(v => v.isControl === true);
                const resolvedControlIndex = firstControlIndex >= 0 ? firstControlIndex : -1;
                allVariants.forEach((v, i) => {
                    v.isControl = resolvedControlIndex >= 0 ? i === resolvedControlIndex : false;
                });
            }
            // --- STAGE 3: NODE CREATION (Phase A: Info Card) ---
            // Create experiment info card: Two-panel layout with experiment metadata and resource links
            // Positioned to the left of main flow to provide context
            infoCard = yield createExperimentInfoCard(experiment.name, experiment.description || 'e.g., Testing if new CTA increases conversions.', ((_a = experiment.links) === null || _a === void 0 ? void 0 : _a.figma) || '', ((_b = experiment.links) === null || _b === void 0 ? void 0 : _b.jira) || '', ((_c = experiment.links) === null || _c === void 0 ? void 0 : _c.miro) || '', ((_d = experiment.links) === null || _d === void 0 ? void 0 : _d.notion) || '', ((_e = experiment.links) === null || _e === void 0 ? void 0 : _e.amplitude) || '', ((_f = experiment.links) === null || _f === void 0 ? void 0 : _f.asana) || '', ((_g = experiment.links) === null || _g === void 0 ? void 0 : _g.linear) || '', ((_h = experiment.links) === null || _h === void 0 ? void 0 : _h.slack) || '', ((_j = experiment.links) === null || _j === void 0 ? void 0 : _j.github) || '', ((_k = experiment.links) === null || _k === void 0 ? void 0 : _k.confluence) || '', ((_l = experiment.links) === null || _l === void 0 ? void 0 : _l.trello) || '', ((_m = experiment.links) === null || _m === void 0 ? void 0 : _m.monday) || '', ((_o = experiment.links) === null || _o === void 0 ? void 0 : _o.clickup) || '', Array.isArray((_p = experiment.links) === null || _p === void 0 ? void 0 : _p.generic) ? experiment.links.generic : [], metrics, safeGetString(experiment, 'status') || 'running', Object.assign({ showOutcomeCard: allVariants.length > 0, variants: allVariants, owner: safeGetString(experiment, 'owner'), audience: safeGetString(experiment, 'audience'), experimentType: safeGetString(experiment, 'experimentType'), hypothesis: safeGetString(experiment, 'hypothesis'), startDate: safeGetString(experiment, 'startDate'), endDate: safeGetString(experiment, 'endDate'), totalSampleSize: safeGetNumber(experiment, 'sampleSize'), confidenceLevel: safeGetNumber(experiment, 'confidenceLevel'), primaryMetric: (() => {
                    var _a;
                    // Find the metric marked as primary, or fall back to first metric
                    const primaryMetricDef = (metrics === null || metrics === void 0 ? void 0 : metrics.find(m => m.isPrimary)) || (metrics && metrics.length > 0 ? metrics[0] : undefined);
                    if (!primaryMetricDef)
                        return undefined;
                    return ((_a = primaryMetricDef.abbreviation) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || primaryMetricDef.name.replace(/\s+/g, '_').toLowerCase();
                })() }, (() => {
                var _a, _b, _c;
                const rolledOutId = (_b = (_a = experiment.outcomes) === null || _a === void 0 ? void 0 : _a.rolledOutVariantId) !== null && _b !== void 0 ? _b : (_c = experiment.outcomes) === null || _c === void 0 ? void 0 : _c.rolledoutVariantId;
                if (!rolledOutId)
                    return { rolledOutVariantName: undefined, rolledOutVariantColor: undefined };
                const rolledOutVariant = allVariants.find(v => v.id === rolledOutId);
                return {
                    rolledOutVariantName: rolledOutVariant === null || rolledOutVariant === void 0 ? void 0 : rolledOutVariant.name,
                    rolledOutVariantColor: rolledOutVariant === null || rolledOutVariant === void 0 ? void 0 : rolledOutVariant.color
                };
            })()));
            attachNodeMeta(infoCard, {
                name: infoCardName,
                type: 'frame',
                description: experiment.description || 'e.g., Testing if new CTA increases conversions.',
                extra: { experimentId: experiment.id, role: 'experiment-info' },
            });
            const center = figma.viewport.center;
            // Mount the overview card before reading its size for the flow spine. Auto-layout frames
            // that are not on the page often report width ≈ 0, so the spine was placed on top of the
            // card and connectors pointed at the wrong bounds.
            if (infoCard && infoCard.parent === null) {
                infoCard.x = 100;
                infoCard.y = center.y;
                figma.currentPage.appendChild(infoCard);
                yield new Promise((resolve) => setTimeout(resolve, 100));
            }
            // --- STAGE 4: LAYOUT POSITIONING & NODE PLACEMENT ---
            // All nodes positioned directly on page (not in container frame) for ConnectorNode magnetic anchors
            //
            // Layout strategy:
            //   - Horizontal spine: Entry → Events → Exit (same Y line, centered vertically)
            //   - Variants: Below their parent event, in horizontal row
            //   - All positioned with precise X,Y coordinates for deterministic output
            //
            const eventSpacing = (_r = (_q = flow.layout) === null || _q === void 0 ? void 0 : _q.eventSpacing) !== null && _r !== void 0 ? _r : 80; // Horizontal space between events (configurable)
            const variantSpacing = (_t = (_s = flow.layout) === null || _s === void 0 ? void 0 : _s.variantSpacing) !== null && _t !== void 0 ? _t : 40; // Horizontal space between variants in a row
            const eventToVariantSpacing = 100; // Vertical space from event to variant row
            const baseX = infoCard ? infoCard.x + infoCard.width + 200 : 600; // Entry starts after info card
            const baseY = infoCard ? infoCard.y : center.y; // Align to info card or viewport center
            // Track all created nodes: used for layout calc, connector lookup, and viewport zoom
            const allNodes = [];
            // --- STAGE 4a: Create Entry Node (Flow Spine Start) ---
            // Entry node is leftmost on horizontal spine - represents where users enter the experiment
            const entry = flow.entry;
            const entryCard = createNodeCard(entry.label, undefined, undefined, entry.note);
            entryCard.name = 'Entry';
            attachNodeMeta(entryCard, {
                name: entry.label,
                type: 'frame',
                description: entry.note || '',
                extra: {
                    role: 'entry',
                    entryId: entry.id,
                    experimentId: experiment.id,
                    nodeType: 'ENTRY_NODE',
                },
            });
            // Position on the main flow axis; it will be vertically centered later in Stage 4f.
            entryCard.x = baseX;
            entryCard.y = baseY;
            figma.currentPage.appendChild(entryCard);
            allNodes.push({ node: entryCard, id: entry.id, type: 'ENTRY_NODE' });
            // --- STAGE 4b: Pre-calculate Variant Widths (Layout Phase 1) ---
            // Create all variant cards off-screen first to measure their actual widths
            // This allows us to calculate event spacing that accounts for variant row width
            // Why: Events with many variants need more horizontal space
            const variantWidthsByEvent = new Map();
            const variantCardsByEvent = new Map();
            // Generate metric key from abbreviation or name (same logic as UI)
            const getMetricKey = (metric) => {
                if (metric.abbreviation) {
                    return metric.abbreviation.toLowerCase();
                }
                return metric.name.replace(/\s+/g, '_').toLowerCase();
            };
            // Iterate through events and pre-create variant cards to measure widths
            for (const event of flow.events) {
                if (event.variants && event.variants.length > 0) {
                    let totalVariantWidth = 0; // Accumulate total width including spacing
                    const variantCards = [];
                    for (const [vIdx, variant] of event.variants.entries()) {
                        const safeVariantName = typeof variant.name === 'string' && variant.name.trim().length > 0
                            ? variant.name
                            : `Variant ${vIdx + 1}`;
                        const variantColor = variant.color || ((_u = variant.style) === null || _u === void 0 ? void 0 : _u.variantColor);
                        // Check if this variant is rolled out
                        const rolledOutVariantId = (_w = (_v = experiment.outcomes) === null || _v === void 0 ? void 0 : _v.rolledOutVariantId) !== null && _w !== void 0 ? _w : (_x = experiment.outcomes) === null || _x === void 0 ? void 0 : _x.rolledoutVariantId;
                        const isRolledout = rolledOutVariantId === variant.id;
                        const variantForCard = Object.assign(Object.assign({}, variant), { name: safeVariantName, status: isRolledout ? 'winner' : (variant.status || 'none'), metrics: variant.metrics || {}, color: variantColor });
                        const variantThumbnail = yield resolveThumbnailSourceFromFigmaLink(safeGetString(variant, 'figmaLink'), `variant "${safeVariantName}"`);
                        const variantCard = yield createVariantCard(variantForCard, vIdx, {
                            rolledout: isRolledout,
                            metrics: metrics,
                            thumbnailSource: variantThumbnail.node,
                            thumbnailMessage: variantThumbnail.message,
                        });
                        // Position off-screen temporarily (will be positioned correctly in Stage 4d)
                        // We need to add to page to get accurate measurements from Figma's layout engine
                        variantCard.x = -10000;
                        variantCard.y = -10000;
                        figma.currentPage.appendChild(variantCard);
                        // Accumulate total width: spacing between variants + card width
                        if (vIdx > 0) {
                            totalVariantWidth += variantSpacing; // Gap between this and previous variant
                        }
                        totalVariantWidth += variantCard.width;
                        variantCards.push(variantCard);
                    }
                    variantWidthsByEvent.set(event.id, totalVariantWidth);
                    variantCardsByEvent.set(event.id, variantCards);
                }
            }
            // --- STAGE 4c: Create Event Nodes (Flow Spine Middle) ---
            // Event nodes represent touchpoints where variants are tested
            // Positioned on horizontal spine between Entry and Exit
            // Horizontal spacing accounts for variant row widths to prevent overlaps
            //
            let currentX = baseX + entryCard.width + eventSpacing; // Start after entry node
            let maxEventHeight = 0; // Track max height for vertical centering later
            const eventPositions = [];
            for (const [eventIdx, event] of flow.events.entries()) {
                const safeEventName = typeof event.name === 'string' && event.name.trim().length > 0
                    ? event.name
                    : `Touchpoint ${eventIdx + 1}`;
                const eventThumbnail = yield resolveThumbnailSourceFromFigmaLink(safeGetString(event, 'figmaLink'), `touchpoint "${safeEventName}"`);
                // Create event card
                const eventCard = createEventCard(safeEventName, (_z = (_y = event.variants) === null || _y === void 0 ? void 0 : _y.length) !== null && _z !== void 0 ? _z : 0, eventIdx, eventThumbnail.node, eventThumbnail.message, {
                    figmaLink: safeGetString(event, 'figmaLink'),
                    showFigmaLink: event.showFigmaLink,
                });
                // Naming shows up in the Layers panel; use user-facing "Touchpoint" vocabulary.
                eventCard.name = `Touchpoint`;
                // eventCard.name = `Touchpoint: ${safeEventName}`;
                attachNodeMeta(eventCard, {
                    name: safeEventName,
                    type: 'frame',
                    description: ((_0 = event.entryNote) === null || _0 === void 0 ? void 0 : _0.text) || '',
                    extra: {
                        role: 'event',
                        eventId: event.id,
                        experimentId: experiment.id,
                        hasVariants: !!((_1 = event.variants) === null || _1 === void 0 ? void 0 : _1.length),
                        nodeType: 'EVENT_NODE',
                        entryNoteId: (_2 = event.entryNote) === null || _2 === void 0 ? void 0 : _2.id,
                        figmaLink: safeGetString(event, 'figmaLink'),
                    },
                });
                // Position this event at calculated X, aligned to baseY (will be centered vertically in Stage 4f)
                eventCard.x = currentX;
                eventCard.y = baseY;
                figma.currentPage.appendChild(eventCard);
                allNodes.push({ node: eventCard, id: event.id, type: 'EVENT_NODE' });
                // Store position: used in next stage to position variants directly below this event
                eventPositions.push({ event, eventCard, x: currentX, y: baseY });
                // Track max height: all spine nodes will be centered to this height
                maxEventHeight = Math.max(maxEventHeight, eventCard.height);
                // Calculate spacing to next event: account for variant row width
                // This prevents variants from overlapping with the next event
                const eventWidth = eventCard.width;
                const variantRowWidth = variantWidthsByEvent.get(event.id) || 0; // Total width of variant row
                const effectiveWidth = Math.max(eventWidth, variantRowWidth); // Use whichever is wider
                const extraSpacingForVariants = event.variants && event.variants.length > 0 ? eventSpacing * 0.5 : 0; // Add extra space for variants
                // Advance X cursor: past effective width + normal spacing + extra spacing
                currentX += effectiveWidth + eventSpacing + extraSpacingForVariants;
            }
            // --- STAGE 4d: Position Variant Nodes (Rows Below Events) ---
            // Reposition variant cards from off-screen to their final locations
            // Each event's variants are positioned in a horizontal row below the event
            // All variants for an event are aligned to the same Y coordinate
            for (const { event, eventCard, x: eventX, y: eventY } of eventPositions) {
                const variantCards = variantCardsByEvent.get(event.id);
                if (variantCards && variantCards.length > 0) {
                    let variantX = eventX; // Start variants aligned to event's left edge
                    const variantY = eventY + eventCard.height + eventToVariantSpacing; // Position below event
                    for (const [vIdx, variantCard] of variantCards.entries()) {
                        const variant = (_3 = event.variants) === null || _3 === void 0 ? void 0 : _3[vIdx];
                        if (!variant)
                            continue;
                        const safeVariantName = typeof variant.name === 'string' && variant.name.trim().length > 0
                            ? variant.name
                            : `Variant ${vIdx + 1}`;
                        // Set variant card metadata (if not already set)
                        variantCard.name = `Variant`;
                        // variantCard.name = `Variant: ${safeVariantName}`;
                        attachNodeMeta(variantCard, {
                            name: safeVariantName,
                            type: 'frame',
                            description: variant.description || '',
                            extra: {
                                role: 'variant',
                                eventId: event.id,
                                variantId: variant.id,
                                experimentId: experiment.id,
                                variantIndex: vIdx,
                                traffic: variant.traffic,
                                nodeType: 'VARIANT_NODE',
                                parentEventId: variant.parentEventId,
                                figmaLink: safeGetString(variant, 'figmaLink'),
                            },
                        });
                        // Position variant in horizontal row below event
                        variantCard.x = variantX;
                        variantCard.y = variantY;
                        allNodes.push({ node: variantCard, id: variant.id, type: 'VARIANT_NODE' });
                        variantX += variantCard.width + variantSpacing;
                    }
                }
            }
            // --- STAGE 4e: Create Exit Node (Flow Spine End) ---
            // Exit node is rightmost on horizontal spine - represents where users exit the experiment
            const exit = flow.exit;
            const exitCard = createNodeCard(exit.label);
            exitCard.name = 'Exit';
            attachNodeMeta(exitCard, {
                name: exit.label,
                type: 'frame',
                description: '',
                extra: {
                    role: 'exit',
                    exitId: exit.id,
                    experimentId: experiment.id,
                    nodeType: 'EXIT_NODE',
                },
            });
            // Position exit at calculated X position after all events on the main flow axis.
            exitCard.x = currentX;
            exitCard.y = baseY;
            figma.currentPage.appendChild(exitCard);
            allNodes.push({ node: exitCard, id: exit.id, type: 'EXIT_NODE' });
            // --- STAGE 4f: Vertical Alignment (Center All Spine Nodes) ---
            // Ensure Entry → Events → Exit are all vertically centered as a group
            // This creates a clean horizontal spine regardless of individual node heights
            // Strategy: Find tallest spine node, then center all others around it
            //
            const spineNodes = [entryCard, ...eventPositions.map(ep => ep.eventCard), exitCard];
            const maxSpineHeight = Math.max(...spineNodes.map(n => n.height));
            // Center Entry node: move up by half the height difference
            const entryCenterOffset = (maxSpineHeight - entryCard.height) / 2;
            entryCard.y = baseY + entryCenterOffset;
            // Center each Event node vertically and cascade adjustments to variants
            // When an event moves, its variants must move with it to maintain relative positioning
            for (const { event, eventCard } of eventPositions) {
                const oldEventY = eventCard.y; // Remember old position before centering
                const eventCenterOffset = (maxSpineHeight - eventCard.height) / 2;
                const newEventY = baseY + eventCenterOffset;
                eventCard.y = newEventY;
                // Cascade Y adjustment to variants: move them by same delta as their event
                if (event.variants && event.variants.length > 0) {
                    const yDelta = newEventY - oldEventY; // How much did event move?
                    for (const variant of event.variants) {
                        const variantNode = allNodes.find(n => n.id === variant.id);
                        if (variantNode) {
                            variantNode.node.y += yDelta; // Move variant by same amount
                        }
                    }
                }
            }
            // Center Exit node: move up by half the height difference
            const exitCenterOffset = (maxSpineHeight - exitCard.height) / 2;
            exitCard.y = baseY + exitCenterOffset;
            // --- STAGE 5: CONNECTOR RENDERING SETUP ---
            // Build a quick lookup map: node ID → node object
            // This is used to find source/target nodes when drawing connectors
            const nodeMap = {};
            for (const { node, id } of allNodes) {
                nodeMap[id] = node;
            }
            // Overview frame is mounted before spine layout so width is real; settle once more before connectors.
            if (infoCard) {
                yield new Promise(resolve => setTimeout(resolve, 50));
            }
            // --- STAGE 5a: Dynamic Connector Rendering ---
            // Creates connectors between nodes using the smart dynamic system:
            //   1. Tries native ConnectorNode first (FigJam): automatic updates when nodes move! ✨
            //   2. Falls back to VectorNode (regular Figma): manual refresh via refreshConnectors()
            // For VectorNode connectors, call refreshConnectors() or send 'refresh-connectors' message when nodes move
            const createdConnectors = [];
            const connectorErrors = []; // Track errors for reporting
            if (flow.connectors && Array.isArray(flow.connectors) && flow.connectors.length > 0) {
                // Categorize connectors into two groups based on their structure:
                //   1. Merge connectors (MERGE_LINE): Multiple sources → single target, uses merge+trunk pattern
                //   2. Direct connectors (PRIMARY_FLOW_LINE, BRANCH_LINE): Simple one-to-one or one-to-many connections
                const mergeGroups = new Map(); // Group merges by target ID
                const directConnectors = []; // PRIMARY_FLOW_LINE and BRANCH_LINE connectors
                for (const connector of flow.connectors) {
                    if (connector.type === 'MERGE_LINE') {
                        const toId = connector.to.id;
                        if (!mergeGroups.has(toId)) {
                            mergeGroups.set(toId, []);
                        }
                        mergeGroups.get(toId).push(connector);
                    }
                    else {
                        // PRIMARY_FLOW_LINE and BRANCH_LINE use direct connections (no grouping)
                        directConnectors.push(connector);
                    }
                }
                // Render direct connectors (PRIMARY_FLOW_LINE: spine connections; BRANCH_LINE: event to variant)
                // Direct connectors use simple one-to-one paths without merging
                for (const connector of directConnectors) {
                    const fromNode = nodeMap[connector.from.id];
                    const toNode = nodeMap[connector.to.id];
                    if (!fromNode || !toNode) {
                        // Skip: one or both endpoints missing (normal for optional connectors)
                        connectorErrors.push({
                            connectorId: connector.id,
                            from: connector.from.id,
                            to: connector.to.id,
                            error: `Missing node endpoint: ${fromNode ? 'to' : 'from'} node not found`
                        });
                        continue;
                    }
                    try {
                        // Determine connector styling: is one endpoint a rolled-out (winning) variant?
                        // Rolled-out variants get special styling to highlight the chosen path
                        const fromNodeId = connector.from.id;
                        const toNodeId = connector.to.id;
                        const rolledOutVariantId = (_5 = (_4 = experiment.outcomes) === null || _4 === void 0 ? void 0 : _4.rolledOutVariantId) !== null && _5 !== void 0 ? _5 : (_6 = experiment.outcomes) === null || _6 === void 0 ? void 0 : _6.rolledoutVariantId;
                        // Check if either endpoint is the rolled-out variant
                        const isRolledout = rolledOutVariantId && (fromNodeId === rolledOutVariantId || toNodeId === rolledOutVariantId);
                        // Rolled-out styling takes priority over generic winner styling
                        const isWinner = isRolledout || false;
                        // Create connector using dynamic system (tries native → VectorNode fallback)
                        // Native connectors in FigJam will automatically update when nodes move!
                        const connectorNode = createDynamicConnector(fromNode, toNode, connector.type, {
                            label: connector.label,
                            winner: isWinner, // Rolled-out variant is the winner
                            variantColor: undefined,
                            index: 0,
                            rolledout: isRolledout || false, // Rollout styling takes priority over winner
                            useNativeConnector: true, // Try native connectors for automatic updates
                        });
                        if (connectorNode) {
                            // Store additional metadata on the connector
                            try {
                                const existingMeta = connectorNode.getPluginData('connectorMeta');
                                let meta = existingMeta ? JSON.parse(existingMeta) : {};
                                meta = Object.assign(Object.assign({}, meta), { connectorId: connector.id, fromNodeType: connector.from.nodeType, toNodeType: connector.to.nodeType, experimentId: experiment.id });
                                connectorNode.setPluginData('connectorMeta', JSON.stringify(meta));
                            }
                            catch (metaError) {
                                // Non-critical: metadata storage failed, but connector was created
                            }
                            // Name the connector for easy identification
                            try {
                                if (!connectorNode.name.includes('Dynamic') && !connectorNode.name.includes('Static')) {
                                    connectorNode.name = `${connector.type}: ${connector.from.nodeType} → ${connector.to.nodeType}`;
                                }
                            }
                            catch (nameError) {
                                // Non-critical: naming failed, but connector was created
                            }
                            createdConnectors.push(connectorNode);
                        }
                        else {
                            // Connector creation returned null (likely FigJam unavailable or VectorNode creation failed)
                            connectorErrors.push({
                                connectorId: connector.id,
                                from: connector.from.nodeType,
                                to: connector.to.nodeType,
                                error: 'Failed to create connector (likely environment incompatibility)'
                            });
                        }
                    }
                    catch (error) {
                        // Connector creation threw an error: log but continue with remaining connectors
                        // This prevents one bad connector from breaking the entire flow
                        connectorErrors.push({
                            connectorId: connector.id,
                            from: connector.from.nodeType,
                            to: connector.to.nodeType,
                            error: `Connector creation failed: ${error instanceof Error ? error.message : 'unknown error'}`
                        });
                    }
                }
                // Render merge connectors as merge+trunk patterns
                // Merge pattern: Multiple variants connect via branches to a common trunk, then trunk to target
                // This creates cleaner visualization than many separate connectors
                for (const [targetId, merges] of mergeGroups.entries()) {
                    const targetNode = nodeMap[targetId];
                    if (!targetNode) {
                        // Skip: target node missing (unlikely, but handle gracefully)
                        connectorErrors.push({
                            from: `${merges.length} variant(s)`,
                            to: targetId,
                            error: 'Target node not found - merge cannot be created'
                        });
                        continue;
                    }
                    // Collect all variant source nodes for this merge group
                    const variantNodes = merges
                        .map(m => ({ connector: m, node: nodeMap[m.from.id] }))
                        .filter(v => v.node !== undefined);
                    if (variantNodes.length === 0) {
                        // Skip: no valid source nodes (all missing)
                        connectorErrors.push({
                            from: `${merges.length} variant(s)`,
                            to: targetId,
                            error: 'All source nodes missing - merge cannot be created'
                        });
                        continue;
                    }
                    // Log if some variants were filtered out
                    if (variantNodes.length < merges.length) {
                        const missingCount = merges.length - variantNodes.length;
                        connectorErrors.push({
                            error: `Merge group: ${missingCount} of ${merges.length} source nodes missing, creating merge with ${variantNodes.length} available node(s)`
                        });
                    }
                    try {
                        // Create merge+trunk structure: branches from variants converge on trunk, then to target
                        // This produces cleaner visualization than many separate connectors
                        const mergeConnectors = createMergingTree(variantNodes, targetNode, experiment.id);
                        createdConnectors.push(...mergeConnectors);
                    }
                    catch (error) {
                        // Merge tree creation failed: log but continue with remaining connectors
                        // Partial failure doesn't prevent the flow from rendering
                        connectorErrors.push({
                            from: `${variantNodes.length} variant(s)`,
                            to: targetId,
                            error: `Merge tree creation failed: ${error instanceof Error ? error.message : 'unknown error'}`
                        });
                        // Continue to next merge group instead of stopping
                    }
                }
            }
            else {
            }
            // Notify user about connector creation results
            // Report success, partial failure, or complete failure with detailed information
            if (createdConnectors.length > 0) {
                const nativeCount = createdConnectors.filter(c => c.type === 'CONNECTOR').length;
                const vectorCount = createdConnectors.length - nativeCount;
                let message = `Created ${createdConnectors.length} connector${createdConnectors.length !== 1 ? 's' : ''}`;
                if (nativeCount > 0) {
                    message += ` (${nativeCount} dynamic${nativeCount !== 1 ? 's' : ''} - auto-update when cards move)`;
                }
                if (vectorCount > 0) {
                    if (isFigJam()) {
                        message += `. ${vectorCount} static connector${vectorCount !== 1 ? 's' : ''} - use "Refresh Connectors" to update`;
                    }
                    else {
                        message += `. ${vectorCount} connector${vectorCount !== 1 ? 's' : ''} - auto-refreshing when cards move`;
                    }
                }
                // If there were errors during connector creation, report them as a warning
                if (connectorErrors.length > 0) {
                    notifyUser({
                        type: 'warning',
                        title: `⚠️ ${message}`,
                        detail: `However, ${connectorErrors.length} connector(s) failed to create.`,
                        actionHint: 'The flow is complete, but some connections are missing. Check console for details.'
                    });
                }
                else {
                    notifyUser({ type: 'success', title: `✓ ${message}` });
                }
            }
            else {
                // No connectors created at all
                if (connectorErrors.length > 0) {
                    notifyUser({
                        type: 'error',
                        title: '❌ No connectors created',
                        detail: `All ${connectorErrors.length} connector creation attempt(s) failed.`,
                        actionHint: 'Flow structure is intact. Check console for detailed error information.'
                    });
                }
                else {
                    notifyUser(ERRORS.NO_CONNECTORS_CREATED);
                }
            }
            // Select info card and zoom to view all nodes
            if (infoCard) {
                const allPageNodes = allNodes.map(n => n.node);
                figma.viewport.scrollAndZoomIntoView([infoCard, ...allPageNodes]);
            }
            // --- Entry Notes Rendering ---
            // In v2 schema, entry notes may be on flow.entryNotes or experiment.flow.entryNotes or not present
            const entryNotesV2 = flow.entryNotes || experiment.entryNotes || [];
            // Reuse nodeMap for anchor lookup (already built above for connectors)
            // nodeMap is already populated with all nodes from connector rendering
            if (Array.isArray(entryNotesV2)) {
                for (const note of entryNotesV2) {
                    // Create a sticky note frame
                    const noteFrame = figma.createFrame();
                    noteFrame.layoutMode = 'VERTICAL';
                    noteFrame.counterAxisSizingMode = 'AUTO';
                    noteFrame.primaryAxisSizingMode = 'AUTO';
                    noteFrame.paddingLeft = noteFrame.paddingRight = TOKENS.space12;
                    noteFrame.paddingTop = noteFrame.paddingBottom = TOKENS.space8;
                    noteFrame.cornerRadius = TOKENS.radiusSM;
                    noteFrame.fills = [{ type: 'SOLID', color: hexToRgb(TOKENS.yellow50) }];
                    noteFrame.strokes = [{ type: 'SOLID', color: hexToRgb(TOKENS.yellow300) }];
                    noteFrame.strokeWeight = 1;
                    noteFrame.name = `EntryNote: ${note.text}`;
                    const noteText = figma.createText();
                    noteText.fontName = { family: 'Figtree', style: 'Regular' };
                    noteText.fontSize = TOKENS.fontSizeBodySm;
                    noteText.fills = [{ type: 'SOLID', color: hexToRgb(TOKENS.yellow900) }];
                    noteText.characters = note.text;
                    noteText.textAutoResize = 'WIDTH_AND_HEIGHT';
                    noteFrame.appendChild(noteText);
                    attachNodeMeta(noteFrame, {
                        name: note.text,
                        type: 'frame',
                        description: 'Entry Note',
                        extra: {
                            role: 'entry-note',
                            entryNoteId: note.id,
                            anchor: note.attachTo,
                            experimentId: experiment.id,
                        },
                    });
                    // Position note based on attachTo
                    let anchorNode = undefined;
                    const anchorType = (_7 = note.attachTo) === null || _7 === void 0 ? void 0 : _7.target;
                    const anchorId = (_8 = note.attachTo) === null || _8 === void 0 ? void 0 : _8.targetId;
                    if (anchorType === 'EVENT_NODE' && anchorId) {
                        anchorNode = nodeMap[anchorId];
                    }
                    if (anchorNode) {
                        // Place note above or to the left of anchor node, depending on layout
                        // For horizontal spine, place above; for vertical, place left
                        if (((_9 = flow.layout) === null || _9 === void 0 ? void 0 : _9.direction) === 'VERTICAL') {
                            noteFrame.x = ((_10 = anchorNode === null || anchorNode === void 0 ? void 0 : anchorNode.x) !== null && _10 !== void 0 ? _10 : 0) - noteFrame.width - 24;
                            noteFrame.y = ((_11 = anchorNode === null || anchorNode === void 0 ? void 0 : anchorNode.y) !== null && _11 !== void 0 ? _11 : 0) + ((_12 = anchorNode === null || anchorNode === void 0 ? void 0 : anchorNode.height) !== null && _12 !== void 0 ? _12 : 0) / 2 - noteFrame.height / 2;
                        }
                        else {
                            noteFrame.x = ((_13 = anchorNode === null || anchorNode === void 0 ? void 0 : anchorNode.x) !== null && _13 !== void 0 ? _13 : 0) + ((_14 = anchorNode === null || anchorNode === void 0 ? void 0 : anchorNode.width) !== null && _14 !== void 0 ? _14 : 0) / 2 - noteFrame.width / 2;
                            noteFrame.y = ((_15 = anchorNode === null || anchorNode === void 0 ? void 0 : anchorNode.y) !== null && _15 !== void 0 ? _15 : 0) - noteFrame.height - 24;
                        }
                    }
                    else {
                        // Default: place near first event
                        const firstNode = allNodes[0];
                        if (firstNode) {
                            noteFrame.x = firstNode.node.x - noteFrame.width - 24;
                            noteFrame.y = firstNode.node.y;
                        }
                        else {
                            noteFrame.x = baseX - 60;
                            noteFrame.y = baseY - 60;
                        }
                    }
                    figma.currentPage.appendChild(noteFrame);
                }
            }
            // Outcome Note removed
            notifyUser(ERRORS.FLOW_CREATED_SUCCESSFULLY);
            // Set up auto-refresh for connectors in regular Figma
            // (In FigJam, native connectors auto-update, so this isn't needed)
            setupAutoRefreshConnectors().catch(err => {
            });
        });
    }
    /**
     * Safely handle type-specific message dispatch
     * Uses type guards to ensure type safety without 'as any' casts
     * @param msg - Message from UI
     */
    function handlePluginMessage(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            // Handle UI resize
            if (msg.type === 'resize-ui') {
                const width = safeGetNumber(msg, 'width');
                const height = safeGetNumber(msg, 'height');
                if (width && height) {
                    figma.ui.resize(Math.max(MIN_UI_WIDTH, width), height);
                }
                return;
            }
            // Handle V2 flow creation (primary handler with full type safety)
            if (msg.type === 'create-flow-v2') {
                const payload = safeGetProperty(msg, 'payload');
                if (payload && isCreateFlowV2Payload(payload)) {
                    const { experiment, flow, metrics } = payload;
                    // Validate payload before processing
                    const experimentValidation = validateExperiment(experiment);
                    const flowValidation = validateFlow(flow);
                    if (!experimentValidation.isValid || !flowValidation.isValid) {
                        const merged = [...experimentValidation.issues, ...flowValidation.issues];
                        postValidationFailedToUi(merged);
                        console.error('[Petri] create-flow-v2 validation', merged);
                        const preview = merged.slice(0, 3).map((i) => `${validationSectionLabel(i.section)}: ${i.message}`).join('\n');
                        notifyUser({
                            type: 'error',
                            title: 'Fix a few things before creating the flow',
                            detail: preview + (merged.length > 3 ? `\n(+${merged.length - 3} more in the plugin panel)` : ''),
                            actionHint: 'Details are listed in the plugin toast.',
                        });
                        return;
                    }
                    if (metrics && !isMetricDefinitionArray(metrics)) {
                        const goalsIssues = [validationIssue('goals', 'metrics', 'One or more goals are incomplete or invalid.')];
                        postValidationFailedToUi(goalsIssues);
                        console.error('[Petri] invalid metrics payload', metrics);
                        notifyUser({
                            type: 'error',
                            title: 'Fix goals before creating the flow',
                            detail: goalsIssues[0].message,
                        });
                        return;
                    }
                    yield createFlowV2FromData(experiment, flow, metrics);
                }
                return;
            }
            // Handle connector refresh
            if (msg.type === 'refresh-connectors') {
                yield refreshConnectors();
                return;
            }
            // Handle legacy message types
            if (msg.type === 'delete-experiment-flows') {
                deleteExperimentFlowFrames();
                notifyUser(ERRORS.FLOW_DELETED_SUCCESSFULLY);
                return;
            }
        });
    }
    figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
        yield handlePluginMessage(msg);
        // --- LEGACY HANDLERS (kept for backward compatibility) ---
        if (msg.type === 'create-flow' && 'payload' in msg && msg.payload) {
            notifyUser(ERRORS.OLD_FLOW_SCHEMA);
            const payload = safeGetProperty(msg, 'payload');
            if (payload && typeof payload === 'object') {
                const variants = safeGetProperty(payload, 'variants');
                if (!Array.isArray(variants) || variants.length === 0) {
                    notifyUser(ERRORS.NO_VARIANTS);
                    return;
                }
            }
            notifyUser(ERRORS.DEPRECATED_FLOW_TYPE);
        }
        else if (msg.type === 'create-from-selection') {
            const selection = figma.currentPage.selection.filter(node => node.type === 'FRAME' || node.type === 'GROUP');
            if (selection.length === 0) {
                notifyUser(ERRORS.INVALID_THUMBNAIL_SELECTION);
                return;
            }
            if (!('payload' in msg) || !msg.payload) {
                notifyUser(ERRORS.FORM_INCOMPLETE);
                return;
            }
            const payload = safeGetProperty(msg, 'payload');
            if (!payload || typeof payload !== 'object')
                return;
            const experimentName = safeGetString(payload, 'experimentName');
            const roundNumber = safeGetNumber(payload, 'roundNumber');
            const entryLabel = safeGetString(payload, 'entryLabel');
            const exitLabel = safeGetString(payload, 'exitLabel');
            const variants = safeGetProperty(payload, 'variants');
            if (!experimentName || !roundNumber || !entryLabel || !exitLabel || !Array.isArray(variants)) {
                notifyUser(ERRORS.FORM_INCOMPLETE);
                return;
            }
            yield loadFonts();
            const flowFrame = figma.createFrame();
            flowFrame.name = `Experiment Flow: ${experimentName}`;
            flowFrame.layoutMode = 'HORIZONTAL';
            flowFrame.counterAxisSizingMode = 'AUTO'; // Hug content vertically
            flowFrame.primaryAxisSizingMode = 'AUTO'; // Hug content horizontally
            flowFrame.itemSpacing = 32;
            flowFrame.paddingLeft = flowFrame.paddingRight = 32;
            flowFrame.paddingTop = flowFrame.paddingBottom = 32;
            flowFrame.fills = [{ type: 'SOLID', color: hexToRgb(TOKENS.royalBlue600) }];
            flowFrame.cornerRadius = 24;
            // Removed Pill: roundBadge
            // Detect if entryLabel matches a variant name
            let entryCard;
            const matchingVariant = variants.find((v) => v.name === entryLabel);
            if (matchingVariant) {
                entryCard = yield createVariantCard(matchingVariant);
                entryCard.name = 'Entry Variant Node';
            }
            else {
                entryCard = createEventCard(entryLabel, 0, undefined);
                entryCard.name = 'Entry Event Node';
            }
            flowFrame.appendChild(entryCard);
            const roundContainer = figma.createFrame();
            roundContainer.name = 'Round 1 Variants';
            roundContainer.layoutMode = 'VERTICAL';
            roundContainer.counterAxisSizingMode = 'AUTO';
            roundContainer.primaryAxisSizingMode = 'AUTO';
            roundContainer.itemSpacing = 24;
            roundContainer.paddingLeft = roundContainer.paddingRight = 24;
            roundContainer.paddingTop = roundContainer.paddingBottom = 24;
            roundContainer.cornerRadius = 24;
            roundContainer.fills = [{ type: 'SOLID', color: hexToRgb(TOKENS.royalBlue600) }];
            roundContainer.strokes = [{ type: 'SOLID', color: { r: 0.85, g: 0.9, b: 1 } }];
            roundContainer.strokeWeight = 1;
            const variantNodes = [];
            for (let i = 0; i < variants.length; i++) {
                const v = variants[i];
                const card = yield createVariantCard(v);
                if (selection[i]) {
                    const thumb = selection[i].clone();
                    thumb.resize(240, 140);
                    if (thumb.type === 'FRAME')
                        thumb.cornerRadius = TOKENS.radiusSM;
                    thumb.name = 'Thumbnail';
                    for (const child of Array.from(card.children)) {
                        if (child.name === 'Thumbnail')
                            child.remove();
                    }
                    card.insertChild(1, thumb);
                }
                roundContainer.appendChild(card);
                variantNodes.push(card);
            }
            flowFrame.appendChild(roundContainer);
            const exitCard = createNodeCard(exitLabel);
            exitCard.name = 'Exit Node';
            flowFrame.appendChild(exitCard);
            const center = figma.viewport.center;
            flowFrame.x = center.x - 600;
            flowFrame.y = center.y - 200;
            figma.currentPage.appendChild(flowFrame);
            figma.currentPage.selection = [flowFrame];
            figma.viewport.scrollAndZoomIntoView([flowFrame]);
            for (let i = 0; i < variantNodes.length; i++) {
                connectNodes(entryCard, variantNodes[i], flowFrame, {
                    winner: variants[i].status === 'winner',
                    label: `${variants[i].traffic}%`,
                    index: i
                });
            }
            for (let i = 0; i < variantNodes.length; i++) {
                connectNodes(variantNodes[i], exitCard, flowFrame, {
                    winner: variants[i].status === 'winner',
                    index: i
                });
            }
            notifyUser(ERRORS.FLOW_FROM_SELECTION_CREATED);
        }
        else if (msg.type === 'cancel') {
            if (!KEEP_OPEN)
                figma.closePlugin('Plugin closed.');
            else
                notifyUser(ERRORS.OPERATION_CANCELLED);
            return;
        }
    });
    function connectNodes(fromNode, toNode, flowFrame, options) {
        var _a;
        const color = (options === null || options === void 0 ? void 0 : options.winner)
            ? hexToRgb(TOKENS.malachite600)
            : hexToRgb(TOKENS.royalBlue600);
        const strokeWeight = (options === null || options === void 0 ? void 0 : options.winner) ? 7 : 4;
        // Utility: Get best edge-to-edge connection points between two rectangles
        function getEdgeToEdgePoints(from, to, fromMagnet = undefined, toMagnet = undefined) {
            const fx = from.absoluteTransform[0][2];
            const fy = from.absoluteTransform[1][2];
            const tx = to.absoluteTransform[0][2];
            const ty = to.absoluteTransform[1][2];
            // Helper to get edge point
            function getMagnetPoint(node, x, y, magnet) {
                switch (magnet) {
                    case 'LEFT': return { x, y: y + node.height / 2 };
                    case 'RIGHT': return { x: x + node.width, y: y + node.height / 2 };
                    case 'TOP': return { x: x + node.width / 2, y };
                    case 'BOTTOM': return { x: x + node.width / 2, y: y + node.height };
                    default: return { x: x + node.width / 2, y: y + node.height / 2 };
                }
            }
            const fromPoint = getMagnetPoint(from, fx, fy, fromMagnet);
            const toPoint = getMagnetPoint(to, tx, ty, toMagnet);
            return { from: fromPoint, to: toPoint };
        }
        // Support explicit magnet endpoints via options
        // const fromMagnet = options?.fromMagnet as ('LEFT'|'RIGHT'|'TOP'|'BOTTOM'|undefined);
        // const toMagnet = options?.toMagnet as ('LEFT'|'RIGHT'|'TOP'|'BOTTOM'|undefined);
        // Helper to get absolute position of a node
        function getAbsolutePos(node) {
            let x = node.x, y = node.y;
            let parent = node.parent;
            while (parent && parent.type !== 'PAGE') {
                if ('x' in parent && 'y' in parent) {
                    x += parent.x;
                    y += parent.y;
                }
                parent = parent.parent;
            }
            return { x, y };
        }
        // Get edge-to-edge points using absolute positions
        function getEdgeToEdgePointsAbs(from, to) {
            const fromAbs = getAbsolutePos(from);
            const toAbs = getAbsolutePos(to);
            // Center points
            const fromCenter = { x: fromAbs.x + from.width / 2, y: fromAbs.y + from.height / 2 };
            const toCenter = { x: toAbs.x + to.width / 2, y: toAbs.y + to.height / 2 };
            // Direction vector
            const dx = toCenter.x - fromCenter.x;
            const dy = toCenter.y - fromCenter.y;
            let fromPoint, toPoint;
            if (Math.abs(dx) > Math.abs(dy)) {
                fromPoint = {
                    x: dx > 0 ? fromAbs.x + from.width : fromAbs.x,
                    y: fromAbs.y + from.height / 2
                };
                toPoint = {
                    x: dx > 0 ? toAbs.x : toAbs.x + to.width,
                    y: toAbs.y + to.height / 2
                };
            }
            else {
                fromPoint = {
                    x: fromAbs.x + from.width / 2,
                    y: dy > 0 ? fromAbs.y + from.height : fromAbs.y
                };
                toPoint = {
                    x: toAbs.x + to.width / 2,
                    y: dy > 0 ? toAbs.y : toAbs.y + to.height
                };
            }
            return { from: fromPoint, to: toPoint };
        }
        const { from: startAbs, to: endAbs } = getEdgeToEdgePointsAbs(fromNode, toNode);
        // Convert to flowFrame-local coordinates
        const start = Object.assign({}, startAbs), end = Object.assign({}, endAbs);
        if (flowFrame) {
            const frameAbs = getAbsolutePos(flowFrame);
            start.x = startAbs.x - frameAbs.x;
            start.y = startAbs.y - frameAbs.y;
            end.x = endAbs.x - frameAbs.x;
            end.y = endAbs.y - frameAbs.y;
        }
        const index = (_a = options === null || options === void 0 ? void 0 : options.index) !== null && _a !== void 0 ? _a : 0;
        // Add a small offset for parallel lines if needed
        let midX, midY;
        let line, arrow;
        if (Math.abs(start.x - end.x) > Math.abs(start.y - end.y)) {
            // Horizontal: elbow in X
            midX = start.x + (end.x - start.x) * 0.5 + index * 12;
            midY = start.y;
            const pathData = `M ${start.x} ${start.y} L ${midX} ${midY} L ${midX} ${end.y} L ${end.x} ${end.y}`;
            line = figma.createVector();
            line.vectorPaths = [{ windingRule: "NONZERO", data: pathData }];
            line.strokes = [{ type: "SOLID", color }];
            line.strokeWeight = strokeWeight;
            line.strokeAlign = "CENTER";
            line.strokeCap = "ROUND";
            line.strokeJoin = "ROUND";
            line.dashPattern = [6, 3];
            line.name = "Flow Line";
            if (flowFrame)
                flowFrame.appendChild(line);
            else
                figma.currentPage.appendChild(line);
            if (options === null || options === void 0 ? void 0 : options.label) {
                // Removed Pill: label chip
            }
            // Arrowhead - chevron (open caret)
            arrow = figma.createVector();
            const size = 10;
            const arrowX = end.x - size * Math.sign(end.x - start.x);
            arrow.vectorPaths = [
                {
                    windingRule: "NONZERO",
                    data: `M ${end.x} ${end.y} L ${arrowX} ${end.y - size / 2} M ${end.x} ${end.y} L ${arrowX} ${end.y + size / 2}`,
                },
            ];
            arrow.fills = [];
            arrow.strokes = [{ type: "SOLID", color }];
            arrow.strokeWeight = strokeWeight;
            arrow.strokeCap = "ROUND";
            arrow.strokeJoin = "ROUND";
            arrow.name = "Arrowhead";
            if (flowFrame)
                flowFrame.appendChild(arrow);
            else
                figma.currentPage.appendChild(arrow);
            return line;
        }
        else {
            // Vertical: elbow in Y
            midX = start.x;
            midY = start.y + (end.y - start.y) * 0.5 + index * 12;
            const pathData = `M ${start.x} ${start.y} L ${midX} ${midY} L ${end.x} ${midY} L ${end.x} ${end.y}`;
            line = figma.createVector();
            line.vectorPaths = [{ windingRule: "NONZERO", data: pathData }];
            line.strokes = [{ type: "SOLID", color }];
            line.strokeWeight = strokeWeight;
            line.strokeAlign = "CENTER";
            line.strokeCap = "ROUND";
            line.strokeJoin = "ROUND";
            line.dashPattern = [6, 3];
            line.name = "Flow Line";
            if (flowFrame)
                flowFrame.appendChild(line);
            else
                figma.currentPage.appendChild(line);
            if (options === null || options === void 0 ? void 0 : options.label) {
                // Removed Pill: label chip
            }
            // Arrowhead - chevron (open caret)
            arrow = figma.createVector();
            const size = 10;
            const arrowY = end.y - size * Math.sign(end.y - start.y);
            arrow.vectorPaths = [
                {
                    windingRule: "NONZERO",
                    data: `M ${end.x} ${end.y} L ${end.x - size / 2} ${arrowY} M ${end.x} ${end.y} L ${end.x + size / 2} ${arrowY}`,
                },
            ];
            arrow.fills = [];
            arrow.strokes = [{ type: "SOLID", color }];
            arrow.strokeWeight = strokeWeight;
            arrow.strokeCap = "ROUND";
            arrow.strokeJoin = "ROUND";
            arrow.name = "Arrowhead";
            if (flowFrame)
                flowFrame.appendChild(arrow);
            else
                figma.currentPage.appendChild(arrow);
            return line;
        }
    }
    function loadFonts() {
        return __awaiter(this, void 0, void 0, function* () {
            yield figma.loadFontAsync({ family: "Inter", style: "Regular" }).catch(() => { });
            yield figma.loadFontAsync({ family: "Figtree", style: "Regular" }).catch(() => { });
            try {
                yield figma.loadFontAsync({ family: "Figtree", style: "Semibold" });
            }
            catch (_a) {
                yield figma.loadFontAsync({ family: "Figtree", style: "Medium" }).catch(() => { });
            }
            yield figma.loadFontAsync({ family: "Figtree", style: "Bold" }).catch(() => { });
            yield figma.loadFontAsync({ family: "Roboto", style: "Regular" }).catch(() => { });
            yield figma.loadFontAsync({ family: "Roboto", style: "Bold" }).catch(() => { });
        });
    }
}
// --- Canvas Node Framework ---
// ===== Canvas Helper Functions =====
export function attachNodeMeta(node, meta) {
    node.setPluginData('meta', JSON.stringify(meta));
}
export function createFrame(meta, options = {}) {
    const frame = figma.createFrame();
    frame.name = meta.name;
    // Set axis sizing modes if provided in extra
    if (options.extra) {
        if ('primaryAxisSizingMode' in options.extra && typeof options.extra.primaryAxisSizingMode === 'string') {
            frame.primaryAxisSizingMode = options.extra.primaryAxisSizingMode === 'AUTO' ? 'AUTO' : 'FIXED';
        }
        if ('counterAxisSizingMode' in options.extra && typeof options.extra.counterAxisSizingMode === 'string') {
            frame.counterAxisSizingMode = options.extra.counterAxisSizingMode === 'AUTO' ? 'AUTO' : 'FIXED';
        }
    }
    frame.name = meta.name;
    // Hug content logic for auto layout
    if (options.width && options.height) {
        frame.resizeWithoutConstraints(options.width, options.height);
    }
    else if (options.width) {
        frame.resizeWithoutConstraints(options.width, frame.height);
    }
    else if (options.height) {
        frame.resizeWithoutConstraints(frame.width, options.height);
    }
    if (options.x !== undefined && options.y !== undefined) {
        frame.x = options.x;
        frame.y = options.y;
    }
    if (options.fills)
        frame.fills = options.fills;
    if (options.layoutMode)
        frame.layoutMode = options.layoutMode;
    if (options.padding !== undefined) {
        frame.paddingLeft = frame.paddingRight = frame.paddingTop = frame.paddingBottom = options.padding;
    }
    if (options.paddingLeft !== undefined)
        frame.paddingLeft = options.paddingLeft;
    if (options.paddingRight !== undefined)
        frame.paddingRight = options.paddingRight;
    if (options.paddingTop !== undefined)
        frame.paddingTop = options.paddingTop;
    if (options.paddingBottom !== undefined)
        frame.paddingBottom = options.paddingBottom;
    if (options.itemSpacing !== undefined)
        frame.itemSpacing = options.itemSpacing;
    if (options.cornerRadius !== undefined)
        frame.cornerRadius = options.cornerRadius;
    attachNodeMeta(frame, meta);
    return frame;
}
export function createComponent(meta, options = {}) {
    const component = figma.createComponent();
    component.name = meta.name;
    if (options.width)
        component.resizeWithoutConstraints(options.width, options.height || 100);
    if (options.x !== undefined && options.y !== undefined) {
        component.x = options.x;
        component.y = options.y;
    }
    if (options.fills)
        component.fills = options.fills;
    if (options.layoutMode)
        component.layoutMode = options.layoutMode;
    if (options.padding !== undefined) {
        component.paddingLeft = component.paddingRight = component.paddingTop = component.paddingBottom = options.padding;
    }
    if (options.itemSpacing !== undefined)
        component.itemSpacing = options.itemSpacing;
    attachNodeMeta(component, meta);
    return component;
}
export function getNodeMeta(node) {
    const data = node.getPluginData('meta');
    if (!data)
        return null;
    try {
        return JSON.parse(data);
    }
    catch (_a) {
        return null;
    }
}
// --- Visual QA Helper ---
// ===== Serialization Helper =====
function serializeNode(node) {
    return {
        id: node.id,
        type: node.type,
        name: node.name,
        layoutMode: 'layoutMode' in node ? node.layoutMode : undefined,
        fills: Array.isArray(node.fills) ? node.fills : undefined,
        fontName: typeof node.fontName === 'object' ? node.fontName : undefined,
        characters: 'characters' in node ? node.characters : undefined,
        children: 'children' in node ? node.children.map(child => serializeNode(child)) : undefined,
        width: node.width,
        height: node.height,
        paddingLeft: 'paddingLeft' in node ? node.paddingLeft : undefined,
        paddingRight: 'paddingRight' in node ? node.paddingRight : undefined,
        paddingTop: 'paddingTop' in node ? node.paddingTop : undefined,
        paddingBottom: 'paddingBottom' in node ? node.paddingBottom : undefined,
        itemSpacing: 'itemSpacing' in node ? node.itemSpacing : undefined,
        cornerRadius: typeof node.cornerRadius === 'number' ? node.cornerRadius : undefined,
    };
}
