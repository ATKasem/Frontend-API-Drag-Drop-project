import { MarkerType } from '@xyflow/react';
import type { WorkflowEdge, WorkflowNode } from '../types/workflow';

export const initialNodes: WorkflowNode[] = [
  {
    id: 'api-1',
    type: 'workflowNode',
    position: { x: 40, y: 70 },
    data: {
      kind: 'api',
      config: {
        label: 'API Request',
        method: 'GET',
        url: 'https://api.example.com/orders',
      },
      status: 'idle',
    },
  },
  {
    id: 'transform-1',
    type: 'workflowNode',
    position: { x: 360, y: 70 },
    data: {
      kind: 'transform',
      config: {
        label: 'Transform',
        code: 'return data',
      },
      status: 'idle',
    },
  },
  {
    id: 'condition-1',
    type: 'workflowNode',
    position: { x: 680, y: 70 },
    data: {
      kind: 'condition',
      config: {
        label: 'Condition',
        condition: 'data.status === 200',
      },
      status: 'idle',
    },
  },
  {
    id: 'output-1',
    type: 'workflowNode',
    position: { x: 1020, y: 36 },
    data: {
      kind: 'output',
      config: {
        label: 'Output',
      },
      status: 'idle',
    },
  },
];

export const initialEdges: WorkflowEdge[] = [
  {
    id: 'api-1-transform-1',
    source: 'api-1',
    target: 'transform-1',
    sourceHandle: 'out',
    targetHandle: 'in',
    type: 'default',
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: 'transform-1-condition-1',
    source: 'transform-1',
    target: 'condition-1',
    sourceHandle: 'out',
    targetHandle: 'in',
    type: 'default',
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: 'condition-1-output-1',
    source: 'condition-1',
    target: 'output-1',
    sourceHandle: 'true',
    targetHandle: 'in',
    type: 'default',
    markerEnd: { type: MarkerType.ArrowClosed },
  },
];
