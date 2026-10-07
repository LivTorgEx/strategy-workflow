import type { StrategyWorkflowRunInspection, WorkflowEdge, WorkflowNode } from "./model";
import {
  WORKFLOW_COMPACT_NODE_HEIGHT,
  WORKFLOW_COMPACT_NODE_WIDTH,
  WORKFLOW_NODE_HEIGHT,
  WORKFLOW_NODE_WIDTH,
} from "./constants";

export function workflowNodeTitle(node: WorkflowNode): string {
  return node.name || node.node_key;
}

export function workflowNodeDimensions(node: WorkflowNode) {
  return node.node_type === "fork" || node.node_type === "join"
    ? {
        width: WORKFLOW_COMPACT_NODE_WIDTH,
        height: WORKFLOW_COMPACT_NODE_HEIGHT,
      }
    : { width: WORKFLOW_NODE_WIDTH, height: WORKFLOW_NODE_HEIGHT };
}

export function workflowNodeKind(node: WorkflowNode): string {
  if (node.execution?.type === "api_exchange") {
    const operation = node.execution.operation;
    if (typeof operation === "object" && operation !== null) {
      const provider = "provider_code" in operation ? operation.provider_code : null;
      const capability = "capability_code" in operation ? operation.capability_code : null;
      if (typeof provider === "string" && typeof capability === "string") {
        return `${provider} / ${capability}`;
      }
    }
    return "api exchange";
  }
  return node.execution?.type === "calculation" ? "calculation" : node.node_type;
}

export function workflowNodeGuard(node: WorkflowNode): string | null {
  return node.requires_confirmation ? "approval required" : null;
}

export function workflowNodeColor(node: WorkflowNode): string {
  if (node.execution?.type === "worker_bot") return "#7c3aed";
  if (node.execution?.type === "calculation") return "#b45309";
  if (node.node_type === "fork") return "#0f766e";
  if (node.node_type === "join") return "#0e7490";
  if (node.execution?.type === "public_api") return "#0891b2";
  if (node.execution?.type === "api_exchange") return "#2563eb";
  return "#475569";
}

function latestStep(run: StrategyWorkflowRunInspection | undefined, nodeKey: string) {
  const steps = run?.steps ?? [];
  return steps
    .filter((step) => step.node_key === nodeKey)
    .reduce(
      (latest, step) => {
        if (!latest || step.attempt > latest.attempt) return step;
        return latest;
      },
      undefined as (typeof steps)[number] | undefined,
    );
}

export function workflowNodeVisualState(
  run: StrategyWorkflowRunInspection | undefined,
  node: WorkflowNode,
  selected: boolean,
) {
  if (selected) return { color: "#f59e0b", background: "#fff7ed" };

  const step = latestStep(run, node.node_key);
  const failedCursor = run?.cursors?.some(
    (cursor) => cursor.node_key === node.node_key && cursor.status === "failed",
  );
  const isCurrent = run?.run?.active_node_keys?.includes(node.node_key) ?? false;
  if (step?.status === "completed") {
    return { color: "#15803d", background: "#ecfdf5" };
  }
  if (step?.status === "running") {
    return { color: "#2563eb", background: "#eff6ff" };
  }
  if (step?.status === "waiting") {
    return { color: "#d97706", background: "#fffbeb" };
  }
  if (step?.status === "failed" || failedCursor) {
    return { color: "#dc2626", background: "#fef2f2" };
  }
  if (isCurrent) return { color: "#d97706", background: "#fffbeb" };
  if (node.node_type === "complete") {
    return { color: "#15803d", background: "#ecfdf5" };
  }
  return { color: workflowNodeColor(node), background: "#ffffff" };
}

export function conditionExpression(value: unknown): string | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const condition = value as Record<string, unknown>;
  return typeof condition.value === "string" ? condition.value : null;
}

export function configString(config: unknown, key: string): string | null {
  if (typeof config !== "object" || config === null || Array.isArray(config)) {
    return null;
  }
  const properties = (config as Record<string, unknown>).properties;
  if (typeof properties !== "object" || properties === null || Array.isArray(properties)) {
    return null;
  }
  const property = (properties as Record<string, unknown>)[key];
  if (typeof property !== "object" || property === null || Array.isArray(property)) {
    return null;
  }
  const propertyRecord = property as Record<string, unknown>;
  const value = propertyRecord.const ?? propertyRecord.default;
  return typeof value === "string" ? value : null;
}

export function workflowConditionExpression(
  node: WorkflowNode,
  edges: WorkflowEdge[],
): string | null {
  const conditionEdge = edges.find(
    (edge) => edge.from_node_key === node.node_key && edge.trigger_type === "condition",
  );

  return conditionExpression(conditionEdge?.condition) ?? configString(node.config, "formula");
}
