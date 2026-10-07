import type { StrategyWorkflow, WorkflowEdge, WorkflowNode } from "./model";
import {
  WORKFLOW_GAP_X,
  WORKFLOW_GAP_Y,
  WORKFLOW_NODE_WIDTH,
  WORKFLOW_TRIGGER_HEIGHT,
  WORKFLOW_TITLE_HEIGHT,
} from "./constants.js";
import { workflowNodeDimensions } from "./formatters.js";

function edgeOrder(edge: WorkflowEdge, index: number) {
  const triggerRank =
    edge.trigger_type === "success" ? 0 : edge.trigger_type === "condition" ? 1 : 2;
  return [triggerRank, edge.priority ?? 0, index] as const;
}

function compareEdgeOrder(
  left: { edge: WorkflowEdge; index: number },
  right: { edge: WorkflowEdge; index: number },
) {
  const leftOrder = edgeOrder(left.edge, left.index);
  const rightOrder = edgeOrder(right.edge, right.index);
  return (
    leftOrder[0] - rightOrder[0] || leftOrder[1] - rightOrder[1] || leftOrder[2] - rightOrder[2]
  );
}

function graphNodeOrder(workflow: StrategyWorkflow, nodes: WorkflowNode[], edges: WorkflowEdge[]) {
  const nodeByKey = new Map(nodes.map((node) => [node.node_key, node]));
  const outgoing = new Map<string, Array<{ edge: WorkflowEdge; index: number }>>();
  edges.forEach((edge, index) => {
    outgoing.set(edge.from_node_key, [
      ...(outgoing.get(edge.from_node_key) ?? []),
      { edge, index },
    ]);
  });
  outgoing.forEach((nodeEdges) => nodeEdges.sort(compareEdgeOrder));

  const orderedKeys: string[] = [];
  const visited = new Set<string>();
  const visit = (nodeKey: string) => {
    if (visited.has(nodeKey) || !nodeByKey.has(nodeKey)) return;
    visited.add(nodeKey);
    orderedKeys.push(nodeKey);
    outgoing.get(nodeKey)?.forEach(({ edge }) => visit(edge.to_node_key));
  };

  const entryNodeKey = workflow.triggers.find(
    (trigger) => trigger.enabled && nodeByKey.has(trigger.entry_node_key),
  )?.entry_node_key;
  if (entryNodeKey) visit(entryNodeKey);
  nodes.forEach((node) => visit(node.node_key));

  return orderedKeys.map((nodeKey) => nodeByKey.get(nodeKey) as WorkflowNode);
}

function graphNodeRanks(
  workflow: StrategyWorkflow,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  orderedNodes: WorkflowNode[],
) {
  const nodeKeys = new Set(nodes.map((node) => node.node_key));
  const incoming = new Map<string, number>();
  const ranks = new Map<string, number>();
  const outgoing = new Map<string, WorkflowEdge[]>();
  nodes.forEach((node) => {
    incoming.set(node.node_key, 0);
    ranks.set(node.node_key, 0);
  });
  edges.forEach((edge) => {
    if (!nodeKeys.has(edge.from_node_key) || !nodeKeys.has(edge.to_node_key)) {
      return;
    }
    incoming.set(edge.to_node_key, (incoming.get(edge.to_node_key) ?? 0) + 1);
    outgoing.set(edge.from_node_key, [...(outgoing.get(edge.from_node_key) ?? []), edge]);
  });

  const orderIndex = new Map(orderedNodes.map((node, index) => [node.node_key, index]));
  const queue = nodes
    .filter((node) => incoming.get(node.node_key) === 0)
    .sort(
      (left, right) => (orderIndex.get(left.node_key) ?? 0) - (orderIndex.get(right.node_key) ?? 0),
    )
    .map((node) => node.node_key);
  const processed = new Set<string>();

  while (queue.length > 0) {
    const nodeKey = queue.shift();
    if (!nodeKey || processed.has(nodeKey)) continue;
    processed.add(nodeKey);
    outgoing.get(nodeKey)?.forEach((edge) => {
      ranks.set(
        edge.to_node_key,
        Math.max(ranks.get(edge.to_node_key) ?? 0, (ranks.get(nodeKey) ?? 0) + 1),
      );
      const nextIncoming = (incoming.get(edge.to_node_key) ?? 0) - 1;
      incoming.set(edge.to_node_key, nextIncoming);
      if (nextIncoming === 0) {
        queue.push(edge.to_node_key);
        queue.sort((left, right) => (orderIndex.get(left) ?? 0) - (orderIndex.get(right) ?? 0));
      }
    });
  }

  const entryNodeKey = workflow.triggers.find(
    (trigger) => trigger.enabled && nodeKeys.has(trigger.entry_node_key),
  )?.entry_node_key;
  const reachable = new Set<string>();
  if (entryNodeKey) {
    const visit = (nodeKey: string) => {
      if (reachable.has(nodeKey)) return;
      reachable.add(nodeKey);
      outgoing.get(nodeKey)?.forEach((edge) => visit(edge.to_node_key));
    };
    visit(entryNodeKey);
  }
  const reachableMaxRank = Math.max(0, ...[...reachable].map((nodeKey) => ranks.get(nodeKey) ?? 0));
  nodes.forEach((node) => {
    if (!reachable.has(node.node_key) && entryNodeKey) {
      ranks.set(node.node_key, reachableMaxRank + 1 + (ranks.get(node.node_key) ?? 0));
    }
  });

  return ranks;
}

