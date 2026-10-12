import { Badge, Text } from "@livtorgex/ui-kit";
import type { NodeProps } from "@xyflow/react";
import type { WorkflowFlowNode, WorkflowTriggerData } from "../flow";
import { WorkflowHandles } from "./WorkflowHandles";

export function WorkflowTriggerCard({ data, selected }: NodeProps<WorkflowFlowNode>) {
  const { trigger } = data as WorkflowTriggerData;
  const label = trigger.action_code || trigger.input_kind;
  const enabledLabel = trigger.enabled === false ? "disabled" : "enabled";
  const tooltip = [
    label,
    `Input: ${trigger.input_kind}`,
    `Entry node: ${trigger.entry_node_key}`,
    enabledLabel,
  ].join("\n");

  return (
    <div
      className="strategy-workflow-trigger"
      data-selected={selected}
      role="button"
      tabIndex={0}
      aria-label={`${label} workflow listener, ${enabledLabel}, entry node ${trigger.entry_node_key}`}
      title={tooltip}
    >
      <WorkflowHandles nodeType="trigger" />
      <Text
        as="span"
        className="strategy-workflow-trigger-label"
        variant="label"
        tone="inverse"
        weight="bold"
      >
        Signal trigger
      </Text>
      <Text as="span" variant="body-sm" tone="inverse" weight="semibold" truncate>
        {label}
      </Text>
      <div className="strategy-workflow-node-badges">
        <Badge variant="neutral">{trigger.enabled === false ? "disabled" : "enabled"}</Badge>
        <Badge variant="neutral">→ {trigger.entry_node_key}</Badge>
      </div>
    </div>
  );
}
