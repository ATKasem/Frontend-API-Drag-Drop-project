import type { Edge, Node, XYPosition } from '@xyflow/react';

export const DRAG_NODE_MIME = 'application/x-workflow-node';

export type NodeKind = 'api' | 'transform' | 'condition' | 'output';

export type NodeStatus = 'idle' | 'running' | 'success' | 'error';

export type WorkflowStatus = 'Idle' | 'Running' | 'Complete' | 'Error';

export type ApiMethod = 'GET' | 'POST';

export type NodeConfig = {
  label: string;
  url?: string;
  method?: ApiMethod;
  code?: string;
  condition?: string;
};

export type WorkflowNodeData = {
  kind: NodeKind;
  config: NodeConfig;
  status: NodeStatus;
  result?: unknown;
  error?: string;
};

export type WorkflowNode = Node<WorkflowNodeData, 'workflowNode'>;

export type WorkflowEdge = Edge;

export type NodeTemplate = {
  kind: NodeKind;
  title: string;
  description: string;
};

export type SavedWorkflow = {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
};

export type AddNodeInput = {
  kind: NodeKind;
  position: XYPosition;
};