const BRANCH_LANE_STEP = 1;

/**
 * Assign a stable horizontal lane to every node while preserving the graph's
 * branching structure. A lane is inherited from the incoming edge; outgoing
 * edges from a fork receive separated lanes and a join averages its incoming
 * lanes back together. This keeps long branch paths aligned even when a row
 * contains only one node.
 */
function graphNodeLanes(
  workflow: StrategyWorkflow,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  orderedNodes: WorkflowNode[],
) {
  const nodeKeys = new Set(nodes.map((node) => node.node_key));
  const outgoing = new Map<string, Array<{ edge: WorkflowEdge; index: number }>>();
  const incoming = new Map<string, Array<{ from: string; edge: WorkflowEdge }>>();
  edges.forEach((edge, index) => {
    if (!nodeKeys.has(edge.from_node_key) || !nodeKeys.has(edge.to_node_key)) {
      return;
    }
    outgoing.set(edge.from_node_key, [
      ...(outgoing.get(edge.from_node_key) ?? []),
      { edge, index },
    ]);
    incoming.set(edge.to_node_key, [
      ...(incoming.get(edge.to_node_key) ?? []),
      { from: edge.from_node_key, edge },
    ]);
  });
  outgoing.forEach((nodeEdges) => nodeEdges.sort(compareEdgeOrder));

  const orderIndex = new Map(orderedNodes.map((node, index) => [node.node_key, index]));
  const ranks = graphNodeRanks(workflow, nodes, edges, orderedNodes);
  const lanes = new Map<string, number>();
  const entryNodeKey = workflow.triggers.find(
    (trigger) => trigger.enabled && nodeKeys.has(trigger.entry_node_key),
  )?.entry_node_key;

  const roots = orderedNodes.filter((node) => !(incoming.get(node.node_key)?.length ?? 0));
  roots.forEach((node, index) => {
    lanes.set(node.node_key, node.node_key === entryNodeKey ? 0 : (index + 1) * BRANCH_LANE_STEP);
  });

  [...orderedNodes]
    .sort(
      (left, right) =>
        (ranks.get(left.node_key) ?? 0) - (ranks.get(right.node_key) ?? 0) ||
        (orderIndex.get(left.node_key) ?? 0) - (orderIndex.get(right.node_key) ?? 0),
    )
    .forEach((node) => {
      if (lanes.has(node.node_key)) return;
      const parentLanes = (incoming.get(node.node_key) ?? [])
        .map(({ from, edge }) => {
          const parentLane = lanes.get(from);
          if (parentLane === undefined) return null;
          const siblings = outgoing.get(from) ?? [];
          if (siblings.length <= 1) return parentLane;
          const branchIndex = siblings.findIndex(({ edge: sibling }) => sibling.id === edge.id);
          return parentLane + branchIndex - (siblings.length - 1) / 2;
        })
        .filter((lane): lane is number => lane !== null);

      lanes.set(
        node.node_key,
        parentLanes.length > 0
          ? parentLanes.reduce((sum, lane) => sum + lane, 0) / parentLanes.length
          : 0,
      );
    });

  return lanes;
}

