export type WorkflowNodeType =
  "operation" | "calculation" | "fork" | "join" | "condition" | "complete" | "stop" | (string & {});

export type WorkflowGraphNode = {
  id?: string;
  workflow_id?: string;
  node_key: string;
  name: string;
  node_type?: WorkflowNodeType;
  execution?: { type?: string; [key: string]: unknown } | null;
  requires_confirmation?: boolean;
  config?: unknown;
};

export type WorkflowGraphEdge = {
  id?: string;
  workflow_id?: string;
  from_node_key: string;
  to_node_key: string;
  trigger_type?: "success" | "failure" | "condition";
  condition?: unknown;
  priority?: number;
};

export type WorkflowGraphTrigger = {
  id?: string;
  action_code?: string | null;
  input_kind?: string;
  entry_node_key: string;
  enabled?: boolean;
};

export type WorkflowGraph = {
  id?: string;
  name?: string;
  nodes: WorkflowGraphNode[];
  edges: WorkflowGraphEdge[];
  triggers?: WorkflowGraphTrigger[];
};

export type WorkflowGraphViewProps = {
  graph: WorkflowGraph;
  currentNodeKeys?: ReadonlySet<string>;
  selectedNodeKey?: string | null;
  onNodeSelect?: (nodeKey: string | null) => void;
  fitView?: boolean;
};
