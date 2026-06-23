import type { NodeTemplate } from '../types/workflow';

export const nodeTemplates: NodeTemplate[] = [
  {
    kind: 'api',
    title: 'API Request',
    description: 'Fetch JSON from an endpoint',
  },
  {
    kind: 'transform',
    title: 'Transform',
    description: 'Shape incoming data',
  },
  {
    kind: 'condition',
    title: 'Condition',
    description: 'Route true and false paths',
  },
  {
    kind: 'output',
    title: 'Output',
    description: 'Inspect final JSON',
  },
];
