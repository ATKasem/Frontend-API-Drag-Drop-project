import type { WorkflowEdge, WorkflowNode } from '../types/workflow';

type RunnerHooks = {
  onNodeStart: (nodeId: string) => void;
  onNodeSuccess: (nodeId: string, result: unknown) => void;
  onNodeError: (nodeId: string, message: string) => void;
};

type QueueItem = {
  nodeId: string;
  input: unknown;
};

type BranchResult = {
  value: unknown;
  branch?: 'true' | 'false';
};

const EXECUTION_DELAY_MS = 420;

const wait = (ms: number) => new Promise((resolve) => globalThis.setTimeout(resolve, ms));

export async function runWorkflowGraph(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  hooks: RunnerHooks,
) {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const incomingCount = new Map(nodes.map((node) => [node.id, 0]));
  const outgoingEdges = new Map<string, WorkflowEdge[]>();

  edges.forEach((edge) => {
    incomingCount.set(edge.target, (incomingCount.get(edge.target) ?? 0) + 1);
    const existing = outgoingEdges.get(edge.source) ?? [];
    outgoingEdges.set(edge.source, [...existing, edge]);
  });

  const cyclicNodeId = findCycleStart(nodes, outgoingEdges);
  if (cyclicNodeId) {
    hooks.onNodeError(cyclicNodeId, 'Cycle detected. Remove the loop before running.');
    throw new Error('Workflow cycle detected');
  }

  const startNodes = nodes.filter((node) => (incomingCount.get(node.id) ?? 0) === 0);
  const queue: QueueItem[] = startNodes.map((node) => ({ nodeId: node.id, input: undefined }));
  const executionCounts = new Map<string, number>();

  while (queue.length > 0) {
    const item = queue.shift()!;
    const node = nodeMap.get(item.nodeId);

    if (!node) {
      continue;
    }

    const currentCount = (executionCounts.get(node.id) ?? 0) + 1;
    executionCounts.set(node.id, currentCount);

    if (currentCount > nodes.length) {
      hooks.onNodeError(node.id, 'Cycle detected. Remove the loop before running.');
      throw new Error('Workflow cycle detected');
    }

    hooks.onNodeStart(node.id);
    await wait(EXECUTION_DELAY_MS);

    try {
      const result = executeNode(node, item.input);
      hooks.onNodeSuccess(node.id, result.value);

      const nextEdges = outgoingEdges.get(node.id) ?? [];
      nextEdges
        .filter((edge) => shouldFollowEdge(edge, result.branch))
        .forEach((edge) => {
          queue.push({ nodeId: edge.target, input: result.value });
        });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Node execution failed';
      hooks.onNodeError(node.id, message);
      throw error;
    }
  }
}

function findCycleStart(nodes: WorkflowNode[], outgoingEdges: Map<string, WorkflowEdge[]>) {
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const nodeIds = new Set(nodes.map((node) => node.id));

  function visit(nodeId: string): string | null {
    if (visiting.has(nodeId)) {
      return nodeId;
    }

    if (visited.has(nodeId)) {
      return null;
    }

    visiting.add(nodeId);

    for (const edge of outgoingEdges.get(nodeId) ?? []) {
      if (!nodeIds.has(edge.target)) {
        continue;
      }

      const cyclicNodeId = visit(edge.target);
      if (cyclicNodeId) {
        return cyclicNodeId;
      }
    }

    visiting.delete(nodeId);
    visited.add(nodeId);
    return null;
  }

  for (const node of nodes) {
    const cyclicNodeId = visit(node.id);
    if (cyclicNodeId) {
      return cyclicNodeId;
    }
  }

  return null;
}

function executeNode(node: WorkflowNode, input: unknown): BranchResult {
  switch (node.data.kind) {
    case 'api':
      return { value: simulateApiRequest(node) };
    case 'transform':
      return { value: runSafeTransform(node.data.config.code ?? 'return data', input) };
    case 'condition': {
      const passed = evaluateCondition(node.data.config.condition ?? '', input);
      return { value: input, branch: passed ? 'true' : 'false' };
    }
    case 'output':
      return { value: input ?? null };
    default:
      return assertNever(node.data.kind);
  }
}

