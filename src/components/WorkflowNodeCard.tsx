import { Badge, Text } from "@livtorgex/ui-kit";
import type { NodeProps } from "@xyflow/react";
import type { WorkflowFlowNode, WorkflowNodeData } from "../flow";
import { workflowNodeTitle } from "../flow";
import { WorkflowHandles } from "./WorkflowHandles";

export function WorkflowNodeCard({ data, selected }: NodeProps<WorkflowFlowNode>) {
  const { node, current } = data as WorkflowNodeData;
  const compact = node.node_type === "fork" || node.node_type === "join";

  return (
    <div
      className="strategy-workflow-node"
      data-current={current}
      data-selected={selected}
      data-node-type={node.node_type}
      role="button"
      tabIndex={0}
      aria-label={`${workflowNodeTitle(node)} workflow node`}
      title={workflowNodeTitle(node)}
    >
      <WorkflowHandles nodeType={node.node_type} />
      <div className="strategy-workflow-node-content">
        <Text as="span" variant="body-sm" weight="semibold" tone="inverse">
          {workflowNodeTitle(node)}
        </Text>
        {!compact ? (
          <Text as="span" variant="caption" tone="subtle">
            {node.node_type}
          </Text>
        ) : null}
        <div className="strategy-workflow-node-badges">
          <Badge variant="neutral">{node.node_type}</Badge>
          {node.requires_confirmation ? <Badge variant="warning">approval required</Badge> : null}
          {current ? <Badge variant="active">Current</Badge> : null}
        </div>
      </div>
    </div>
  );
}
