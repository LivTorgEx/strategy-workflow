import { MarkerType } from "@xyflow/react";
import type { StrategyWorkflow, StrategyWorkflowRunInspection } from "./model";
import {
  DEFAULT_GRAPH_PALETTE,
  HIDDEN_OVERVIEW_NODE_TYPES,
  WORKFLOW_GAP_X,
  WORKFLOW_GAP_Y,
  WORKFLOW_TRIGGER_HEIGHT,
  WORKFLOW_TRIGGER_WIDTH,
} from "./constants";
import { edgeHandles, layoutWorkflowNodes } from "./layout";
import { conditionExpression, workflowNodeDimensions } from "./formatters";
import type { WorkflowGraph, WorkflowGraphPalette } from "./types";
import { visibleEdges } from "./visibleEdges";

function workflowEdgeId(edgeId: string): string {
  const separator = edgeId.lastIndexOf(":");
  return separator >= 0 ? edgeId.slice(separator + 1) : edgeId;
}

export function buildWorkflowGraph(
  workflow: StrategyWorkflow,
  run: StrategyWorkflowRunInspection | undefined,
  selectedNodeKey: string | null,
  palette: WorkflowGraphPalette = DEFAULT_GRAPH_PALETTE,
  selectedEdgeId: string | null = null,
  selectedTriggerId: string | null = null,
  currentNodeKeys: ReadonlySet<string> = new Set(),
): WorkflowGraph {
  const nodes = workflow.nodes.filter((node) => !HIDDEN_OVERVIEW_NODE_TYPES.has(node.node_type));
  const nodeKeys = new Set(nodes.map((node) => node.node_key));
  const edges = visibleEdges(workflow, nodeKeys);
  const { orderedNodes, positions } = layoutWorkflowNodes(workflow, nodes, edges);
  const nodeByKey = new Map(orderedNodes.map((node) => [node.node_key, node]));
  const entryTriggers = workflow.triggers.filter((trigger) => nodeKeys.has(trigger.entry_node_key));
  const triggerPositions = new Map<string, { x: number; y: number }>();
  entryTriggers.forEach((trigger, index) => {
    const entryNode = nodeByKey.get(trigger.entry_node_key);
    const entryPosition = positions.get(trigger.entry_node_key);
    if (!entryNode || !entryPosition) return;
    const rowOffset =
      (index - (entryTriggers.length - 1) / 2) * (WORKFLOW_TRIGGER_WIDTH + WORKFLOW_GAP_X);
    triggerPositions.set(trigger.id, {
      x:
        entryPosition.x +
        workflowNodeDimensions(entryNode).width / 2 -
        WORKFLOW_TRIGGER_WIDTH / 2 +
        rowOffset,
      y: entryPosition.y - WORKFLOW_TRIGGER_HEIGHT - WORKFLOW_GAP_Y,
    });
  });

  const triggerNodes = entryTriggers.flatMap((trigger) => {
    const position = triggerPositions.get(trigger.id);
    if (!position) return [];
    return [
      {
        id: triggerNodeId(trigger.id),
        type: "trigger" as const,
        position,
        data: { trigger },
        selected: trigger.id === selectedTriggerId,
        draggable: false,
        selectable: true,
        connectable: false,
        deletable: false,
        ariaLabel: `${triggerTitle(trigger)} workflow signal trigger`,
        zIndex: 0,
      },
    ];
  });

  const triggerEdges = entryTriggers.flatMap((trigger) => {
    if (!triggerPositions.has(trigger.id)) return [];
    return [
      {
        id: triggerEdgeId(trigger.id),
        source: triggerNodeId(trigger.id),
        target: trigger.entry_node_key,
        sourceHandle: "source-bottom",
        targetHandle: "target-top",
        type: "smoothstep" as const,
        data: { triggerId: trigger.id },
        label: trigger.action_code ?? trigger.input_kind,
        labelStyle: { fontSize: 11, fill: palette.label },
        labelBgStyle: { fill: palette.labelBackground, fillOpacity: 0.9 },
        style: { stroke: palette.alternateEdge, strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: palette.alternateEdge,
        },
      },
    ];
  });

  return {
    nodes: [
      ...triggerNodes,
      ...orderedNodes.map((node, index) => ({
        id: node.node_key,
        type: "workflow" as const,
        position: positions.get(node.node_key) ?? { x: 0, y: 0 },
        data: {
          node,
          run,
          current: currentNodeKeys.has(node.node_key),
        },
        selected: node.node_key === selectedNodeKey,
        draggable: false,
        selectable: true,
        connectable: false,
        deletable: false,
        ariaLabel: `${node.name || node.node_key} workflow node`,
        zIndex: index + triggerNodes.length,
      })),
    ],
    edges: [
      ...triggerEdges,
      ...edges.flatMap((edge) => {
        const from = positions.get(edge.from_node_key);
        const to = positions.get(edge.to_node_key);
        if (!from || !to) return [];
        const fromNode = nodeByKey.get(edge.from_node_key);
        const toNode = nodeByKey.get(edge.to_node_key);
        if (!fromNode || !toNode) return [];
        const handles = edgeHandles({ ...from, node: fromNode }, { ...to, node: toNode });
        return [
          {
            id: edge.id,
            source: edge.from_node_key,
            target: edge.to_node_key,
            sourceHandle: handles.sourceHandle,
            targetHandle: handles.targetHandle,
            type: edge.trigger_type === "condition" ? "condition" : "smoothstep",
            data: {
              workflowEdgeId: workflowEdgeId(edge.id),
              ...(edge.trigger_type === "condition"
                ? {
                    conditionExpression: conditionExpression(edge.condition) ?? "condition",
                  }
                : {}),
            },
            selected: edge.id === selectedEdgeId,
            label: edge.trigger_type === "success" ? undefined : edge.trigger_type,
            labelStyle: { fontSize: 11, fill: palette.label },
            labelBgStyle: { fill: palette.labelBackground, fillOpacity: 0.9 },
            style: {
              stroke: edge.trigger_type === "success" ? palette.edge : palette.alternateEdge,
              strokeWidth: 2,
              strokeDasharray: edge.trigger_type === "success" ? undefined : "6 4",
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: edge.trigger_type === "success" ? palette.edge : palette.alternateEdge,
            },
          },
        ];
      }),
    ],
  };
}

function triggerNodeId(triggerId: string) {
  return `trigger:${triggerId}`;
}

function triggerEdgeId(triggerId: string) {
  return `trigger-edge:${triggerId}`;
}

function triggerTitle(trigger: StrategyWorkflow["triggers"][number]) {
  return trigger.action_code || trigger.input_kind;
}
