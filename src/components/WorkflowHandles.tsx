import { Handle, Position } from "@xyflow/react";
import type { WorkflowNodeType } from "../types";

function WorkflowHandle({
  type,
  position,
  id,
}: {
  type: "source" | "target";
  position: Position;
  id: string;
}) {
  return (
    <Handle
      id={id}
      type={type}
      position={position}
      isConnectable={false}
      className="strategy-workflow-handle"
    />
  );
}

export function WorkflowHandles({ nodeType }: { nodeType: WorkflowNodeType | "trigger" }) {
  if (nodeType === "trigger") {
    return <WorkflowHandle type="source" position={Position.Bottom} id="source-bottom" />;
  }

  if (nodeType === "fork" || nodeType === "join") {
    return (
      <>
        <WorkflowHandle type="target" position={Position.Top} id="target-top" />
        <WorkflowHandle type="source" position={Position.Bottom} id="source-bottom" />
      </>
    );
  }

  return (
    <>
      <WorkflowHandle type="target" position={Position.Top} id="target-top" />
      <WorkflowHandle type="target" position={Position.Right} id="target-right" />
      <WorkflowHandle type="target" position={Position.Bottom} id="target-bottom" />
      <WorkflowHandle type="target" position={Position.Left} id="target-left" />
      <WorkflowHandle type="source" position={Position.Top} id="source-top" />
      <WorkflowHandle type="source" position={Position.Right} id="source-right" />
      <WorkflowHandle type="source" position={Position.Bottom} id="source-bottom" />
      <WorkflowHandle type="source" position={Position.Left} id="source-left" />
    </>
  );
}
