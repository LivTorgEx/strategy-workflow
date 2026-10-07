import { useMemo } from "react";
import { Text } from "@livtorgex/ui-kit";
import { buildWorkflowGraph, normalizeWorkflowGraph } from "../flow";
import type { WorkflowGraphViewProps } from "../types";
import { WorkflowCanvas } from "./WorkflowCanvas";

const EMPTY_NODE_KEYS: ReadonlySet<string> = new Set();

export function WorkflowGraphView({
  graph,
  currentNodeKeys = EMPTY_NODE_KEYS,
  selectedNodeKey = null,
  onNodeSelect,
  fitView = true,
}: WorkflowGraphViewProps) {
  const workflow = useMemo(() => normalizeWorkflowGraph(graph), [graph]);
  const flowGraph = useMemo(
    () =>
      buildWorkflowGraph(
        workflow,
        undefined,
        selectedNodeKey,
        undefined,
        null,
        null,
        currentNodeKeys,
      ),
    [currentNodeKeys, selectedNodeKey, workflow],
  );

  if (graph.nodes.length === 0) {
    return (
      <Text variant="caption" tone="subtle">
        This workflow has no nodes.
      </Text>
    );
  }

  return <WorkflowCanvas graph={flowGraph} fitView={fitView} onNodeSelect={onNodeSelect} />;
}
