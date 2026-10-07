import { Badge, Text } from "@livtorgex/ui-kit";
import type { NodeProps } from "@xyflow/react";
import type { WorkflowFlowNode, WorkflowTriggerData } from "../flow";
import { WorkflowHandles } from "./WorkflowHandles";

export function WorkflowTriggerCard({ data, selected }: NodeProps<WorkflowFlowNode>) {
  const { trigger } = data as WorkflowTriggerData;
  const label = trigger.action_code || trigger.input_kind;

  return (
    <div
      className="strategy-workflow-trigger"
      data-selected={selected}
      role="button"
      tabIndex={0}
      aria-label={`${label} workflow trigger`}
      title={label}
    >
      <WorkflowHandles nodeType="trigger" />
      <Text as="span" variant="label" tone="positive" weight="bold">
        Signal trigger
      </Text>
      <Text as="span" variant="body-sm" tone="inverse" weight="semibold">
        {label}
      </Text>
      <div className="strategy-workflow-node-badges">
        <Badge variant={trigger.enabled === false ? "neutral" : "active"}>
          {trigger.enabled === false ? "disabled" : "enabled"}
        </Badge>
        <Badge variant="neutral">→ {trigger.entry_node_key}</Badge>
      </div>
    </div>
  );
}
