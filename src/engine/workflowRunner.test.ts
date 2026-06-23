import { describe, expect, it, vi } from 'vitest';
import { runWorkflowGraph } from './workflowRunner';
import type { NodeKind, WorkflowEdge, WorkflowNode } from '../types/workflow';

function node(id: string, kind: NodeKind, config: WorkflowNode['data']['config'] = { label: id }): WorkflowNode {
  return {
    id,
    type: 'workflowNode',
    position: { x: 0, y: 0 },
    data: {
      kind,
      config,
      status: 'idle',
    },
  };
}

function edge(source: string, target: string, sourceHandle = 'out'): WorkflowEdge {
  return {
    id: `${source}-${sourceHandle}-${target}`,
    source,
    target,
    sourceHandle,
    targetHandle: 'in',
  };
}

function createHooks() {
  return {
    onNodeStart: vi.fn(),
    onNodeSuccess: vi.fn(),
    onNodeError: vi.fn(),
  };
}

async function runWithFakeTimers(nodes: WorkflowNode[], edges: WorkflowEdge[], hooks = createHooks()) {
  vi.useFakeTimers();
  const run = runWorkflowGraph(nodes, edges, hooks).catch((error: unknown) => error);
  await vi.runAllTimersAsync();

  try {
    const result = await run;
    if (result instanceof Error) {
      throw result;
    }

    return hooks;
  } finally {
    vi.useRealTimers();
  }
}

describe('runWorkflowGraph', () => {
  it('runs connected nodes in order and passes transformed data forward', async () => {
    const api = node('api', 'api', {
      label: 'API Request',
      method: 'GET',
      url: 'https://api.example.com/orders',
    });
    const transform = node('transform', 'transform', {
      label: 'Transform',
      code: 'return data.status',
    });
    const output = node('output', 'output', { label: 'Output' });
    const hooks = await runWithFakeTimers([api, transform, output], [edge('api', 'transform'), edge('transform', 'output')]);

    expect(hooks.onNodeStart.mock.calls.map(([nodeId]) => nodeId)).toEqual(['api', 'transform', 'output']);
    expect(hooks.onNodeSuccess).toHaveBeenCalledWith('transform', 200);
    expect(hooks.onNodeSuccess).toHaveBeenCalledWith('output', 200);
    expect(hooks.onNodeError).not.toHaveBeenCalled();
  });

  it('follows the false branch when a condition evaluates to false', async () => {
    const api = node('api', 'api', {
      label: 'API Request',
      method: 'GET',
      url: 'https://api.example.com/orders',
    });
    const condition = node('condition', 'condition', {
      label: 'Condition',
      condition: 'data.ok === false',
    });
    const trueOutput = node('true-output', 'output', { label: 'True Output' });
    const falseOutput = node('false-output', 'output', { label: 'False Output' });
    const hooks = await runWithFakeTimers(
      [api, condition, trueOutput, falseOutput],
      [edge('api', 'condition'), edge('condition', 'true-output', 'true'), edge('condition', 'false-output', 'false')],
    );

    expect(hooks.onNodeStart.mock.calls.map(([nodeId]) => nodeId)).toEqual(['api', 'condition', 'false-output']);
    expect(hooks.onNodeSuccess).not.toHaveBeenCalledWith('true-output', expect.anything());
    expect(hooks.onNodeSuccess).toHaveBeenCalledWith(
      'false-output',
      expect.objectContaining({
        ok: true,
        status: 200,
      }),
    );
  });

  it('stops the workflow and reports a node error for unsupported transforms', async () => {
    const transform = node('transform', 'transform', {
      label: 'Transform',
      code: 'return data.map(item => item.id)',
    });
    const hooks = createHooks();

    await expect(runWithFakeTimers([transform], [], hooks)).rejects.toThrow('Unsupported transform');

    expect(hooks.onNodeStart).toHaveBeenCalledWith('transform');
    expect(hooks.onNodeError).toHaveBeenCalledWith(
      'transform',
      'Unsupported transform. Use return data, return data.path, or a JSON literal.',
    );
  });

  it('fails closed when every node participates in a cycle', async () => {
    const first = node('first', 'transform', { label: 'First', code: 'return data' });
    const second = node('second', 'output', { label: 'Second' });
    const hooks = createHooks();

    await expect(runWithFakeTimers([first, second], [edge('first', 'second'), edge('second', 'first')], hooks)).rejects.toThrow(
      'Workflow cycle detected',
    );

    expect(hooks.onNodeError).toHaveBeenCalledWith('first', 'Cycle detected. Remove the loop before running.');
    expect(hooks.onNodeStart).not.toHaveBeenCalled();
  });
});
