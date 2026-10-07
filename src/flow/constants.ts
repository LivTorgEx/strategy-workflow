import type { WorkflowNodeType } from "../types";

export const WORKFLOW_NODE_WIDTH = 260;
export const WORKFLOW_NODE_HEIGHT = 116;
export const WORKFLOW_COMPACT_NODE_WIDTH = 180;
export const WORKFLOW_COMPACT_NODE_HEIGHT = 84;
export const WORKFLOW_TRIGGER_WIDTH = 300;
export const WORKFLOW_TRIGGER_HEIGHT = 104;
export const WORKFLOW_GAP_X = 88;
export const WORKFLOW_GAP_Y = 52;
export const WORKFLOW_TITLE_HEIGHT = 48;

export const HIDDEN_OVERVIEW_NODE_TYPES = new Set<WorkflowNodeType>(["condition", "stop"]);

export const DEFAULT_GRAPH_PALETTE = {
  edge: "#334155",
  alternateEdge: "#64748b",
  label: "#64748b",
  labelBackground: "#ffffff",
} as const;