export function layoutWorkflowNodes(
  workflow: StrategyWorkflow,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
) {
  const orderedNodes = graphNodeOrder(workflow, nodes, edges);
  const ranks = graphNodeRanks(workflow, nodes, edges, orderedNodes);
  const lanes = graphNodeLanes(workflow, nodes, edges, orderedNodes);
  const rows = new Map<number, WorkflowNode[]>();
  orderedNodes.forEach((node) => {
    const rank = ranks.get(node.node_key) ?? 0;
    rows.set(rank, [...(rows.get(rank) ?? []), node]);
  });

  const positions = new Map<string, { x: number; y: number }>();
  const sortedRanks = [...rows.keys()].sort((left, right) => left - right);
  const nodeKeys = new Set(nodes.map((node) => node.node_key));
  const entryTriggerCount = workflow.triggers.filter((trigger) =>
    nodeKeys.has(trigger.entry_node_key),
  ).length;
  let y =
    WORKFLOW_TITLE_HEIGHT + (entryTriggerCount > 0 ? WORKFLOW_TRIGGER_HEIGHT + WORKFLOW_GAP_Y : 0);
  sortedRanks.forEach((rank) => {
    const row = rows.get(rank) ?? [];
    const rowHeight = Math.max(...row.map((node) => workflowNodeDimensions(node).height));
    const rowEntries = row
      .map((node, index) => {
        const dimensions = workflowNodeDimensions(node);
        const lane = lanes.get(node.node_key) ?? 0;
        return {
          node,
          dimensions,
          order: index,
          desiredCenter: lane * (WORKFLOW_NODE_WIDTH + WORKFLOW_GAP_X),
        };
      })
      .sort((left, right) => left.desiredCenter - right.desiredCenter || left.order - right.order);
    const rowGap = WORKFLOW_GAP_X / 2;
    let previousRight = Number.NEGATIVE_INFINITY;
    const placed = rowEntries.map((entry) => {
      const left = Math.max(
        entry.desiredCenter - entry.dimensions.width / 2,
        previousRight + rowGap,
      );
      previousRight = left + entry.dimensions.width;
      return { ...entry, left };
    });
    const desiredMin = Math.min(
      ...rowEntries.map((entry) => entry.desiredCenter - entry.dimensions.width / 2),
    );
    const desiredMax = Math.max(
      ...rowEntries.map((entry) => entry.desiredCenter + entry.dimensions.width / 2),
    );
    const actualMin = Math.min(...placed.map((entry) => entry.left));
    const actualMax = Math.max(...placed.map((entry) => entry.left + entry.dimensions.width));
    const rowShift = (desiredMin + desiredMax - actualMin - actualMax) / 2;
    placed.forEach((entry) => {
      positions.set(entry.node.node_key, {
        x: entry.left + rowShift,
        y,
      });
    });
    y += rowHeight + WORKFLOW_GAP_Y;
  });

  // Center the complete graph after lane placement. This preserves lane
  // spacing while keeping the viewport balanced for asymmetric branches.
  const horizontalBounds = [...positions.values()].reduce(
    (bounds, position) => ({
      min: Math.min(bounds.min, position.x),
      max: Math.max(bounds.max, position.x),
    }),
    { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY },
  );
  const horizontalCenter = (horizontalBounds.min + horizontalBounds.max) / 2 || 0;
  positions.forEach((position, nodeKey) => {
    positions.set(nodeKey, { ...position, x: position.x - horizontalCenter });
  });

  return { orderedNodes, positions };
}

export function edgeHandles(
  from: { x: number; y: number; node: WorkflowNode },
  to: { x: number; y: number; node: WorkflowNode },
) {
  const fromDimensions = workflowNodeDimensions(from.node);
  const toDimensions = workflowNodeDimensions(to.node);
  if (
    from.node.node_type === "fork" ||
    from.node.node_type === "join" ||
    to.node.node_type === "fork" ||
    to.node.node_type === "join"
  ) {
    return { sourceHandle: "source-bottom", targetHandle: "target-top" };
  }
  if (to.y >= from.y) {
    return { sourceHandle: "source-bottom", targetHandle: "target-top" };
  }
  const fromCenterX = from.x + fromDimensions.width / 2;
  const toCenterX = to.x + toDimensions.width / 2;
  if (Math.abs(toCenterX - fromCenterX) < 2) {
    return to.y >= from.y
      ? { sourceHandle: "source-bottom", targetHandle: "target-top" }
      : { sourceHandle: "source-top", targetHandle: "target-bottom" };
  }
  return toCenterX > fromCenterX
    ? { sourceHandle: "source-right", targetHandle: "target-left" }
    : { sourceHandle: "source-left", targetHandle: "target-right" };
}
