import { Background, Controls, ReactFlow } from "@xyflow/react";
import type { WorkflowFlowEdge, WorkflowFlowNode, WorkflowGraph as FlowGraph } from "../flow";
import { WorkflowConditionEdge } from "./WorkflowConditionEdge";
import { WorkflowNodeCard } from "./WorkflowNodeCard";
import { WorkflowTransitionEdge } from "./WorkflowTransitionEdge";
import { WorkflowTriggerCard } from "./WorkflowTriggerCard";

const nodeTypes = {
  workflow: WorkflowNodeCard,
  trigger: WorkflowTriggerCard,
};

const edgeTypes = {
  condition: WorkflowConditionEdge,
  smoothstep: WorkflowTransitionEdge,
};

export function WorkflowCanvas({
  graph,
  fitView,
  onNodeSelect,
}: {
  graph: FlowGraph;
  fitView: boolean;
  onNodeSelect?: (nodeKey: string | null) => void;
}) {
  return (
    <div className="strategy-workflow-view" aria-label="Workflow graph">
      <ReactFlow<WorkflowFlowNode, WorkflowFlowEdge>
        nodes={graph.nodes}
        edges={graph.edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView={fitView}
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={Boolean(onNodeSelect)}
        onNodeClick={(_event, node) => onNodeSelect?.(node.id)}
        onPaneClick={() => onNodeSelect?.(null)}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1f2937" gap={24} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
