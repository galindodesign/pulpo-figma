/**
 * Type definitions for Growthlab Experiment Flow Builder
 * Centralized type system for experiment flows, nodes, connectors, and messages
 */

/// <reference types="@figma/plugin-typings" />

// ===== Core Experiment Types =====

/**
 * V2 Experiment definition with metadata and outcomes
 */
export interface ExperimentV2 {
  id: string;
  name: string;
  roundNumber: number;
  description?: string;
  links?: {
    figma?: string;
    jira?: string;
    miro?: string;
    notion?: string;
    amplitude?: string;
    asana?: string;
    linear?: string;
    slack?: string;
    github?: string;
    confluence?: string;
    trello?: string;
    monday?: string;
    clickup?: string;
    generic?: string;
  };
  outcomes?: {
    winningPaths?: Array<{ eventId: string; variantId: string }>;
    notes?: string;
    rolledOutVariantId?: string;
    rolledoutVariantId?: string;
  };
}

/**
 * Metric definition for experiment measurement
 */
export interface MetricDefinition {
  id: string;
  name: string;
  abbreviation?: string;
  direction?: "increase" | "decrease" | "neutral";
  thresholdPct?: number;
  min?: number;
  max?: number;
  isPrimary?: boolean;
}

// ===== Node Types =====

/**
 * Entry node marking experiment flow start
 */
export interface EntryNodeV2 {
  id: string;
  label: string;
  note?: string;
  nodeType: 'ENTRY_NODE';
}

/**
 * Exit node marking experiment flow end
 */
export interface ExitNodeV2 {
  id: string;
  label: string;
  nodeType: 'EXIT_NODE';
}

/**
 * Variant metrics (dynamic keys based on metric definitions)
 */
export type VariantMetrics = {
  [key: string]: number;
};

/**
 * Experiment variant within an event
 */
export interface VariantV2 {
  id: string;
  parentEventId: string;
  key: string;
  name: string;
  description?: string;
  figmaLink?: string;
  traffic: number;
  metrics?: VariantMetrics;
  /** When false, per-variant goal outcome fields stay hidden until the user opts in from the variant menu. */
  showGoalOutcomes?: boolean;
  /**
   * Visibility of the inline "Linked design" Figma link block on the variant card.
   * Explicit false hides; undefined defers to whether `figmaLink` is set (legacy grace).
   */
  showFigmaLink?: boolean;
  style?: {
    variantColor?: string;
  };
}

/**
 * Entry note attached to events or connectors
 */
export interface EntryNoteV2 {
  id: string;
  text: string;
  attachTo: {
    target: 'EVENT_NODE' | 'PRIMARY_FLOW_LINE';
    targetId?: string;
    fromId?: string;
    toId?: string;
    anchor?: string;
  };
}

/**
 * Event node representing a touchpoint in the experiment flow
 */
export interface EventNodeV2 {
  id: string;
  name: string;
  nodeType: 'EVENT_NODE';
  figmaLink?: string;
  /**
   * Visibility of the inline "Linked design" Figma link block on the touchpoint card.
   * Explicit false hides; undefined defers to whether `figmaLink` is set (legacy grace).
   */
  showFigmaLink?: boolean;
  entryNote?: EntryNoteV2;
  variants?: VariantV2[];
}

// ===== Connector Types =====

/**
 * Connector types for flow visualization
 */
export type ConnectorTypeV2 = 'PRIMARY_FLOW_LINE' | 'BRANCH_LINE' | 'MERGE_LINE';

/**
 * Connector style properties with type-safe values
 */
export interface ConnectorStyle {
  strokeWeight?: number;
  color?: RGB | string;
  dashPattern?: number[];
  arrowhead?: boolean;
  opacity?: number;
}

/**
 * Connector definition linking nodes in the flow
 */
export interface ConnectorV2 {
  id: string;
  type: ConnectorTypeV2;
  from: { nodeType: string; id: string };
  to: { nodeType: string; id: string };
  label?: string;
  arrowhead?: boolean;
  style?: ConnectorStyle;
}

/**
 * Internal connector style configuration
 */
export interface ConnectorStyleConfig {
  strokeWeight: number;
  color: RGB;
  dashPattern?: number[];
  arrowhead: boolean;
}

/**
 * Options for connector styling
 */
export interface ConnectorStyleOptions {
  winner?: boolean;
  variantColor?: string;
  rolledout?: boolean;
}

// ===== Flow Types =====

/**
 * Layout configuration for flow rendering
 */
export interface FlowLayoutV2 {
  direction?: 'HORIZONTAL' | 'VERTICAL';
  eventSpacing?: number;
  variantSpacing?: number;
  branchDepth?: number;
}

/**
 * Complete flow definition with nodes and connectors
 */
export interface FlowV2 {
  id: string;
  layout?: FlowLayoutV2;
  entry: EntryNodeV2;
  events: EventNodeV2[];
  exit: ExitNodeV2;
  connectors: ConnectorV2[];
}

// ===== Message Types =====

/**
 * Payload for creating V2 experiment flows
 */
export interface CreateFlowV2Payload {
  experiment: ExperimentV2;
  flow: FlowV2;
  metrics?: MetricDefinition[];
}

/**
 * V2 message for creating experiment flows
 */
export interface PluginMessageV2 {
  type: 'create-flow-v2';
  payload: CreateFlowV2Payload;
}

/**
 * Type-safe union of all plugin message types
 */
export type PluginMessageUnion =
  | { type: 'create-flow-v2'; payload: CreateFlowV2Payload }
  | { type: 'delete-experiment-flows' }
  | { type: 'refresh-connectors' }
  | { type: 'resize-ui'; width?: number; height?: number }
  | { type: string; payload?: unknown };

/**
 * Generic plugin message interface
 */
export interface PluginMessage {
  type: string;
  payload?: CreateFlowV2Payload;
}

// ===== Legacy Types (for backward compatibility) =====

/**
 * Legacy variant status
 */
export type VariantStatus = "running" | "winner" | "none";

/**
 * Legacy variant type
 */
export type Variant = {
  key: string;
  name: string;
  traffic: number;
  status: VariantStatus;
  metrics: VariantMetrics;
  figmaLink?: string;
};

// ===== Canvas Node Types =====

/**
 * Canvas node type
 */
export type CanvasNodeType = 'frame' | 'component' | 'group' | 'text' | 'shape';

/**
 * Metadata attached to canvas nodes
 */
export interface CanvasNodeMeta {
  id?: string;
  name: string;
  type: CanvasNodeType;
  description?: string;
  tags?: string[];
  extra?: Record<string, unknown>;
}

/**
 * Options for canvas node creation
 */
export interface CanvasNodeOptions {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  fills?: Paint[];
  layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
  padding?: number;
  itemSpacing?: number;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  cornerRadius?: number;
  extra?: Record<string, unknown>;
}

// ===== Validation Types =====

/**
 * Validation result with errors and warnings
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Error message structure for user feedback
 */
export interface ErrorMessage {
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  detail?: string;
  actionHint?: string;
}

// ===== Serialization Types =====

/**
 * Serialized node for debugging and visualization
 */
export type SerializeNode = {
  id: string;
  type: string;
  name: string;
  layoutMode?: string;
  fills?: Paint[];
  fontName?: FontName;
  characters?: string;
  children?: SerializeNode[];
  width: number;
  height: number;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  itemSpacing?: number;
  cornerRadius?: number;
};