function simulateApiRequest(node: WorkflowNode) {
  const url = node.data.config.url?.trim();
  const method = node.data.config.method ?? 'GET';

  if (!url) {
    throw new Error('URL is required');
  }

  return {
    status: 200,
    ok: true,
    method,
    url,
    receivedAt: new Date().toISOString(),
    data: [
      { id: 'ord_1001', total: 129.5, state: 'paid' },
      { id: 'ord_1002', total: 84.25, state: 'pending' },
    ],
  };
}

function runSafeTransform(code: string, data: unknown) {
  const normalizedCode = code.trim().replace(/;$/, '');

  if (!normalizedCode || normalizedCode === 'return data') {
    return data;
  }

  const pathMatch = normalizedCode.match(/^return\s+data((?:\.[A-Za-z_$][\w$]*)+)$/);
  if (pathMatch) {
    return readPath(data, pathMatch[1]);
  }

  const literalMatch = normalizedCode.match(/^return\s+(\{[\s\S]*\}|\[[\s\S]*\]|"[\s\S]*"|\d+(?:\.\d+)?|true|false|null)$/);
  if (literalMatch) {
    return JSON.parse(literalMatch[1]);
  }

  throw new Error('Unsupported transform. Use return data, return data.path, or a JSON literal.');
}

function evaluateCondition(condition: string, data: unknown) {
  const trimmedCondition = condition.trim();

  if (!trimmedCondition) {
    return Boolean(data);
  }

  const truthyPath = trimmedCondition.match(/^data((?:\.[A-Za-z_$][\w$]*)+)$/);
  if (truthyPath) {
    return Boolean(readPath(data, truthyPath[1]));
  }

  const comparison = trimmedCondition.match(
    /^data((?:\.[A-Za-z_$][\w$]*)+)\s*(===|==|!==|!=|>=|<=|>|<)\s*(.+)$/,
  );

  if (!comparison) {
    throw new Error('Unsupported condition. Use data.path === value or data.path.');
  }

  const actual = readPath(data, comparison[1]);
  const operator = comparison[2];
  const expected = parseConditionValue(comparison[3]);

  switch (operator) {
    case '===':
    case '==':
      return actual === expected;
    case '!==':
    case '!=':
      return actual !== expected;
    case '>':
      return Number(actual) > Number(expected);
    case '>=':
      return Number(actual) >= Number(expected);
    case '<':
      return Number(actual) < Number(expected);
    case '<=':
      return Number(actual) <= Number(expected);
    default:
      return false;
  }
}

function parseConditionValue(rawValue: string) {
  const trimmedValue = rawValue.trim();

  if (trimmedValue === 'true') {
    return true;
  }

  if (trimmedValue === 'false') {
    return false;
  }

  if (trimmedValue === 'null') {
    return null;
  }

  if (/^-?\d+(\.\d+)?$/.test(trimmedValue)) {
    return Number(trimmedValue);
  }

  const quotedString = trimmedValue.match(/^["']([\s\S]*)["']$/);
  if (quotedString) {
    return quotedString[1];
  }

  throw new Error('Condition value must be a string, number, boolean, or null.');
}

function readPath(data: unknown, dottedPath: string) {
  return dottedPath
    .slice(1)
    .split('.')
    .reduce<unknown>((currentValue, pathPart) => {
      if (currentValue === null || typeof currentValue !== 'object') {
        return undefined;
      }

      return (currentValue as Record<string, unknown>)[pathPart];
    }, data);
}

function shouldFollowEdge(edge: WorkflowEdge, branch?: 'true' | 'false') {
  if (!branch) {
    return true;
  }

  return edge.sourceHandle === branch;
}

function assertNever(value: never): never {
  throw new Error(`Unsupported node kind: ${value}`);
}
