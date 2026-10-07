import type { StrategyWorkflow, WorkflowEdge } from "./model";
import { conditionExpression, workflowConditionExpression } from "./formatters.js";

function visibleEdges(workflow: StrategyWorkflow, visibleNodeKeys: Set<string>): WorkflowEdge[] {
  const directEdges = workflow.edges.filter(
    (edge) => visibleNodeKeys.has(edge.from_node_key) && visibleNodeKeys.has(edge.to_node_key),
  );
  const conditionEdges = workflow.nodes
    .filter((node) => node.node_type === "condition")
    .flatMap((conditionNode) => {
      const incoming = workflow.edges.filter(
        (edge) =>
          edge.to_node_key === conditionNode.node_key && visibleNodeKeys.has(edge.from_node_key),
      );
      const outgoing = workflow.edges.filter(
        (edge) =>
          edge.from_node_key === conditionNode.node_key && visibleNodeKeys.has(edge.to_node_key),
      );

      return incoming.flatMap((incomingEdge) =>
        outgoing.map((outgoingEdge) => {
          const expression =
            conditionExpression(outgoingEdge.condition) ??
            workflowConditionExpression(conditionNode, workflow.edges);
          return {
            ...outgoingEdge,
            id: `${incomingEdge.id}:${outgoingEdge.id}`,
            from_node_key: incomingEdge.from_node_key,
            condition:
              outgoingEdge.condition ?? (expression ? { type: "ast", value: expression } : null),
          };
        }),
      );
    });

  return [...directEdges, ...conditionEdges];
}

export { visibleEdges };
