import type {
  WorkflowGraph,
  WorkflowGraphEdge,
  WorkflowGraphNode,
  WorkflowGraphTrigger,
} from "../types";

export type WorkflowNode = WorkflowGraphNode & {
  id: string;
  node_type: NonNullable<WorkflowGraphNode["node_type"]>;
};

export type WorkflowEdge = WorkflowGraphEdge & {
  id: string;
  priority: number;
  trigger_type: NonNullable<WorkflowGraphEdge["trigger_type"]>;
};

export type WorkflowTrigger = WorkflowGraphTrigger & {
  id: string;
  input_kind: string;
};

export type StrategyWorkflow = Omit<WorkflowGraph, "nodes" | "edges" | "triggers"> & {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  triggers: WorkflowTrigger[];
};

export type StrategyWorkflowRunInspection = {
  run?: { active_node_keys?: string[] };
  steps?: Array<{ node_key: string; attempt: number; status: string }>;
  cursors?: Array<{ node_key: string; status: string }>;
};

export function normalizeWorkflowGraph(graph: WorkflowGraph): StrategyWorkflow {
  return {
    ...graph,
    nodes: graph.nodes.map((node, index) => ({
      ...node,
      id: node.id ?? `${node.node_key}:${index}`,
      node_type: node.node_type ?? "operation",
    })),
    edges: graph.edges.map((edge, index) => ({
      ...edge,
      id: edge.id ?? `${edge.from_node_key}:${edge.to_node_key}:${index}`,
      priority: edge.priority ?? index,
      trigger_type: edge.trigger_type ?? "success",
    })),
    triggers: (graph.triggers ?? []).map((trigger, index) => ({
      ...trigger,
      id: trigger.id ?? `trigger:${index}`,
      input_kind: trigger.input_kind ?? "manual_signal",
    })),
  };
}
