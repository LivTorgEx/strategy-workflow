import { Badge, Text } from "@livtorgex/ui-kit";
import type { NodeProps } from "@xyflow/react";
import type { WorkflowFlowNode, WorkflowNodeData } from "../flow";
import { workflowNodeTitle } from "../flow";
import { WorkflowHandles } from "./WorkflowHandles";

export function WorkflowNodeCard({ data, selected }: NodeProps<WorkflowFlowNode>) {
  const { node, current, failed } = data as WorkflowNodeData;
  const compact = node.node_type === "fork" || node.node_type === "join";
  const title = workflowNodeTitle(node);
  const tooltip = [
    title,
    `Type: ${node.node_type}`,
    node.requires_confirmation ? "Approval required" : null,
    current ? "Current" : null,
    failed ? "Failed" : null,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div
      className="strategy-workflow-node"
      data-current={current}
      data-failed={failed}
      data-selected={selected}
      data-node-type={node.node_type}
      role="button"
      tabIndex={0}
      aria-label={tooltip.replaceAll("\n", ", ")}
      title={tooltip}
    >
      <WorkflowHandles nodeType={node.node_type} />
      <div className="strategy-workflow-node-content">
        <Text as="span" variant="body-sm" weight="semibold" tone="inverse" truncate>
          {title}
        </Text>
        <div className="strategy-workflow-node-badges">
          {compact ? (
            failed ? (
              <Badge variant="loss">Failed</Badge>
            ) : current ? (
              <Badge variant="active">Current</Badge>
            ) : node.requires_confirmation ? (
              <Badge variant="warning">approval required</Badge>
            ) : (
              <Badge variant="neutral">{node.node_type}</Badge>
            )
          ) : (
            <>
              <Badge variant="neutral">{node.node_type}</Badge>
              {node.requires_confirmation ? (
                <Badge variant="warning">approval required</Badge>
              ) : null}
              {current ? <Badge variant="active">Current</Badge> : null}
              {failed ? <Badge variant="loss">Failed</Badge> : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
