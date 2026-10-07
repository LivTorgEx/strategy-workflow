import type { Edge, Node } from "@xyflow/react";
import type { StrategyWorkflowRunInspection, WorkflowTrigger, WorkflowNode } from "./model";

export type WorkflowNodeData = {
  node: WorkflowNode;
  run?: StrategyWorkflowRunInspection;
  current: boolean;
};

export type WorkflowTriggerData = {
  trigger: WorkflowTrigger;
};

export type WorkflowFlowNode = Node<WorkflowNodeData | WorkflowTriggerData, "workflow" | "trigger">;

export type WorkflowEdgeData = {
  workflowEdgeId?: string;
  triggerId?: string;
  conditionExpression?: string;
};

export type WorkflowFlowEdge = Edge<WorkflowEdgeData>;

export type WorkflowGraph = {
  nodes: WorkflowFlowNode[];
  edges: WorkflowFlowEdge[];
};

export type WorkflowGraphPalette = {
  edge: string;
  alternateEdge: string;
  label: string;
  labelBackground: string;
};
